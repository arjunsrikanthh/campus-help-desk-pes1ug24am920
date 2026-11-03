import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRedis } from "@/lib/redis";

export const dynamic = "force-dynamic";
const CACHE_KEY = "help:latest";
const VERSION_KEY = "help:version";

export async function GET() {
  const redis = await getRedis();
  let version: string | null = null;
  if (redis) {
    try {
      const [cached, currentVersion] = await Promise.all([redis.get(CACHE_KEY), redis.get(VERSION_KEY)]);
      version = currentVersion ?? "0";
      if (cached) return NextResponse.json({ source: "Redis", requests: JSON.parse(cached) });
    } catch { /* Read directly from PostgreSQL. */ }
  }
  try {
    const result = await db.query("SELECT id, student_name, message, created_at FROM help_requests ORDER BY created_at DESC, id DESC LIMIT $1", [10]);
    if (redis && version !== null) {
      try {
        // Avoid caching a stale query if a POST invalidated the cache while it ran.
        await redis.eval("if (redis.call('GET', KEYS[2]) or '0') == ARGV[1] then return redis.call('SET', KEYS[1], ARGV[2], 'EX', 60) end return nil", { keys: [CACHE_KEY, VERSION_KEY], arguments: [version, JSON.stringify(result.rows)] });
      } catch { /* Return the database result even if caching fails. */ }
    }
    return NextResponse.json({ source: "PostgreSQL", requests: result.rows });
  } catch {
    return NextResponse.json({ error: "Could not load requests" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }
  const input = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const name = typeof input.student_name === "string" ? input.student_name.trim() : "";
  const message = typeof input.message === "string" ? input.message.trim() : "";
  if (!name || !message) return NextResponse.json({ success: false, error: "student_name and message are required" }, { status: 400 });
  if (name.length > 50 || message.length > 200) return NextResponse.json({ success: false, error: "Name must be at most 50 characters and message at most 200 characters" }, { status: 400 });
  try {
    const result = await db.query("INSERT INTO help_requests (student_name, message) VALUES ($1, $2) RETURNING id", [name, message]);
    const redis = await getRedis();
    if (redis) {
      try { await redis.multi().incr(VERSION_KEY).del(CACHE_KEY).exec(); } catch { /* The database write succeeded. */ }
    }
    return NextResponse.json({ success: true, id: result.rows[0].id });
  } catch {
    return NextResponse.json({ success: false, error: "Could not save request" }, { status: 503 });
  }
}
