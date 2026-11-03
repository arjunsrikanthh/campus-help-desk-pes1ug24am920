# Campus Help Desk Board

**DBMS Lab 11 · Arjun Srikanth · PES1UG24AM920**

A Next.js app where students post short questions and browse the ten latest requests. PostgreSQL is the source of truth; Redis caches the list for 60 seconds and counts page loads.

## Requirements

- Node.js 20.9 or later and npm
- PostgreSQL and Redis

## Setup

1. Create a PostgreSQL database (for example, `helpdesk`) and apply the schema:
   ```sh
   psql "$DATABASE_URL" -f sql/schema.sql
   ```
2. Copy `.env.example` to `.env.local`, then set `DATABASE_URL` and `REDIS_URL` for your local services. If Redis requires authentication, include credentials in its URL; do not commit `.env.local`.
3. Install dependencies and start the app:
   ```sh
   npm install
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000). For a production build, run `npm run build` followed by `npm start`.

## How to demonstrate

1. Enter a name and question, then select **Post Request**. The request is saved to PostgreSQL and the cached list is invalidated. The updated list shows **Source: PostgreSQL**.
2. Refresh within 60 seconds. The source becomes **Redis**, and the board view count increases.
3. Post another request: the cache is invalidated, so the updated list comes from PostgreSQL again.
4. Submit the empty form to see validation. The API also rejects missing or whitespace-only fields and enforces the database's length limits.
5. Stop Redis and refresh: the request list still comes from PostgreSQL; the view counter is shown as unavailable. Restart Redis to restore caching and counting. During an outage the app cannot count those views. If a write succeeds while Redis is unreachable but a prior cache survives its recovery, that cache can remain stale for up to its 60-second TTL.

## API

- `GET /api/requests` returns `{ source, requests }`. A cache miss reads PostgreSQL and caches the result as `help:latest` for 60 seconds.
- `POST /api/requests` accepts `{ "student_name": "...", "message": "..." }`; returns `{ "success": true, "id": ... }` or a JSON validation error. Inserts use parameterized SQL.
- `POST /api/views` atomically increments `help:views` with Redis `INCR` and returns `{ views }`. It returns 503 if Redis is unavailable.

The `help:version` Redis key prevents an in-flight database read from restoring stale cached data after a concurrent post. Redis is an optional cache and counter, not the permanent store.
