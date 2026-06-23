'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { siteContent } from '@/lib/db/schema';
import type { SiteContent } from '@/lib/db/schema';
import { requireRole } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { pick, type Locale } from '@/lib/i18n';
import type { ActionResult } from '@/lib/forms';
import { SECTIONS, type SectionKey, type SectionValue } from '@/lib/cms/sections';

/**
 * Admin editor for the EDITORIAL site-content sections (ADR-0004).
 *
 * One generic action — `updateEditorialSection(key, value)` — drives every
 * editorial form. It follows the `admin-core.ts` contract exactly:
 *   1. `'use server'` (top of file).
 *   2. `requireRole('admin')` FIRST — before any validation or DB write.
 *   3. Zod `safeParse` at the boundary, reusing the section's registry schema
 *      (`lib/cms/sections.ts`) so the admin validates against the same shape the
 *      public read layer falls back from. No `any`, no `@ts-ignore`.
 *   4. `ActionResult<T>` with a bilingual error via `pick(th, en, locale)`.
 *   5. Upsert the `siteContent` row (`onConflictDoUpdate` on the key, so an
 *      admin re-edit overwrites cleanly — mirrors `updateSiteConfig`).
 *   6. `revalidatePath('/')` (public landing) and `revalidatePath('/admin/content')`.
 *
 * "Add an editable section" stays a one-line registry change: this action and
 * the admin page both iterate `EDITORIAL_KEYS`, so a new editorial entry is
 * picked up without touching this file.
 */

function msg(th: string, en: string, locale: Locale): string {
  return pick(th, en, locale);
}

/**
 * The editorial section keys — the subset of the registry an admin edits as
 * free text on `/admin/content`. `church` is a registry section too, but it is
 * structured (coordinates, social links, worship times) and owned by its own
 * admin slice, so it is intentionally excluded here.
 */
// NOTE: a `'use server'` module may export ONLY async functions (Next.js turns
// every export into an RPC stub). Types are erased, so a `type` export is fine,
// but the key list + guard below must stay module-private. Callers that need
// the list at runtime (the admin page) derive it from the section registry; the
// `EditorialKey` type below is the one shared, compile-time export.
const EDITORIAL_KEYS = [
  'hero',
  'gospel',
  'story',
  'firstVisit',
  'classesTeaser',
  'verse',
] as const satisfies readonly SectionKey[];

/** The editorial section keys an admin edits as free text on `/admin/content`. */
export type EditorialKey = (typeof EDITORIAL_KEYS)[number];

const EDITORIAL_KEY_SET: ReadonlySet<string> = new Set<string>(EDITORIAL_KEYS);

/** Type guard: is `key` one of the editorial sections this action edits? */
function isEditorialKey(key: string): key is EditorialKey {
  return EDITORIAL_KEY_SET.has(key);
}

/**
 * Validate `value` against `key`'s registry schema and upsert the `siteContent`
 * row. Admin only. Returns the saved row on success, or a bilingual `ok:false`
 * message when the role check, the key, or the shape is wrong.
 */
export async function updateEditorialSection<K extends EditorialKey>(
  key: K,
  value: unknown,
): Promise<ActionResult<SiteContent>> {
  await requireRole('admin');
  const locale = await getLocale();

  if (!isEditorialKey(key)) {
    return { ok: false, error: msg('ส่วนเนื้อหาไม่ถูกต้อง', 'Unknown content section.', locale) };
  }

  // Reuse the registry schema for this section — the single source of truth.
  const parsed = SECTIONS[key].schema.safeParse(value);
  if (!parsed.success) {
    return { ok: false, error: msg('เนื้อหาไม่ถูกต้อง', 'Invalid content.', locale) };
  }

  // `parsed.data` is `SectionValue<K>` by construction; the generic index keeps
  // TS from reducing that automatically, so narrow it once here (validated at
  // runtime by the safeParse above — no `any`).
  const data = parsed.data as SectionValue<K>;
  const now = new Date();

  const [row] = await db
    .insert(siteContent)
    .values({ key, value: data, updatedAt: now })
    .onConflictDoUpdate({
      target: siteContent.key,
      set: { value: data, updatedAt: now },
    })
    .returning();

  if (!row) {
    return { ok: false, error: msg('บันทึกไม่สำเร็จ', 'Could not save.', locale) };
  }

  // Public landing reads this content; the admin editor re-renders prefilled.
  revalidatePath('/');
  revalidatePath('/admin/content');
  return { ok: true, data: row };
}
