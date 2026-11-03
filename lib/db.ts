import { Pool } from "pg";

const globalForDb = globalThis as typeof globalThis & { helpdeskPool?: Pool };
export const db = globalForDb.helpdeskPool ?? new Pool({ connectionString: process.env.DATABASE_URL });
if (process.env.NODE_ENV !== "production") globalForDb.helpdeskPool = db;
