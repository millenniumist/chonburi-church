import Link from 'next/link';
import { FileText, Download, Eye, HardDrive } from 'lucide-react';

import { getBulletins } from '@/lib/bulletins';
import StickyNav from '@/components/landing/StickyNav';
import { Card } from '@/components/ui/card';

export const metadata = {
  title: 'สูจิบัตร | คริสตจักรชลบุรี ภาค 7',
  description: 'สูจิบัตรประจำสัปดาห์ของคริสตจักรชลบุรี ภาค 7 / Weekly Church Bulletins',
};

// DB-backed page — never prerender at build time (matches the other public pages).
export const dynamic = 'force-dynamic';

const BULLETINS_PER_PAGE = 12;

export default async function BulletinsPage({ searchParams }) {
  const params = await searchParams;
  const page = Number.parseInt(params?.page ?? '1', 10) || 1;
  const { bulletins, pagination } = await getBulletins({
    page,
    limit: BULLETINS_PER_PAGE,
    activeOnly: true,
  });

  return (
    <main className="bg-white min-h-screen">
      <StickyNav />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-3 px-4 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
              <FileText className="w-4 h-4" />
              Weekly Bulletins
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              สูจิบัตรประจำสัปดาห์
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              ดาวน์โหลดสูจิบัตรประจำการนมัสการของเราได้ทุกสัปดาห์ ทั้งภาษาไทยและภาษาอังกฤษ
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {bulletins.length === 0 ? (
            <Card className="p-12 text-center bg-slate-50 border-dashed border-2">
              <div className="text-6xl mb-4">📄</div>
              <h2 className="text-2xl font-semibold mb-2">ยังไม่มีสูจิบัตร</h2>
              <p className="text-muted-foreground">
                Checking back next Sunday – bulletins will appear here once they are published.
              </p>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bulletins.map((bulletin) => {
                  const dates = formatDateRange(bulletin.date);
                  return (
                    <Card
                      key={bulletin.id}
                      className="flex flex-col h-full border border-slate-100 shadow-sm hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-center justify-between px-6 pt-6 pb-4">
                        <div className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                          <FileText className="w-4 h-4" />
                          PDF
                        </div>
                        <span className="text-xs text-muted-foreground">
                          อัปเดต {formatShortDate(bulletin.createdAt)}
                        </span>
                      </div>

                      <div className="px-6 pb-6 flex flex-col flex-1 gap-4">
                        <div>
                          <p className="text-sm text-blue-600 font-semibold">{dates.th.weekday}</p>
                          <h3 className="text-xl font-semibold text-slate-900">{bulletin.title.th}</h3>
                          <p className="text-sm text-muted-foreground">{bulletin.title.en}</p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4 space-y-1 text-sm text-muted-foreground">
                          <p className="font-medium text-slate-900">{dates.th.full}</p>
                          <p>{dates.en.full}</p>
                          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500 mt-2">
                            <HardDrive className="w-3.5 h-3.5" />
                            {formatFileSize(bulletin.fileSize)}
                          </div>
                        </div>

                        <div className="mt-auto flex flex-col gap-3">
                          <a
                            href={`/api/bulletins/${bulletin.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            ดู / View
                          </a>
                          <a
                            href={`/api/bulletins/${bulletin.id}`}
                            download
                            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            ดาวน์โหลด / Download
                          </a>
                        </div>

                      </div>
                    </Card>
                  );
                })}
              </div>

              {pagination.totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                  <PaginationButton
                    disabled={page <= 1}
                    href={`/bulletins?page=${Math.max(1, page - 1)}`}
                    label="← หน้าก่อนหน้า / Previous"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    หน้า {page} / {pagination.totalPages}
                  </span>
                  <PaginationButton
                    disabled={page >= pagination.totalPages}
                    href={`/bulletins?page=${Math.min(pagination.totalPages, page + 1)}`}
                    label="หน้าถัดไป / Next →"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </section>


    </main>
  );
}

function PaginationButton({ href, label, disabled }) {
  if (disabled) {
    return (
      <span className="px-5 py-2.5 rounded-lg border border-slate-200 text-slate-400 cursor-not-allowed">
        {label}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="px-5 py-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium transition-colors"
    >
      {label}
    </Link>
  );
}

function Feature({ title, subtitle, body }) {
  return (
    <div className="space-y-2">
      <p className="text-sm uppercase tracking-wide text-slate-300">{subtitle}</p>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-slate-200">{body}</p>
    </div>
  );
}

function formatFileSize(size) {
  if (!size) return 'N/A';
  const mb = size / 1024 / 1024;
  return `${mb.toFixed(2)} MB`;
}

function formatShortDate(dateString) {
  return new Date(dateString).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
    timeZone: 'Asia/Bangkok'
  });
}

function formatDateRange(dateString) {
  const date = new Date(dateString);
  const opts = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long', timeZone: 'Asia/Bangkok' };
  return {
    th: {
      full: date.toLocaleDateString('th-TH', opts),
      weekday: date.toLocaleDateString('th-TH', { weekday: 'long', timeZone: 'Asia/Bangkok' }),
    },
    en: {
      full: date.toLocaleDateString('en-US', { ...opts, timeZone: 'Asia/Bangkok' }),
    },
  };
}
