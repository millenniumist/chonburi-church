import { Plus } from 'lucide-react';
import { asc, eq } from 'drizzle-orm';
import { requireRole } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { pick } from '@/lib/i18n';
import { db } from '@/lib/db';
import { classOfferings, members } from '@/lib/db/schema';
import { listAttendance } from '@/lib/actions/admin-class-attendance';
import { Button } from '@/components/ui/button';
import { ClassAttendanceFilter } from '@/components/admin-catalog/class-attendance-filter';
import { ClassAttendanceDialog } from '@/components/admin-catalog/class-attendance-dialog';
import { ClassAttendanceTable } from '@/components/admin-catalog/class-attendance-table';

// Admin reads must reflect mutations immediately.
export const dynamic = 'force-dynamic';

/** Today as `YYYY-MM-DD` in Asia/Bangkok (matches a `<input type="date">`). */
function todayInBangkok(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

type SearchParams = { classId?: string; date?: string };

export default async function AdminClassAttendancePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireRole('admin');
  const locale = await getLocale();
  const tr = (th: string, en: string): string => pick(th, en, locale);

  const { classId: classIdParam, date: dateParam } = await searchParams;
  const date = dateParam || todayInBangkok();

  // Active class offerings (for the filter) and active members (for the add dialog).
  const offerings = await db
    .select()
    .from(classOfferings)
    .where(eq(classOfferings.active, true))
    .orderBy(asc(classOfferings.sortOrder), asc(classOfferings.nameTh));

  const classId = offerings.some((o) => o.id === classIdParam) ? (classIdParam ?? null) : null;
  const hasSelection = classId != null && date.length > 0;

  const directory = await db
    .select()
    .from(members)
    .where(eq(members.active, true))
    .orderBy(asc(members.name));

  const rows = hasSelection
    ? await listAttendance({ classOfferingId: classId, sessionDate: date })
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {tr('การเข้าร่วมคลาส', 'Class attendance')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {tr(
              'เลือกคลาสและวันที่ เพื่อบันทึกผู้ที่มาเข้าร่วม',
              'Pick a class and a date to record who was present.',
            )}
          </p>
        </div>
        <ClassAttendanceDialog
          locale={locale}
          classOfferingId={classId ?? ''}
          sessionDate={date}
          members={directory}
        >
          <Button type="button" disabled={!hasSelection}>
            <Plus className="size-4" />
            {tr('เพิ่มผู้เข้าร่วม', 'Add member')}
          </Button>
        </ClassAttendanceDialog>
      </div>

      <ClassAttendanceFilter
        locale={locale}
        offerings={offerings}
        classId={classId}
        date={date}
      />

      {hasSelection ? (
        <>
          <p className="text-sm text-muted-foreground">
            {tr(`เข้าร่วม ${rows.length} คน`, `${rows.length} present`)}
          </p>
          <ClassAttendanceTable locale={locale} rows={rows} />
        </>
      ) : (
        <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
          {tr('เลือกคลาสและวันที่เพื่อดูรายการเข้าร่วม', 'Select a class and a date to view the register.')}
        </div>
      )}
    </div>
  );
}
