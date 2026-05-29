'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { classKind, classOfferings, menuItems } from '@/lib/db/schema';
import { requireRole } from '@/lib/auth';
import type { ActionResult } from '@/lib/forms';
import type { ClassOffering, MenuItem } from '@/lib/db/schema';

/**
 * Admin catalog mutations (Slice 8).
 *
 * Every export here is admin-gated (`requireRole('admin')`), Zod-validated at
 * the boundary, and revalidates the relevant admin page. These are direct
 * (non-form) actions returning `ActionResult` — the client components call them
 * from a transition and surface the result via toasts.
 *
 * Coffee is free: there is deliberately NO price/payment field anywhere.
 */

const MENU_ADMIN_PATH = '/admin/menu';
const CLASSES_ADMIN_PATH = '/admin/classes';

// ── Shared field schemas ─────────────────────────────────────────────────────

// A URL-friendly slug: lowercase letters, digits and hyphens.
const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be lowercase letters, numbers and hyphens');

// Optional text: trim, treat empty string as "not provided" (-> null on write).
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));

// "HH:MM" or "HH:MM:SS" wall-clock time (Postgres `time` column).
const timeSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/, 'time must be HH:MM');

// ── Menu items ───────────────────────────────────────────────────────────────

const menuItemSchema = z.object({
  slug: slugSchema,
  nameTh: z.string().trim().min(1).max(120),
  nameEn: z.string().trim().min(1).max(120),
  descriptionTh: optionalText(2000),
  descriptionEn: optionalText(2000),
  imageUrl: z
    .union([z.string().trim().url().max(2000), z.literal('')])
    .optional()
    .transform((v) => (v ? v : null)),
  category: z.string().trim().min(1).max(60).default('coffee'),
  available: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(100000).default(0),
});

export type MenuItemInput = z.input<typeof menuItemSchema>;

export async function createMenuItem(input: MenuItemInput): Promise<ActionResult<MenuItem>> {
  await requireRole('admin');

  const parsed = menuItemSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstError(parsed.error) };
  }

  const existing = await db.query.menuItems.findFirst({
    where: eq(menuItems.slug, parsed.data.slug),
    columns: { id: true },
  });
  if (existing) {
    return { ok: false, error: 'มี slug นี้อยู่แล้ว / Slug already in use' };
  }

  const [row] = await db.insert(menuItems).values(parsed.data).returning();
  if (!row) {
    return { ok: false, error: 'บันทึกไม่สำเร็จ / Could not save the item' };
  }

  revalidatePath(MENU_ADMIN_PATH);
  return { ok: true, data: row };
}

const updateMenuItemSchema = menuItemSchema.extend({ id: z.string().uuid() });

export type UpdateMenuItemInput = z.input<typeof updateMenuItemSchema>;

export async function updateMenuItem(input: UpdateMenuItemInput): Promise<ActionResult<MenuItem>> {
  await requireRole('admin');

  const parsed = updateMenuItemSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstError(parsed.error) };
  }

  const { id, ...values } = parsed.data;

  const current = await db.query.menuItems.findFirst({
    where: eq(menuItems.id, id),
    columns: { id: true },
  });
  if (!current) {
    return { ok: false, error: 'ไม่พบเมนูนี้ / Menu item not found' };
  }

  // Guard the unique slug against a different row.
  const slugOwner = await db.query.menuItems.findFirst({
    where: eq(menuItems.slug, values.slug),
    columns: { id: true },
  });
  if (slugOwner && slugOwner.id !== id) {
    return { ok: false, error: 'มี slug นี้อยู่แล้ว / Slug already in use' };
  }

  const [row] = await db
    .update(menuItems)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(menuItems.id, id))
    .returning();
  if (!row) {
    return { ok: false, error: 'บันทึกไม่สำเร็จ / Could not save the item' };
  }

  revalidatePath(MENU_ADMIN_PATH);
  return { ok: true, data: row };
}

const toggleMenuItemSchema = z.object({
  id: z.string().uuid(),
  available: z.boolean(),
});

export type ToggleMenuItemInput = z.input<typeof toggleMenuItemSchema>;

export async function toggleMenuItemAvailable(
  input: ToggleMenuItemInput,
): Promise<ActionResult<MenuItem>> {
  await requireRole('admin');

  const parsed = toggleMenuItemSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstError(parsed.error) };
  }

  const [row] = await db
    .update(menuItems)
    .set({ available: parsed.data.available, updatedAt: new Date() })
    .where(eq(menuItems.id, parsed.data.id))
    .returning();
  if (!row) {
    return { ok: false, error: 'ไม่พบเมนูนี้ / Menu item not found' };
  }

  revalidatePath(MENU_ADMIN_PATH);
  return { ok: true, data: row };
}

const deleteMenuItemSchema = z.object({ id: z.string().uuid() });

export type DeleteMenuItemInput = z.input<typeof deleteMenuItemSchema>;

export async function deleteMenuItem(input: DeleteMenuItemInput): Promise<ActionResult> {
  await requireRole('admin');

  const parsed = deleteMenuItemSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstError(parsed.error) };
  }

  const [row] = await db
    .delete(menuItems)
    .where(eq(menuItems.id, parsed.data.id))
    .returning({ id: menuItems.id });
  if (!row) {
    return { ok: false, error: 'ไม่พบเมนูนี้ / Menu item not found' };
  }

  revalidatePath(MENU_ADMIN_PATH);
  return { ok: true, data: undefined };
}

// ── Class offerings ──────────────────────────────────────────────────────────

const classOfferingSchema = z
  .object({
    slug: slugSchema,
    kind: z.enum(classKind.enumValues),
    nameTh: z.string().trim().min(1).max(120),
    nameEn: z.string().trim().min(1).max(120),
    descriptionTh: optionalText(2000),
    descriptionEn: optionalText(2000),
    level: optionalText(60),
    dayOfWeek: z.coerce.number().int().min(0).max(6).default(6),
    startTime: timeSchema,
    endTime: timeSchema,
    capacity: z
      .union([z.coerce.number().int().min(1).max(100000), z.literal('')])
      .optional()
      .transform((v) => (v === '' || v === undefined ? null : v)),
    active: z.boolean().default(true),
    sortOrder: z.coerce.number().int().min(0).max(100000).default(0),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: 'endTime must be after startTime',
    path: ['endTime'],
  });

export type ClassOfferingInput = z.input<typeof classOfferingSchema>;

export async function createClassOffering(
  input: ClassOfferingInput,
): Promise<ActionResult<ClassOffering>> {
  await requireRole('admin');

  const parsed = classOfferingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstError(parsed.error) };
  }

  const existing = await db.query.classOfferings.findFirst({
    where: eq(classOfferings.slug, parsed.data.slug),
    columns: { id: true },
  });
  if (existing) {
    return { ok: false, error: 'มี slug นี้อยู่แล้ว / Slug already in use' };
  }

  const [row] = await db.insert(classOfferings).values(parsed.data).returning();
  if (!row) {
    return { ok: false, error: 'บันทึกไม่สำเร็จ / Could not save the class' };
  }

  revalidatePath(CLASSES_ADMIN_PATH);
  return { ok: true, data: row };
}

const updateClassOfferingSchema = z
  .object({
    id: z.string().uuid(),
    slug: slugSchema,
    kind: z.enum(classKind.enumValues),
    nameTh: z.string().trim().min(1).max(120),
    nameEn: z.string().trim().min(1).max(120),
    descriptionTh: optionalText(2000),
    descriptionEn: optionalText(2000),
    level: optionalText(60),
    dayOfWeek: z.coerce.number().int().min(0).max(6).default(6),
    startTime: timeSchema,
    endTime: timeSchema,
    capacity: z
      .union([z.coerce.number().int().min(1).max(100000), z.literal('')])
      .optional()
      .transform((v) => (v === '' || v === undefined ? null : v)),
    active: z.boolean().default(true),
    sortOrder: z.coerce.number().int().min(0).max(100000).default(0),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: 'endTime must be after startTime',
    path: ['endTime'],
  });

export type UpdateClassOfferingInput = z.input<typeof updateClassOfferingSchema>;

export async function updateClassOffering(
  input: UpdateClassOfferingInput,
): Promise<ActionResult<ClassOffering>> {
  await requireRole('admin');

  const parsed = updateClassOfferingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstError(parsed.error) };
  }

  const { id, ...values } = parsed.data;

  const current = await db.query.classOfferings.findFirst({
    where: eq(classOfferings.id, id),
    columns: { id: true },
  });
  if (!current) {
    return { ok: false, error: 'ไม่พบคลาสนี้ / Class not found' };
  }

  const slugOwner = await db.query.classOfferings.findFirst({
    where: eq(classOfferings.slug, values.slug),
    columns: { id: true },
  });
  if (slugOwner && slugOwner.id !== id) {
    return { ok: false, error: 'มี slug นี้อยู่แล้ว / Slug already in use' };
  }

  const [row] = await db
    .update(classOfferings)
    .set(values)
    .where(eq(classOfferings.id, id))
    .returning();
  if (!row) {
    return { ok: false, error: 'บันทึกไม่สำเร็จ / Could not save the class' };
  }

  revalidatePath(CLASSES_ADMIN_PATH);
  return { ok: true, data: row };
}

const deleteClassOfferingSchema = z.object({ id: z.string().uuid() });

export type DeleteClassOfferingInput = z.input<typeof deleteClassOfferingSchema>;

export async function deleteClassOffering(
  input: DeleteClassOfferingInput,
): Promise<ActionResult> {
  await requireRole('admin');

  const parsed = deleteClassOfferingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstError(parsed.error) };
  }

  // Enrollments cascade-delete via the FK (onDelete: 'cascade').
  const [row] = await db
    .delete(classOfferings)
    .where(eq(classOfferings.id, parsed.data.id))
    .returning({ id: classOfferings.id });
  if (!row) {
    return { ok: false, error: 'ไม่พบคลาสนี้ / Class not found' };
  }

  revalidatePath(CLASSES_ADMIN_PATH);
  return { ok: true, data: undefined };
}

// ── Internal ─────────────────────────────────────────────────────────────────

/** A single bilingual-friendly error string from a Zod failure. */
function firstError(error: z.ZodError): string {
  const issue = error.issues[0];
  const field = issue?.path.join('.') ?? '';
  const detail = issue?.message ?? 'invalid input';
  const where = field ? ` (${field})` : '';
  return `ข้อมูลไม่ถูกต้อง / Invalid input${where}: ${detail}`;
}
