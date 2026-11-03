import { createClient } from "redis";

function makeClient() {
  return createClient({ url: process.env.REDIS_URL, disableOfflineQueue: true,
    socket: { connectTimeout: 1000, reconnectStrategy: false } });
}
type Client = ReturnType<typeof makeClient>;
const globalForRedis = globalThis as typeof globalThis & { helpdeskRedis?: Client; helpdeskRedisConnecting?: Promise<Client | null> };

// Failed connections return null quickly; subsequent requests may retry.
export async function getRedis(): Promise<Client | null> {
  if (globalForRedis.helpdeskRedis?.isReady) return globalForRedis.helpdeskRedis;
  if (globalForRedis.helpdeskRedisConnecting) return globalForRedis.helpdeskRedisConnecting;
  const client = makeClient();
  client.on("error", () => { /* PostgreSQL remains available if Redis is down. */ });
  const connecting = client.connect().then(() => {
    globalForRedis.helpdeskRedis = client;
    return client;
  }).catch(() => null).finally(() => { globalForRedis.helpdeskRedisConnecting = undefined; });
  globalForRedis.helpdeskRedisConnecting = connecting;
  return connecting;
}
