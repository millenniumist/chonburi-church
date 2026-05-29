import Link from 'next/link';
import { getLocale } from '@/lib/locale';
import { pick, t } from '@/lib/i18n';
import { site } from '@/content/site';

export async function SiteFooter() {
  const locale = await getLocale();

  return (
    <footer className="mt-16 border-t bg-muted/30">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 md:grid-cols-3">
        <div>
          <p className="font-semibold">{t(site.name, locale)}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t(site.tagline, locale)}</p>
        </div>
        <div className="text-sm">
          <p className="font-medium">{pick('ลิงก์', 'Links', locale)}</p>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            <li>
              <Link href="/menu" className="hover:text-foreground">
                {pick('เมนู', 'Menu', locale)}
              </Link>
            </li>
            <li>
              <Link href="/classes" className="hover:text-foreground">
                {pick('คลาสเรียน', 'Classes', locale)}
              </Link>
            </li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="font-medium">{pick('มาเยี่ยมเรา', 'Visit us', locale)}</p>
          <p className="mt-2 text-muted-foreground">
            {pick('เปิดทุกวัน มาจิบกาแฟด้วยกัน', 'Open daily — come sip a coffee together.', locale)}
          </p>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {t(site.name, locale)}
      </div>
    </footer>
  );
}
