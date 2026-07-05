---
description: Spin up the full local dev stack (Postgres container + schema + seed + Next.js dev server) for testing
argument-hint: "[reset]"
allowed-tools: Bash, Read, Edit, Write
---

Bring the **entire local dev stack** up for testing, end to end, then report how to use it.

The stack for this app (Coffee & Gospel — Next.js 16 + Drizzle + Postgres) is exactly
**two services**: a Postgres database and the Next.js dev server. Everything else
(Google Sheets, Cloudinary, R2) is external SaaS and is not started here; Elasticsearch
defaults to disabled.

Use these fixed values throughout (the local container is isolated from the LAN dev DB
at `DATABASE_URL_DEV` and from the other project's `ai-passport-postgres` on :5432):

- Container name: `cag-postgres`
- Image: `postgres:18-alpine` (already cached locally — no pull)
- Host port: **5433** → container 5432
- Credentials: user `cag`, password `cag`, db `coffee_and_gospel`
- **`LOCAL_DB_URL = postgresql://cag:cag@localhost:5433/coffee_and_gospel`**

Pass this URL inline to every DB-touching command (`db:push`, `db:seed`, `next dev`).
**Do not** write it into `.env`/`.env.local` — keep the dev's env files untouched; the
inline env wins over dotenv files in both Next and drizzle/seed (dotenv does not override
an already-set `process.env`).

`$ARGUMENTS` — if it contains `reset` / `fresh` / `clean`, do a clean slate first:
`docker rm -f cag-postgres 2>/dev/null; docker volume rm cag-pgdata 2>/dev/null` before step 1.

Execute the steps in order. After any step fails, stop and report the failure clearly —
do not start the dev server against a DB that isn't ready.

## 1 — Start (or reuse) the Postgres container

```bash
docker start cag-postgres 2>/dev/null || docker run -d \
  --name cag-postgres \
  -e POSTGRES_USER=cag \
  -e POSTGRES_PASSWORD=cag \
  -e POSTGRES_DB=coffee_and_gospel \
  -p 5433:5432 \
  -v cag-pgdata:/var/lib/postgresql/data \
  postgres:18-alpine
```

`docker start` reuses an existing container (data persists in the `cag-pgdata` volume);
the `docker run` branch creates it the first time. Both are safe to re-run.

## 2 — Wait until Postgres accepts connections

Poll `pg_isready` (bounded; the alpine image is usually ready in 2–4s). If the loop's
`sleep` is rejected by the harness, fall back to the **Monitor** tool with the same
`pg_isready` condition instead.

```bash
for i in $(seq 1 30); do
  docker exec cag-postgres pg_isready -U cag -d coffee_and_gospel >/dev/null 2>&1 && { echo "postgres ready"; break; }
  [ "$i" = 30 ] && { echo "postgres did not become ready in 30s"; docker logs --tail 30 cag-postgres; exit 1; }
  sleep 1
done
```

## 3 — Sync the schema (Drizzle push)

`db:push` reconciles `lib/db/schema.ts` directly against the fresh DB — no migration
files needed. The schema only uses `pgEnum` + `gen_random_uuid()` (built into PG13+), so
no extensions are required.

```bash
DATABASE_URL="postgresql://cag:cag@localhost:5433/coffee_and_gospel" npm run db:push
```

## 4 — Seed baseline data

Seeds site config, the Sunday service windows, the three free Saturday classes, the
starter menu, and an admin user. Idempotent (`onConflictDoNothing` / `onConflictDoUpdate`).

```bash
DATABASE_URL="postgresql://cag:cag@localhost:5433/coffee_and_gospel" npm run db:seed
```

The seeded admin defaults to `admin@church.local` / `change-me-now` (override with
`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_NAME` env vars).

## 5 — Start the Next.js dev server (background)

Port 3000 is often occupied on this machine (a `bun.exe` process), so pick a port:
use **3000** if free, otherwise **3100** (otherwise the next free port). Check first:

```bash
PORT=3000; lsof -nP -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1 && PORT=3100
lsof -nP -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1 && PORT=3101
echo "using port $PORT"
```

Then start it as a **background** process (it must keep running after the command ends):

```bash
DATABASE_URL="postgresql://cag:cag@localhost:5433/coffee_and_gospel" PORT=$PORT npm run dev
```

Run that with the Bash tool's `run_in_background: true`. Then give it a moment and
confirm it's serving (a 200/redirect on `/` means the server booted and the DB env
validated): `curl -sS -o /dev/null -w "%{http_code}" http://localhost:$PORT/`.
If it isn't up, surface the background process's log output.

## 6 — Report

Print a concise summary the user can act on:

- ✅ Postgres `cag-postgres` on `localhost:5433` (db `coffee_and_gospel`)
- ✅ Schema pushed + data seeded
- ✅ App running at **http://localhost:<PORT>**
- 🔑 Admin login: `admin@church.local` / `change-me-now`
- 🔎 Inspect data: `DATABASE_URL="postgresql://cag:cag@localhost:5433/coffee_and_gospel" npm run db:studio`
- 🧹 Tear down: `docker stop cag-postgres` (keeps data) — and stop the background dev server.
  Wipe the DB for a clean slate with `/dev-up reset`.
