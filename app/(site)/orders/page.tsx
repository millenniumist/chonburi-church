import Link from 'next/link';
import { desc, eq, count } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders, orderItems } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { pick } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrderStatusBadge } from '@/components/orders/order-status-badge';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const [user, locale] = await Promise.all([requireUser(), getLocale()]);

  // Orders newest first, with a per-order count of line items.
  const rows = await db
    .select({
      id: orders.id,
      status: orders.status,
      pickupCode: orders.pickupCode,
      createdAt: orders.createdAt,
      itemCount: count(orderItems.id),
    })
    .from(orders)
    .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
    .where(eq(orders.userId, user.id))
    .groupBy(orders.id)
    .orderBy(desc(orders.createdAt));

  const dateFormatter = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Bangkok',
  });

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <header className="mb-8 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {pick('คำสั่งซื้อของฉัน', 'My orders', locale)}
        </h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/menu">{pick('สั่งเพิ่ม', 'Order more', locale)}</Link>
        </Button>
      </header>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>{pick('คุณยังไม่มีคำสั่งซื้อ', 'You have no orders yet.', locale)}</p>
            <Button asChild className="mt-4">
              <Link href="/menu">{pick('ดูเมนู', 'Browse the menu', locale)}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {rows.map((order) => (
            <li key={order.id}>
              <Link href={`/orders/${order.id}`} className="block">
                <Card className="transition-colors hover:bg-accent/40">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="font-mono text-xl tracking-widest">
                          {order.pickupCode}
                        </CardTitle>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {dateFormatter.format(order.createdAt)}
                        </p>
                      </div>
                      <OrderStatusBadge status={order.status} locale={locale} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {order.itemCount}{' '}
                      {pick('รายการ', order.itemCount === 1 ? 'item' : 'items', locale)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
