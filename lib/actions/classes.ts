'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { and, count, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { classOfferings, enrollments } from '@/lib/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { pick } from '@/lib/i18n';
import type { FormState } from '@/lib/forms';

/**
 * Enroll the current user (or a guest) into a free Saturday class.
 * useActionState handler: (prev, formData) => Promise<FormState>.
 *
 * Server-side rules (never trust the client):
 *  - The offering must exist and be active.
 *  - A logged-in user enrolls with their userId (guest fields ignored).
 *    A guest must supply both name and phone.
 *  - Duplicates are rejected: same userId+class, or same guestPhone+class.
 *  - Capacity: when capacity != null and active enrolled count >= capacity,
 *    the enrollment is waitlisted; otherwise enrolled.
 */
const enrollSchema = z.object({
  classOfferingId: z.string().uuid(),
  guestName: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => (v ? v : undefined)),
  guestPhone: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export async function enrollAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const locale = await getLocale();
  const tr = (th: string, en: string): string => pick(th, en, locale);

  const parsed = enrollSchema.safeParse({
    classOfferingId: formData.get('classOfferingId'),
    guestName: formData.get('guestName') ?? undefined,
    guestPhone: formData.get('guestPhone') ?? undefined,
  });

  if (!parsed.success) {
    return {
      status: 'error',
      message: tr('ข้อมูลไม่ถูกต้อง กรุณาลองใหม่', 'Invalid details. Please try again.'),
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { classOfferingId } = parsed.data;
  const user = await getCurrentUser();

  // Identity: logged-in user OR guest (name + phone both required).
  let guestName: string | undefined;
  let guestPhone: string | undefined;

  if (!user) {
    guestName = parsed.data.guestName;
    guestPhone = parsed.data.guestPhone;

    const fieldErrors: Record<string, string[]> = {};
    if (!guestName) {
      fieldErrors.guestName = [tr('กรุณากรอกชื่อ', 'Please enter your name.')];
    }
    if (!guestPhone) {
      fieldErrors.guestPhone = [tr('กรุณากรอกเบอร์โทร', 'Please enter your phone number.')];
    }
    if (Object.keys(fieldErrors).length > 0) {
      return {
        status: 'error',
        message: tr(
          'กรุณากรอกชื่อและเบอร์โทรเพื่อลงทะเบียน',
          'Please provide your name and phone number to enroll.',
        ),
        fieldErrors,
      };
    }
  }

  // The offering must exist and be active.
  const offering = await db.query.classOfferings.findFirst({
    where: eq(classOfferings.id, classOfferingId),
  });

  if (!offering || !offering.active) {
    return {
      status: 'error',
      message: tr('ไม่พบคลาสนี้หรือคลาสปิดรับสมัครแล้ว', 'This class is not available.'),
    };
  }

  const className = pick(offering.nameTh, offering.nameEn, locale);

  // Prevent duplicates: same user+class, or same guestPhone+class
  // (ignoring already-cancelled enrollments).
  const duplicateWhere = user
    ? and(eq(enrollments.classOfferingId, classOfferingId), eq(enrollments.userId, user.id))
    : and(
        eq(enrollments.classOfferingId, classOfferingId),
        // guestPhone is guaranteed defined here (validated above).
        eq(enrollments.guestPhone, guestPhone ?? ''),
      );

  const existing = await db.query.enrollments.findFirst({ where: duplicateWhere });
  if (existing && existing.status !== 'cancelled') {
    return {
      status: 'error',
      message: tr(
        `คุณลงทะเบียนคลาส "${className}" ไว้แล้ว`,
        `You are already enrolled in "${className}".`,
      ),
    };
  }

  // Capacity check: count active (non-cancelled) enrollments.
  let status: 'enrolled' | 'waitlisted' = 'enrolled';
  if (offering.capacity != null) {
    const [tally] = await db
      .select({ value: count() })
      .from(enrollments)
      .where(
        and(eq(enrollments.classOfferingId, classOfferingId), eq(enrollments.status, 'enrolled')),
      );
    const enrolledCount = tally?.value ?? 0;
    if (enrolledCount >= offering.capacity) {
      status = 'waitlisted';
    }
  }

  await db.insert(enrollments).values({
    classOfferingId,
    userId: user ? user.id : null,
    guestName: user ? null : (guestName ?? null),
    guestPhone: user ? null : (guestPhone ?? null),
    status,
  });

  revalidatePath('/classes');

  return {
    status: 'success',
    message:
      status === 'waitlisted'
        ? tr(
            `เพิ่มคุณในรายชื่อสำรองของคลาส "${className}" แล้ว`,
            `You've been added to the waitlist for "${className}".`,
          )
        : tr(
            `ลงทะเบียนคลาส "${className}" สำเร็จแล้ว แล้วพบกันวันเสาร์!`,
            `You're enrolled in "${className}". See you Saturday!`,
          ),
  };
}
