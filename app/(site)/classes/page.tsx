import type { Metadata } from 'next';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { classOfferings } from '@/lib/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { pick } from '@/lib/i18n';
import { formatTime } from '@/lib/datetime';
import { EnrollDialog } from '@/components/classes/enroll-dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'Classes / คลาสเรียน',
  description: 'Free Saturday classes — English, Guitar, and Japanese. Everyone welcome.',
};

const WEEKDAY_LABEL: Record<number, { th: string; en: string }> = {
  0: { th: 'อาทิตย์', en: 'Sunday' },
  1: { th: 'จันทร์', en: 'Monday' },
  2: { th: 'อังคาร', en: 'Tuesday' },
  3: { th: 'พุธ', en: 'Wednesday' },
  4: { th: 'พฤหัสบดี', en: 'Thursday' },
  5: { th: 'ศุกร์', en: 'Friday' },
  6: { th: 'เสาร์', en: 'Saturday' },
};

export default async function ClassesPage() {
  const locale = await getLocale();
  const tr = (th: string, en: string): string => pick(th, en, locale);

  const [offerings, user] = await Promise.all([
    db
      .select()
      .from(classOfferings)
      .where(eq(classOfferings.active, true))
      .orderBy(asc(classOfferings.sortOrder)),
    getCurrentUser(),
  ]);

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12 sm:py-16">
      <header className="flex flex-col gap-3 text-center">
        <Badge variant="secondary" className="mx-auto">
          {tr('ทุกวันเสาร์ • เรียนฟรี', 'Every Saturday • Free')}
        </Badge>
        <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          {tr('คลาสเรียนฟรีทุกวันเสาร์', 'Free Saturday Classes')}
        </h1>
        <p className="mx-auto max-w-2xl text-pretty text-muted-foreground">
          {tr(
            'มาเรียนรู้สิ่งใหม่ ๆ ไปด้วยกัน ทุกคนยินดีต้อนรับ ไม่มีค่าใช้จ่าย ลงทะเบียนล่วงหน้าได้เลย',
            'Come learn something new together. Everyone is welcome, every class is free — reserve your spot below.',
          )}
        </p>
      </header>

      <Separator className="my-10" />

      {offerings.length === 0 ? (
        <p className="text-center text-muted-foreground">
          {tr(
            'ยังไม่มีคลาสที่เปิดรับสมัครในขณะนี้ โปรดกลับมาตรวจสอบใหม่ภายหลัง',
            'No classes are open right now. Please check back soon.',
          )}
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {offerings.map((offering) => {
            const name = pick(offering.nameTh, offering.nameEn, locale);
            const description = pick(offering.descriptionTh ?? '', offering.descriptionEn ?? '', locale);
            const day = WEEKDAY_LABEL[offering.dayOfWeek];
            const dayLabel = day ? pick(day.th, day.en, locale) : '';
            const timeRange = `${formatTime(offering.startTime)} – ${formatTime(offering.endTime)}`;

            return (
              <Card
                key={offering.id}
                className={
                  offering.imageUrl
                    ? 'flex flex-col justify-between overflow-hidden pt-0'
                    : 'flex flex-col justify-between'
                }
              >
                {offering.imageUrl ? (
                  // Class images are admin-supplied arbitrary URLs; a plain <img>
                  // avoids remotePatterns config and keeps the Pi's image optimizer
                  // idle (matches the menu pattern).
                  <img
                    src={offering.imageUrl}
                    alt={name}
                    className="aspect-[16/9] w-full object-cover"
                    loading="lazy"
                  />
                ) : null}
                <CardHeader className={offering.imageUrl ? 'pt-6' : undefined}>
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-xl">{name}</CardTitle>
                    <Badge>{tr('ฟรี', 'FREE')}</Badge>
                  </div>
                  <CardDescription className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span>
                      {tr('วัน', 'Day')}: {dayLabel}
                    </span>
                    <span aria-hidden>•</span>
                    <span>{timeRange}</span>
                    {offering.level && (
                      <>
                        <span aria-hidden>•</span>
                        <span>
                          {tr('ระดับ', 'Level')}: {offering.level}
                        </span>
                      </>
                    )}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col gap-5">
                  {description && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                  )}
                  <div className="mt-auto">
                    <EnrollDialog
                      classOfferingId={offering.id}
                      className={name}
                      isLoggedIn={user != null}
                      userName={user?.name}
                      locale={locale}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
