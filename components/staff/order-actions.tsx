'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Check, ChevronRight, CookingPot, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { advanceOrderAction, type AdvanceOrderInput } from '@/lib/actions/staff';
import type { Locale } from '@/lib/i18n';
import type { OrderStatus } from '@/lib/db/schema';

type AdvanceTarget = AdvanceOrderInput['toStatus'];

type Props = {
  orderId: string;
  status: OrderStatus;
  locale: Locale;
};

const LABEL: Record<AdvanceTarget, { th: string; en: string }> = {
  preparing: { th: 'เริ่มทำ', en: 'Start' },
  ready: { th: 'พร้อมรับ', en: 'Mark ready' },
  completed: { th: 'รับแล้ว', en: 'Picked up' },
  cancelled: { th: 'ยกเลิก', en: 'Cancel' },
};

export function OrderActions({ orderId, status, locale }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyTarget, setBusyTarget] = useState<AdvanceTarget | null>(null);

  function run(toStatus: AdvanceTarget) {
    setBusyTarget(toStatus);
    startTransition(async () => {
      const result = await advanceOrderAction({ orderId, toStatus });
      setBusyTarget(null);
      if (result.ok) {
        toast.success(
          locale === 'en' ? `Order ${LABEL[toStatus].en.toLowerCase()}` : `${LABEL[toStatus].th}แล้ว`,
        );
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  // The single "advance forward" target for the current status (null = terminal).
  const forward: AdvanceTarget | null =
    status === 'pending'
      ? 'preparing'
      : status === 'preparing'
        ? 'ready'
        : status === 'ready'
          ? 'completed'
          : null;

  const canCancel = status === 'pending' || status === 'preparing' || status === 'ready';

  if (!forward && !canCancel) return null;

  const forwardIcon =
    forward === 'preparing' ? (
      <CookingPot />
    ) : forward === 'completed' ? (
      <Check />
    ) : (
      <ChevronRight />
    );

  return (
    <div className="flex flex-wrap gap-2">
      {forward ? (
        <Button
          type="button"
          size="lg"
          className="h-12 flex-1 text-base"
          disabled={isPending}
          onClick={() => run(forward)}
        >
          {forwardIcon}
          {busyTarget === forward
            ? locale === 'en'
              ? 'Working…'
              : 'กำลังทำ…'
            : LABEL[forward][locale]}
        </Button>
      ) : null}
      {canCancel ? (
        <Button
          type="button"
          size="lg"
          variant="outline"
          className="h-12 text-base text-destructive hover:text-destructive"
          disabled={isPending}
          onClick={() => run('cancelled')}
        >
          <X />
          {LABEL.cancelled[locale]}
        </Button>
      ) : null}
    </div>
  );
}
