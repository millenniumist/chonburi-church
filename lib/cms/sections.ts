import { z } from 'zod';
import { site, verse, church } from '@/content/site';

/**
 * The section registry — the single source of truth that makes editable site
 * content strict-typed and extensible (ADR-0004).
 *
 * For each `siteContent` key we declare, in one place:
 *   - a Zod `schema` describing the bilingual structured shape, and
 *   - a `default` value imported from `content/site.ts` (the canonical defaults
 *     and the runtime fallback — the public site must never break).
 *
 * "Add an editable section" == add one entry to `SECTIONS` (schema + default).
 * The read layer (`lib/cms/read.ts`), the seed (`lib/db/seed.ts`) and the admin
 * forms all iterate this registry generically, so a new entry is picked up
 * everywhere without touching those files.
 */

// ── Atomic building block ─────────────────────────────────────────────────────

/** The `Localized = { th: string; en: string }` shape from `lib/i18n.ts`. */
export const localizedSchema = z.object({
  th: z.string(),
  en: z.string(),
});

export type LocalizedValue = z.infer<typeof localizedSchema>;

// ── Per-section schemas ───────────────────────────────────────────────────────

const heroSchema = z.object({
  heading: localizedSchema,
  body: localizedSchema,
  primaryCta: localizedSchema,
  secondaryCta: localizedSchema,
});

const gospelSchema = z.object({
  heading: localizedSchema,
  body: localizedSchema,
});

const storySchema = z.object({
  heading: localizedSchema,
  body: localizedSchema,
});

const firstVisitSchema = z.object({
  heading: localizedSchema,
  steps: z.array(localizedSchema),
});

const classesTeaserSchema = z.object({
  heading: localizedSchema,
  body: localizedSchema,
  cta: localizedSchema,
});

const verseSchema = z.object({
  text: localizedSchema,
  reference: localizedSchema,
});

const worshipTimeSchema = z.object({
  day: localizedSchema,
  time: z.string(),
  event: localizedSchema,
});

const churchSchema = z.object({
  legalName: localizedSchema,
  phone: z.string(),
  email: z.string(),
  address: localizedSchema,
  coordinates: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  mapEmbedUrl: z.string(),
  mapsLink: z.string(),
  social: z.object({
    facebook: z.string(),
    facebookLive: z.string(),
    youtube: z.string(),
  }),
  worshipTimes: z.array(worshipTimeSchema),
});

// ── The registry ──────────────────────────────────────────────────────────────

/**
 * A single registry entry: a Zod schema and the default value (from
 * `content/site.ts`) parsed once through that schema so the default is provably
 * valid against its own contract (and shed of the `as const` literal narrowing).
 */
export type SectionEntry<S extends z.ZodTypeAny> = {
  schema: S;
  default: z.infer<S>;
};

function entry<S extends z.ZodTypeAny>(schema: S, defaults: unknown): SectionEntry<S> {
  // Parse (not safeParse): a build-time guarantee that every default matches its
  // schema. If `content/site.ts` ever drifts from a schema, this throws on import.
  return { schema, default: schema.parse(defaults) };
}

export const SECTIONS = {
  hero: entry(heroSchema, site.hero),
  gospel: entry(gospelSchema, site.gospel),
  story: entry(storySchema, site.story),
  firstVisit: entry(firstVisitSchema, site.firstVisit),
  classesTeaser: entry(classesTeaserSchema, site.classesTeaser),
  verse: entry(verseSchema, verse),
  church: entry(churchSchema, church),
} as const;

// ── Inferred types ──────────────────────────────────────────────────────────

/** Every editable section key (the `siteContent.key` values). */
export type SectionKey = keyof typeof SECTIONS;

/** The validated value type for a given section key. */
export type SectionValue<K extends SectionKey> = z.infer<(typeof SECTIONS)[K]['schema']>;

/**
 * Resolve `value` for `key` with the registry schema, falling back to the
 * section default when `value` is absent or fails validation. The single place
 * the registry's generic-keyed lookup is reconciled with `SectionValue<K>`:
 * `safeParse(...).data` and `.default` are both, by construction, the section's
 * value type, but TypeScript cannot reduce that through the generic index — so
 * this one helper narrows it (no `any`, validated at runtime).
 *
 * Pass `present = false` to force the default (a missing row, not a bad one).
 */
export function resolveSectionValue<K extends SectionKey>(
  key: K,
  value: unknown,
  present: boolean,
): { value: SectionValue<K>; usedDefault: boolean; error?: z.ZodError } {
  const e = SECTIONS[key];
  const fallback = e.default as SectionValue<K>;
  if (!present) return { value: fallback, usedDefault: true };

  const parsed = e.schema.safeParse(value);
  if (!parsed.success) {
    return { value: fallback, usedDefault: true, error: parsed.error };
  }
  return { value: parsed.data as SectionValue<K>, usedDefault: false };
}

/** Per-section inferred types, for callers that want them by name. */
export type HeroContent = SectionValue<'hero'>;
export type GospelContent = SectionValue<'gospel'>;
export type StoryContent = SectionValue<'story'>;
export type FirstVisitContent = SectionValue<'firstVisit'>;
export type ClassesTeaserContent = SectionValue<'classesTeaser'>;
export type VerseContent = SectionValue<'verse'>;
export type ChurchContent = SectionValue<'church'>;

/** The full map of resolved content, keyed by section. */
export type AllContent = { [K in SectionKey]: SectionValue<K> };

/** All section keys as a readonly tuple (handy for iterating/seeding). */
export const SECTION_KEYS = Object.keys(SECTIONS) as SectionKey[];
