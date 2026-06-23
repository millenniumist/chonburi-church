import { notFound } from 'next/navigation';
import { and, asc, eq, gte, lte } from 'drizzle-orm';
import { requireRole } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { pick, t, type Locale } from '@/lib/i18n';
import { db } from '@/lib/db';
import { donations, members } from '@/lib/db/schema';
import type { DonationFund, DonationMethod } from '@/lib/db/schema';
import { church } from '@/content/site';
import { formatBaht } from '@/lib/donations/format';
import { PrintButton } from '@/components/admin-catalog/print-button';

// Admin reads must reflect mutations immediately.
export const dynamic = 'force-dynamic';

const FUND_LABELS: Record<DonationFund, { th: string; en: string }> = {
  general: { th: 'ทั่วไป', en: 'General' },
  tithe: { th: 'สิบลด', en: 'Tithe' },
  missions: { th: 'พันธกิจ', en: 'Missions' },
  building: { th: 'อาคาร', en: 'Building' },
  other: { th: 'อื่น ๆ', en: 'Other' },
};

const METHOD_LABELS: Record<DonationMethod, { th: string; en: string }> = {
  cash: { th: 'เงินสด', en: 'Cash' },
  transfer: { th: 'โอนเงิน', en: 'Transfer' },
  promptpay: { th: 'พร้อมเพย์', en: 'PromptPay' },
  other: { th: 'อื่น ๆ', en: 'Other' },
};

/** Format a YYYY-MM-DD gift date for display (Bangkok wall-clock noon, no TZ drift). */
function formatDate(value: string, locale: Locale): string {
  const date = new Date(`${value}T12:00:00+07:00`);
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'th-TH', {
    timeZone: 'Asia/Bangkok',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

type PageParams = { memberId: string };
type SearchParams = { year?: string };

export default async function GivingStatementPage({
  params,
  searchParams,
}: {
  params: Promise<PageParams>;
  searchParams: Promise<SearchParams>;
}) {
  await requireRole('admin');
  const locale = await getLocale();
  const tr = (th: string, en: string): string => pick(th, en, locale);

  const { memberId } = await params;
  const currentYear = new Date().getFullYear();
  const { year: yearParam } = await searchParams;
  const parsedYear = yearParam ? Number(yearParam) : currentYear;
  const year = Number.isInteger(parsedYear) ? parsedYear : currentYear;

  const member = await db.query.members.findFirst({
    where: eq(members.id, memberId),
    columns: { id: true, name: true },
  });
  if (!member) notFound();

  const rows = await db
    .select()
    .from(donations)
    .where(
      and(
        eq(donations.memberId, member.id),
        gte(donations.receivedAt, `${year}-01-01`),
        lte(donations.receivedAt, `${year}-12-31`),
      ),
    )
    .orderBy(asc(donations.receivedAt));

  const total = rows.reduce((sum, row) => sum + row.amount, 0);

  return (
    <div className="space-y-6">
      <style>{`@media print { body * { visibility: hidden !important; } #statement, #statement * { visibility: visible !important; } #statement { position: absolute; inset: 0; padding: 24px; } }`}</style>

      <div className="flex items-center justify-end print:hidden">
        <PrintButton label={tr('พิมพ์', 'Print')} />
      </div>

      <div id="statement" className="mx-auto max-w-2xl space-y-6 rounded-xl border border-neutral-200 bg-white p-8 text-neutral-900">
        <header className="space-y-1 border-b pb-4 text-center">
          <h1 className="text-xl font-bold tracking-tight">{t(church.legalName, locale)}</h1>
          <p className="text-sm text-neutral-500">{t(church.address, locale)}</p>
          <p className="text-sm text-neutral-500">{church.phone}</p>
        </header>

        <div className="space-y-1 text-center">
          <h2 className="text-lg font-semibold">
            {tr('ใบรับรองการถวาย', 'Annual Giving Statement')}
          </h2>
          <p className="text-sm text-neutral-500">{tr('ปี', 'Year')} {year}</p>
        </div>

        <div className="text-sm">
          <span className="text-neutral-500">{tr('สมาชิก', 'Member')}: </span>
          <span className="font-medium">{member.name}</span>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-lg border border-dashed py-12 text-center text-neutral-500">
            {tr('ไม่มีรายการบริจาคในปีนี้', 'No donations recorded for this year.')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-neutral-500">
                  <th className="py-2 pr-4 font-medium">{tr('วันที่', 'Date')}</th>
                  <th className="py-2 pr-4 font-medium">{tr('กองทุน', 'Fund')}</th>
                  <th className="py-2 pr-4 font-medium">{tr('ช่องทาง', 'Method')}</th>
                  <th className="py-2 text-right font-medium">{tr('จำนวนเงิน', 'Amount')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 whitespace-nowrap">{formatDate(row.receivedAt, locale)}</td>
                    <td className="py-2 pr-4">
                      {pick(FUND_LABELS[row.fund].th, FUND_LABELS[row.fund].en, locale)}
                    </td>
                    <td className="py-2 pr-4">
                      {pick(METHOD_LABELS[row.method].th, METHOD_LABELS[row.method].en, locale)}
                    </td>
                    <td className="py-2 text-right tabular-nums">{formatBaht(row.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-semibold">
                  <td className="py-2 pr-4" colSpan={3}>
                    {tr('รวมทั้งสิ้น', 'Total')}
                  </td>
                  <td className="py-2 text-right tabular-nums">{formatBaht(total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <p className="pt-4 text-center text-xs text-neutral-500">
          {tr(
            'ขอบคุณสำหรับการถวายด้วยใจกว้างขวางของท่าน',
            'Thank you for your generous giving.',
          )}
        </p>
      </div>
    </div>
  );
}
