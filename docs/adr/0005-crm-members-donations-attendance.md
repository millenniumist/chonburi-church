# ADR-0005 — Native member directory, donations & class attendance

- Status: accepted
- Date: 2026-06-23

## Context

The church runs this Next.js + Drizzle + Postgres app on a Raspberry Pi (behind
Tailscale). We evaluated adding **ChurchCRM** for the back-office needs a church
has beyond the public café site: a member/family directory, donation tracking
with giving statements, and class (Sunday-school) attendance.

ChurchCRM was rejected:

- It is a separate **PHP + Apache + MySQL/MariaDB** stack — a second database,
  second auth system, second attack surface bolted next to our app, with **zero
  data integration**.
- Its official Docker images are stale (~8 years) with **no published arm64
  build**, so it is not a clean deploy on the ARM64 Pi.
- The features we need are a small, well-understood data model we can own
  natively — and several adjacent features (announcements, classes) already live
  here.

## Decision

Model the three capabilities natively, following the existing admin
"feature-slice" pattern (`requireRole('admin')` server actions → Zod → Drizzle →
`ActionResult`; server-component pages; dialog + table components).

- **People are records, not logins.** A new `members` table is a person in the
  directory, independent of `users`. `members.userId` is an optional, unique
  link for those who also log in. This lets the directory include children and
  non-login visitors — required for a family directory and Sunday-school
  attendance. A `families` table groups members by household.
- **Money is integer satang.** `donations.amount` is integer THB minor units —
  never float. THB only. `memberId` is nullable (anonymous/cash gifts);
  `donorName` snapshots the giver. There is **no online payment processing** —
  admins record gifts received out-of-band. The "coffee is free, no payments"
  non-goal is unchanged.
- **Giving statements are printable HTML.** A per-member, per-year statement page
  styled with `@media print` (browser "Save as PDF"). No PDF dependency added.
- **Class attendance is a register.** `class_attendances` records that a member
  was present at a class offering on a date, unique on
  `(classOfferingId, memberId, sessionDate)`. Distinct from the GPS
  service-`attendances` table.
- **Directory data is single-field, not bilingual.** Person/family/donor names,
  addresses, and notes are operational data, not translated public content
  (refines CONTEXT invariant 7). Admin UI chrome stays bilingual via `pick`.

## Consequences

- Four new tables (`families`, `members`, `donations`, `class_attendances`) and
  three enums (`member_status`, `donation_fund`, `donation_method`) in one
  migration. Standard Postgres — applies identically on the Pi or a future
  serverless host.
- These admin modules expose member **PII and donation records**. Today the Pi is
  Tailscale-only, so they're private by default. A future move to a public host
  (e.g. Vercel — pending infra decision) would put them on the public internet
  behind admin auth only; weigh keeping the back-office on the tailnet, or accept
  it with the existing scrypt/session auth.
- No second stack to run, patch, or back up. One database, one auth model.
