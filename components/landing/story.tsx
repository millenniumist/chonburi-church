import { t } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';
import { SECTIONS } from '@/lib/cms/sections';
import type { StoryContent } from '@/lib/cms/sections';
import { Reveal } from '@/components/landing/reveal';

export function Story({
  locale,
  content = SECTIONS.story.default,
}: {
  locale: Locale;
  content?: StoryContent;
}) {
  return (
    <section className="mx-auto max-w-5xl px-6 py-20 sm:py-24">
      <div className="grid items-center gap-10 md:grid-cols-2">
        <Reveal from="up">
          <div>
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              {t(content.heading, locale)}
            </h2>
            <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground">
              {t(content.body, locale)}
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          {/* Decorative warm panel — no real photo asset in v1 */}
          <div
            aria-hidden
            className="relative aspect-[4/3] overflow-hidden rounded-2xl border bg-gradient-to-br from-accent via-secondary to-card shadow-sm"
          >
            <div className="absolute -left-10 -top-10 size-48 rounded-full bg-primary/15 blur-2xl" />
            <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-primary/10 to-transparent" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
