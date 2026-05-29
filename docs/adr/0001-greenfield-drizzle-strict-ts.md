# ADR-0001 — Greenfield Drizzle + strict TypeScript; drop Prisma & Payload

- Status: accepted
- Date: 2026-05-29

## Context

The old `cc-financial` app was a church finance/missions site: Next.js 16 + Payload CMS 3 + Prisma 6, but with TypeScript effectively disabled (`strict: false`, `allowJs: true`, `ignoreBuildErrors: true`; ~89% untyped `.js`). We are pivoting the whole product to a church café + gospel app and the owner asked for a "Matt Pocock way" rebuild — type-safe end to end, ship and adapt fast.

## Decision

Rebuild on a strict-TypeScript, type-safe-boundary stack:

- **Next.js (App Router) + React 19** — already in place; keep.
- **strict TypeScript** — `strict: true`, `allowJs: false`, `noUncheckedIndexedAccess: true`; remove `ignoreBuildErrors`. New code is `.ts`/`.tsx` only.
- **Drizzle ORM + node-postgres** — replaces Prisma. Schema-as-TypeScript, inferred types flow to the app with no codegen step. Lighter Docker build on the Pi (no `prisma generate`).
- **Zod** — validation at every server-action / route boundary; Zod schemas are the single source of truth for input shapes.
- **Server Actions** — mutations via typed server actions, not bespoke REST handlers.
- **Tailwind v4 + shadcn/ui** — already on Tailwind v4; layer shadcn primitives (most of its deps — radix, cva, clsx, tailwind-merge, lucide — are already installed).
- **Drop Payload CMS** — editorial content (gospel intro, café story, what-to-expect) becomes typed content modules under `content/`, version-controlled. An admin-editable content table can be added later if non-devs need to edit; not needed for v1.

## Consequences

- A real rewrite of the data layer and pages; the finance/missions/bulletins domain is deleted entirely.
- Removing Prisma + Payload simplifies the Docker build (no client generation, no Payload type-gen, lower build heap need).
- We lose Payload's admin UI; we build a small typed admin instead (menu, classes, services, users) — appropriate for the smaller surface area.
- Content edits require a deploy (typed modules) until/unless a content table is added.
