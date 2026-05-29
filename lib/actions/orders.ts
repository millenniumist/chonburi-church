'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { menuItems, orders, orderItems } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { requireOrderingEnabled } from '@/lib/auth';
import { generatePickupCode } from '@/lib/order-code';
import type { ActionResult } from '@/lib/forms';

const orderItemInput = z.object({
  menuItemId: z.string().uuid(),
  quantity: z.number().int().min(1).max(10),
  note: z.string().trim().max(280).optional(),
});

const placeOrderInput = z.object({
  items: z.array(orderItemInput).min(1).max(20),
  note: z.string().trim().max(280).optional(),
});

export type PlaceOrderInput = z.input<typeof placeOrderInput>;

/**
 * Place a free coffee order. Gated server-side on `orderingEnabled` — never
 * trust the client. Validates the cart, re-checks every referenced menu item
 * is present and available, snapshots names, and writes the order atomically.
 * Coffee is free: there is no price or payment anywhere here.
 */
export async function placeOrderAction(
  input: PlaceOrderInput,
): Promise<ActionResult<{ orderId: string; pickupCode: string }>> {
  // Invariant 1: ordering requires orderingEnabled === true.
  const user = await requireOrderingEnabled();

  const parsed = placeOrderInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'คำสั่งซื้อไม่ถูกต้อง / Invalid order' };
  }
  const { items, note } = parsed.data;

  // Collapse duplicate line items by id, summing quantities (still capped at 10).
  const byId = new Map<string, { quantity: number; note?: string }>();
  for (const item of items) {
    const existing = byId.get(item.menuItemId);
    if (existing) {
      existing.quantity = Math.min(10, existing.quantity + item.quantity);
      if (!existing.note && item.note) existing.note = item.note;
    } else {
      byId.set(item.menuItemId, { quantity: item.quantity, note: item.note });
    }
  }
  const ids = [...byId.keys()];

  // Load the referenced items and reject anything missing or unavailable.
  const rows = await db
    .select()
    .from(menuItems)
    .where(and(inArray(menuItems.id, ids), eq(menuItems.available, true)));

  if (rows.length !== ids.length) {
    return {
      ok: false,
      error: 'บางรายการไม่พร้อมจำหน่ายแล้ว กรุณาลองใหม่ / Some items are no longer available',
    };
  }

  const itemsById = new Map(rows.map((row) => [row.id, row]));
  const pickupCode = generatePickupCode();

  const orderId = await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(orders)
      .values({ userId: user.id, pickupCode, status: 'pending', note: note ?? null })
      .returning({ id: orders.id });

    const created = inserted[0];
    if (!created) throw new Error('order insert failed');

    const lines = ids.map((id) => {
      const menuItem = itemsById.get(id);
      const line = byId.get(id);
      // Both are guaranteed present (built from the same keys), but guard for
      // noUncheckedIndexedAccess.
      if (!menuItem || !line) throw new Error('order line mismatch');
      return {
        orderId: created.id,
        menuItemId: menuItem.id,
        nameSnapshotTh: menuItem.nameTh,
        nameSnapshotEn: menuItem.nameEn,
        quantity: line.quantity,
        note: line.note ?? null,
      };
    });

    await tx.insert(orderItems).values(lines);
    return created.id;
  });

  revalidatePath('/orders');

  return { ok: true, data: { orderId, pickupCode } };
}
