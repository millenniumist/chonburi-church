'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import type { Locale } from '@/lib/i18n';

type Props = {
  /** ISO timestamp of when the order was created. */
  since: string;
  locale: Locale;
};

function format(elapsedMs: number, locale: Locale): string {
  const totalMinutes = Math.max(0, Math.floor(elapsedMs / 60000));
  if (totalMinutes < 1) return locale === 'en' ? 'just now' : 'เมื่อสักครู่';
  if (totalMinutes < 60) {
    return locale === 'en' ? `${totalMinutes} min` : `${totalMinutes} นาที`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (locale === 'en') {
    return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
  }
  return minutes > 0 ? `${hours} ชม. ${minutes} นาที` : `${hours} ชม.`;
}

/**
 * Live-updating "time waiting" badge. Recomputes on the client every 30s so the
 * counter stays roughly current between full-page refreshes.
 */
export function WaitingTime({ since, locale }: Props) {
  const sinceMs = new Date(since).getTime();
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const elapsed = Number.isFinite(sinceMs) ? now - sinceMs : 0;
  const isLong = elapsed >= 10 * 60_000;

  return (
    <span
      className={
        'inline-flex items-center gap-1 text-xs tabular-nums ' +
        (isLong ? 'font-medium text-amber-600 dark:text-amber-500' : 'text-muted-foreground')
      }
    >
      <Clock className="size-3" />
      {locale === 'en' ? 'waiting ' : 'รอ '}
      {format(elapsed, locale)}
    </span>
  );
}
