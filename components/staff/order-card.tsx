import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { OrderActions } from '@/components/staff/order-actions';
import { WaitingTime } from '@/components/staff/waiting-time';
import { pick, type Locale } from '@/lib/i18n';
import type { OrderStatus } from '@/lib/db/schema';

export type QueueItem = {
  id: string;
  nameTh: string;
  nameEn: string;
  quantity: number;
  note: string | null;
};

export type QueueOrder = {
  id: string;
  status: OrderStatus;
  pickupCode: string;
  note: string | null;
  createdAt: Date;
  customerName: string;
  items: QueueItem[];
};

type Props = {
  order: QueueOrder;
  locale: Locale;
};

/** Customer's first name only — the counter calls people by name. */
function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

export function OrderCard({ order, locale }: Props) {
  return (
    <Card className="gap-3 py-4">
      <CardHeader className="px-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-mono text-2xl font-bold tracking-widest text-primary">
              {order.pickupCode}
            </div>
            <div className="text-sm font-medium">{firstName(order.customerName)}</div>
          </div>
          <Badge variant="outline" className="shrink-0">
            {order.items.reduce((sum, item) => sum + item.quantity, 0)}{' '}
            {pick('แก้ว', 'cups', locale)}
          </Badge>
        </div>
        <WaitingTime since={order.createdAt.toISOString()} locale={locale} />
      </CardHeader>

      <Separator />

      <CardContent className="space-y-1.5 px-4">
        <ul className="space-y-1 text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-baseline justify-between gap-2">
              <span>
                <span className="font-medium tabular-nums">{item.quantity}×</span>{' '}
                {pick(item.nameTh, item.nameEn, locale)}
              </span>
              {item.note ? (
                <span className="shrink-0 text-xs text-muted-foreground italic">{item.note}</span>
              ) : null}
            </li>
          ))}
        </ul>
        {order.note ? (
          <p className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
            {pick('หมายเหตุ', 'Note', locale)}: {order.note}
          </p>
        ) : null}
      </CardContent>

      <CardContent className="px-4">
        <OrderActions orderId={order.id} status={order.status} locale={locale} />
      </CardContent>
    </Card>
  );
}
