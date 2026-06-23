'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { siteContent } from '@/lib/db/schema';
import { requireRole } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { pick, type Locale } from '@/lib/i18n';
import type { ActionResult } from '@/lib/forms';
import { SECTIONS, type ChurchContent } from '@/lib/cms/sections';
import { churchInputSchema } from '@/lib/cms/church-input';

/**
 * 'church' CMS slice — the PUBLIC-FACING church info (legal name, address,
 * contact, map embed, socials, worship schedule) shown on the landing "Visit Us"
 * band and the site footer. Stored as the `siteContent.church` row, read back
 * (with fallback) by `lib/cms/read.ts`.
 *
 * IMPORTANT — relationship to `siteConfig` (CONTEXT invariant 2):
 *   `siteContent.church` drives DISPLAY only. The GPS check-in anchor
 *   (lat/lng/radius) lives in the SEPARATE `siteConfig` table and is the source
 *   of truth for proximity verification. This action NEVER writes `siteConfig`,
 *   so editing the displayed map/coordinates here cannot silently move the
 *   check-in geofence. The admin UI says so in plain bilingual copy.
 *
 * Pattern mirrors `lib/actions/admin-core.ts` / `lib/actions/admin-catalog.ts`:
 * `'use server'` at the MODULE top (so the file is server-only and `pg`/Drizzle
 * never leak into the client bundle when the admin form imports this action),
 * requireRole('admin') first, Zod `safeParse` at the boundary, `ActionResult<T>`
 * with a bilingual error via `pick`, then `revalidatePath`.
 *
 * The pure validator + reshaping helper (`churchInputSchema`,
 * `normalizeChurchInput`) live in `@/lib/cms/church-input` — a `'use server'`
 * module may only export async functions, and the client form needs those pure
 * helpers, so they cannot live here.
 */

// ── Bilingual error helper ────────────────────────────────────────────────────

function msg(th: string, en: string, locale: Locale): string {
  return pick(th, en, locale);
}

// ── updateChurchInfo ─────────────────────────────────────────────────────────

/**
 * Validate and upsert the public-facing church info into the `siteContent`
 * `church` row. Admin only. Does NOT touch `siteConfig` (the GPS check-in
 * anchor stays independent — see the module note above).
 */
export async function updateChurchInfo(
  input: unknown,
): Promise<ActionResult<ChurchContent>> {
  await requireRole('admin');
  const locale = await getLocale();

  const parsed = churchInputSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    // Surface the offending field path so the admin can find the bad value.
    const where = first?.path.join('.') ?? '';
    return {
      ok: false,
      error: msg(
        `ข้อมูลคริสตจักรไม่ถูกต้อง${where ? ` (${where})` : ''}`,
        `Invalid church info${where ? ` (${where})` : ''}.`,
        locale,
      ),
    };
  }

  // Re-validate against the registry schema as a final guarantee the stored JSON
  // is exactly what the read layer expects (defence in depth; should never fail).
  const value = SECTIONS.church.schema.safeParse(parsed.data);
  if (!value.success) {
    return { ok: false, error: msg('บันทึกไม่สำเร็จ', 'Could not save.', locale) };
  }

  const now = new Date();
  try {
    await db
      .insert(siteContent)
      .values({ key: 'church', value: value.data, updatedAt: now })
      .onConflictDoUpdate({
        target: siteContent.key,
        set: { value: value.data, updatedAt: now },
      });
  } catch {
    return { ok: false, error: msg('บันทึกไม่สำเร็จ', 'Could not save.', locale) };
  }

  // The church info shows on the public landing/footer and the admin panel.
  revalidatePath('/');
  revalidatePath('/admin/church');

  return { ok: true, data: value.data };
}
