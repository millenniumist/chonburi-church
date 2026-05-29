import { Card, CardContent } from '@/components/ui/card';
import { site } from '@/content/site';
import { t } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';
import { Reveal } from '@/components/landing/reveal';

export function FirstVisit({ locale }: { locale: Locale }) {
  return (
    <section className="bg-secondary/40">
      <div className="mx-auto max-w-5xl px-6 py-20 sm:py-24">
        <Reveal>
          <h2 className="text-balance text-center text-3xl font-semibold tracking-tight sm:text-4xl">
            {t(site.firstVisit.heading, locale)}
          </h2>
        </Reveal>

        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {site.firstVisit.steps.map((step, index) => (
            <Reveal as="li" key={index} delay={index * 0.08} className="list-none">
              <Card className="h-full border-border/70 bg-card/80 transition-shadow hover:shadow-md">
                <CardContent className="flex h-full flex-col gap-4">
                  <span className="flex size-10 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground">
                    {index + 1}
                  </span>
                  <p className="text-pretty text-base leading-relaxed text-foreground">
                    {t(step, locale)}
                  </p>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
