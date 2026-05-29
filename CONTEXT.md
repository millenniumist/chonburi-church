# CONTEXT — Coffee & Gospel

> The domain language and the decisions that don't live in the code. Read this first.
> Every build agent should treat this file as the source of truth for *what* we're building and *why*.

## The vision

A church café that introduces people to the gospel over a cup of coffee.

- **Anyone** can browse the site, learn about the café, the church, and come **sip a coffee together** (walk-in).
- **Members** of the church can **order coffee online** for pickup.
- **Visitors** can't order online *until they qualify*: they qualify by **attending one service**, confirmed by a **GPS check-in** at the church during a service window.
- Coffee is **free** — it's offered freely as part of the gospel ministry. No payments, ever.
- The church also runs **free Saturday classes** anyone can sign up for.

The product goal is warmth + low friction: make it easy and inviting for a stranger to walk in, attend once, and become a regular.

## Ubiquitous language

- **Visitor** — has an account but has not yet qualified to order. `role = visitor`, `orderingEnabled = false`.
- **Member** — a church member; can order from day one. `role = member`, `orderingEnabled = true`.
- **Staff** — works the café counter; sees the order queue, advances order status. `role = staff`.
- **Admin** — manages menu, classes, services, config, users. `role = admin`.
- **Qualify** — the act of a visitor becoming able to order, by completing a verified check-in. Flips `orderingEnabled` to `true`.
- **Check-in** — a visitor pressing "I'm here" during a service window; the browser reports GPS, the server verifies it's within the church radius and time window, and records an **Attendance**.
- **Service window** — a recurring day-of-week + start/end time during which a check-in counts (e.g. Sunday 10:00–12:00).
- **Order** — a request for free coffee, fulfilled at pickup. Has a short **pickup code** and moves through a status state machine.
- **Class offering** — a recurring free Saturday class (English P1–P6, Guitar, Japanese basic).
- **Enrollment** — a signup for a class offering (by an account holder *or* a guest with name + phone).

## The classes (seed data)

All free, every Saturday:

| Class            | Level   | Time          |
| ---------------- | ------- | ------------- |
| English          | P1–P6   | 13:00 – 15:00 |
| Guitar           | —       | 13:00 – 15:00 |
| Japanese (basic) | basic   | 14:00 – 15:00 |

## Core invariants (enforce these on the server, always)

1. **Ordering is gated.** A user may place an order **only if `orderingEnabled = true`**. Never trust the client; check on the server action.
2. **Check-in verification is server-side.** The browser sends lat/lng; the *server* computes the haversine distance against the church coordinates and checks it's within `checkinRadiusMeters` **and** the current time falls inside an active service window. The client never decides if a check-in is valid.
3. **Qualification needs ≥1 verified attendance.** One verified check-in flips a visitor's `orderingEnabled` to `true`. Members are born qualified.
4. **GPS is a soft gate.** Geolocation is spoofable. Treat it as convenience, not security for anything that matters. (Coffee is free, so the blast radius is low — but the trust model can later be hardened with staff-confirmed or QR check-in. The schema leaves room: `attendances.method`, `verified`.)
5. **One check-in per service day.** `attendances` is unique on `(userId, serviceDate)`.
6. **Sessions are signed/hashed, never plaintext.** No base64 JSON cookies (the old app's security defect). Session tokens are random, the cookie holds the token, the DB stores only its SHA-256 hash. (See ADR-0002.)
7. **Bilingual th/en everywhere.** Every user-facing content field has a `*Th` and `*En` variant. Thai is the default locale.

## What we are NOT building (explicit non-goals)

- No payments, no cart checkout with money, no PromptPay/Stripe. Coffee is free.
- No Prisma, no Payload CMS (removed — see ADR-0001).
- No multi-location. GPS radius assumes a single café site.
- No real-time kitchen display / websockets in v1 (the Pi has ~1GB runtime heap). Order status is poll/refresh; revisit if needed.

## Decisions

See `docs/adr/` for the full architecture decision records. Summary:

- **ADR-0001** — Greenfield Drizzle + strict TypeScript; drop Prisma & Payload.
- **ADR-0002** — Hand-rolled DB-session auth on `node:crypto` (scrypt + SHA-256), zero native deps (Pi/alpine-safe).
- **ADR-0003** — Keep the existing Docker → Raspberry Pi GitOps pipeline; reuse the Postgres instance, wipe the schema.

## Constraints from the deployment target

The app runs on a Raspberry Pi via Docker (`100.110.210.24`), capped at ~1.5GB RAM / 2 CPU, port 8358, `TZ=Asia/Bangkok`. Build happens off-Pi (M2 cross-compile, ARM64). Keep dependencies lean and **avoid native-compiled modules** that complicate alpine/ARM builds — this is why auth uses `node:crypto`, not `argon2`/`bcrypt`-native.
