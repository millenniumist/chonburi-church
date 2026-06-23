import Link from 'next/link';
import { Facebook, Mail, MapPin, Phone, Youtube } from 'lucide-react';
import { getLocale } from '@/lib/locale';
import { pick, t } from '@/lib/i18n';
import { site } from '@/content/site';
import type { ChurchContent } from '@/lib/cms/sections';
import { getContent } from '@/lib/cms/read';

export async function SiteFooter({ content }: { content?: ChurchContent } = {}) {
  const [locale, churchContent] = await Promise.all([
    getLocale(),
    content ? Promise.resolve(content) : getContent('church'),
  ]);

  return (
    <footer className="mt-16 border-t bg-muted/30">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 md:grid-cols-3">
        <div>
          <p className="font-semibold">{t(site.name, locale)}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t(site.tagline, locale)}</p>
          <p className="mt-3 text-sm text-muted-foreground">{t(churchContent.legalName, locale)}</p>
          <div className="mt-4 flex gap-3">
            <a
              href={churchContent.social.facebook}
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="text-muted-foreground hover:text-primary"
            >
              <Facebook className="size-5" />
            </a>
            <a
              href={churchContent.social.youtube}
              target="_blank"
              rel="noreferrer"
              aria-label="YouTube"
              className="text-muted-foreground hover:text-primary"
            >
              <Youtube className="size-5" />
            </a>
          </div>
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
            <li>
              <Link href="/#visit" className="hover:text-foreground">
                {pick('เวลานมัสการ', 'Worship times', locale)}
              </Link>
            </li>
          </ul>
        </div>

        <div className="text-sm">
          <p className="font-medium">{pick('ติดต่อ / มาเยี่ยมเรา', 'Contact / Visit', locale)}</p>
          <ul className="mt-2 space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
              <a href={churchContent.mapsLink} target="_blank" rel="noreferrer" className="hover:text-foreground">
                {t(churchContent.address, locale)}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="size-4 shrink-0" aria-hidden />
              <span>{churchContent.phone}</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="size-4 shrink-0" aria-hidden />
              <a href={`mailto:${churchContent.email}`} className="hover:text-foreground">
                {churchContent.email}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {t(churchContent.legalName, locale)}
      </div>
    </footer>
  );
}
