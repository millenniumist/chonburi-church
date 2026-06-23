import { Separator } from '@/components/ui/separator';
import { getLocale } from '@/lib/locale';
import { getAllContent, listAnnouncements } from '@/lib/cms/read';
import { Hero } from '@/components/landing/hero';
import { Verse } from '@/components/landing/verse';
import { Gospel } from '@/components/landing/gospel';
import { Story } from '@/components/landing/story';
import { FirstVisit } from '@/components/landing/first-visit';
import { ClassesTeaser } from '@/components/landing/classes-teaser';
import { Announcements } from '@/components/landing/announcements';
import { VisitUs } from '@/components/landing/visit-us';
import { VisitBand } from '@/components/landing/visit-band';

export default async function HomePage() {
  // Fetch the editable content + published announcements from the DB. Both have
  // fallback baked into the read layer, so the page always renders.
  const [locale, content, announcements] = await Promise.all([
    getLocale(),
    getAllContent(),
    listAnnouncements({ publishedOnly: true }),
  ]);

  return (
    <main>
      <Hero locale={locale} content={content.hero} />
      <Verse locale={locale} content={content.verse} />
      <Gospel locale={locale} content={content.gospel} />
      <Story locale={locale} content={content.story} />
      <FirstVisit locale={locale} content={content.firstVisit} />
      <ClassesTeaser locale={locale} content={content.classesTeaser} />
      <Announcements locale={locale} items={announcements} />
      <VisitUs locale={locale} content={content.church} />
      <Separator className="mx-auto max-w-5xl" />
      <VisitBand locale={locale} />
    </main>
  );
}
