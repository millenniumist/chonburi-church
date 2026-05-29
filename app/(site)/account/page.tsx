import type { Metadata } from 'next';
import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { pick } from '@/lib/i18n';
import type { UserRole } from '@/lib/db/schema';
import type { Locale } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LogoutButton } from '@/components/auth/logout-button';

export const metadata: Metadata = {
  title: 'บัญชีของฉัน · My account',
};

const ROLE_LABELS: Record<UserRole, { th: string; en: string }> = {
  admin: { th: 'ผู้ดูแลระบบ', en: 'Admin' },
  staff: { th: 'พนักงาน', en: 'Staff' },
  member: { th: 'สมาชิก', en: 'Member' },
  visitor: { th: 'ผู้มาเยือน', en: 'Visitor' },
};

function roleLabel(role: UserRole, locale: Locale): string {
  const label = ROLE_LABELS[role];
  return pick(label.th, label.en, locale);
}

export default async function AccountPage() {
  const user = await requireUser();
  const locale = await getLocale();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {pick('บัญชีของฉัน', 'My account', locale)}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {pick(`สวัสดี ${user.name}`, `Hi, ${user.name}`, locale)}
          </p>
        </div>
        <LogoutButton
          label={pick('ออกจากระบบ', 'Log out', locale)}
          pendingLabel={pick('กำลังออก…', 'Logging out…', locale)}
        />
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>{pick('ข้อมูลส่วนตัว', 'Profile', locale)}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">{pick('ชื่อ', 'Name', locale)}</span>
            <span className="font-medium">{user.name}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">{pick('อีเมล', 'Email', locale)}</span>
            <span className="font-medium break-all">{user.email}</span>
          </div>
          {user.phone ? (
            <>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">{pick('เบอร์โทรศัพท์', 'Phone', locale)}</span>
                <span className="font-medium">{user.phone}</span>
              </div>
            </>
          ) : null}
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">{pick('สถานะ', 'Role', locale)}</span>
            <Badge variant="secondary">{roleLabel(user.role, locale)}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Ordering status */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{pick('การสั่งกาแฟออนไลน์', 'Online ordering', locale)}</CardTitle>
          <CardDescription>
            {pick('กาแฟของเราฟรีเสมอ', 'Our coffee is always free.', locale)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user.orderingEnabled ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 rounded-md bg-green-600/10 px-3 py-2 text-sm font-medium text-green-700 dark:text-green-400">
                <span aria-hidden>✓</span>
                {pick('คุณสามารถสั่งกาแฟออนไลน์ได้แล้ว', 'You can order online.', locale)}
              </div>
              <Button asChild className="w-full sm:w-auto">
                <Link href="/menu">{pick('ดูเมนูและสั่งกาแฟ', 'Browse the menu', locale)}</Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="rounded-md bg-amber-500/10 px-3 py-3 text-sm text-amber-800 dark:text-amber-300">
                <p className="font-medium">
                  {pick('ยังสั่งออนไลน์ไม่ได้', 'Online ordering is locked.', locale)}
                </p>
                <p className="mt-1 text-amber-700/90 dark:text-amber-200/80">
                  {pick(
                    'เข้าร่วมนมัสการหนึ่งครั้งแล้วเช็คอินที่โบสถ์ เพื่อปลดล็อกการสั่งกาแฟออนไลน์',
                    'Attend one service and check in at the church to unlock online ordering.',
                    locale,
                  )}
                </p>
              </div>
              <Button asChild className="w-full sm:w-auto">
                <Link href="/checkin">{pick('เช็คอินเข้าร่วมนมัสการ', "I'm here — check in", locale)}</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent orders placeholder */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{pick('คำสั่งซื้อล่าสุด', 'My recent orders', locale)}</CardTitle>
        </CardHeader>
        <CardContent>
          <Link
            href="/orders"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            {pick('ดูคำสั่งซื้อทั้งหมด', 'View all my orders', locale)}
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
