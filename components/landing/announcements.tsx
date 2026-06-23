import { CalendarDays, Megaphone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { pick } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';
import type { Announcement } from '@/lib/db/schema';
import { Reveal } from '@/components/landing/reveal';

/** Format an announcement's published date for the given locale (Asia/Bangkok). */
function formatPublished(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'th-TH', {
    timeZone: 'Asia/Bangkok',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * The landing "Announcements" section. Renders the published announcements
 * (already filtered + ordered by the read layer) as bilingual cards with optional
 * imagery. Renders nothing when there is nothing to show, so the section quietly
 * disappears rather than leaving an empty heading on the page.
 */
export function Announcements({
  locale,
  items,
}: {
  locale: Locale;
  items: Announcement[];
}) {
  if (items.length === 0) return null;

  return (
    <section className="bg-secondary/40">
      <div className="mx-auto max-w-5xl px-6 py-20 sm:py-24">
        <Reveal className="text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Megaphone className="size-6" aria-hidden />
          </span>
          <h2 className="mt-6 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {pick('ข่าวประกาศ', 'Announcements', locale)}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-pretty text-muted-foreground">
            {pick(
              'ข่าวสารและกิจกรรมล่าสุดจากเรา',
              'The latest news and happenings from us.',
              locale,
            )}
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => {
            const title = pick(item.titleTh, item.titleEn, locale);
            const body = pick(item.bodyTh, item.bodyEn, locale);

            return (
              <Reveal
                as="div"
                key={item.id}
                delay={index * 0.06}
                className="h-full"
              >
                <Card className="flex h-full flex-col overflow-hidden pt-0 transition-shadow hover:shadow-md">
                  {item.imageUrl ? (
                    // Announcement images are admin-supplied arbitrary URLs; a plain
                    // <img> avoids remotePatterns config and keeps the Pi's image
                    // optimizer idle (matches the menu pattern).
                    <img
                      src={item.imageUrl}
                      alt={title}
                      className="aspect-[16/9] w-full object-cover"
                      loading="lazy"
                    />
                  ) : null}
                  <CardHeader className={item.imageUrl ? 'pt-6' : undefined}>
                    {item.publishedAt ? (
                      <Badge
                        variant="secondary"
                        className="mb-1 w-fit gap-1.5 font-normal"
                      >
                        <CalendarDays className="size-3.5" aria-hidden />
                        {formatPublished(item.publishedAt, locale)}
                      </Badge>
                    ) : null}
                    <CardTitle className="text-balance text-lg">{title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                      {body}
                    </p>
                  </CardContent>
                </Card>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
