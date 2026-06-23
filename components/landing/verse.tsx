import { Quote } from 'lucide-react';
import { t } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';
import { SECTIONS } from '@/lib/cms/sections';
import type { VerseContent } from '@/lib/cms/sections';
import { Reveal } from '@/components/landing/reveal';

export function Verse({
  locale,
  content = SECTIONS.verse.default,
}: {
  locale: Locale;
  content?: VerseContent;
}) {
  return (
    <section className="bg-primary/5 px-6 py-20 sm:py-24">
      <Reveal className="mx-auto max-w-3xl text-center">
        <Quote className="mx-auto size-8 text-primary/40" aria-hidden />
        <blockquote className="mt-6 text-balance text-2xl font-medium leading-relaxed sm:text-3xl">
          {t(content.text, locale)}
        </blockquote>
        <cite className="mt-6 block text-sm font-semibold uppercase not-italic tracking-wide text-primary">
          {t(content.reference, locale)}
        </cite>
      </Reveal>
    </section>
  );
}
