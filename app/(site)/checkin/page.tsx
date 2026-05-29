import Link from 'next/link';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { services } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { pick } from '@/lib/i18n';
import { formatTime } from '@/lib/datetime';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckInPanel, type ServiceWindow } from '@/components/checkin/checkin-panel';

export const dynamic = 'force-dynamic';

const DAY_NAMES: { th: string; en: string }[] = [
  { th: 'อาทิตย์', en: 'Sunday' },
  { th: 'จันทร์', en: 'Monday' },
  { th: 'อังคาร', en: 'Tuesday' },
  { th: 'พุธ', en: 'Wednesday' },
  { th: 'พฤหัสบดี', en: 'Thursday' },
  { th: 'ศุกร์', en: 'Friday' },
  { th: 'เสาร์', en: 'Saturday' },
];

export default async function CheckInPage() {
  const user = await requireUser();
  const locale = await getLocale();

  // Already qualified → no need to check in.
  if (user.orderingEnabled) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-16">
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-2xl">
              {pick('คุณพร้อมแล้ว!', "You're all set!", locale)}
            </CardTitle>
            <CardDescription className="text-base">
              {pick(
                'บัญชีของคุณสามารถสั่งกาแฟได้แล้ว ไม่ต้องเช็คอินอีก',
                'Your account can already order coffee — no check-in needed.',
                locale,
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg" className="w-full">
              <Link href="/menu">{pick('ดูเมนูกาแฟ', 'Browse the menu', locale)}</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const activeServices = await db
    .select()
    .from(services)
    .where(eq(services.active, true))
    .orderBy(asc(services.dayOfWeek), asc(services.startTime));

  const windows: ServiceWindow[] = activeServices.map((s) => {
    const day = DAY_NAMES[s.dayOfWeek] ?? { th: '', en: '' };
    return {
      id: s.id,
      name: pick(s.nameTh, s.nameEn, locale),
      dayLabel: pick(day.th, day.en, locale),
      dayOfWeek: s.dayOfWeek,
      startTime: formatTime(s.startTime),
      endTime: formatTime(s.endTime),
      startMinutes: minutesOf(s.startTime),
    };
  });

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-12">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          {pick('เช็คอิน "ฉันมาแล้ว"', "Check in — “I'm here”", locale)}
        </h1>
        <p className="text-pretty text-muted-foreground">
          {pick(
            'มาร่วมนมัสการกับเราหนึ่งครั้ง แล้วกดเช็คอินที่โบสถ์ในช่วงเวลานมัสการ เพื่อปลดล็อกการสั่งกาแฟฟรี',
            'Join us for one service, then check in at the church during a service window to unlock free coffee ordering.',
            locale,
          )}
        </p>
      </header>

      <CheckInPanel locale={locale} services={windows} />
    </main>
  );
}

/** "HH:MM[:SS]" → minutes since midnight (display-only ordering on the client). */
function minutesOf(time: string): number {
  const [h, m] = time.split(':');
  return Number(h ?? 0) * 60 + Number(m ?? 0);
}
