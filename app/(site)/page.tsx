import { Separator } from '@/components/ui/separator';
import { getLocale } from '@/lib/locale';
import { Hero } from '@/components/landing/hero';
import { Gospel } from '@/components/landing/gospel';
import { Story } from '@/components/landing/story';
import { FirstVisit } from '@/components/landing/first-visit';
import { ClassesTeaser } from '@/components/landing/classes-teaser';
import { VisitBand } from '@/components/landing/visit-band';

export default async function HomePage() {
  const locale = await getLocale();

  return (
    <main>
      <Hero locale={locale} />
      <Gospel locale={locale} />
      <Story locale={locale} />
      <FirstVisit locale={locale} />
      <ClassesTeaser locale={locale} />
      <Separator className="mx-auto max-w-5xl" />
      <VisitBand locale={locale} />
    </main>
  );
}
