import Link from 'next/link';
import { count, gte } from 'drizzle-orm';
import { CalendarClock, ListChecks, ShoppingBag, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { db } from '@/lib/db';
import { attendances, enrollments, orders, users } from '@/lib/db/schema';
import { requireRole } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { pick } from '@/lib/i18n';
import { bangkokNow } from '@/lib/datetime';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Counts must reflect the live DB, not a build-time snapshot.
export const dynamic = 'force-dynamic';

type Stat = {
  href: string;
  icon: LucideIcon;
  value: number;
  th: string;
  en: string;
};

async function singleCount(promise: Promise<{ value: number }[]>): Promise<number> {
  const [row] = await promise;
  return row?.value ?? 0;
}

export default async function AdminDashboardPage() {
  await requireRole('admin');
  const locale = await getLocale();

  // Start of the current Bangkok calendar day, as a Date for timestamp comparison.
  const todayStart = new Date(`${bangkokNow().date}T00:00:00+07:00`);

  const [userCount, ordersToday, enrollmentCount, attendanceCount] = await Promise.all([
    singleCount(db.select({ value: count() }).from(users)),
    singleCount(
      db.select({ value: count() }).from(orders).where(gte(orders.createdAt, todayStart)),
    ),
    singleCount(db.select({ value: count() }).from(enrollments)),
    singleCount(db.select({ value: count() }).from(attendances)),
  ]);

  const stats: Stat[] = [
    { href: '/admin/users', icon: Users, value: userCount, th: 'ผู้ใช้ทั้งหมด', en: 'Total users' },
    {
      href: '/staff',
      icon: ShoppingBag,
      value: ordersToday,
      th: 'ออเดอร์วันนี้',
      en: 'Orders today',
    },
    {
      href: '/admin/classes',
      icon: CalendarClock,
      value: enrollmentCount,
      th: 'การลงทะเบียนเรียน',
      en: 'Enrollments',
    },
    {
      href: '/admin/attendance',
      icon: ListChecks,
      value: attendanceCount,
      th: 'การเช็คอินทั้งหมด',
      en: 'Check-ins',
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={pick('แดชบอร์ด', 'Dashboard', locale)}
        description={pick(
          'ภาพรวมของคาเฟ่และพันธกิจ',
          'A quick overview of the café and ministry.',
          locale,
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.href + stat.en} href={stat.href} className="group">
              <Card className="transition-colors group-hover:border-primary/50">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {pick(stat.th, stat.en, locale)}
                  </CardTitle>
                  <Icon className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold tabular-nums">{stat.value}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {pick('เริ่มต้นใช้งาน', 'Getting started', locale)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            {pick(
              'ตั้งค่าพิกัดโบสถ์และรัศมีในหน้า "ตั้งค่าเว็บไซต์" เพื่อให้การเช็คอินด้วย GPS ทำงานได้',
              'Set the church coordinates and radius under “Site config” so GPS check-in works.',
              locale,
            )}
          </p>
          <p>
            {pick(
              'กำหนดรอบนมัสการในหน้า "รอบนมัสการ" — การเช็คอินจะนับเฉพาะในช่วงเวลาเหล่านี้',
              'Define service windows under “Services” — check-ins only count inside them.',
              locale,
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
