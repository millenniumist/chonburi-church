# Deploy to Vercel + Neon

The production target (ADR-0006). Public site **and** `/admin` run on Vercel;
Postgres is Neon. One-time setup, then push-to-deploy.

## 1. Create the Neon database

1. Create a project at <https://neon.tech> (region close to your users, e.g. `ap-southeast-1` Singapore for Thailand).
2. Copy the **pooled** connection string — the host contains **`-pooler`**:
   ```
   postgresql://USER:PASS@ep-xxxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
   (Use the *pooled* one for the app. The *direct* (non-pooler) URL is only for migrations if you prefer, but the pooled URL works for both here.)

## 2. Apply the schema + seed (from a trusted machine, once)

```bash
# Migrations are standard Postgres — the 0000→0002 chain applies cleanly to a fresh DB.
DATABASE_URL="<NEON_POOLED_URL>" npm run db:migrate

# Seed base data + the admin user. CHANGE THESE before running.
SEED_ADMIN_EMAIL="you@church.org" \
SEED_ADMIN_PASSWORD="$(openssl rand -base64 18)" \
SEED_ADMIN_NAME="Church Admin" \
DATABASE_URL="<NEON_POOLED_URL>" npm run db:seed
```
Record the generated admin password. (Fallback if `migrate` ever complains on a
fresh DB: `DATABASE_URL="<NEON_POOLED_URL>" npm run db:push -- --force` — reconciles
the schema directly; proven in local dev.)

## 3. Import the repo into Vercel

- New Project → import this Git repo. Framework **Next.js** is auto-detected; keep
  the default build (`next build`) and output settings. `output: 'standalone'` in
  `next.config` is ignored by Vercel — leave it.

## 4. Set Vercel project env vars (Production + Preview)

| Var | Value |
|---|---|
| `DATABASE_URL` | the Neon **pooled** URL from step 1 |
| `TZ` | `Asia/Bangkok` |
| `NEXT_PUBLIC_SITE_URL` | your final domain, e.g. `https://chonburichurch.org` |
| `SESSION_COOKIE_NAME` | optional (defaults to `cag_session`) |
| `DB_POOL_MAX` | optional, defaults to `1` (right for serverless) |

`SEED_ADMIN_*` are **not** needed at runtime (seeding is done in step 2).

## 5. Deploy & verify

- Trigger a deploy (push to the production branch, or "Deploy" in the dashboard).
- Smoke test: `/` loads; log in at `/login`; `/admin/members`, `/admin/donations`
  (+ a giving statement), `/admin/class-attendance` render; an **unauth** hit to
  `/admin/*` redirects (not 200/500).
- **Change the seeded admin password** immediately if you didn't set a strong one.

## 6. After cutover

- Point DNS at Vercel; decommission the Raspberry Pi pipeline (ADR-0003 assets in
  this folder are kept only as history).
- Optional hardening for the PII surface: put `/admin` behind **Cloudflare Access**
  or **Vercel Deployment Protection**. The app's own admin auth (scrypt + hashed
  sessions + role gate) is the baseline.

## Notes / gotchas

- **Pooling:** the app keeps a small `pg` pool per warm instance and relies on
  Neon's pooler. Don't raise `DB_POOL_MAX` without reason.
- **Migrations never run on Vercel** — always apply them from a trusted machine
  (step 2) before/with a deploy that changes the schema.
- **Cold starts:** an idle deployment has a first-request latency floor — expected
  on serverless, fine for this traffic.
