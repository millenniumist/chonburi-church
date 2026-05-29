import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { pick } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { OrderStatusBadge, orderStatusLabel } from '@/components/orders/order-status-badge';

export const dynamic = 'force-dynamic';

// A loose UUID shape check — avoids a DB round-trip on obviously bad ids.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, locale] = await Promise.all([requireUser(), getLocale()]);

  if (!UUID_RE.test(id)) notFound();

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: { items: true },
  });

  if (!order) notFound();

  // Owner may view; staff/admin may also view any order. Everyone else: 404.
  const isOwner = order.userId === user.id;
  const isStaff = user.role === 'staff' || user.role === 'admin';
  if (!isOwner && !isStaff) notFound();

  const dateFormatter = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Bangkok',
  });

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-12">
      <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
        <Link href="/orders">{pick('← คำสั่งซื้อทั้งหมด', '← All orders', locale)}</Link>
      </Button>

      <Card>
        <CardHeader className="items-center text-center">
          <p className="text-sm text-muted-foreground">
            {pick('รหัสรับกาแฟ', 'Your pickup code', locale)}
          </p>
          <CardTitle className="font-mono text-5xl tracking-[0.3em] sm:text-6xl">
            {order.pickupCode}
          </CardTitle>
          <div className="mt-2">
            <OrderStatusBadge status={order.status} locale={locale} />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <p className="text-center text-pretty text-muted-foreground">
            {pick(
              'กาแฟฟรี — แจ้งรหัสนี้ที่เคาน์เตอร์ แล้วเจอกันนะ!',
              'It’s free — show this code at the counter. See you there!',
              locale,
            )}
          </p>

          <Separator />

          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {pick('รายการ', 'Items', locale)}
            </h2>
            <ul className="space-y-2">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-medium">
                      {pick(item.nameSnapshotTh, item.nameSnapshotEn, locale)}
                    </span>
                    {item.note ? (
                      <p className="text-sm text-muted-foreground">{item.note}</p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                    × {item.quantity}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {order.note ? (
            <>
              <Separator />
              <div>
                <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {pick('หมายเหตุ', 'Note', locale)}
                </h2>
                <p className="text-sm">{order.note}</p>
              </div>
            </>
          ) : null}

          <Separator />

          <dl className="space-y-1 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{pick('สถานะ', 'Status', locale)}</dt>
              <dd>{orderStatusLabel(order.status, locale)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{pick('สั่งเมื่อ', 'Ordered', locale)}</dt>
              <dd>{dateFormatter.format(order.createdAt)}</dd>
            </div>
            {order.readyAt ? (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">{pick('พร้อมรับเมื่อ', 'Ready at', locale)}</dt>
                <dd>{dateFormatter.format(order.readyAt)}</dd>
              </div>
            ) : null}
          </dl>
        </CardContent>
      </Card>
    </main>
  );
}
