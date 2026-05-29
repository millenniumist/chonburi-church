'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { setUserOrdering, setUserRole } from '@/lib/actions/admin-core';
import { pick, type Locale } from '@/lib/i18n';
import type { UserRole } from '@/lib/db/schema';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ROLE_OPTIONS: { value: UserRole; th: string; en: string }[] = [
  { value: 'admin', th: 'แอดมิน', en: 'Admin' },
  { value: 'staff', th: 'พนักงาน', en: 'Staff' },
  { value: 'member', th: 'สมาชิก', en: 'Member' },
  { value: 'visitor', th: 'ผู้มาเยือน', en: 'Visitor' },
];

type UserRowControlsProps = {
  userId: string;
  role: UserRole;
  orderingEnabled: boolean;
  locale: Locale;
};

export function RoleSelect({ userId, role, locale }: Omit<UserRowControlsProps, 'orderingEnabled'>) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const tr = (th: string, en: string): string => pick(th, en, locale);

  function onChange(next: string) {
    if (next === role) return;
    startTransition(async () => {
      const result = await setUserRole({ userId, role: next });
      if (result.ok) {
        toast.success(tr('อัปเดตบทบาทแล้ว', 'Role updated.'));
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Select value={role} onValueChange={onChange} disabled={isPending}>
      <SelectTrigger size="sm" className="w-[140px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ROLE_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {pick(option.th, option.en, locale)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function OrderingToggle({
  userId,
  orderingEnabled,
  locale,
}: Omit<UserRowControlsProps, 'role'>) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const tr = (th: string, en: string): string => pick(th, en, locale);

  function onToggle() {
    startTransition(async () => {
      const result = await setUserOrdering({ userId, orderingEnabled: !orderingEnabled });
      if (result.ok) {
        toast.success(
          orderingEnabled
            ? tr('ปิดการสั่งซื้อแล้ว', 'Ordering disabled.')
            : tr('เปิดการสั่งซื้อแล้ว', 'Ordering enabled.'),
        );
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Button
      type="button"
      size="sm"
      variant={orderingEnabled ? 'secondary' : 'outline'}
      disabled={isPending}
      onClick={onToggle}
      aria-pressed={orderingEnabled}
    >
      {orderingEnabled ? tr('สั่งได้', 'Enabled') : tr('ล็อกอยู่', 'Locked')}
    </Button>
  );
}
