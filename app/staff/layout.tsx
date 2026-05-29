import type { ReactNode } from 'react';
import Link from 'next/link';
import { Coffee, Home } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { pick } from '@/lib/i18n';

export default async function StaffLayout({ children }: { children: ReactNode }) {
  const [user, locale] = await Promise.all([requireRole('staff', 'admin'), getLocale()]);

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="sticky top-0 z-40 w-full border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-2 font-semibold">
            <Coffee className="size-5 text-primary" />
            <span>{pick('เคาน์เตอร์', 'Counter', locale)}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {user.name.split(' ')[0]}
            </span>
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

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
