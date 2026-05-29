import Link from 'next/link';
import { site } from '@/content/site';
import { t } from '@/lib/i18n';

// Placeholder landing — Slice 1 replaces this with the full designed page.
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-8 px-6 text-center">
      <span className="rounded-full border px-4 py-1 text-sm text-muted-foreground">
        {t(site.tagline)}
      </span>
      <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
        {t(site.hero.heading)}
      </h1>
      <p className="text-pretty text-lg text-muted-foreground">{t(site.hero.body)}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/menu"
          className="rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground"
        >
          {t(site.hero.primaryCta)}
        </Link>
        <Link href="/classes" className="rounded-full border px-6 py-3 font-medium">
          {t(site.classesTeaser.cta)}
        </Link>
      </div>
    </main>
  );
}
