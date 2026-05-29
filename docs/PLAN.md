# PLAN — Coffee & Gospel build

How we build: **vertical tracer-bullet slices**. Each slice is shippable end-to-end (DB → server action → UI), strict-typed, with Zod at the boundary. We ship a slice, look at it, adapt — the "Matt Pocock / ship fast" loop.

Read `CONTEXT.md` for the domain and invariants, and `docs/adr/` for stack decisions.

## How agents build it

- **Foundation (Slice 0)** is built directly and verified to compile — it's the keystone every slice depends on (schema, db, auth, env, config). No fan-out; correctness first.
- **Feature slices (1–6)** are built with **Workflow fan-out**: independent files in parallel, then an adversarial review pass per slice (verify the invariants in CONTEXT.md actually hold server-side). One workflow per slice keeps the human in the loop between slices.

## Data model (Drizzle, Postgres)

Tables: `users`, `sessions`, `attendances`, `services`, `siteConfig`, `menuItems`, `orders`, `orderItems`, `classOfferings`, `enrollments`.
Enums: `userRole`, `orderStatus`, `enrollmentStatus`, `classKind`, `attendanceMethod`.
See `lib/db/schema.ts`.

## Slices

### Slice 0 — Foundation ✅ keystone (built directly)
Strict tsconfig; Drizzle + Zod + shadcn; `lib/db` (schema, client, migrations), `lib/env` (Zod-validated), `lib/auth` (sessions, password, current-user), typed `content/`, new root layout, health route, simplified Dockerfile + `.env.example`. App compiles and boots with a placeholder landing.

### Slice 1 — Landing + gospel intro (public)
The front door. "Come sip a coffee together" hero, gospel intro, café story, what-to-expect-on-your-first-visit, classes teaser, location/map, footer. Bilingual, modern, warm. No auth.

### Slice 2 — Accounts (auth)
Sign up / log in / log out (email + password). Visitor vs member. Account page showing ordering status (locked → "attend a service to unlock" / unlocked). Seed an admin.

### Slice 3 — GPS check-in / qualification
"I'm here" check-in: browser geolocation → server verifies haversine ≤ radius **and** inside a service window → record verified `Attendance` → flip visitor `orderingEnabled`. `siteConfig` (church lat/lng/radius) + `services` seeded. Invariant tests for the gate.

### Slice 4 — Menu + free coffee ordering
Public menu (read). Order flow gated by `orderingEnabled`. Place order → pickup code + confirmation. Order history for the user. (No money anywhere.)

### Slice 5 — Staff queue + admin
Staff: live-ish order queue, advance status (pending → preparing → ready → completed). Admin: manage menu, services, `siteConfig`, classes, view attendance, manage users/roles.

### Slice 6 — Classes + signup
Public class schedule (English P1–P6 / Guitar / Japanese basic, all Sat, free). Enroll as account holder or guest (name + phone). Capacity + waitlist. Admin roster.

## Definition of done (every slice)

1. Server-side enforcement of the relevant CONTEXT invariants (never client-trusted).
2. Zod at every server action / route boundary.
3. `npm run typecheck` and `npm run build` pass; no `any`, no `ignoreBuildErrors`.
4. Bilingual th/en for user-facing strings.
5. Adversarial review pass: can the gate be bypassed? is input validated? does it build?
