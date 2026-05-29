import Link from 'next/link';
import { ArrowRight, GraduationCap, Guitar, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { site } from '@/content/site';
import { t } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';
import { Reveal } from '@/components/landing/reveal';

export function ClassesTeaser({ locale }: { locale: Locale }) {
  return (
    <section className="mx-auto max-w-5xl px-6 py-20 sm:py-24">
      <Reveal>
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-card to-accent/40">
          <CardContent className="flex flex-col items-center gap-8 px-6 py-10 text-center md:flex-row md:px-12 md:text-left">
            <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <GraduationCap className="size-8" aria-hidden />
            </span>

            <div className="flex-1">
              <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
                {t(site.classesTeaser.heading, locale)}
              </h2>
              <p className="mt-3 text-pretty text-base leading-relaxed text-muted-foreground">
                {t(site.classesTeaser.body, locale)}
              </p>
              <div
                className="mt-5 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground md:justify-start"
                aria-hidden
              >
                <span className="inline-flex items-center gap-1.5">
                  <Languages className="size-4" /> EN
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Guitar className="size-4" /> Guitar
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Languages className="size-4" /> 日本語
                </span>
              </div>
            </div>

            <Button asChild size="lg" className="rounded-full">
              <Link href="/classes">
                {t(site.classesTeaser.cta, locale)}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </Reveal>
    </section>
  );
}
