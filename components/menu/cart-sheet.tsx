'use client';

import { useState } from 'react';
import { pick } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import type { CartLine, OrderableItem } from '@/components/menu/cart-types';
import { QuantityStepper, OrderNoteField } from '@/components/menu/cart-controls';

export function CartSheet({
  lines,
  locale,
  pending,
  orderNote,
  onOrderNoteChange,
  onIncrement,
  onDecrement,
  onLineNoteChange,
  onClear,
  onPlaceOrder,
}: {
  lines: CartLine[];
  locale: Locale;
  pending: boolean;
  orderNote: string;
  onOrderNoteChange: (value: string) => void;
  onIncrement: (item: OrderableItem) => void;
  onDecrement: (item: OrderableItem) => void;
  onLineNoteChange: (itemId: string, note: string) => void;
  onClear: () => void;
  onPlaceOrder: () => void;
}) {
  const [open, setOpen] = useState(false);
  const totalCups = lines.reduce((n, l) => n + l.quantity, 0);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button disabled={lines.length === 0}>
          {pick('ดูตะกร้า', 'View cart', locale)}
          {totalCups > 0 ? ` (${totalCups})` : ''}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{pick('ตะกร้าของคุณ', 'Your cart', locale)}</SheetTitle>
          <SheetDescription>
            {pick(
              'กาแฟทุกแก้วฟรี มารับที่เคาน์เตอร์เมื่อพร้อม',
              'Every cup is free. Pick up at the counter when it’s ready.',
              locale,
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4">
          {lines.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {pick('ตะกร้าว่างเปล่า', 'Your cart is empty.', locale)}
            </p>
          ) : (
            lines.map((line) => {
              const name = pick(line.item.nameTh, line.item.nameEn, locale);
              return (
                <div key={line.item.id} className="space-y-2 rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-medium">{name}</span>
                    <QuantityStepper
                      quantity={line.quantity}
                      locale={locale}
                      name={name}
                      onIncrement={() => onIncrement(line.item)}
                      onDecrement={() => onDecrement(line.item)}
                    />
                  </div>
                  <input
                    type="text"
                    value={line.note}
                    maxLength={280}
                    onChange={(e) => onLineNoteChange(line.item.id, e.target.value)}
                    placeholder={pick('หมายเหตุรายการนี้', 'Note for this item', locale)}
                    className="w-full rounded-md border bg-transparent px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              );
            })
          )}

          {lines.length > 0 ? (
            <>
              <Separator />
              <OrderNoteField value={orderNote} onChange={onOrderNoteChange} locale={locale} />
            </>
          ) : null}
        </div>

        <SheetFooter>
          <Button onClick={onPlaceOrder} disabled={pending || lines.length === 0}>
            {pending
              ? pick('กำลังสั่ง…', 'Placing order…', locale)
              : pick('ยืนยันสั่งกาแฟ (ฟรี)', 'Place order (free)', locale)}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={onClear}
              disabled={pending || lines.length === 0}
            >
              {pick('ล้างตะกร้า', 'Clear', locale)}
            </Button>
            <SheetClose asChild>
              <Button variant="outline" className="flex-1">
                {pick('สั่งต่อ', 'Keep browsing', locale)}
              </Button>
            </SheetClose>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
