import Link from 'next/link';
import { ArrowRight, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { site } from '@/content/site';
import { t } from '@/lib/i18n';
import type { Locale, Localized } from '@/lib/i18n';
import { Reveal } from '@/components/landing/reveal';

/** Closing-band copy lives here (not in content/site) — bilingual as required. */
const visit = {
  heading: {
    th: 'แวะมาหาเราสิ',
    en: 'Come visit us',
  } satisfies Localized,
  body: {
    th: 'ประตูของเราเปิดต้อนรับเสมอ มาเป็นส่วนหนึ่งของชุมชนของเรา จิบกาแฟอุ่นๆ ด้วยกัน',
    en: 'Our doors are always open. Come be part of our community over a warm cup of coffee.',
  } satisfies Localized,
  cta: {
    th: 'มาครั้งแรกใช่ไหม?',
    en: 'First time here?',
  } satisfies Localized,
} as const;

export function VisitBand({ locale }: { locale: Locale }) {
  return (
    <section className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-3xl px-6 py-20 text-center sm:py-24">
        <Reveal>
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary-foreground/15">
            <Coffee className="size-6" aria-hidden />
          </span>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="mt-6 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {t(visit.heading, locale)}
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-lg leading-relaxed text-primary-foreground/80">
            {t(visit.body, locale)}
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="w-full rounded-full sm:w-auto"
            >
              <Link href="/menu">{t(site.hero.primaryCta, locale)}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full rounded-full border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground sm:w-auto"
            >
              <Link href="/signup">
                {t(visit.cta, locale)}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
