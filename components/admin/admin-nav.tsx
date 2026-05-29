'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarClock,
  Coffee,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  MapPinned,
  Settings,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { pick, type Locale } from '@/lib/i18n';

type NavItem = {
  href: string;
  icon: LucideIcon;
  th: string;
  en: string;
};

const ITEMS: NavItem[] = [
  { href: '/admin', icon: LayoutDashboard, th: 'แดชบอร์ด', en: 'Dashboard' },
  { href: '/admin/menu', icon: Coffee, th: 'เมนู', en: 'Menu' },
  { href: '/admin/classes', icon: GraduationCap, th: 'คลาสเรียน', en: 'Classes' },
  { href: '/admin/services', icon: CalendarClock, th: 'รอบนมัสการ', en: 'Services' },
  { href: '/admin/config', icon: Settings, th: 'ตั้งค่าเว็บไซต์', en: 'Site config' },
  { href: '/admin/users', icon: Users, th: 'ผู้ใช้', en: 'Users' },
  { href: '/admin/attendance', icon: ListChecks, th: 'การเช็คอิน', en: 'Attendance' },
];

type AdminNavProps = {
  locale: Locale;
  /** Layout variant: vertical sidebar (desktop) or horizontal scroller (mobile). */
  orientation?: 'vertical' | 'horizontal';
};

export function AdminNav({ locale, orientation = 'vertical' }: AdminNavProps) {
  const pathname = usePathname();

  const isActive = (href: string): boolean =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  return (
    <nav
      aria-label={pick('เมนูผู้ดูแล', 'Admin navigation', locale)}
      className={cn(
        orientation === 'vertical'
          ? 'flex flex-col gap-1'
          : 'flex gap-1 overflow-x-auto pb-1',
      )}
    >
      {ITEMS.map((item) => {
        const active = isActive(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
              active
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className="size-4 shrink-0" />
            {pick(item.th, item.en, locale)}
          </Link>
        );
      })}
    </nav>
  );
}
