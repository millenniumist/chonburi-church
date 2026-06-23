import { Plus } from 'lucide-react';
import { asc, eq } from 'drizzle-orm';
import { requireRole } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { pick } from '@/lib/i18n';
import { db } from '@/lib/db';
import { members } from '@/lib/db/schema';
import { listDonations } from '@/lib/actions/admin-donations';
import { Button } from '@/components/ui/button';
import { DonationDialog } from '@/components/admin-catalog/donation-dialog';
import { DonationTable } from '@/components/admin-catalog/donation-table';
import { DonationYearFilter } from '@/components/admin-catalog/donation-year-filter';

// Admin reads must reflect mutations immediately.
export const dynamic = 'force-dynamic';

type SearchParams = { year?: string };

export default async function AdminDonationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireRole('admin');
  const locale = await getLocale();
  const tr = (th: string, en: string): string => pick(th, en, locale);

  const currentYear = new Date().getFullYear();
  const { year: yearParam } = await searchParams;
  const parsedYear = yearParam ? Number(yearParam) : currentYear;
  const year = Number.isInteger(parsedYear) ? parsedYear : currentYear;

  // The last several years are selectable in the filter (newest first).
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  // Donor Select: every active member, by name.
  const directory = await db
    .select({ id: members.id, name: members.name })
    .from(members)
    .where(eq(members.active, true))
    .orderBy(asc(members.name));

  const items = await listDonations({ year });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{tr('การถวายและบริจาค', 'Donations')}</h1>
          <p className="text-sm text-muted-foreground">
            {tr(
              'บันทึกการถวาย และพิมพ์ใบรับรองการถวายรายปีของสมาชิก',
              'Record gifts and print members’ yearly giving statements.',
            )}
          </p>
        </div>
        <div className="flex items-end gap-2">
          <DonationYearFilter locale={locale} year={year} years={years} />
          <DonationDialog locale={locale} members={directory}>
            <Button type="button">
              <Plus className="size-4" />
              {tr('บันทึกการบริจาค', 'New donation')}
            </Button>
          </DonationDialog>
        </div>
      </div>

      <DonationTable locale={locale} items={items} members={directory} />
    </div>
  );
}
