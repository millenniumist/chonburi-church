import { requireRole } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { pick } from '@/lib/i18n';
import { getContent } from '@/lib/cms/read';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { ChurchInfoForm } from './church-info-form';
import { Card, CardContent } from '@/components/ui/card';

// Admin reads must reflect mutations immediately.
export const dynamic = 'force-dynamic';

/**
 * Admin editor for the public-facing church info (the `siteContent.church`
 * section). Drives the landing "Visit Us" band and the footer. Separate from
 * "Site config", which owns the GPS check-in anchor (CONTEXT invariant 2).
 */
export default async function AdminChurchPage() {
  await requireRole('admin');
  const locale = await getLocale();

  // Read through the shared read layer: a missing/invalid row degrades to the
  // registry default, so the form is always pre-filled with something sane.
  const initial = await getContent('church');

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={pick('ข้อมูลคริสตจักร', 'Church info', locale)}
        description={pick(
          'แก้ไขข้อมูลคริสตจักรที่แสดงบนหน้าเว็บ (ส่วน “มาเยี่ยมเรา” และส่วนท้าย)',
          'Edit the church info shown on the public site (the "Visit Us" band and the footer).',
          locale,
        )}
      />

      <Card>
        <CardContent className="pt-6">
          <ChurchInfoForm locale={locale} initial={initial} />
        </CardContent>
      </Card>
    </div>
  );
}
