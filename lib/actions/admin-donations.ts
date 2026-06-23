'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { and, desc, eq, gte, lte } from 'drizzle-orm';
import { db } from '@/lib/db';
import { donations, donationFund, donationMethod, members } from '@/lib/db/schema';
import { requireRole } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { pick, type Locale } from '@/lib/i18n';
import type { ActionResult } from '@/lib/forms';
import type { Donation } from '@/lib/db/schema';

/**
 * Donations + giving-statements admin slice — full admin CRUD for recorded gifts.
 *
 * Pattern mirrors `lib/actions/cms-announcements.ts`: `'use server'` at the
 * MODULE top (so `pg`/Drizzle never leak into a client bundle when a client
 * component imports these actions); every action calls `requireRole('admin')`
 * FIRST, Zod-`safeParse`s the input at the boundary, returns an `ActionResult<T>`
 * with a BILINGUAL error via `pick(th, en, locale)`, then revalidates the admin
 * route after a mutation.
 *
 * MONEY: `amount` is stored in **satang** (THB minor units) — integer, never
 * float (CONTEXT invariant 8). The admin form collects baht; we convert
 * `satang = Math.round(baht * 100)` on the way in. There is NO online payment
 * processing — admins record gifts the church received out-of-band.
 */

const ADMIN_PATH = '/admin/donations';

// ── Bilingual error helper ─────────────────────────────────────────────────────

function msg(th: string, en: string, locale: Locale): string {
  return pick(th, en, locale);
}

// ── Field schemas ────────────────────────────────────────────────────────────

/** A member id (uuid) or '' / absent → null (anonymous/free-text donor). */
const optionalMemberId = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : null))
  .refine((v) => v === null || z.string().uuid().safeParse(v).success, {
    message: 'memberId must be a uuid',
  });

/** Optional free-text donor name → null when blank. */
const optionalDonorName = z
  .string()
  .trim()
  .max(200)
  .optional()
  .transform((v) => (v && v.length > 0 ? v : null));

/** Optional note → null when blank. */
const optionalNote = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .transform((v) => (v && v.length > 0 ? v : null));

// ── Donation schemas (exported for unit tests) ───────────────────────────────

const donationInputSchema = z.object({
  memberId: optionalMemberId,
  donorName: optionalDonorName,
  fund: z.enum(donationFund.enumValues).default('general'),
  amountBaht: z.coerce.number().positive(),
  method: z.enum(donationMethod.enumValues).default('cash'),
  receivedAt: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'receivedAt must be YYYY-MM-DD' }),
  note: optionalNote,
});

export type DonationInput = z.input<typeof donationInputSchema>;

const updateDonationSchema = donationInputSchema.extend({
  id: z.string().uuid(),
});

export type UpdateDonationInput = z.input<typeof updateDonationSchema>;

const deleteDonationSchema = z.object({ id: z.string().uuid() });

export type DeleteDonationInput = z.input<typeof deleteDonationSchema>;

// ── Internal helpers ─────────────────────────────────────────────────────────

function revalidate(): void {
  revalidatePath(ADMIN_PATH);
}

/**
 * Resolve the persisted donor fields from a parsed input. Require at least one
 * of `memberId` / `donorName`; when a member is chosen and `donorName` is blank,
 * snapshot the member's current name into `donorName` so a receipt stays correct
 * if the member is later edited.
 */
async function resolveDonor(
  memberId: string | null,
  donorName: string | null,
  locale: Locale,
): Promise<ActionResult<{ memberId: string | null; donorName: string | null }>> {
  if (memberId === null && donorName === null) {
    return {
      ok: false,
      error: msg('เลือกสมาชิกหรือกรอกชื่อผู้บริจาค', 'Choose a member or enter a donor name.', locale),
    };
  }

  if (memberId !== null) {
    const member = await db.query.members.findFirst({
      where: eq(members.id, memberId),
      columns: { name: true },
    });
    if (!member) {
      return { ok: false, error: msg('ไม่พบสมาชิกนี้', 'Member not found.', locale) };
    }
    return { ok: true, data: { memberId, donorName: donorName ?? member.name } };
  }

  return { ok: true, data: { memberId: null, donorName } };
}

// ── listDonations (admin-only reader) ────────────────────────────────────────

/** A donation row joined with its member's name (null for free-text donors). */
export type DonationWithMember = Donation & { member: { name: string } | null };

/**
 * Every donation, newest first, joined with the member's name. When `year` is
 * given, restrict to gifts whose `receivedAt` falls in that calendar year.
 */
export async function listDonations(opts?: { year?: number }): Promise<DonationWithMember[]> {
  await requireRole('admin');
  const year = opts?.year;
  const where =
    year != null
      ? and(
          gte(donations.receivedAt, `${year}-01-01`),
          lte(donations.receivedAt, `${year}-12-31`),
        )
      : undefined;

  return db.query.donations.findMany({
    where,
    with: { member: { columns: { name: true } } },
    orderBy: [desc(donations.receivedAt), desc(donations.createdAt)],
  });
}

// ── createDonation ─────────────────────────────────────────────────────────────

export async function createDonation(input: DonationInput): Promise<ActionResult<Donation>> {
  await requireRole('admin');
  const locale = await getLocale();

  const parsed = donationInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: msg('ข้อมูลการบริจาคไม่ถูกต้อง', 'Invalid donation.', locale) };
  }

  const donor = await resolveDonor(parsed.data.memberId, parsed.data.donorName, locale);
  if (!donor.ok) return donor;

  const { amountBaht, fund, method, receivedAt, note } = parsed.data;

  const [row] = await db
    .insert(donations)
    .values({
      memberId: donor.data.memberId,
      donorName: donor.data.donorName,
      fund,
      amount: Math.round(amountBaht * 100),
      method,
      receivedAt,
      note,
    })
    .returning();
  if (!row) {
    return { ok: false, error: msg('บันทึกการบริจาคไม่สำเร็จ', 'Could not save the donation.', locale) };
  }

  revalidate();
  return { ok: true, data: row };
}

// ── updateDonation ─────────────────────────────────────────────────────────────

export async function updateDonation(input: UpdateDonationInput): Promise<ActionResult<Donation>> {
  await requireRole('admin');
  const locale = await getLocale();

  const parsed = updateDonationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: msg('ข้อมูลการบริจาคไม่ถูกต้อง', 'Invalid donation.', locale) };
  }

  const { id, amountBaht, fund, method, receivedAt, note } = parsed.data;

  const current = await db.query.donations.findFirst({
    where: eq(donations.id, id),
    columns: { id: true },
  });
  if (!current) {
    return { ok: false, error: msg('ไม่พบการบริจาคนี้', 'Donation not found.', locale) };
  }

  const donor = await resolveDonor(parsed.data.memberId, parsed.data.donorName, locale);
  if (!donor.ok) return donor;

  const [row] = await db
    .update(donations)
    .set({
      memberId: donor.data.memberId,
      donorName: donor.data.donorName,
      fund,
      amount: Math.round(amountBaht * 100),
      method,
      receivedAt,
      note,
      updatedAt: new Date(),
    })
    .where(eq(donations.id, id))
    .returning();
  if (!row) {
    return { ok: false, error: msg('บันทึกการบริจาคไม่สำเร็จ', 'Could not save the donation.', locale) };
  }

  revalidate();
  return { ok: true, data: row };
}

// ── deleteDonation ─────────────────────────────────────────────────────────────

export async function deleteDonation(input: DeleteDonationInput): Promise<ActionResult> {
  await requireRole('admin');
  const locale = await getLocale();

  const parsed = deleteDonationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: msg('คำสั่งไม่ถูกต้อง', 'Invalid request.', locale) };
  }

  const [row] = await db
    .delete(donations)
    .where(eq(donations.id, parsed.data.id))
    .returning({ id: donations.id });
  if (!row) {
    return { ok: false, error: msg('ไม่พบการบริจาคนี้', 'Donation not found.', locale) };
  }

  revalidate();
  return { ok: true, data: undefined };
}
