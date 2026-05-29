'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import {
  createService,
  deleteService,
  updateService,
} from '@/lib/actions/admin-core';
import { formatTime } from '@/lib/datetime';
import { pick, type Locale } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
} from '@/components/ui/dialog';

export type AdminService = {
  id: string;
  nameTh: string;
  nameEn: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  active: boolean;
};

type ServicesManagerProps = {
  locale: Locale;
  services: AdminService[];
};

const DAY_LABELS: { th: string; en: string }[] = [
  { th: 'อาทิตย์', en: 'Sunday' },
  { th: 'จันทร์', en: 'Monday' },
  { th: 'อังคาร', en: 'Tuesday' },
  { th: 'พุธ', en: 'Wednesday' },
  { th: 'พฤหัสบดี', en: 'Thursday' },
  { th: 'ศุกร์', en: 'Friday' },
  { th: 'เสาร์', en: 'Saturday' },
];

function dayLabel(day: number, locale: Locale): string {
  const entry = DAY_LABELS[day];
  if (!entry) return String(day);
  return pick(entry.th, entry.en, locale);
}

type Editing = AdminService | 'new' | null;

export function ServicesManager({ locale, services }: ServicesManagerProps) {
  const [editing, setEditing] = useState<Editing>(null);
  const tr = (th: string, en: string): string => pick(th, en, locale);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setEditing('new')}>
          <Plus />
          {tr('เพิ่มรอบนมัสการ', 'New service')}
        </Button>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tr('ชื่อรอบ', 'Service')}</TableHead>
              <TableHead>{tr('วัน', 'Day')}</TableHead>
              <TableHead>{tr('เวลา', 'Time')}</TableHead>
              <TableHead>{tr('สถานะ', 'Status')}</TableHead>
              <TableHead className="text-right">{tr('จัดการ', 'Actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  {tr('ยังไม่มีรอบนมัสการ', 'No service windows yet.')}
                </TableCell>
              </TableRow>
            ) : (
              services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">
                    {pick(service.nameTh, service.nameEn, locale)}
                  </TableCell>
                  <TableCell>{dayLabel(service.dayOfWeek, locale)}</TableCell>
                  <TableCell className="tabular-nums">
                    {formatTime(service.startTime)}–{formatTime(service.endTime)}
                  </TableCell>
                  <TableCell>
                    {service.active ? (
                      <Badge variant="secondary">{tr('เปิดใช้งาน', 'Active')}</Badge>
                    ) : (
                      <Badge variant="outline">{tr('ปิด', 'Inactive')}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={tr('แก้ไข', 'Edit')}
                        onClick={() => setEditing(service)}
                      >
                        <Pencil />
                      </Button>
                      <DeleteServiceButton id={service.id} locale={locale} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Key by the target so local Select/checkbox state re-seeds per row. */}
      <ServiceDialog
        key={editing === 'new' ? 'new' : (editing?.id ?? 'closed')}
        locale={locale}
        editing={editing}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}

// ── Create / edit dialog ───────────────────────────────────────────────────────

function ServiceDialog({
  locale,
  editing,
  onClose,
}: {
  locale: Locale;
  editing: Editing;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const tr = (th: string, en: string): string => pick(th, en, locale);

  const open = editing !== null;
  const current = editing === 'new' ? null : editing;

  // Local state for the day + active controls (Select/checkbox aren't form-native).
  // The parent keys this component by the target row, so these initializers
  // re-run (re-seed) whenever a different row is opened.
  const [day, setDay] = useState<number>(current?.dayOfWeek ?? 0);
  const [active, setActive] = useState<boolean>(current?.active ?? true);

  function onSubmit(formData: FormData) {
    const payload = {
      nameTh: formData.get('nameTh'),
      nameEn: formData.get('nameEn'),
      dayOfWeek: day,
      startTime: formData.get('startTime'),
      endTime: formData.get('endTime'),
      active,
    };

    startTransition(async () => {
      const result = current
        ? await updateService({ ...payload, id: current.id })
        : await createService(payload);

      if (result.ok) {
        toast.success(
          current
            ? tr('บันทึกรอบนมัสการแล้ว', 'Service updated.')
            : tr('เพิ่มรอบนมัสการแล้ว', 'Service created.'),
        );
        onClose();
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
        if (!next) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {current ? tr('แก้ไขรอบนมัสการ', 'Edit service') : tr('เพิ่มรอบนมัสการ', 'New service')}
          </DialogTitle>
          <DialogDescription>
            {tr(
              'รอบนมัสการกำหนดช่วงเวลาที่การเช็คอินจะนับเป็นการเข้าร่วม',
              'Service windows define when a check-in counts as attendance.',
            )}
          </DialogDescription>
        </DialogHeader>

        <form action={onSubmit} className="space-y-4">
          <fieldset className="space-y-4" disabled={isPending}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nameTh">{tr('ชื่อ (ไทย)', 'Name (Thai)')}</Label>
                <Input
                  id="nameTh"
                  name="nameTh"
                  required
                  maxLength={120}
                  defaultValue={current?.nameTh ?? ''}
                  placeholder={tr('นมัสการเช้าวันอาทิตย์', 'Sunday morning service')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameEn">{tr('ชื่อ (อังกฤษ)', 'Name (English)')}</Label>
                <Input
                  id="nameEn"
                  name="nameEn"
                  required
                  maxLength={120}
                  defaultValue={current?.nameEn ?? ''}
                  placeholder="Sunday morning service"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="dayOfWeek">{tr('วัน', 'Day')}</Label>
                <Select value={String(day)} onValueChange={(v) => setDay(Number(v))}>
                  <SelectTrigger id="dayOfWeek" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAY_LABELS.map((label, index) => (
                      <SelectItem key={index} value={String(index)}>
                        {pick(label.th, label.en, locale)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime">{tr('เวลาเริ่ม', 'Start')}</Label>
                <Input
                  id="startTime"
                  name="startTime"
                  type="time"
                  required
                  defaultValue={current ? formatTime(current.startTime) : '10:00'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">{tr('เวลาสิ้นสุด', 'End')}</Label>
                <Input
                  id="endTime"
                  name="endTime"
                  type="time"
                  required
                  defaultValue={current ? formatTime(current.endTime) : '12:00'}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 rounded border-input accent-primary"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              {tr('เปิดใช้งานรอบนี้ (นับการเช็คอิน)', 'Active (counts check-ins)')}
            </label>
          </fieldset>

          <DialogFooter>
            <Button type="button" variant="outline" disabled={isPending} onClick={onClose}>
              {tr('ยกเลิก', 'Cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? tr('กำลังบันทึก…', 'Saving…') : tr('บันทึก', 'Save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Delete (with confirm) ──────────────────────────────────────────────────────

function DeleteServiceButton({ id, locale }: { id: string; locale: Locale }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const tr = (th: string, en: string): string => pick(th, en, locale);

  function onConfirm() {
    startTransition(async () => {
      const result = await deleteService({ id });
      if (result.ok) {
        toast.success(tr('ลบรอบนมัสการแล้ว', 'Service deleted.'));
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={tr('ลบ', 'Delete')}
        className="text-destructive hover:text-destructive"
        onClick={() => setOpen(true)}
      >
        <Trash2 />
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tr('ลบรอบนมัสการ?', 'Delete this service?')}</DialogTitle>
          <DialogDescription>
            {tr(
              'การลบไม่สามารถย้อนกลับได้ การเช็คอินที่บันทึกไว้แล้วจะยังคงอยู่',
              'This cannot be undone. Existing attendance records are kept.',
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={isPending} onClick={() => setOpen(false)}>
            {tr('ยกเลิก', 'Cancel')}
          </Button>
          <Button type="button" variant="destructive" disabled={isPending} onClick={onConfirm}>
            {isPending ? tr('กำลังลบ…', 'Deleting…') : tr('ลบ', 'Delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
