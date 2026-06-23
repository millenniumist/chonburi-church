'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { classAttendances, members } from '@/lib/db/schema';
import { requireRole } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { pick, type Locale } from '@/lib/i18n';
import type { ActionResult } from '@/lib/forms';
import type { ClassAttendance } from '@/lib/db/schema';

/**
 * Class-attendance register (ADR-0005) — admin-only CRUD for the Sunday-school /
 * class register: pick a class offering + a date, see who was present, add or
 * remove members.
 *
 * Pattern mirrors `lib/actions/cms-announcements.ts`: `'use server'` at the
 * MODULE top; every action calls `requireRole('admin')` FIRST; the input is
 * Zod-`safeParse`d at the boundary; failures return an `ActionResult<T>` with a
 * BILINGUAL error via `pick(th, en, locale)` (never thrown); mutations
 * `revalidatePath(ADMIN_PATH)`.
 *
 * `listAttendance` is exported for the admin server-component page — this module
 * is ADMIN-ONLY and deliberately does NOT touch the public read layer
 * (`lib/cms/read.ts`).
 */

const ADMIN_PATH = '/admin/class-attendance';

// ── Bilingual error helper ─────────────────────────────────────────────────────

function msg(th: string, en: string, locale: Locale): string {
  return pick(th, en, locale);
}

// ── Shared field schemas ───────────────────────────────────────────────────────

/** A calendar date as `YYYY-MM-DD` (Drizzle `date()` is STRING mode). */
const sessionDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'sessionDate must be YYYY-MM-DD' });

/** An optional free-text note (single field — operational data, not th/en). */
const optionalNote = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((v) => (v && v.length > 0 ? v : null));

// ── Attendance schemas (exported for unit tests) ─────────────────────────────────

const attendanceInputSchema = z.object({
  classOfferingId: z.string().uuid(),
  memberId: z.string().uuid(),
  sessionDate: sessionDateSchema,
  note: optionalNote,
});

export type AttendanceInput = z.input<typeof attendanceInputSchema>;

const removeAttendanceSchema = z.object({ id: z.string().uuid() });

export type RemoveAttendanceInput = z.input<typeof removeAttendanceSchema>;

const listAttendanceSchema = z.object({
  classOfferingId: z.string().uuid(),
  sessionDate: sessionDateSchema,
});

export type ListAttendanceInput = z.input<typeof listAttendanceSchema>;

/** One register row joined with the present member's directory name. */
export type AttendanceRow = ClassAttendance & { memberName: string };

// ── listAttendance ───────────────────────────────────────────────────────────

/**
 * Rows for one class offering on one date, joined with the member's name and
 * ordered by member name. Admin-only; called by the server-component page.
 */
export async function listAttendance(
  input: ListAttendanceInput,
): Promise<AttendanceRow[]> {
  await requireRole('admin');

  const parsed = listAttendanceSchema.safeParse(input);
  if (!parsed.success) return [];

  const rows = await db
    .select({
      id: classAttendances.id,
      classOfferingId: classAttendances.classOfferingId,
      memberId: classAttendances.memberId,
      sessionDate: classAttendances.sessionDate,
      note: classAttendances.note,
      createdAt: classAttendances.createdAt,
      memberName: members.name,
    })
    .from(classAttendances)
    .innerJoin(members, eq(classAttendances.memberId, members.id))
    .where(
      and(
        eq(classAttendances.classOfferingId, parsed.data.classOfferingId),
        eq(classAttendances.sessionDate, parsed.data.sessionDate),
      ),
    )
    .orderBy(asc(members.name));

  return rows;
}

// ── markAttendance ───────────────────────────────────────────────────────────

/**
 * Mark a member present at a class offering on a date. Respects the unique
 * `(classOfferingId, memberId, sessionDate)` index: a duplicate insert does
 * nothing and reports "already marked" rather than erroring.
 */
export async function markAttendance(
  input: AttendanceInput,
): Promise<ActionResult<ClassAttendance>> {
  await requireRole('admin');
  const locale = await getLocale();

  const parsed = attendanceInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: msg('ข้อมูลไม่ถูกต้อง', 'Invalid attendance.', locale) };
  }

  const [row] = await db
    .insert(classAttendances)
    .values(parsed.data)
    .onConflictDoNothing()
    .returning();
  if (!row) {
    return { ok: false, error: msg('ทำเครื่องหมายไว้แล้ว', 'Already marked present', locale) };
  }

  revalidatePath(ADMIN_PATH);
  return { ok: true, data: row };
}

// ── removeAttendance ─────────────────────────────────────────────────────────

export async function removeAttendance(
  input: RemoveAttendanceInput,
): Promise<ActionResult> {
  await requireRole('admin');
  const locale = await getLocale();

  const parsed = removeAttendanceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: msg('คำสั่งไม่ถูกต้อง', 'Invalid request.', locale) };
  }

  const [row] = await db
    .delete(classAttendances)
    .where(eq(classAttendances.id, parsed.data.id))
    .returning({ id: classAttendances.id });
  if (!row) {
    return { ok: false, error: msg('ไม่พบรายการนี้', 'Record not found.', locale) };
  }

  revalidatePath(ADMIN_PATH);
  return { ok: true, data: undefined };
}
