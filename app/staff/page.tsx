import { asc, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { requireRole } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { pick } from '@/lib/i18n';
import { Badge } from '@/components/ui/badge';
import { OrderCard, type QueueOrder } from '@/components/staff/order-card';
import type { OrderStatus } from '@/lib/db/schema';

// The queue must reflect mutations immediately; never serve a cached snapshot.
export const dynamic = 'force-dynamic';

const ACTIVE_STATUSES = ['pending', 'preparing', 'ready'] as const;

type Column = {
  status: (typeof ACTIVE_STATUSES)[number];
  titleTh: string;
  titleEn: string;
};

const COLUMNS: Column[] = [
  { status: 'pending', titleTh: 'รอคิว', titleEn: 'New' },
  { status: 'preparing', titleTh: 'กำลังทำ', titleEn: 'Preparing' },
  { status: 'ready', titleTh: 'พร้อมรับ', titleEn: 'Ready' },
];

export default async function StaffQueuePage() {
  await requireRole('staff', 'admin');
  const locale = await getLocale();

  const rows = await db.query.orders.findMany({
    where: inArray(orders.status, [...ACTIVE_STATUSES]),
    orderBy: [asc(orders.createdAt)],
    columns: {
      id: true,
      status: true,
      pickupCode: true,
      note: true,
      createdAt: true,
    },
    with: {
      user: { columns: { name: true } },
      items: {
        columns: {
          id: true,
          nameSnapshotTh: true,
          nameSnapshotEn: true,
          quantity: true,
          note: true,
        },
      },
    },
  });

  const queue: QueueOrder[] = rows.map((row) => ({
    id: row.id,
    status: row.status,
    pickupCode: row.pickupCode,
    note: row.note,
    createdAt: row.createdAt,
    customerName: row.user?.name ?? pick('ลูกค้า', 'Customer', locale),
    items: row.items.map((item) => ({
      id: item.id,
      nameTh: item.nameSnapshotTh,
      nameEn: item.nameSnapshotEn,
      quantity: item.quantity,
      note: item.note,
    })),
  }));

  const byStatus = (status: OrderStatus): QueueOrder[] =>
    queue.filter((order) => order.status === status);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {pick('คิวออเดอร์', 'Order queue', locale)}
          </h1>
          <p className="text-sm text-muted-foreground">
            {pick(
              'เรียงจากออเดอร์ที่รอนานที่สุดก่อน',
              'Oldest orders first',
              locale,
            )}
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {queue.length} {pick('ออเดอร์', 'active', locale)}
        </Badge>
      </div>

      {queue.length === 0 ? (
        <div className="rounded-xl border border-dashed py-20 text-center text-muted-foreground">
          {pick('ยังไม่มีออเดอร์ที่ต้องทำ', 'No active orders right now', locale)}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {COLUMNS.map((column) => {
            const columnOrders = byStatus(column.status);
            return (
              <section key={column.status} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                    {pick(column.titleTh, column.titleEn, locale)}
                  </h2>
                  <span className="text-sm font-medium tabular-nums text-muted-foreground">
                    {columnOrders.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {columnOrders.length === 0 ? (
                    <p className="rounded-lg border border-dashed py-8 text-center text-xs text-muted-foreground">
                      {pick('ว่าง', 'Empty', locale)}
                    </p>
                  ) : (
                    columnOrders.map((order) => (
                      <OrderCard key={order.id} order={order} locale={locale} />
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
