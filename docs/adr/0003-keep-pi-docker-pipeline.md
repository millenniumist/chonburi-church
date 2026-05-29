# ADR-0003 — Keep the Raspberry Pi Docker/GitOps pipeline; reuse Postgres

- Status: accepted
- Date: 2026-05-29

## Context

The old app has a hard-won, working deployment: multi-stage ARM64 Docker → Raspberry Pi (`100.110.210.24`), 1.5GB RAM / 2 CPU cap, port 8358, push-driven GitOps (`deployment/gitops/deploy.sh`) with versioned releases, health checks, rollback, and an M2 cross-compile path (`deployment/scripts/m2-deploy.sh`). Memory tuning (build heap, 1GB runtime heap, `UV_THREADPOOL_SIZE`, `TZ=Asia/Bangkok`) is non-trivial.

## Decision

- **Keep the entire deploy pipeline** (`Dockerfile` shell, the two `docker-compose.*.yml`, `deployment/`) — adapt, don't replace.
- **Reuse the existing Postgres instance**; wipe the schema and let Drizzle migrations own it going forward.
- **Simplify the Dockerfile**: remove `prisma generate`, Payload type-gen, the Google-Sheets credential copy, and the bulletins volume. Drizzle needs no build-time codegen, which lowers the build-heap requirement.
- Keep WebP-only image optimization (`sharp`) and the Pi resource caps.

## Consequences

- Fast path to a deployable artifact; we inherit a proven release/rollback story.
- `.env` shrinks (no Google Sheets, Cloudinary optional, no Payload secret). A new `.env.example` documents the café app's variables.
- Migrations run as an explicit step (`drizzle-kit migrate`) against the Pi's Postgres, not implicitly at build.
