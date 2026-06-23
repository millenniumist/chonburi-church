'use client';

import { useRouter } from 'next/navigation';
import { pick, type Locale } from '@/lib/i18n';
import type { ClassOffering } from '@/lib/db/schema';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type ClassAttendanceFilterProps = {
  locale: Locale;
  /** Active class offerings to choose from. */
  offerings: ClassOffering[];
  /** The currently selected class offering id, if any. */
  classId: string | null;
  /** The currently selected session date (YYYY-MM-DD). */
  date: string;
};

/** Build the register URL for a given class + date selection. */
function hrefFor(classId: string, date: string): string {
  const params = new URLSearchParams();
  if (classId) params.set('classId', classId);
  if (date) params.set('date', date);
  const qs = params.toString();
  return qs ? `/admin/class-attendance?${qs}` : '/admin/class-attendance';
}

export function ClassAttendanceFilter({
  locale,
  offerings,
  classId,
  date,
}: ClassAttendanceFilterProps) {
  const router = useRouter();
  const tr = (th: string, en: string): string => pick(th, en, locale);

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-xl border p-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="classId">{tr('คลาส', 'Class')}</Label>
        <Select
          value={classId ?? undefined}
          onValueChange={(value) => router.push(hrefFor(value, date))}
        >
          <SelectTrigger id="classId" className="w-64">
            <SelectValue placeholder={tr('เลือกคลาส', 'Select a class')} />
          </SelectTrigger>
          <SelectContent>
            {offerings.map((offering) => (
              <SelectItem key={offering.id} value={offering.id}>
                {pick(offering.nameTh, offering.nameEn, locale)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="date">{tr('วันที่', 'Date')}</Label>
        <Input
          id="date"
          name="date"
          type="date"
          value={date}
          onChange={(event) => router.push(hrefFor(classId ?? '', event.target.value))}
        />
      </div>
    </div>
  );
}
