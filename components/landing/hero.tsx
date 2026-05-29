import Link from 'next/link';
import { ArrowRight, Coffee } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { site } from '@/content/site';
import { t } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';
import { Reveal } from '@/components/landing/reveal';

export function Hero({ locale }: { locale: Locale }) {
  return (
    <section className="relative overflow-hidden">
      {/* Warm ambient glow backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -top-32 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-accent/40 blur-3xl" />
        <div className="absolute -right-24 top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-3xl px-6 py-24 text-center sm:py-32">
        <Reveal from="down">
          <Badge
            variant="secondary"
            className="gap-1.5 px-3 py-1 text-sm font-medium"
          >
            <Coffee className="size-3.5" aria-hidden />
            {t(site.tagline, locale)}
          </Badge>
        </Reveal>

        <Reveal delay={0.05}>
          <h1 className="mt-6 text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            {t(site.hero.heading, locale)}
          </h1>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            {t(site.hero.body, locale)}
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full rounded-full sm:w-auto">
              <Link href="/menu">
                {t(site.hero.primaryCta, locale)}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full rounded-full sm:w-auto"
            >
              <Link href="/signup">{t(site.hero.secondaryCta, locale)}</Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
