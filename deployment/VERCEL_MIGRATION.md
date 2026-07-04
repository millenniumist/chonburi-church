# Migration: Pi → Vercel + Neon (cc-financial, the live site)

Status at time of writing (2026-07-04): code adapted on `feat/vercel-hosting`,
preview deployed, production untouched. The live site still runs on the Pi.

## Architecture after cutover

- App: Vercel project `chonburi-church` (team `millenniumists-projects`),
  GitHub-connected, production branch `main`.
- DB: Neon (existing integration DB), **dedicated Postgres schema `cc_financial`**
  via `APP_DATABASE_URL` / `APP_DATABASE_URL_UNPOOLED` (= integration URLs +
  `&schema=cc_financial`). The integration-managed `DATABASE_URL` (public schema)
  still holds the old Drizzle-app tables; they are untouched. Drop them whenever.
- Bulletin PDFs: Cloudinary only (`church-cms/bulletins`). No disk.
- Schema DDL: `prisma migrate deploy` inside `vercel-build` (dev boxes can't
  reach Neon; Vercel's build network can). Never switch this to `db push`:
  db push **drops tables it doesn't know** (i.e. the Drizzle tables sharing the DB).
- No seed in the build: `prisma/seed.js` is destructive (deleteMany per table).

## Env vars already set (production + preview)

`APP_DATABASE_URL`, `APP_DATABASE_URL_UNPOOLED`, `ADMIN_USERNAME`,
`ADMIN_PASSWORD` (generated — shown once in the migration session; rotate with
`vercel env rm/add`), `SESSION_SECRET`, `SYNC_API_KEY`, `CLOUDINARY_CLOUD_NAME`.
`NEXT_PUBLIC_SITE_URL` was removed — lib/seo.js defaults to
https://www.chonburichurch.com in production.

## Remaining steps (in order)

### 1. Secrets that live only on the Pi  — copy from `/srv/cc-financial/current/.env`

```bash
tailscale up                      # this box's tailscale is logged out
ssh <pi>  # 100.110.210.24 per ~/.ssh/config
grep -E 'CLOUDINARY_API_KEY|CLOUDINARY_API_SECRET|GOOGLE_SHEETS_SPREADSHEET_ID' /srv/cc-financial/current/.env
# also copy the service-account JSON (file at GOOGLE_SERVICE_ACCOUNT_PATH)
```

Then for each of `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`,
`GOOGLE_SHEETS_SPREADSHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_JSON` (the full JSON
string, not a path):

```bash
printf '%s' '<value>' | npx vercel env add <NAME> production
printf '%s' '<value>' | npx vercel env add <NAME> preview
```

Without CLOUDINARY_* the site runs but new bulletin uploads 500.
Without GOOGLE_* the sheet sync endpoint fails (site otherwise fine).

### 2. Merge + production deploy

```bash
git checkout main && git merge --ff-only feat/vercel-hosting && git push
```

Watch the deploy build `prisma migrate deploy` against Neon, then check
https://chonburi-church.vercel.app (empty DB — pages render with empty states).

### 3. Data: Pi → Neon (run ON the Pi; it has direct Postgres access)

```bash
cd /srv/cc-financial/current
DATABASE_URL_DEV='<APP_DATABASE_URL_UNPOOLED value>' \
DATABASE_URL_SECONDARY='<APP_DATABASE_URL_UNPOOLED value>' \
npm run db:sync
```

(The script loads DEV and SECONDARY targets; pointing both at Neon is
idempotent — it deleteMany()s then re-inserts each table.)
Verify: `https://chonburi-church.vercel.app/financial`, `/bulletins`, `/about`
should now show the live data. Log in at `/admin/login` and click through.

### 4. Domain cutover (Cloudflare — zone `chonburichurch.com`)

```bash
npx vercel domains add chonburichurch.com
npx vercel domains add www.chonburichurch.com
```

In Cloudflare DNS (currently proxied to the Pi's cloudflared tunnel):
- `www`  → CNAME `cname.vercel-dns.com`, **DNS only** (grey cloud)
- apex   → A `76.76.21.21`, DNS only (or CNAME-flattened `cname.vercel-dns.com`)

Vercel then issues certs automatically. Re-run the final data sync (step 3)
right before flipping DNS if editors changed anything in between.

### 5. Sheet-sync cron (replaces whatever called it on the Pi)

Vercel Cron: add to `vercel.json` when wanted:

```json
{ "crons": [{ "path": "/api/sync-financial", "schedule": "0 20 * * *" }] }
```

(20:00 UTC = 03:00 Bangkok. Note: Vercel cron requests don't carry the
SYNC_API_KEY header; either allow GET without key, check
`x-vercel-cron` header, or trigger externally with the key.)

### 6. Decommission the Pi (after a comfortable soak)

On the Pi: `systemctl disable --now` the `cc-financial-*` gitops/cloudflared
units, remove the `db-sync-pi-to-cloud` crontab entry, keep one final
`pg_dump` of `cc_financial` as archive. Cloudflare tunnel config can be
deleted with the DNS records already moved.

## Notes / gotchas

- This dev box cannot reach ANY Postgres (Pi LAN unreachable, Neon blocked on
  both 5432 and 443) — DB work happens in Vercel builds or on the Pi.
- `TZ` is a reserved env var on Vercel; runtime TZ comes from
  `instrumentation.js` (`process.env.TZ = 'Asia/Bangkok'`).
- Old Drizzle tables from the coffee-shop prototype sit in Neon's `public`
  schema. Nothing uses them after production switches to this app. Drop them
  via Neon console when sure.
- Leftover env vars from the prototype (`SEED_ADMIN_*`) are unused by this app.
