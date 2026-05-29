import { asc } from 'drizzle-orm';
import { Plus } from 'lucide-react';
import { db } from '@/lib/db';
import { classOfferings } from '@/lib/db/schema';
import { requireRole } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { pick } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { ClassOfferingDialog } from '@/components/admin-catalog/class-offering-dialog';
import {
  ClassTable,
  type ClassWithRoster,
  type RosterEntry,
} from '@/components/admin-catalog/class-table';

// Admin reads must reflect mutations immediately.
export const dynamic = 'force-dynamic';

export default async function AdminClassesPage() {
  await requireRole('admin');
  const locale = await getLocale();
  const tr = (th: string, en: string): string => pick(th, en, locale);

  // Offerings with their enrollments (and the enrolling user, if any).
  const offerings = await db.query.classOfferings.findMany({
    orderBy: [asc(classOfferings.sortOrder), asc(classOfferings.nameTh)],
    with: {
      enrollments: {
        with: {
          user: { columns: { name: true, phone: true } },
        },
      },
    },
  });

  const anonymous = tr('ไม่ระบุชื่อ', 'Unnamed');

  const classes: ClassWithRoster[] = offerings.map((offering) => {
    const { enrollments, ...rest } = offering;

    const roster: RosterEntry[] = enrollments
      .map((enrollment) => ({
        id: enrollment.id,
        name: enrollment.user?.name ?? enrollment.guestName ?? anonymous,
        phone: enrollment.user?.phone ?? enrollment.guestPhone ?? null,
        status: enrollment.status,
        createdAt: enrollment.createdAt,
      }))
      // Active (enrolled/waitlisted) first, then by signup time.
      .sort((a, b) => {
        const rank = (s: RosterEntry['status']): number =>
          s === 'enrolled' ? 0 : s === 'waitlisted' ? 1 : 2;
        const byStatus = rank(a.status) - rank(b.status);
        return byStatus !== 0 ? byStatus : a.createdAt.getTime() - b.createdAt.getTime();
      });

    const enrolledCount = enrollments.filter((e) => e.status === 'enrolled').length;

    return { offering: rest, roster, enrolledCount };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{tr('จัดการคลาสเรียน', 'Classes')}</h1>
          <p className="text-sm text-muted-foreground">
            {tr(
              'จัดการคลาสเรียนฟรี และดูรายชื่อผู้ลงทะเบียนของแต่ละคลาส',
              'Manage free classes and view each offering’s enrollment roster.',
            )}
          </p>
        </div>
        <ClassOfferingDialog locale={locale}>
          <Button type="button">
            <Plus className="size-4" />
            {tr('เพิ่มคลาส', 'New class')}
          </Button>
        </ClassOfferingDialog>
      </div>

      <ClassTable locale={locale} classes={classes} />
    </div>
  );
}
