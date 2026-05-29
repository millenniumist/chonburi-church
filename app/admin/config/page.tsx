import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { siteConfig } from '@/lib/db/schema';
import { requireRole } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { pick } from '@/lib/i18n';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { SiteConfigForm } from '@/components/admin/site-config-form';
import { Card, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function AdminConfigPage() {
  await requireRole('admin');
  const locale = await getLocale();

  const [config] = await db.select().from(siteConfig).where(eq(siteConfig.id, 1)).limit(1);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={pick('ตั้งค่าเว็บไซต์', 'Site config', locale)}
        description={pick(
          'พิกัดและรัศมีนี้ใช้ขับเคลื่อนการเช็คอินด้วย GPS',
          'These coordinates and radius power the GPS check-in.',
          locale,
        )}
      />

      <Card>
        <CardContent className="pt-6">
          <SiteConfigForm
            locale={locale}
            initial={{
              churchLat: config?.churchLat ?? null,
              churchLng: config?.churchLng ?? null,
              checkinRadiusMeters: config?.checkinRadiusMeters ?? 150,
              addressTh: config?.addressTh ?? null,
              addressEn: config?.addressEn ?? null,
              phone: config?.phone ?? null,
              mapEmbedUrl: config?.mapEmbedUrl ?? null,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
