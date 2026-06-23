'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { families, members, memberStatus } from '@/lib/db/schema';
import { requireRole } from '@/lib/auth';
import { imageUrlSchema } from '@/lib/cms/url';
import { getLocale } from '@/lib/locale';
import { pick, type Locale } from '@/lib/i18n';
import type { ActionResult } from '@/lib/forms';
import type { Family, Member } from '@/lib/db/schema';

/**
 * Members + families directory (ADR-0005) — ADMIN-ONLY CRUD for the church
 * directory. There is no public read layer for this data, so the list helpers
 * live here next to the actions (NOT in `lib/cms/read.ts`, which is public).
 *
 * Pattern mirrors `lib/actions/cms-announcements.ts`: `'use server'` at the
 * MODULE top; every action calls `requireRole('admin')` FIRST; input is
 * Zod-`safeParse`d at the boundary; failures `return { ok: false, error }` with
 * a BILINGUAL message via `pick(th, en, locale)` (never throw for validation);
 * mutations use Drizzle CRUD with `.returning()` and revalidate `/admin/members`.
 *
 * Names, addresses, notes are operational data — single fields, never th/en
 * (CONTEXT invariant 9). Only the UI chrome is bilingual.
 */

const ADMIN_PATH = '/admin/members';

// ── Bilingual error helper ─────────────────────────────────────────────────────

function msg(th: string, en: string, locale: Locale): string {
  return pick(th, en, locale);
}

function revalidate(): void {
  revalidatePath(ADMIN_PATH);
}

// ── Shared field schemas ───────────────────────────────────────────────────────

/** Optional free-text field: trims, and treats empty string as null. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null));

/** Optional uuid foreign key: accepts '' (→ null) or a valid uuid. */
const optionalUuid = z
  .union([z.string().uuid(), z.literal('')])
  .optional()
  .transform((v) => (v ? v : null));

/** Optional email: accepts '' (→ null) or a valid email. */
const optionalEmail = z
  .union([z.string().trim().email().max(320), z.literal('')])
  .optional()
  .transform((v) => (v ? v : null));

/** Optional `date` column value ('YYYY-MM-DD' string) — '' → null. */
const optionalDate = z
  .union([z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal('')])
  .optional()
  .transform((v) => (v ? v : null));

// ── Family schemas (exported for unit tests) ─────────────────────────────────────

const familyInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  address: optionalText(2000),
  phone: optionalText(50),
  notes: optionalText(5000),
});

export type FamilyInput = z.input<typeof familyInputSchema>;

const updateFamilySchema = familyInputSchema.extend({
  id: z.string().uuid(),
});

export type UpdateFamilyInput = z.input<typeof updateFamilySchema>;

const deleteFamilySchema = z.object({ id: z.string().uuid() });

export type DeleteFamilyInput = z.input<typeof deleteFamilySchema>;

// ── Member schemas (exported for unit tests) ─────────────────────────────────────

const memberInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  familyId: optionalUuid,
  email: optionalEmail,
  phone: optionalText(50),
  birthDate: optionalDate,
  photoUrl: imageUrlSchema,
  status: z.enum(memberStatus.enumValues).default('visitor'),
  joinedAt: optionalDate,
  notes: optionalText(5000),
  active: z.coerce.boolean().default(true),
});

export type MemberInput = z.input<typeof memberInputSchema>;

const updateMemberSchema = memberInputSchema.extend({
  id: z.string().uuid(),
});

export type UpdateMemberInput = z.input<typeof updateMemberSchema>;

const deleteMemberSchema = z.object({ id: z.string().uuid() });

export type DeleteMemberInput = z.input<typeof deleteMemberSchema>;

/** A member row joined with its family name (admin directory listing). */
export type MemberWithFamily = Member & { familyName: string | null };

// ── Family list ──────────────────────────────────────────────────────────────────

/** Every family, ordered by name (ADMIN-ONLY). */
export async function listFamilies(): Promise<Family[]> {
  await requireRole('admin');
  return db.select().from(families).orderBy(asc(families.name));
}

// ── createFamily ─────────────────────────────────────────────────────────────────

export async function createFamily(input: FamilyInput): Promise<ActionResult<Family>> {
  await requireRole('admin');
  const locale = await getLocale();

  const parsed = familyInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: msg('ข้อมูลครอบครัวไม่ถูกต้อง', 'Invalid family.', locale) };
  }

  const [row] = await db.insert(families).values(parsed.data).returning();
  if (!row) {
    return { ok: false, error: msg('บันทึกครอบครัวไม่สำเร็จ', 'Could not save the family.', locale) };
  }

  revalidate();
  return { ok: true, data: row };
}

// ── updateFamily ─────────────────────────────────────────────────────────────────

export async function updateFamily(input: UpdateFamilyInput): Promise<ActionResult<Family>> {
  await requireRole('admin');
  const locale = await getLocale();

  const parsed = updateFamilySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: msg('ข้อมูลครอบครัวไม่ถูกต้อง', 'Invalid family.', locale) };
  }

  const { id, ...values } = parsed.data;

  const [row] = await db
    .update(families)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(families.id, id))
    .returning();
  if (!row) {
    return { ok: false, error: msg('ไม่พบครอบครัวนี้', 'Family not found.', locale) };
  }

  revalidate();
  return { ok: true, data: row };
}

// ── deleteFamily ─────────────────────────────────────────────────────────────────

export async function deleteFamily(input: DeleteFamilyInput): Promise<ActionResult> {
  await requireRole('admin');
  const locale = await getLocale();

  const parsed = deleteFamilySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: msg('คำสั่งไม่ถูกต้อง', 'Invalid request.', locale) };
  }

  // Members keep existing; their familyId is set null by the FK (onDelete: set null).
  const [row] = await db
    .delete(families)
    .where(eq(families.id, parsed.data.id))
    .returning({ id: families.id });
  if (!row) {
    return { ok: false, error: msg('ไม่พบครอบครัวนี้', 'Family not found.', locale) };
  }

  revalidate();
  return { ok: true, data: undefined };
}

// ── Member list ────────────────────────────────────────────────────────────────

/** Every member joined with their family name, ordered by name (ADMIN-ONLY). */
export async function listMembers(): Promise<MemberWithFamily[]> {
  await requireRole('admin');
  const rows = await db
    .select({ member: members, familyName: families.name })
    .from(members)
    .leftJoin(families, eq(members.familyId, families.id))
    .orderBy(asc(members.name));

  return rows.map((r) => ({ ...r.member, familyName: r.familyName }));
}

// ── createMember ─────────────────────────────────────────────────────────────────

export async function createMember(input: MemberInput): Promise<ActionResult<Member>> {
  await requireRole('admin');
  const locale = await getLocale();

  const parsed = memberInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: msg('ข้อมูลสมาชิกไม่ถูกต้อง', 'Invalid member.', locale) };
  }

  const [row] = await db.insert(members).values(parsed.data).returning();
  if (!row) {
    return { ok: false, error: msg('บันทึกสมาชิกไม่สำเร็จ', 'Could not save the member.', locale) };
  }

  revalidate();
  return { ok: true, data: row };
}

// ── updateMember ─────────────────────────────────────────────────────────────────

export async function updateMember(input: UpdateMemberInput): Promise<ActionResult<Member>> {
  await requireRole('admin');
  const locale = await getLocale();

  const parsed = updateMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: msg('ข้อมูลสมาชิกไม่ถูกต้อง', 'Invalid member.', locale) };
  }

  const { id, ...values } = parsed.data;

  const [row] = await db
    .update(members)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(members.id, id))
    .returning();
  if (!row) {
    return { ok: false, error: msg('ไม่พบสมาชิกนี้', 'Member not found.', locale) };
  }

  revalidate();
  return { ok: true, data: row };
}

// ── deleteMember ─────────────────────────────────────────────────────────────────

export async function deleteMember(input: DeleteMemberInput): Promise<ActionResult> {
  await requireRole('admin');
  const locale = await getLocale();

  const parsed = deleteMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: msg('คำสั่งไม่ถูกต้อง', 'Invalid request.', locale) };
  }

  // Hard delete is fine: donations.memberId / class_attendances cascade per the FKs.
  // The edit form's `active` flag is the soft-archive path.
  const [row] = await db
    .delete(members)
    .where(eq(members.id, parsed.data.id))
    .returning({ id: members.id });
  if (!row) {
    return { ok: false, error: msg('ไม่พบสมาชิกนี้', 'Member not found.', locale) };
  }

  revalidate();
  return { ok: true, data: undefined };
}
