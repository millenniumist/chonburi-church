# ADR-0004 — DB-backed CMS backoffice for editorial, church, announcements & images

- Status: accepted
- Date: 2026-05-30
- Supersedes: the "no CMS in v1" stance of ADR-0001 (which deferred admin-editable content to "later, if non-devs need to edit")

## Context

ADR-0001 deliberately shipped editorial content as typed, version-controlled modules under `content/` (`site.ts`: `site`, `verse`, `church`) and noted: *"Content edits require a deploy (typed modules) until/unless a content table is added."* That was the right call for the first ship — it got the landing, gospel intro, café story, first-visit steps, classes teaser, verse, and real Chonburi Church details (worship times, address, map, socials) live with zero CMS surface area and full type-safety.

The owner has now asked for the next capability: **make all site content editable from the admin backoffice without a deploy.** Concretely:

1. **Editorial landing copy** — hero, gospel, story, first-visit steps, classes teaser, verse.
2. **Church info & worship times** — legal name, address, phone, email, map embed, socials, and the recurring worship schedule shown on the landing's "Visit Us" band.
3. **Announcements / news** — a new content type (church/café news, events) the church can publish, reorder, and retire on its own.
4. **Menu & class images** — the `imageUrl` for menu items already exists and is admin-editable; class offerings need the same field so the admin can attach images.

The non-negotiable constraints from CONTEXT.md and ADR-0001/0002/0003 still hold: strict TypeScript (no `any`, no `@ts-ignore`, no `ignoreBuildErrors`), Zod at every boundary, bilingual th/en for every user-facing string, lean dependencies (Raspberry Pi, ~1.5GB RAM, ARM64, no native modules), and the existing admin action pattern in `lib/actions/admin-core.ts` (`'use server'` → `requireRole('admin')` → Zod `safeParse` → `ActionResult<T>` with bilingual error via `pick` → `revalidatePath`).

The public site must **never break** because an admin saved bad data or a row is missing — `content/site.ts` remains the canonical default and the runtime fallback.

## Decision

Introduce a **DB-backed CMS layer that is seeded from `content/site.ts` and falls back to it at read time**, structured around a typed section registry. The content modules under `content/` are NOT deleted: they become the schema-validated defaults and the safety net.

### Data model (the agreed spine — do not redesign)

1. **`siteContent`** — `{ key: text primaryKey, value: jsonb notNull, updatedAt: timestamptz notNull defaultNow }`. One row per editable editorial/church section, keyed by section id (`'hero'`, `'gospel'`, `'story'`, `'firstVisit'`, `'classesTeaser'`, `'verse'`, `'church'`). The bilingual structured content lives as validated JSON in `value`.
2. **`announcements`** — `{ id uuid pk defaultRandom, slug text unique, titleTh text notNull, titleEn text notNull, bodyTh text notNull, bodyEn text notNull, imageUrl text, publishedAt timestamptz, active boolean notNull default true, sortOrder int notNull default 0, createdAt timestamptz notNull defaultNow, updatedAt timestamptz notNull defaultNow }`.
3. **`classOfferings.imageUrl text`** — added to the existing table (`menuItems.imageUrl` already exists).

### The section registry (`lib/cms/sections.ts`) — single source of truth

For each `siteContent` key, the registry exports a **Zod schema** (the bilingual structured shape) AND a **default value imported from `content/site.ts`**, plus an inferred TypeScript type per section. The registry is what makes content strict-typed and extensible: **"add an editable section" = add a registry entry** (schema + default + type), and the read layer, seed, and admin form pick it up generically. The `Localized = { th: string; en: string }` shape from `lib/i18n.ts` is the atomic building block for every schema (e.g. `firstVisit.steps` is `z.array(localizedSchema)`). Each default is parsed through its own schema at module load, so a drift between `content/site.ts` and a schema fails fast at import.

### Read layer (`lib/cms/read.ts`, NOT a builder file)

A shared, server-side read module with **fallback baked in**:

- `getContent(key)` → parses the row's `value` with the registry's Zod schema; on missing row OR validation failure, returns the registry **default** (so a stranger never sees a broken page). Validation failures are logged, not thrown.
- `getAllContent()` → the map of every section, each resolved through the same fallback.
- `listAnnouncements({ publishedOnly })` → active announcements ordered by `sortOrder`, `publishedAt`; `publishedOnly` filters to `active && publishedAt != null && publishedAt <= now`.

Landing components (`components/landing/*`, `components/site-footer.tsx`, `components/landing/visit-us.tsx`) stop importing `content/site.ts` directly and instead receive resolved content from the page (which calls the read layer). The `t()` / `pick()` locale helpers are unchanged.

### Mutations (`lib/actions/cms.ts`)

New server actions follow `admin-core.ts` exactly: `'use server'`, `await requireRole('admin')` first, Zod `safeParse` (reusing the registry schemas for `siteContent` upserts), `ActionResult<T>` with bilingual error via `pick`, then `revalidatePath('/')` (public) and `revalidatePath('/admin/content' | '/admin/announcements')`. `updateContent(key, value)` upserts one `siteContent` row (`onConflictDoUpdate` on `key`, like `updateSiteConfig` does on `id`). Announcements get full CRUD + reorder + publish/unpublish, mirroring `admin-catalog.ts`.

### Seed (`lib/db/seed.ts` additions)

Idempotently upsert every `siteContent` row from the `content/site.ts` defaults (iterate the registry, `onConflictDoNothing` on `key` so admin edits are never clobbered), and insert 1–2 sample announcements (`onConflictDoNothing` on `slug`).

### Build approach

Adaptive TDD per the slice philosophy in `docs/PLAN.md`: this round establishes the **Vitest** unit harness (registry schema validation, read-layer fallback, action guards/round-trips) and **Playwright** e2e harness (admin edit → public reflects it; public stays up when a row is missing). Neither is configured today, so Slice "editorial" sets up both runners as part of its Definition of Done.

## Consequences

- **Content edits no longer require a deploy** — the explicit open question left by ADR-0001 is now closed. Non-devs (church staff) edit landing copy, church details, worship times, and announcements from `/admin`.
- **`content/site.ts` is repurposed, not removed** — it is now the typed default + runtime fallback. This keeps the public site resilient (bad/missing DB data degrades to the shipped defaults) and keeps the defaults under code review.
- **Schema migration** — one Drizzle migration adds two tables and one column. Lean and Pi-safe: `jsonb` + `text`, no native deps, no new runtime libraries.
- **Slightly more read work per request** — the landing now reads `siteContent` from Postgres instead of a static import. Mitigated by Next.js caching/`revalidatePath` (writes invalidate `/`) and the small row count; acceptable on the Pi.
- **A new content-trust boundary** — admin-saved JSON must be validated on the way in (Zod at the action) AND on the way out (registry parse at read, with fallback). Defense in depth keeps a malformed row from ever reaching a visitor.
- **Test harness debt is paid down** — the repo gains its first Vitest + Playwright setup, which future slices reuse.
- **Image strategy stays minimal for now** — images are URL references (`imageUrl text`), matching the existing `menuItems` pattern. Actual file upload/storage is explicitly deferred to a future round (see roadmap), keeping the Pi footprint small.
