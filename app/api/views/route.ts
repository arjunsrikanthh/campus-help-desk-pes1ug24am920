import { NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";

export const dynamic = "force-dynamic";
export async function POST() {
  const redis = await getRedis();
  if (redis) {
    try { return NextResponse.json({ views: await redis.incr("help:views") }); } catch { /* Show unavailable. */ }
  }
  return NextResponse.json({ views: null, error: "View count temporarily unavailable" }, { status: 503 });
}
