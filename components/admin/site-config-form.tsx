'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import { updateSiteConfig } from '@/lib/actions/admin-core';
import { pick, type Locale } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type SiteConfigFormProps = {
  locale: Locale;
  /** Existing values (null = not configured yet). */
  initial: {
    churchLat: number | null;
    churchLng: number | null;
    checkinRadiusMeters: number;
    addressTh: string | null;
    addressEn: string | null;
    phone: string | null;
    mapEmbedUrl: string | null;
  };
};

export function SiteConfigForm({ locale, initial }: SiteConfigFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const tr = (th: string, en: string): string => pick(th, en, locale);

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateSiteConfig({
        churchLat: formData.get('churchLat'),
        churchLng: formData.get('churchLng'),
        checkinRadiusMeters: formData.get('checkinRadiusMeters'),
        addressTh: formData.get('addressTh'),
        addressEn: formData.get('addressEn'),
        phone: formData.get('phone'),
        mapEmbedUrl: formData.get('mapEmbedUrl'),
      });
      if (result.ok) {
        toast.success(tr('บันทึกการตั้งค่าแล้ว', 'Configuration saved.'));
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-6">
      <fieldset className="space-y-4" disabled={isPending}>
        <legend className="text-sm font-semibold">
          {tr('พิกัดโบสถ์ & รัศมีเช็คอิน', 'Church location & check-in radius')}
        </legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="churchLat">{tr('ละติจูด', 'Latitude')}</Label>
            <Input
              id="churchLat"
              name="churchLat"
              type="number"
              step="any"
              required
              inputMode="decimal"
              defaultValue={initial.churchLat ?? ''}
              placeholder="13.7563"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="churchLng">{tr('ลองจิจูด', 'Longitude')}</Label>
            <Input
              id="churchLng"
              name="churchLng"
              type="number"
              step="any"
              required
              inputMode="decimal"
              defaultValue={initial.churchLng ?? ''}
              placeholder="100.5018"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="checkinRadiusMeters">{tr('รัศมี (เมตร)', 'Radius (meters)')}</Label>
            <Input
              id="checkinRadiusMeters"
              name="checkinRadiusMeters"
              type="number"
              min={1}
              step={1}
              required
              inputMode="numeric"
              defaultValue={initial.checkinRadiusMeters}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {tr(
            'ค่าเหล่านี้ใช้ตรวจสอบการเช็คอินด้วย GPS เซิร์ฟเวอร์จะคำนวณระยะทางจากพิกัดนี้และยอมรับเฉพาะการเช็คอินที่อยู่ในรัศมีและช่วงเวลานมัสการเท่านั้น',
            'These power the GPS check-in. The server measures the distance from this point and only accepts a check-in that is within the radius AND inside an active service window.',
          )}
        </p>
      </fieldset>

      <fieldset className="space-y-4" disabled={isPending}>
        <legend className="text-sm font-semibold">{tr('ที่อยู่ & การติดต่อ', 'Address & contact')}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="addressTh">{tr('ที่อยู่ (ไทย)', 'Address (Thai)')}</Label>
            <Textarea
              id="addressTh"
              name="addressTh"
              rows={2}
              defaultValue={initial.addressTh ?? ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="addressEn">{tr('ที่อยู่ (อังกฤษ)', 'Address (English)')}</Label>
            <Textarea
              id="addressEn"
              name="addressEn"
              rows={2}
              defaultValue={initial.addressEn ?? ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{tr('เบอร์โทร', 'Phone')}</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              defaultValue={initial.phone ?? ''}
              placeholder="02-xxx-xxxx"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mapEmbedUrl">{tr('ลิงก์ฝังแผนที่', 'Map embed URL')}</Label>
            <Input
              id="mapEmbedUrl"
              name="mapEmbedUrl"
              type="url"
              defaultValue={initial.mapEmbedUrl ?? ''}
              placeholder="https://www.google.com/maps/embed?..."
            />
          </div>
        </div>
      </fieldset>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          <Save />
          {isPending ? tr('กำลังบันทึก…', 'Saving…') : tr('บันทึก', 'Save')}
        </Button>
      </div>
    </form>
  );
}
