import type { ReactNode } from 'react';
import Link from 'next/link';
import { Coffee, Home } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { pick } from '@/lib/i18n';
import { AdminNav } from '@/components/admin/admin-nav';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const [user, locale] = await Promise.all([requireRole('admin'), getLocale()]);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-40 w-full border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-2 font-semibold">
            <Coffee className="size-5 text-primary" />
            <span>{pick('ผู้ดูแลระบบ', 'Admin', locale)}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{user.name}</span>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Home className="size-4" />
              <span className="hidden sm:inline">{pick('กลับหน้าแรก', 'Back home', locale)}</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:flex-row">
        {/* Mobile: horizontal nav. Desktop: sticky sidebar. */}
        <aside className="md:w-56 md:shrink-0">
          <div className="md:hidden">
            <AdminNav locale={locale} orientation="horizontal" />
          </div>
          <div className="hidden md:block md:sticky md:top-20">
            <AdminNav locale={locale} orientation="vertical" />
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
