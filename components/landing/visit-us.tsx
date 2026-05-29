import { Clock, Facebook, MapPin, Phone, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { pick, t } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';
import { church } from '@/content/site';
import { Reveal } from '@/components/landing/reveal';

export function VisitUs({ locale }: { locale: Locale }) {
  return (
    <section id="visit" className="mx-auto max-w-5xl px-6 py-20 sm:py-24">
      <Reveal className="text-center">
        <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          {pick('มาเยี่ยมเราที่โบสถ์', 'Visit us at church', locale)}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-pretty text-muted-foreground">
          {pick(
            `${t(church.legalName, locale)} — ยินดีต้อนรับทุกคน`,
            `${t(church.legalName, locale)} — everyone is welcome`,
            locale,
          )}
        </p>
      </Reveal>

      <div className="mt-12 grid gap-8 md:grid-cols-2">
        {/* Worship schedule */}
        <Reveal>
          <Card className="h-full">
            <CardContent className="px-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <Clock className="size-5 text-primary" aria-hidden />
                {pick('เวลานมัสการ', 'Worship times', locale)}
              </h3>
              <ul className="mt-4 divide-y">
                {church.worshipTimes.map((slot) => (
                  <li
                    key={`${t(slot.day, 'en')}-${slot.time}-${t(slot.event, 'en')}`}
                    className="flex items-baseline justify-between gap-4 py-3"
                  >
                    <div>
                      <p className="font-medium">{t(slot.event, locale)}</p>
                      <p className="text-sm text-muted-foreground">{t(slot.day, locale)}</p>
                    </div>
                    <span className="shrink-0 text-sm font-medium tabular-nums text-muted-foreground">
                      {slot.time}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </Reveal>

        {/* Map + address + connect */}
        <Reveal delay={0.1}>
          <Card className="h-full gap-0 overflow-hidden p-0">
            <iframe
              src={church.mapEmbedUrl}
              title={pick('แผนที่โบสถ์', 'Church map', locale)}
              className="aspect-[16/10] w-full border-0"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
            <CardContent className="space-y-4 p-6">
              <a
                href={church.mapsLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-start gap-2 text-sm hover:text-primary"
              >
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <span>{t(church.address, locale)}</span>
              </a>
              <a
                href={`tel:${church.phone.split(',')[0]?.trim()}`}
                className="flex items-center gap-2 text-sm hover:text-primary"
              >
                <Phone className="size-4 shrink-0 text-primary" aria-hidden />
                <span>{church.phone}</span>
              </a>
              <div className="flex flex-wrap gap-3 pt-1">
                <Button asChild variant="outline" size="sm">
                  <a href={church.social.facebook} target="_blank" rel="noreferrer">
                    <Facebook className="size-4" aria-hidden />
                    Facebook
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <a href={church.social.youtube} target="_blank" rel="noreferrer">
                    <Youtube className="size-4" aria-hidden />
                    YouTube
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}
