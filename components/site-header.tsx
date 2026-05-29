import Link from 'next/link';
import { Coffee } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { pick, t } from '@/lib/i18n';
import { site } from '@/content/site';
import { LocaleToggle } from '@/components/locale-toggle';
import { MobileNav, type NavLink } from '@/components/mobile-nav';
import { Button } from '@/components/ui/button';

export async function SiteHeader() {
  const [user, locale] = await Promise.all([getCurrentUser(), getLocale()]);

  const links: NavLink[] = [
    { href: '/', label: pick('หน้าแรก', 'Home', locale) },
    { href: '/menu', label: pick('เมนู', 'Menu', locale) },
    { href: '/classes', label: pick('คลาสเรียน', 'Classes', locale) },
  ];

  if (user) {
    links.push({ href: '/account', label: pick('บัญชีของฉัน', 'Account', locale) });
  }
  if (user?.role === 'staff' || user?.role === 'admin') {
    links.push({ href: '/staff', label: pick('เคาน์เตอร์', 'Counter', locale) });
  }
  if (user?.role === 'admin') {
    links.push({ href: '/admin', label: pick('ผู้ดูแล', 'Admin', locale) });
  }

  const mobileLinks: NavLink[] = user
    ? links
    : [
        ...links,
        { href: '/login', label: pick('เข้าสู่ระบบ', 'Log in', locale) },
        { href: '/signup', label: pick('สมัครสมาชิก', 'Sign up', locale) },
      ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Coffee className="size-5 text-primary" />
          <span>{t(site.name, locale)}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LocaleToggle locale={locale} />
          {user ? (
            <Button asChild size="sm" variant="secondary" className="hidden md:inline-flex">
              <Link href="/account">{user.name.split(' ')[0]}</Link>
            </Button>
          ) : (
            <>
              <Button asChild size="sm" variant="ghost" className="hidden md:inline-flex">
                <Link href="/login">{pick('เข้าสู่ระบบ', 'Log in', locale)}</Link>
              </Button>
              <Button asChild size="sm" className="hidden md:inline-flex">
                <Link href="/signup">{pick('สมัครสมาชิก', 'Sign up', locale)}</Link>
              </Button>
            </>
          )}
          <MobileNav links={mobileLinks} title={t(site.name, locale)} />
        </div>
      </div>
    </header>
  );
}
