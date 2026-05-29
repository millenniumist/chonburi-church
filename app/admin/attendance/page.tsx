import { desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { attendances } from '@/lib/db/schema';
import { requireRole } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { pick } from '@/lib/i18n';
import type { AttendanceMethod } from '@/lib/db/schema';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const dynamic = 'force-dynamic';

const METHOD_LABELS: Record<AttendanceMethod, { th: string; en: string }> = {
  gps: { th: 'GPS', en: 'GPS' },
  staff: { th: 'พนักงาน', en: 'Staff' },
  qr: { th: 'QR', en: 'QR' },
};

export default async function AdminAttendancePage() {
  await requireRole('admin');
  const locale = await getLocale();

  const rows = await db.query.attendances.findMany({
    orderBy: [desc(attendances.checkedInAt)],
    limit: 100,
    columns: {
      id: true,
      serviceDate: true,
      verified: true,
      distanceMeters: true,
      method: true,
      checkedInAt: true,
    },
    with: {
      user: { columns: { name: true } },
      service: { columns: { nameTh: true, nameEn: true } },
    },
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={pick('การเช็คอิน', 'Attendance', locale)}
        description={pick(
          'การเช็คอินล่าสุด 100 รายการ',
          'The 100 most recent check-ins.',
          locale,
        )}
      />

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{pick('ผู้ใช้', 'User', locale)}</TableHead>
              <TableHead>{pick('วันที่', 'Date', locale)}</TableHead>
              <TableHead>{pick('รอบนมัสการ', 'Service', locale)}</TableHead>
              <TableHead>{pick('สถานะ', 'Verified', locale)}</TableHead>
              <TableHead className="text-right">{pick('ระยะทาง (ม.)', 'Distance (m)', locale)}</TableHead>
              <TableHead>{pick('วิธี', 'Method', locale)}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  {pick('ยังไม่มีการเช็คอิน', 'No check-ins yet.', locale)}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">
                    {row.user?.name ?? pick('ไม่ทราบ', 'Unknown', locale)}
                  </TableCell>
                  <TableCell className="tabular-nums">{row.serviceDate}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.service
                      ? pick(row.service.nameTh, row.service.nameEn, locale)
                      : pick('นอกรอบ', 'Off-window', locale)}
                  </TableCell>
                  <TableCell>
                    {row.verified ? (
                      <Badge variant="secondary">{pick('ยืนยันแล้ว', 'Verified', locale)}</Badge>
                    ) : (
                      <Badge variant="outline">{pick('ไม่ผ่าน', 'Unverified', locale)}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {Math.round(row.distanceMeters)}
                  </TableCell>
                  <TableCell>
                    {pick(METHOD_LABELS[row.method].th, METHOD_LABELS[row.method].en, locale)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
