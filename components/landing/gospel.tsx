import { Heart } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { site } from '@/content/site';
import { t } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';
import { Reveal } from '@/components/landing/reveal';

export function Gospel({ locale }: { locale: Locale }) {
  return (
    <section className="bg-accent/30">
      <div className="mx-auto max-w-3xl px-6 py-20 text-center sm:py-24">
        <Reveal>
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Heart className="size-6" aria-hidden />
          </span>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="mt-6 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {t(site.gospel.heading, locale)}
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <Separator className="mx-auto mt-6 w-16 bg-primary/30" />
        </Reveal>
        <Reveal delay={0.15}>
          <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground">
            {t(site.gospel.body, locale)}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
