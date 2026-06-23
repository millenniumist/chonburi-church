import { Plus } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { pick } from '@/lib/i18n';
import { listAnnouncements } from '@/lib/cms/read';
import { Button } from '@/components/ui/button';
import { AnnouncementDialog } from '@/components/admin-catalog/announcement-dialog';
import { AnnouncementTable } from '@/components/admin-catalog/announcement-table';

// Admin reads must reflect mutations immediately.
export const dynamic = 'force-dynamic';

export default async function AdminAnnouncementsPage() {
  await requireRole('admin');
  const locale = await getLocale();
  const tr = (th: string, en: string): string => pick(th, en, locale);

  // Admin view: every announcement (drafts, scheduled, hidden), already ordered
  // by sortOrder then publishedAt by the shared read layer.
  const items = await listAnnouncements({ publishedOnly: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{tr('ประกาศ', 'Announcements')}</h1>
          <p className="text-sm text-muted-foreground">
            {tr(
              'เพิ่ม แก้ไข จัดลำดับ และเผยแพร่ข่าวสารบนหน้าแรกของเว็บไซต์',
              'Add, edit, reorder, and publish news shown on the landing page.',
            )}
          </p>
        </div>
        <AnnouncementDialog locale={locale}>
          <Button type="button">
            <Plus className="size-4" />
            {tr('เพิ่มประกาศ', 'New announcement')}
          </Button>
        </AnnouncementDialog>
      </div>

      <AnnouncementTable locale={locale} items={items} />
    </div>
  );
}
