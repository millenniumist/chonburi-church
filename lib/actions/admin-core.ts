'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { services, siteConfig, users } from '@/lib/db/schema';
import { requireRole } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { pick, type Locale } from '@/lib/i18n';
import type { ActionResult } from '@/lib/forms';
import type { Service, SiteConfig, UserRole } from '@/lib/db/schema';

// ── Bilingual error helper ────────────────────────────────────────────────────

function msg(th: string, en: string, locale: Locale): string {
  return pick(th, en, locale);
}

// ── Shared field schemas ──────────────────────────────────────────────────────

/** "HH:MM" or "HH:MM:SS" 24-hour time. */
const timeSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/);

/** Treat an empty string as "not provided" (nullable text columns). */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null));

// ── updateSiteConfig ───────────────────────────────────────────────────────────

const siteConfigSchema = z.object({
  churchLat: z.coerce.number().finite().min(-90).max(90),
  churchLng: z.coerce.number().finite().min(-180).max(180),
  checkinRadiusMeters: z.coerce.number().int().min(1).max(100000),
  addressTh: optionalText(500),
  addressEn: optionalText(500),
  phone: optionalText(40),
  mapEmbedUrl: optionalText(2000),
});

/**
 * Upsert the single `siteConfig` row (id = 1). These coordinates + radius power
 * the GPS check-in verification — the server measures the haversine distance of
 * a check-in against them. Admin only.
 */
export async function updateSiteConfig(
  input: unknown,
): Promise<ActionResult<SiteConfig>> {
  await requireRole('admin');
  const locale = await getLocale();

  const parsed = siteConfigSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: msg('ข้อมูลไม่ถูกต้อง', 'Invalid configuration.', locale) };
  }

  const data = parsed.data;
  const now = new Date();

  const [row] = await db
    .insert(siteConfig)
    .values({ id: 1, ...data, updatedAt: now })
    .onConflictDoUpdate({
      target: siteConfig.id,
      set: { ...data, updatedAt: now },
    })
    .returning();

  if (!row) {
    return { ok: false, error: msg('บันทึกไม่สำเร็จ', 'Could not save.', locale) };
  }

  revalidatePath('/admin/config');
  return { ok: true, data: row };
}

// ── Services CRUD ────────────────────────────────────────────────────────────

const serviceBaseSchema = z.object({
  nameTh: z.string().trim().min(1).max(120),
  nameEn: z.string().trim().min(1).max(120),
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: timeSchema,
  endTime: timeSchema,
  active: z.coerce.boolean(),
});

const updateServiceSchema = serviceBaseSchema.extend({
  id: z.uuid(),
});

const deleteServiceSchema = z.object({ id: z.uuid() });

/** Reject windows whose end is not strictly after the start. */
function endAfterStart(startTime: string, endTime: string): boolean {
  const toMin = (v: string): number => {
    const [h, m] = v.split(':');
    return Number(h ?? 0) * 60 + Number(m ?? 0);
  };
  return toMin(endTime) > toMin(startTime);
}

export async function createService(input: unknown): Promise<ActionResult<Service>> {
  await requireRole('admin');
  const locale = await getLocale();

  const parsed = serviceBaseSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: msg('ข้อมูลรอบนมัสการไม่ถูกต้อง', 'Invalid service window.', locale) };
  }
  if (!endAfterStart(parsed.data.startTime, parsed.data.endTime)) {
    return {
      ok: false,
      error: msg('เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่ม', 'End time must be after start time.', locale),
    };
  }

  const [row] = await db.insert(services).values(parsed.data).returning();
  if (!row) {
    return { ok: false, error: msg('เพิ่มรอบไม่สำเร็จ', 'Could not create the service.', locale) };
  }

  revalidatePath('/admin/services');
  return { ok: true, data: row };
}

export async function updateService(input: unknown): Promise<ActionResult<Service>> {
  await requireRole('admin');
  const locale = await getLocale();

  const parsed = updateServiceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: msg('ข้อมูลรอบนมัสการไม่ถูกต้อง', 'Invalid service window.', locale) };
  }
  if (!endAfterStart(parsed.data.startTime, parsed.data.endTime)) {
    return {
      ok: false,
      error: msg('เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่ม', 'End time must be after start time.', locale),
    };
  }

  const { id, ...values } = parsed.data;

  const [row] = await db
    .update(services)
    .set(values)
    .where(eq(services.id, id))
    .returning();

  if (!row) {
    return { ok: false, error: msg('ไม่พบรอบนมัสการ', 'Service not found.', locale) };
  }

  revalidatePath('/admin/services');
  return { ok: true, data: row };
}

export async function deleteService(input: unknown): Promise<ActionResult> {
  await requireRole('admin');
  const locale = await getLocale();

  const parsed = deleteServiceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: msg('คำสั่งไม่ถูกต้อง', 'Invalid request.', locale) };
  }

  const [row] = await db
    .delete(services)
    .where(eq(services.id, parsed.data.id))
    .returning({ id: services.id });

  if (!row) {
    return { ok: false, error: msg('ไม่พบรอบนมัสการ', 'Service not found.', locale) };
  }

  revalidatePath('/admin/services');
  return { ok: true, data: undefined };
}

// ── User administration ────────────────────────────────────────────────────────

const ROLE_VALUES = ['admin', 'staff', 'member', 'visitor'] as const satisfies readonly UserRole[];

const setUserRoleSchema = z.object({
  userId: z.uuid(),
  role: z.enum(ROLE_VALUES),
});

const setUserOrderingSchema = z.object({
  userId: z.uuid(),
  orderingEnabled: z.coerce.boolean(),
});

/**
 * Change a user's role. Admin only. Members/admins/staff are considered
 * qualified to order, so promoting to one of those also enables ordering;
 * demoting to `visitor` leaves the existing ordering flag untouched (a visitor
 * may already have qualified via attendance).
 */
export async function setUserRole(input: unknown): Promise<ActionResult> {
  await requireRole('admin');
  const locale = await getLocale();

  const parsed = setUserRoleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: msg('คำสั่งไม่ถูกต้อง', 'Invalid request.', locale) };
  }

  const { userId, role } = parsed.data;
  const grantsOrdering = role === 'admin' || role === 'staff' || role === 'member';

  const [row] = await db
    .update(users)
    .set({
      role,
      ...(grantsOrdering ? { orderingEnabled: true } : {}),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning({ id: users.id });

  if (!row) {
    return { ok: false, error: msg('ไม่พบผู้ใช้', 'User not found.', locale) };
  }

  revalidatePath('/admin/users');
  return { ok: true, data: undefined };
}

/** Manually toggle a user's ordering gate. Admin only. */
export async function setUserOrdering(input: unknown): Promise<ActionResult> {
  await requireRole('admin');
  const locale = await getLocale();

  const parsed = setUserOrderingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: msg('คำสั่งไม่ถูกต้อง', 'Invalid request.', locale) };
  }

  const { userId, orderingEnabled } = parsed.data;

  const [row] = await db
    .update(users)
    .set({ orderingEnabled, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning({ id: users.id });

  if (!row) {
    return { ok: false, error: msg('ไม่พบผู้ใช้', 'User not found.', locale) };
  }

  revalidatePath('/admin/users');
  return { ok: true, data: undefined };
}
