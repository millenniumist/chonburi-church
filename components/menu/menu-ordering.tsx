'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { pick } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { placeOrderAction } from '@/lib/actions/orders';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QuantityStepper } from '@/components/menu/cart-controls';
import { CartSheet } from '@/components/menu/cart-sheet';
import { MAX_ITEMS, MAX_QTY } from '@/components/menu/cart-types';
import type { CartLine, OrderableGroup, OrderableItem } from '@/components/menu/cart-types';

export type { OrderableGroup, OrderableItem } from '@/components/menu/cart-types';

export function MenuOrdering({ groups, locale }: { groups: OrderableGroup[]; locale: Locale }) {
  // Cart keyed by menu item id for O(1) updates.
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [orderNote, setOrderNote] = useState('');
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const lines = useMemo(() => Object.values(cart), [cart]);
  const totalCups = useMemo(() => lines.reduce((n, l) => n + l.quantity, 0), [lines]);

  function setQuantity(item: OrderableItem, quantity: number) {
    setCart((prev) => {
      const next = { ...prev };
      const clamped = Math.max(0, Math.min(MAX_QTY, quantity));
      if (clamped <= 0) {
        delete next[item.id];
        return next;
      }
      if (!next[item.id] && Object.keys(next).length >= MAX_ITEMS) {
        toast.error(
          pick(
            `สั่งได้สูงสุด ${MAX_ITEMS} รายการต่อครั้ง`,
            `You can order up to ${MAX_ITEMS} different items at once.`,
            locale,
          ),
        );
        return next;
      }
      const existing = next[item.id];
      next[item.id] = { item, quantity: clamped, note: existing?.note ?? '' };
      return next;
    });
  }

  function increment(item: OrderableItem) {
    const current = cart[item.id]?.quantity ?? 0;
    if (current >= MAX_QTY) return;
    setQuantity(item, current + 1);
  }

  function decrement(item: OrderableItem) {
    const current = cart[item.id]?.quantity ?? 0;
    setQuantity(item, current - 1);
  }

  function setLineNote(itemId: string, note: string) {
    setCart((prev) => {
      const line = prev[itemId];
      if (!line) return prev;
      return { ...prev, [itemId]: { ...line, note: note.slice(0, 280) } };
    });
  }

  function clearCart() {
    setCart({});
    setOrderNote('');
  }

  function placeOrder() {
    if (lines.length === 0) return;
    startTransition(async () => {
      const result = await placeOrderAction({
        items: lines.map((l) => ({
          menuItemId: l.item.id,
          quantity: l.quantity,
          note: l.note.trim() ? l.note.trim() : undefined,
        })),
        note: orderNote.trim() ? orderNote.trim() : undefined,
      });

      if (result.ok) {
        toast.success(pick('สั่งกาแฟเรียบร้อยแล้ว!', 'Order placed!', locale), {
          description: `${pick('รหัสรับ', 'Pickup code', locale)} ${result.data.pickupCode}`,
        });
        clearCart();
        router.push(`/orders/${result.data.orderId}`);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="mt-8">
      <div className="space-y-10 pb-28">
        {groups.map((group) => (
          <section key={group.category}>
            <h2 className="mb-4 text-lg font-semibold tracking-tight">{group.label}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((item) => (
                <OrderableCard
                  key={item.id}
                  item={item}
                  locale={locale}
                  quantity={cart[item.id]?.quantity ?? 0}
                  onIncrement={() => increment(item)}
                  onDecrement={() => decrement(item)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Floating cart summary + sheet trigger. */}
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur transition-transform',
          totalCups > 0 ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
          <div className="text-sm">
            <span className="font-medium">
              {totalCups} {pick('แก้ว', totalCups === 1 ? 'cup' : 'cups', locale)}
            </span>
            <span className="ml-2 text-muted-foreground">
              {pick('ฟรีทั้งหมด', 'All free', locale)}
            </span>
          </div>
          <CartSheet
            lines={lines}
            locale={locale}
            pending={pending}
            orderNote={orderNote}
            onOrderNoteChange={setOrderNote}
            onIncrement={increment}
            onDecrement={decrement}
            onLineNoteChange={setLineNote}
            onClear={clearCart}
            onPlaceOrder={placeOrder}
          />
        </div>
      </div>
    </div>
  );
}

function OrderableCard({
  item,
  locale,
  quantity,
  onIncrement,
  onDecrement,
}: {
  item: OrderableItem;
  locale: Locale;
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  const name = pick(item.nameTh, item.nameEn, locale);
  const description = pick(item.descriptionTh ?? '', item.descriptionEn ?? '', locale);

  return (
    <Card
      className={cn('overflow-hidden pt-0 transition-shadow', quantity > 0 && 'ring-2 ring-primary')}
    >
      {/* Menu images are admin-supplied arbitrary URLs; a plain <img> avoids
          remotePatterns config and keeps the Pi's image optimizer idle. Falls
          back to a shared placeholder when no image is set. */}
      <img
        src={item.imageUrl ?? '/images/menu-placeholder.webp'}
        alt={name}
        className="aspect-[4/3] w-full object-cover"
        loading="lazy"
      />
      <CardHeader className="pt-6">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{name}</CardTitle>
          <Badge variant="secondary">{pick('ฟรี', 'Free', locale)}</Badge>
        </div>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        {quantity > 0 ? (
          <QuantityStepper
            quantity={quantity}
            locale={locale}
            name={name}
            onIncrement={onIncrement}
            onDecrement={onDecrement}
          />
        ) : (
          <Button variant="outline" size="sm" className="w-full" onClick={onIncrement}>
            {pick('เพิ่มลงตะกร้า', 'Add to cart', locale)}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
