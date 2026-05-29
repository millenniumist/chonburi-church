'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  createClassOffering,
  updateClassOffering,
  type ClassOfferingInput,
} from '@/lib/actions/admin-catalog';
import { pick, type Locale } from '@/lib/i18n';
import type { ClassKind, ClassOffering } from '@/lib/db/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type ClassOfferingDialogProps = {
  locale: Locale;
  /** When provided, the dialog edits this offering; otherwise it creates one. */
  offering?: ClassOffering;
  children: React.ReactNode;
};

// Bilingual labels keyed by ClassKind. The `Record<ClassKind, …>` annotation is
// exhaustive: adding a kind to the schema enum forces a label here (compile error
// otherwise), so the form's options can never silently drift from the DB enum.
const KIND_LABELS: Record<ClassKind, { th: string; en: string }> = {
  english: { th: 'ภาษาอังกฤษ', en: 'English' },
  guitar: { th: 'กีตาร์', en: 'Guitar' },
  japanese: { th: 'ภาษาญี่ปุ่น', en: 'Japanese' },
};

const KIND_VALUES = Object.keys(KIND_LABELS) as ClassKind[];

/** Narrow the untyped string from the Radix Select back to a ClassKind. */
function isClassKind(value: string): value is ClassKind {
  return value in KIND_LABELS;
}

const DAY_OPTIONS: { value: number; th: string; en: string }[] = [
  { value: 0, th: 'อาทิตย์', en: 'Sunday' },
  { value: 1, th: 'จันทร์', en: 'Monday' },
  { value: 2, th: 'อังคาร', en: 'Tuesday' },
  { value: 3, th: 'พุธ', en: 'Wednesday' },
  { value: 4, th: 'พฤหัสบดี', en: 'Thursday' },
  { value: 5, th: 'ศุกร์', en: 'Friday' },
  { value: 6, th: 'เสาร์', en: 'Saturday' },
];

/** Trim a Postgres `time` string ("HH:MM:SS") down to "HH:MM" for the input. */
function toTimeInput(value: string): string {
  return value.slice(0, 5);
}

export function ClassOfferingDialog({ locale, offering, children }: ClassOfferingDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [kind, setKind] = useState<ClassKind>(offering?.kind ?? 'english');
  const [dayOfWeek, setDayOfWeek] = useState<number>(offering?.dayOfWeek ?? 6);
  const [active, setActive] = useState(offering?.active ?? true);
  const tr = (th: string, en: string): string => pick(th, en, locale);

  const isEdit = offering != null;

  function reset() {
    setKind(offering?.kind ?? 'english');
    setDayOfWeek(offering?.dayOfWeek ?? 6);
    setActive(offering?.active ?? true);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const payload: ClassOfferingInput = {
      slug: String(data.get('slug') ?? ''),
      kind,
      nameTh: String(data.get('nameTh') ?? ''),
      nameEn: String(data.get('nameEn') ?? ''),
      descriptionTh: String(data.get('descriptionTh') ?? ''),
      descriptionEn: String(data.get('descriptionEn') ?? ''),
      level: String(data.get('level') ?? ''),
      dayOfWeek,
      startTime: String(data.get('startTime') ?? ''),
      endTime: String(data.get('endTime') ?? ''),
      capacity: String(data.get('capacity') ?? ''),
      active,
      sortOrder: Number(data.get('sortOrder') ?? 0),
    };

    startTransition(async () => {
      const result = isEdit
        ? await updateClassOffering({ id: offering.id, ...payload })
        : await createClassOffering(payload);

      if (result.ok) {
        toast.success(
          isEdit
            ? tr('บันทึกการแก้ไขแล้ว', 'Changes saved')
            : tr('เพิ่มคลาสแล้ว', 'Class added'),
        );
        setOpen(false);
        if (!isEdit) form.reset();
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) reset();
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? tr('แก้ไขคลาส', 'Edit class') : tr('เพิ่มคลาสใหม่', 'New class')}
          </DialogTitle>
          <DialogDescription>
            {tr('ทุกคลาสเรียนฟรี', 'Every class is free.')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="slug">{tr('slug', 'Slug')}</Label>
              <Input
                id="slug"
                name="slug"
                required
                defaultValue={offering?.slug ?? ''}
                placeholder="english-p1"
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="kind">{tr('ประเภท', 'Kind')}</Label>
              <Select
                value={kind}
                onValueChange={(v) => {
                  if (isClassKind(v)) setKind(v);
                }}
              >
                <SelectTrigger id="kind">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KIND_VALUES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {pick(KIND_LABELS[value].th, KIND_LABELS[value].en, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nameTh">{tr('ชื่อ (ไทย)', 'Name (Thai)')}</Label>
              <Input id="nameTh" name="nameTh" required defaultValue={offering?.nameTh ?? ''} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="nameEn">{tr('ชื่อ (อังกฤษ)', 'Name (English)')}</Label>
              <Input id="nameEn" name="nameEn" required defaultValue={offering?.nameEn ?? ''} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="descriptionTh">{tr('คำอธิบาย (ไทย)', 'Description (Thai)')}</Label>
              <Textarea
                id="descriptionTh"
                name="descriptionTh"
                rows={3}
                defaultValue={offering?.descriptionTh ?? ''}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="descriptionEn">
                {tr('คำอธิบาย (อังกฤษ)', 'Description (English)')}
              </Label>
              <Textarea
                id="descriptionEn"
                name="descriptionEn"
                rows={3}
                defaultValue={offering?.descriptionEn ?? ''}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="level">{tr('ระดับ (ไม่บังคับ)', 'Level (optional)')}</Label>
              <Input
                id="level"
                name="level"
                defaultValue={offering?.level ?? ''}
                placeholder="P1-P6"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dayOfWeek">{tr('วัน', 'Day')}</Label>
              <Select
                value={String(dayOfWeek)}
                onValueChange={(v) => setDayOfWeek(Number(v))}
              >
                <SelectTrigger id="dayOfWeek">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {pick(opt.th, opt.en, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="startTime">{tr('เวลาเริ่ม', 'Start time')}</Label>
              <Input
                id="startTime"
                name="startTime"
                type="time"
                required
                defaultValue={offering ? toTimeInput(offering.startTime) : '13:00'}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="endTime">{tr('เวลาเลิก', 'End time')}</Label>
              <Input
                id="endTime"
                name="endTime"
                type="time"
                required
                defaultValue={offering ? toTimeInput(offering.endTime) : '15:00'}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="capacity">{tr('จำนวนรับ (ว่าง = ไม่จำกัด)', 'Capacity (blank = unlimited)')}</Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                min={1}
                step={1}
                defaultValue={offering?.capacity ?? ''}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="sortOrder">{tr('ลำดับการแสดง', 'Sort order')}</Label>
              <Input
                id="sortOrder"
                name="sortOrder"
                type="number"
                min={0}
                step={1}
                defaultValue={offering?.sortOrder ?? 0}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={active}
              onChange={(event) => setActive(event.target.checked)}
            />
            {tr('เปิดรับสมัคร', 'Active (open for enrollment)')}
          </label>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => setOpen(false)}
            >
              {tr('ยกเลิก', 'Cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? tr('กำลังบันทึก…', 'Saving…')
                : isEdit
                  ? tr('บันทึก', 'Save')
                  : tr('เพิ่มคลาส', 'Add class')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
