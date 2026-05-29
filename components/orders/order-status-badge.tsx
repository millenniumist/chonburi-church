import { Badge } from '@/components/ui/badge';
import { pick } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';
import type { OrderStatus } from '@/lib/db/schema';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

const STATUS_META: Record<OrderStatus, { th: string; en: string; variant: BadgeVariant }> = {
  pending: { th: 'รอดำเนินการ', en: 'Pending', variant: 'secondary' },
  preparing: { th: 'กำลังชง', en: 'Preparing', variant: 'default' },
  ready: { th: 'พร้อมรับ', en: 'Ready', variant: 'default' },
  completed: { th: 'รับแล้ว', en: 'Completed', variant: 'outline' },
  cancelled: { th: 'ยกเลิก', en: 'Cancelled', variant: 'destructive' },
};

export function orderStatusLabel(status: OrderStatus, locale: Locale): string {
  const meta = STATUS_META[status];
  return pick(meta.th, meta.en, locale);
}

export function OrderStatusBadge({
  status,
  locale,
  className,
}: {
  status: OrderStatus;
  locale: Locale;
  className?: string;
}) {
  const meta = STATUS_META[status];
  return (
    <Badge variant={meta.variant} className={className}>
      {pick(meta.th, meta.en, locale)}
    </Badge>
  );
}
