# ADR-0006 — Host on Vercel + Neon Postgres

- Status: accepted
- Date: 2026-06-24
- Supersedes: ADR-0003 (Raspberry Pi Docker/GitOps pipeline)

## Context

The app ran on a Raspberry Pi behind Tailscale via a Docker → GitOps pipeline
(ADR-0003). The owner wants managed hosting on **Vercel**: zero box upkeep,
push-to-deploy, TLS and a CDN for free. Vercel is serverless, so two things
change — the database can no longer live on the (now-retired) Pi, and request
handlers are short-lived instances rather than one long process.

The back-office now holds member **PII and donation records** (ADR-0005). On the
Pi these were Tailscale-private. The key realization: **once we host on Vercel,
the database must be cloud-hosted, so that data lives in the cloud regardless of
where the admin UI runs.** A "split" deploy (public site on Vercel, admin on the
Pi) would only hide the admin *UI* surface, not move the *data* — limited benefit
for double the upkeep.

## Decision

- **Vercel for the whole app** (public site + `/admin`), behind the existing
  admin auth (scrypt password hashing + SHA-256-hashed DB sessions + `requireRole`
  gate; PII readers are gated too). Extra gating (Cloudflare Access / Vercel
  Deployment Protection on `/admin`) can be layered later if wanted.
- **Neon Postgres.** Standard Postgres, best Vercel fit, built-in connection
  pooler. `DATABASE_URL` points at Neon's **pooled** endpoint (`-pooler` host).
- **Keep `pg` + `node-postgres`** (no driver swap). `lib/db/index.ts` caches one
  pool on `globalThis` (reused across warm invocations) with a small
  `DB_POOL_MAX` (default 1); Neon's pooler fans many instances into a bounded
  server-side connection count.
- **Migrations run out-of-band**: `drizzle-kit migrate` against the Neon URL from
  a trusted machine (Vercel does not auto-migrate). Standard Postgres DDL, so the
  existing migrations apply unchanged.
- `node:crypto`-based auth and the lean-deps / no-native-modules rule (ADR-0001/2)
  carry over unchanged — they work as-is on serverless.

## Consequences

- The Pi and its Docker/compose/cloudflare-worker/GitOps assets are retired but
  left in `deployment/` as history; `next.config` keeps `output: 'standalone'`
  (Vercel ignores it) so a self-host fallback remains buildable.
- PII + donations now sit in Neon (cloud) behind app-level admin auth. Accepted
  for a small church; revisit with Cloudflare Access on `/admin` if needed.
- No box to patch/back up; Neon handles backups. New external dependency (Neon
  free tier) and a cold-start latency floor on idle.
- Runbook: `deployment/VERCEL.md`.
