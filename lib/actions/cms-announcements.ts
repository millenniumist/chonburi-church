'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { announcements } from '@/lib/db/schema';
import { requireRole } from '@/lib/auth';
import { imageUrlSchema } from '@/lib/cms/url';
import { getLocale } from '@/lib/locale';
import { pick, type Locale } from '@/lib/i18n';
import type { ActionResult } from '@/lib/forms';
import type { Announcement } from '@/lib/db/schema';

/**
 * Announcements CMS slice (ADR-0004) — full admin CRUD for the church/café news
 * & events shown on the public landing "Announcements" band.
 *
 * Pattern mirrors `lib/actions/admin-catalog.ts` + `lib/actions/admin-core.ts`:
 * `'use server'` at the MODULE top (so the file is server-only and `pg`/Drizzle
 * never leak into a client bundle when a client component imports the actions);
 * every mutation calls `requireRole('admin')` FIRST, Zod-`safeParse`s the input
 * at the boundary, enforces the unique-`slug` guard, returns an `ActionResult<T>`
 * with a BILINGUAL error via `pick(th, en, locale)`, then revalidates `/` (the
 * public read) and `/admin/announcements`.
 *
 * The validation schemas are unit-tested by importing this module in a Node
 * (server) test environment, so they stay co-located with the actions.
 *
 * Coffee is free: there is deliberately NO price/payment field anywhere.
 */

const PUBLIC_PATH = '/';
const ADMIN_PATH = '/admin/announcements';

// ── Bilingual error helper ─────────────────────────────────────────────────────

function msg(th: string, en: string, locale: Locale): string {
  return pick(th, en, locale);
}

// ── Shared field schemas ───────────────────────────────────────────────────────

/** A URL-friendly slug: lowercase letters, digits and hyphens. Optional. */
const optionalSlugSchema = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : null))
  .refine((v) => v === null || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v), {
    message: 'slug must be lowercase letters, numbers and hyphens',
  })
  .refine((v) => v === null || v.length <= 80, { message: 'slug is too long' });

/** Required bilingual text (both languages non-empty after trim). */
const requiredText = (max: number) => z.string().trim().min(1).max(max);

/**
 * Optional publish timestamp. Accepts an ISO string (from the admin form), a
 * Date, or empty/absent (→ null = "draft, not published"). A non-parseable
 * string is rejected.
 */
const optionalPublishedAt = z
  .union([z.string().trim(), z.date()])
  .optional()
  .transform((v) => {
    if (v === undefined || v === '') return null;
    return v instanceof Date ? v : new Date(v);
  })
  .refine((v) => v === null || !Number.isNaN(v.getTime()), {
    message: 'publishedAt must be a valid date',
  });

// ── Announcement schemas (exported for unit tests) ───────────────────────────────

export const announcementInputSchema = z.object({
  slug: optionalSlugSchema,
  titleTh: requiredText(200),
  titleEn: requiredText(200),
  bodyTh: requiredText(5000),
  bodyEn: requiredText(5000),
  imageUrl: imageUrlSchema,
  publishedAt: optionalPublishedAt,
  active: z.coerce.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(100000).default(0),
});

export type AnnouncementInput = z.input<typeof announcementInputSchema>;

export const updateAnnouncementSchema = announcementInputSchema.extend({
  id: z.string().uuid(),
});

export type UpdateAnnouncementInput = z.input<typeof updateAnnouncementSchema>;

export const reorderAnnouncementsSchema = z.object({
  items: z
    .array(z.object({ id: z.string().uuid(), sortOrder: z.coerce.number().int().min(0).max(100000) }))
    .min(1),
});

export type ReorderAnnouncementsInput = z.input<typeof reorderAnnouncementsSchema>;

const togglePublishSchema = z.object({
  id: z.string().uuid(),
  /** true → publish now (publishedAt = now if unset); false → unpublish (clear publishedAt). */
  publish: z.coerce.boolean(),
});

export type TogglePublishInput = z.input<typeof togglePublishSchema>;

const toggleActiveSchema = z.object({
  id: z.string().uuid(),
  active: z.coerce.boolean(),
});

export type ToggleActiveInput = z.input<typeof toggleActiveSchema>;

const deleteAnnouncementSchema = z.object({ id: z.string().uuid() });

export type DeleteAnnouncementInput = z.input<typeof deleteAnnouncementSchema>;

// ── Internal helpers ─────────────────────────────────────────────────────────

/** Reject a slug that already belongs to a DIFFERENT row (null slug never clashes). */
async function slugTaken(slug: string | null, exceptId?: string): Promise<boolean> {
  if (slug === null) return false;
  const owner = await db.query.announcements.findFirst({
    where: eq(announcements.slug, slug),
    columns: { id: true },
  });
  return owner != null && owner.id !== exceptId;
}

function revalidate(): void {
  revalidatePath(PUBLIC_PATH);
  revalidatePath(ADMIN_PATH);
}

// ── createAnnouncement ───────────────────────────────────────────────────────

export async function createAnnouncement(
  input: AnnouncementInput,
): Promise<ActionResult<Announcement>> {
  await requireRole('admin');
  const locale = await getLocale();

  const parsed = announcementInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: msg('ข้อมูลประกาศไม่ถูกต้อง', 'Invalid announcement.', locale) };
  }

  if (await slugTaken(parsed.data.slug)) {
    return { ok: false, error: msg('มี slug นี้อยู่แล้ว', 'Slug already in use.', locale) };
  }

  const [row] = await db.insert(announcements).values(parsed.data).returning();
  if (!row) {
    return { ok: false, error: msg('บันทึกประกาศไม่สำเร็จ', 'Could not save the announcement.', locale) };
  }

  revalidate();
  return { ok: true, data: row };
}

// ── updateAnnouncement ───────────────────────────────────────────────────────

export async function updateAnnouncement(
  input: UpdateAnnouncementInput,
): Promise<ActionResult<Announcement>> {
  await requireRole('admin');
  const locale = await getLocale();

  const parsed = updateAnnouncementSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: msg('ข้อมูลประกาศไม่ถูกต้อง', 'Invalid announcement.', locale) };
  }

  const { id, ...values } = parsed.data;

  const current = await db.query.announcements.findFirst({
    where: eq(announcements.id, id),
    columns: { id: true },
  });
  if (!current) {
    return { ok: false, error: msg('ไม่พบประกาศนี้', 'Announcement not found.', locale) };
  }

  if (await slugTaken(values.slug, id)) {
    return { ok: false, error: msg('มี slug นี้อยู่แล้ว', 'Slug already in use.', locale) };
  }

  const [row] = await db
    .update(announcements)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(announcements.id, id))
    .returning();
  if (!row) {
    return { ok: false, error: msg('บันทึกประกาศไม่สำเร็จ', 'Could not save the announcement.', locale) };
  }

  revalidate();
  return { ok: true, data: row };
}

// ── togglePublish ──────────────────────────────────────────────────────────────

/**
 * Publish or unpublish an announcement. Publishing stamps `publishedAt` to now
 * when it is still unset (so a never-published draft goes live immediately);
 * unpublishing clears `publishedAt` so it drops out of the public `publishedOnly`
 * view. `active` is left untouched — that is the separate visibility toggle.
 */
export async function togglePublish(
  input: TogglePublishInput,
): Promise<ActionResult<Announcement>> {
  await requireRole('admin');
  const locale = await getLocale();

  const parsed = togglePublishSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: msg('คำสั่งไม่ถูกต้อง', 'Invalid request.', locale) };
  }

  const current = await db.query.announcements.findFirst({
    where: eq(announcements.id, parsed.data.id),
    columns: { publishedAt: true },
  });
  if (!current) {
    return { ok: false, error: msg('ไม่พบประกาศนี้', 'Announcement not found.', locale) };
  }

  const publishedAt = parsed.data.publish ? (current.publishedAt ?? new Date()) : null;

  const [row] = await db
    .update(announcements)
    .set({ publishedAt, updatedAt: new Date() })
    .where(eq(announcements.id, parsed.data.id))
    .returning();
  if (!row) {
    return { ok: false, error: msg('บันทึกไม่สำเร็จ', 'Could not save.', locale) };
  }

  revalidate();
  return { ok: true, data: row };
}

// ── toggleActive ────────────────────────────────────────────────────────────────

/** Show/hide an announcement without touching its publish timestamp. */
export async function toggleActive(input: ToggleActiveInput): Promise<ActionResult<Announcement>> {
  await requireRole('admin');
  const locale = await getLocale();

  const parsed = toggleActiveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: msg('คำสั่งไม่ถูกต้อง', 'Invalid request.', locale) };
  }

  const [row] = await db
    .update(announcements)
    .set({ active: parsed.data.active, updatedAt: new Date() })
    .where(eq(announcements.id, parsed.data.id))
    .returning();
  if (!row) {
    return { ok: false, error: msg('ไม่พบประกาศนี้', 'Announcement not found.', locale) };
  }

  revalidate();
  return { ok: true, data: row };
}

// ── reorderAnnouncements ─────────────────────────────────────────────────────

/** Persist a new `sortOrder` for several announcements at once (drag-reorder). */
export async function reorderAnnouncements(
  input: ReorderAnnouncementsInput,
): Promise<ActionResult> {
  await requireRole('admin');
  const locale = await getLocale();

  const parsed = reorderAnnouncementsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: msg('คำสั่งไม่ถูกต้อง', 'Invalid request.', locale) };
  }

  const now = new Date();

  await db.transaction(async (tx) => {
    for (const { id, sortOrder } of parsed.data.items) {
      await tx
        .update(announcements)
        .set({ sortOrder, updatedAt: now })
        .where(eq(announcements.id, id));
    }
  });

  revalidate();
  return { ok: true, data: undefined };
}

// ── deleteAnnouncement ───────────────────────────────────────────────────────

export async function deleteAnnouncement(input: DeleteAnnouncementInput): Promise<ActionResult> {
  await requireRole('admin');
  const locale = await getLocale();

  const parsed = deleteAnnouncementSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: msg('คำสั่งไม่ถูกต้อง', 'Invalid request.', locale) };
  }

  const [row] = await db
    .delete(announcements)
    .where(eq(announcements.id, parsed.data.id))
    .returning({ id: announcements.id });
  if (!row) {
    return { ok: false, error: msg('ไม่พบประกาศนี้', 'Announcement not found.', locale) };
  }

  revalidate();
  return { ok: true, data: undefined };
}
