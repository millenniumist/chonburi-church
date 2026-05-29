'use client';

import { pick } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MAX_QTY } from '@/components/menu/cart-types';

export function QuantityStepper({
  quantity,
  locale,
  name,
  onIncrement,
  onDecrement,
}: {
  quantity: number;
  locale: Locale;
  name: string;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon-sm"
        onClick={onDecrement}
        aria-label={pick(`ลด ${name}`, `Decrease ${name}`, locale)}
      >
        −
      </Button>
      <span className="w-6 text-center text-sm font-medium tabular-nums" aria-live="polite">
        {quantity}
      </span>
      <Button
        variant="outline"
        size="icon-sm"
        onClick={onIncrement}
        disabled={quantity >= MAX_QTY}
        aria-label={pick(`เพิ่ม ${name}`, `Increase ${name}`, locale)}
      >
        +
      </Button>
    </div>
  );
}

export function OrderNoteField({
  value,
  onChange,
  locale,
}: {
  value: string;
  onChange: (value: string) => void;
  locale: Locale;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor="order-note">
        {pick('หมายเหตุถึงบาริสต้า (ไม่บังคับ)', 'Note to the barista (optional)', locale)}
      </Label>
      <Textarea
        id="order-note"
        value={value}
        maxLength={280}
        rows={2}
        onChange={(e) => onChange(e.target.value)}
        placeholder={pick('เช่น หวานน้อย, ร้อน', 'e.g. less sweet, hot', locale)}
      />
    </div>
  );
}
