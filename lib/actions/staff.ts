'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orderStatus, orders } from '@/lib/db/schema';
import { requireRole } from '@/lib/auth';
import type { ActionResult } from '@/lib/forms';
import type { OrderStatus } from '@/lib/db/schema';

const advanceInputSchema = z.object({
  orderId: z.uuid(),
  // Derived from the schema enum: a client may move an order to any non-initial
  // status; 'pending' is the creation state and is never a valid target.
  toStatus: z.enum(orderStatus.enumValues).exclude(['pending']),
});

export type AdvanceOrderInput = z.infer<typeof advanceInputSchema>;

/**
 * Allowed forward transitions for the order state machine.
 * pending → preparing → ready → completed, and any non-terminal status may
 * be cancelled. `completed` and `cancelled` are terminal.
 */
const NEXT_STATUS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

/**
 * Advance (or cancel) an order. Staff/admin only. The transition is validated
 * server-side against the state machine — the client cannot jump states or
 * resurrect a terminal order.
 */
export async function advanceOrderAction(input: AdvanceOrderInput): Promise<ActionResult> {
  await requireRole('staff', 'admin');

  const parsed = advanceInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'คำสั่งไม่ถูกต้อง / Invalid request' };
  }

  const { orderId, toStatus } = parsed.data;

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    columns: { id: true, status: true },
  });

  if (!order) {
    return { ok: false, error: 'ไม่พบออเดอร์ / Order not found' };
  }

  const allowed = NEXT_STATUS[order.status];
  if (!allowed.includes(toStatus)) {
    return {
      ok: false,
      error: 'เปลี่ยนสถานะไม่ได้ / Invalid status transition',
    };
  }

  const now = new Date();
  await db
    .update(orders)
    .set({
      status: toStatus,
      updatedAt: now,
      ...(toStatus === 'ready' ? { readyAt: now } : {}),
      ...(toStatus === 'completed' ? { completedAt: now } : {}),
    })
    .where(eq(orders.id, orderId));

  revalidatePath('/staff');

  return { ok: true, data: undefined };
}
