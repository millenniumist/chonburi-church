## Next Step
Cloudinary cleanup

## Parallel Payload CMS admin (experimental)

The repo now ships **two admin panels side-by-side**:

| Panel              | URL              | Backed by           | Postgres schema |
| ------------------ | ---------------- | ------------------- | --------------- |
| Existing custom    | `/admin`         | Prisma + bespoke UI | `public`        |
| Payload CMS (new)  | `/payload-admin` | Payload 3 + Drizzle | `payload`       |

The two admins **never share tables**. Prisma owns the `public` schema; Payload owns
`payload`. You can drop the Payload schema at any time and the rest of the app keeps
running.

### Setup

```bash
# 1. Add to .env
PAYLOAD_SECRET="<run: openssl rand -hex 32>"
# Optional override; otherwise reuses DATABASE_URL_DEV / DATABASE_URL.
# PAYLOAD_DATABASE_URI="postgresql://user:pass@host:5432/db"

# 2. First boot creates the schema automatically (db.push = true).
npm run dev
# open http://localhost:3000/payload-admin → register the first admin user

# 3. Optional CLI helpers
npm run payload:generate:types       # writes payload-types.ts
npm run payload:generate:importmap   # required before production build
```

### Collections shipped

`Users` (auth), `Media` (uploads), `Bulletins`, `Leaders`, `Missions`, `PageContent`,
`NavigationItems` — all localized in `th` (default) / `en`.

### Why parallel instead of a replacement?

Migrating off the existing custom admin would be a multi-week rewrite. Running Payload
alongside lets editors trial the richer UI, image pipeline, drafts/versions, and
localization without risking the production data path. When (or if) Payload wins, port
collections one at a time and retire `/admin`.
