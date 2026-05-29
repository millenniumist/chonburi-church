import { asc } from 'drizzle-orm';
import { Plus } from 'lucide-react';
import { db } from '@/lib/db';
import { menuItems } from '@/lib/db/schema';
import { requireRole } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { pick } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { MenuItemDialog } from '@/components/admin-catalog/menu-item-dialog';
import { MenuTable } from '@/components/admin-catalog/menu-table';

// Admin reads must reflect mutations immediately.
export const dynamic = 'force-dynamic';

export default async function AdminMenuPage() {
  await requireRole('admin');
  const locale = await getLocale();
  const tr = (th: string, en: string): string => pick(th, en, locale);

  const items = await db
    .select()
    .from(menuItems)
    .orderBy(asc(menuItems.sortOrder), asc(menuItems.nameTh));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{tr('จัดการเมนู', 'Menu')}</h1>
          <p className="text-sm text-muted-foreground">
            {tr(
              'เพิ่ม แก้ไข และซ่อนรายการเมนู กาแฟฟรีเสมอ',
              'Add, edit, and hide menu items. Coffee is always free.',
            )}
          </p>
        </div>
        <MenuItemDialog locale={locale}>
          <Button type="button">
            <Plus className="size-4" />
            {tr('เพิ่มเมนู', 'New item')}
          </Button>
        </MenuItemDialog>
      </div>

      <MenuTable locale={locale} items={items} />
    </div>
  );
}
