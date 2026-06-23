import { z } from 'zod';

/**
 * Pure validation + reshaping for the 'church' CMS slice — NO server-only deps
 * (no `@/lib/db`, no `next/cache`). This module is import-safe from BOTH the
 * server action (`lib/actions/cms-church.ts`) and the client form
 * (`app/admin/church/church-info-form.tsx`), which reshapes its flat fields with
 * `normalizeChurchInput` before handing the structured value to the action.
 *
 * Splitting these pure exports out of the `'use server'` action module is what
 * keeps Drizzle/`pg` out of the client bundle: a `'use server'` module may only
 * export async functions, and a client component statically importing the action
 * file would otherwise drag the DB driver into the browser build.
 */

// ── Field-level schemas ────────────────────────────────────────────────────────

/** A required bilingual value: both languages must be non-empty after trim. */
const requiredLocalized = z.object({
  th: z.string().trim().min(1).max(300),
  en: z.string().trim().min(1).max(300),
});

/** An optional bilingual value (either side may be blank). Trimmed; never null. */
const optionalLocalized = z.object({
  th: z.string().trim().max(2000),
  en: z.string().trim().max(2000),
});

/**
 * An optional http(s) URL: an empty string normalises to '' (not a failure, not
 * null) so blank optional fields behave consistently and stay JSON-serialisable
 * for the loose registry schema (which expects `string`, not `string | null`).
 */
const optionalUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => v === '' || (/^https?:\/\//i.test(v) && z.string().url().safeParse(v).success), {
    message: 'must be a valid http(s) URL or empty',
  });

/** A worship-time row: bilingual day + free-form time string + bilingual event. */
const worshipTimeInputSchema = z.object({
  day: requiredLocalized,
  time: z.string().trim().min(1).max(60),
  event: requiredLocalized,
});

/**
 * The STRICT church validator the admin action runs at the boundary. It layers
 * real-world constraints (coordinate ranges, email + URL format, required
 * worship-time fields) on top of the registry's loose `church` schema. Its
 * output is, by construction, a valid `siteContent.church` value (it satisfies
 * the registry schema too — covered by the unit test).
 */
export const churchInputSchema = z.object({
  legalName: requiredLocalized,
  phone: z.string().trim().max(120),
  email: z.string().trim().email().max(200),
  address: optionalLocalized,
  coordinates: z.object({
    latitude: z.coerce.number().finite().min(-90).max(90),
    longitude: z.coerce.number().finite().min(-180).max(180),
  }),
  mapEmbedUrl: optionalUrl,
  mapsLink: optionalUrl,
  social: z.object({
    facebook: optionalUrl,
    facebookLive: optionalUrl,
    youtube: optionalUrl,
  }),
  worshipTimes: z.array(worshipTimeInputSchema).max(50),
}) satisfies z.ZodType<unknown>;

export type ChurchInput = z.infer<typeof churchInputSchema>;

// ── FormData → structured shape ─────────────────────────────────────────────────

/** The flat field bag the client form serialises into. */
export type FlatChurchInput = {
  legalNameTh: string;
  legalNameEn: string;
  phone: string;
  email: string;
  addressTh: string;
  addressEn: string;
  latitude: string;
  longitude: string;
  mapEmbedUrl: string;
  mapsLink: string;
  facebook: string;
  facebookLive: string;
  youtube: string;
  worshipTimes: Array<{
    dayTh: string;
    dayEn: string;
    time: string;
    eventTh: string;
    eventEn: string;
  }>;
};

/**
 * Reshape the form's flat fields + worshipTimes array into the structured
 * `church` object the strict schema validates. NO clamping or coercion of
 * coordinates beyond `Number(...)` — out-of-range values flow through so the
 * schema can reject them (the unit test asserts no silent clamping). Coordinate
 * strings become numbers here; the schema's `z.coerce.number()` is a belt for
 * direct (non-form) callers.
 */
export function normalizeChurchInput(flat: FlatChurchInput): ChurchInput {
  return {
    legalName: { th: flat.legalNameTh, en: flat.legalNameEn },
    phone: flat.phone,
    email: flat.email,
    address: { th: flat.addressTh, en: flat.addressEn },
    coordinates: {
      latitude: Number(flat.latitude),
      longitude: Number(flat.longitude),
    },
    mapEmbedUrl: flat.mapEmbedUrl,
    mapsLink: flat.mapsLink,
    social: {
      facebook: flat.facebook,
      facebookLive: flat.facebookLive,
      youtube: flat.youtube,
    },
    worshipTimes: flat.worshipTimes.map((w) => ({
      day: { th: w.dayTh, en: w.dayEn },
      time: w.time,
      event: { th: w.eventTh, en: w.eventEn },
    })),
  };
}
