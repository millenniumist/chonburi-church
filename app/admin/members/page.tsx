import { Plus } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { pick } from '@/lib/i18n';
import { listFamilies, listMembers } from '@/lib/actions/admin-members';
import { Button } from '@/components/ui/button';
import { FamilyDialog } from '@/components/admin-catalog/family-dialog';
import { FamilyTable } from '@/components/admin-catalog/family-table';
import { MemberDialog } from '@/components/admin-catalog/member-dialog';
import { MemberTable } from '@/components/admin-catalog/member-table';

// Admin reads must reflect mutations immediately.
export const dynamic = 'force-dynamic';

export default async function AdminMembersPage() {
  await requireRole('admin');
  const locale = await getLocale();
  const tr = (th: string, en: string): string => pick(th, en, locale);

  const [families, members] = await Promise.all([listFamilies(), listMembers()]);

  // Member count per family for the families table's "Members" column.
  const memberCounts: Record<string, number> = {};
  for (const member of members) {
    if (member.familyId) {
      memberCounts[member.familyId] = (memberCounts[member.familyId] ?? 0) + 1;
    }
  }

  return (
    <div className="space-y-12">
      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{tr('สมาชิก', 'Members')}</h1>
            <p className="text-sm text-muted-foreground">
              {tr(
                'ไดเรกทอรีผู้คนในคริสตจักร แยกตามครอบครัวและสถานะ',
                'The church people directory, grouped by family and status.',
              )}
            </p>
          </div>
          <MemberDialog locale={locale} families={families}>
            <Button type="button">
              <Plus className="size-4" />
              {tr('เพิ่มสมาชิก', 'New member')}
            </Button>
          </MemberDialog>
        </div>

        <MemberTable locale={locale} members={members} families={families} />
      </section>

      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">{tr('ครอบครัว', 'Families')}</h2>
            <p className="text-sm text-muted-foreground">
              {tr(
                'จัดกลุ่มสมาชิกที่อยู่บ้านเดียวกันเข้าด้วยกัน',
                'Group members who share a household.',
              )}
            </p>
          </div>
          <FamilyDialog locale={locale}>
            <Button type="button" variant="outline">
              <Plus className="size-4" />
              {tr('เพิ่มครอบครัว', 'New family')}
            </Button>
          </FamilyDialog>
        </div>

        <FamilyTable locale={locale} families={families} memberCounts={memberCounts} />
      </section>
    </div>
  );
}
