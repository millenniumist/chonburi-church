'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from 'lucide-react';
import { updateChurchInfo } from '@/lib/actions/cms-church';
import { normalizeChurchInput, type FlatChurchInput } from '@/lib/cms/church-input';
import { pick, type Locale } from '@/lib/i18n';
import type { ChurchContent } from '@/lib/cms/sections';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type WorshipRow = {
  /** Stable client key so React reconciles rows correctly across reorders. */
  key: string;
  dayTh: string;
  dayEn: string;
  time: string;
  eventTh: string;
  eventEn: string;
};

let rowSeq = 0;
function newRowKey(): string {
  rowSeq += 1;
  return `wt-${rowSeq}`;
}

type ChurchInfoFormProps = {
  locale: Locale;
  /** Resolved church content (DB value, or registry default via the read layer). */
  initial: ChurchContent;
};

export function ChurchInfoForm({ locale, initial }: ChurchInfoFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const tr = (th: string, en: string): string => pick(th, en, locale);

  const [rows, setRows] = useState<WorshipRow[]>(() =>
    initial.worshipTimes.map((w) => ({
      key: newRowKey(),
      dayTh: w.day.th,
      dayEn: w.day.en,
      time: w.time,
      eventTh: w.event.th,
      eventEn: w.event.en,
    })),
  );

  function addRow() {
    setRows((rs) => [
      ...rs,
      { key: newRowKey(), dayTh: '', dayEn: '', time: '', eventTh: '', eventEn: '' },
    ]);
  }

  function removeRow(key: string) {
    setRows((rs) => rs.filter((r) => r.key !== key));
  }

  function moveRow(key: string, dir: -1 | 1) {
    setRows((rs) => {
      const i = rs.findIndex((r) => r.key === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= rs.length) return rs;
      const next = [...rs];
      const [moved] = next.splice(i, 1);
      if (moved) next.splice(j, 0, moved);
      return next;
    });
  }

  function updateRow(key: string, patch: Partial<Omit<WorshipRow, 'key'>>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function onSubmit(formData: FormData) {
    const str = (name: string): string => String(formData.get(name) ?? '');
    const flat: FlatChurchInput = {
      legalNameTh: str('legalNameTh'),
      legalNameEn: str('legalNameEn'),
      phone: str('phone'),
      email: str('email'),
      addressTh: str('addressTh'),
      addressEn: str('addressEn'),
      latitude: str('latitude'),
      longitude: str('longitude'),
      mapEmbedUrl: str('mapEmbedUrl'),
      mapsLink: str('mapsLink'),
      facebook: str('facebook'),
      facebookLive: str('facebookLive'),
      youtube: str('youtube'),
      // The controlled `rows` state is the source of truth for the array.
      worshipTimes: rows.map((r) => ({
        dayTh: r.dayTh,
        dayEn: r.dayEn,
        time: r.time,
        eventTh: r.eventTh,
        eventEn: r.eventEn,
      })),
    };

    startTransition(async () => {
      // Reshape flat -> structured on the client, then the action re-validates.
      const result = await updateChurchInfo(normalizeChurchInput(flat));
      if (result.ok) {
        toast.success(tr('บันทึกข้อมูลคริสตจักรแล้ว', 'Church info saved.'));
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-8">
      {/* Identity & contact */}
      <fieldset className="space-y-4" disabled={isPending}>
        <legend className="text-sm font-semibold">{tr('ชื่อ & การติดต่อ', 'Identity & contact')}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="legalNameTh">{tr('ชื่อคริสตจักร (ไทย)', 'Legal name (Thai)')}</Label>
            <Input id="legalNameTh" name="legalNameTh" required defaultValue={initial.legalName.th} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="legalNameEn">{tr('ชื่อคริสตจักร (อังกฤษ)', 'Legal name (English)')}</Label>
            <Input id="legalNameEn" name="legalNameEn" required defaultValue={initial.legalName.en} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{tr('เบอร์โทร', 'Phone')}</Label>
            <Input
              id="phone"
              name="phone"
              type="text"
              inputMode="tel"
              defaultValue={initial.phone}
              placeholder="033-126404, 080-5664871"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{tr('อีเมล', 'Email')}</Label>
            <Input id="email" name="email" type="email" defaultValue={initial.email} required />
          </div>
        </div>
      </fieldset>

      {/* Address & map */}
      <fieldset className="space-y-4" disabled={isPending}>
        <legend className="text-sm font-semibold">{tr('ที่อยู่ & แผนที่', 'Address & map')}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="addressTh">{tr('ที่อยู่ (ไทย)', 'Address (Thai)')}</Label>
            <Textarea id="addressTh" name="addressTh" rows={2} defaultValue={initial.address.th} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="addressEn">{tr('ที่อยู่ (อังกฤษ)', 'Address (English)')}</Label>
            <Textarea id="addressEn" name="addressEn" rows={2} defaultValue={initial.address.en} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="latitude">{tr('ละติจูด (แสดงผล)', 'Latitude (display)')}</Label>
            <Input
              id="latitude"
              name="latitude"
              type="number"
              step="any"
              inputMode="decimal"
              defaultValue={initial.coordinates.latitude}
              placeholder="13.3644026"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="longitude">{tr('ลองจิจูด (แสดงผล)', 'Longitude (display)')}</Label>
            <Input
              id="longitude"
              name="longitude"
              type="number"
              step="any"
              inputMode="decimal"
              defaultValue={initial.coordinates.longitude}
              placeholder="100.9818814"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="mapEmbedUrl">{tr('ลิงก์ฝังแผนที่', 'Map embed URL')}</Label>
            <Input
              id="mapEmbedUrl"
              name="mapEmbedUrl"
              type="url"
              defaultValue={initial.mapEmbedUrl}
              placeholder="https://www.google.com/maps/embed?..."
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="mapsLink">{tr('ลิงก์เปิดแผนที่', 'Open-in-Maps link')}</Label>
            <Input
              id="mapsLink"
              name="mapsLink"
              type="url"
              defaultValue={initial.mapsLink}
              placeholder="https://www.google.com/maps/search/?api=1&query=..."
            />
          </div>
        </div>

        {/* The GPS-anchor disclaimer (CONTEXT invariant 2). */}
        <p className="rounded-md border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-400/30 dark:bg-amber-950/30 dark:text-amber-200">
          {tr(
            'พิกัดและแผนที่ในส่วนนี้ใช้สำหรับ "แสดงผล" บนหน้าเว็บเท่านั้น ไม่ได้ใช้ตรวจสอบการเช็คอินด้วย GPS — จุดอ้างอิงและรัศมีของการเช็คอินตั้งค่าแยกที่หน้า "ตั้งค่าเว็บไซต์" การแก้พิกัดที่นี่จะไม่ขยับขอบเขตการเช็คอิน',
            'The coordinates and map here are for DISPLAY on the public site only. They are NOT used to verify GPS check-in — the check-in anchor and radius are configured separately under "Site config". Editing these coordinates will not move the check-in geofence.',
          )}
        </p>
      </fieldset>

      {/* Social links */}
      <fieldset className="space-y-4" disabled={isPending}>
        <legend className="text-sm font-semibold">{tr('โซเชียลมีเดีย', 'Social links')}</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="facebook">{tr('เฟซบุ๊ก', 'Facebook')}</Label>
            <Input id="facebook" name="facebook" type="url" defaultValue={initial.social.facebook} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="facebookLive">{tr('เฟซบุ๊ก Live', 'Facebook Live')}</Label>
            <Input
              id="facebookLive"
              name="facebookLive"
              type="url"
              defaultValue={initial.social.facebookLive}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="youtube">{tr('ยูทูบ', 'YouTube')}</Label>
            <Input id="youtube" name="youtube" type="url" defaultValue={initial.social.youtube} />
          </div>
        </div>
      </fieldset>

      {/* Worship times — add / remove / reorder */}
      <fieldset className="space-y-4" disabled={isPending}>
        <div className="flex items-center justify-between gap-4">
          <legend className="text-sm font-semibold">{tr('ตารางนมัสการ', 'Worship schedule')}</legend>
          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            <Plus className="size-4" />
            {tr('เพิ่มรอบ', 'Add row')}
          </Button>
        </div>

        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {tr('ยังไม่มีรอบนมัสการ — กด "เพิ่มรอบ"', 'No worship times yet — press "Add row".')}
          </p>
        ) : (
          <ul className="space-y-3">
            {rows.map((row, index) => (
              <li key={row.key} className="rounded-lg border p-3" data-testid="worship-row">
                <div className="grid gap-3 sm:grid-cols-5">
                  <div className="space-y-1">
                    <Label className="text-xs">{tr('วัน (ไทย)', 'Day (Thai)')}</Label>
                    <Input
                      aria-label={tr('วัน (ไทย)', 'Day (Thai)')}
                      value={row.dayTh}
                      onChange={(e) => updateRow(row.key, { dayTh: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{tr('วัน (อังกฤษ)', 'Day (English)')}</Label>
                    <Input
                      aria-label={tr('วัน (อังกฤษ)', 'Day (English)')}
                      value={row.dayEn}
                      onChange={(e) => updateRow(row.key, { dayEn: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{tr('เวลา', 'Time')}</Label>
                    <Input
                      aria-label={tr('เวลา', 'Time')}
                      value={row.time}
                      placeholder="10:00 – 12:00"
                      onChange={(e) => updateRow(row.key, { time: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{tr('กิจกรรม (ไทย)', 'Event (Thai)')}</Label>
                    <Input
                      aria-label={tr('กิจกรรม (ไทย)', 'Event (Thai)')}
                      value={row.eventTh}
                      onChange={(e) => updateRow(row.key, { eventTh: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{tr('กิจกรรม (อังกฤษ)', 'Event (English)')}</Label>
                    <Input
                      aria-label={tr('กิจกรรม (อังกฤษ)', 'Event (English)')}
                      value={row.eventEn}
                      onChange={(e) => updateRow(row.key, { eventEn: e.target.value })}
                    />
                  </div>
                </div>
                <div className="mt-3 flex justify-end gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={index === 0}
                    aria-label={tr('เลื่อนขึ้น', 'Move up')}
                    onClick={() => moveRow(row.key, -1)}
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={index === rows.length - 1}
                    aria-label={tr('เลื่อนลง', 'Move down')}
                    onClick={() => moveRow(row.key, 1)}
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={tr('ลบรอบ', 'Remove row')}
                    onClick={() => removeRow(row.key)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </fieldset>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          <Save className="size-4" />
          {isPending ? tr('กำลังบันทึก…', 'Saving…') : tr('บันทึก', 'Save')}
        </Button>
      </div>
    </form>
  );
}
