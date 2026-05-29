import { asc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { services } from '@/lib/db/schema';
import { requireRole } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { pick } from '@/lib/i18n';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { ServicesManager, type AdminService } from '@/components/admin/services-manager';

export const dynamic = 'force-dynamic';

export default async function AdminServicesPage() {
  await requireRole('admin');
  const locale = await getLocale();

  const rows = await db
    .select()
    .from(services)
    .orderBy(asc(services.dayOfWeek), asc(services.startTime));

  const list: AdminService[] = rows.map((row) => ({
    id: row.id,
    nameTh: row.nameTh,
    nameEn: row.nameEn,
    dayOfWeek: row.dayOfWeek,
    startTime: row.startTime,
    endTime: row.endTime,
    active: row.active,
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={pick('รอบนมัสการ', 'Service windows', locale)}
        description={pick(
          'ช่วงวันและเวลาที่การเช็คอินจะนับเป็นการเข้าร่วม',
          'The day + time windows during which a check-in counts as attendance.',
          locale,
        )}
      />
      <ServicesManager locale={locale} services={list} />
    </div>
  );
}
