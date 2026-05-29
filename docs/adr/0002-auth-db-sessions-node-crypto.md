# ADR-0002 — Hand-rolled DB-session auth on node:crypto

- Status: accepted
- Date: 2026-05-29

## Context

The old app's "auth" was a single hardcoded admin whose session was an **unsigned base64 JSON cookie** — anyone could forge `isAdmin: true`. The new app has real users (visitors, members, staff, admins), PII (phone numbers), and an ordering privilege gate. We need real auth, but the deployment target is a Raspberry Pi building on alpine/ARM64, where native-compiled crypto modules (`argon2`, `bcrypt`) add build pain.

## Decision

Roll a small, well-trodden **database-session** auth (the Lucia / "Copenhagen" pattern) on Node's built-in `crypto` — zero extra native deps:

- **Password hashing:** `node:crypto` `scrypt` (built in, memory-hard, no native module). Store `salt:hash`.
- **Session tokens:** a random token (`crypto.randomBytes`) is given to the client in an httpOnly/secure/sameSite cookie; the DB `sessions` table stores only the **SHA-256 hash** of the token. A stolen DB can't be used to mint sessions.
- **Session validation:** look up by token hash, check `expiresAt`, sliding refresh.
- **Roles:** `users.role` (`admin | staff | member | visitor`) drives access. Server actions and route handlers check role/`orderingEnabled` server-side.

We deliberately avoid Auth.js/NextAuth for v1: fewer moving parts, full control over the visitor→member qualification flow, nothing to misconfigure.

## Consequences

- We own the auth code (small surface: ~2 files). It must be reviewed carefully — this is security-sensitive.
- No OAuth/social login in v1. **Future:** LINE Login is the obvious next step for Thai users; the `users` table leaves room (nullable `passwordHash`, add `lineUserId`). Phone-OTP is another option but needs a paid SMS provider.
- Email + password is the v1 credential. Email is required and unique; phone is optional profile data.
