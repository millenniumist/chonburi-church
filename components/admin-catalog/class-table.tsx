'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Pencil, Trash2, Users } from 'lucide-react';
import { deleteClassOffering } from '@/lib/actions/admin-catalog';
import { pick, type Locale } from '@/lib/i18n';
import { formatTime } from '@/lib/datetime';
import type { ClassOffering, EnrollmentStatus } from '@/lib/db/schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ClassOfferingDialog } from '@/components/admin-catalog/class-offering-dialog';

/** One enrollment row, flattened for display (user.name or guestName). */
export type RosterEntry = {
  id: string;
  name: string;
  phone: string | null;
  status: EnrollmentStatus;
  createdAt: Date;
};

/** A class offering paired with its enrollment roster + counts. */
export type ClassWithRoster = {
  offering: ClassOffering;
  roster: RosterEntry[];
  enrolledCount: number;
};

const WEEKDAY_LABEL: Record<number, { th: string; en: string }> = {
  0: { th: 'อาทิตย์', en: 'Sun' },
  1: { th: 'จันทร์', en: 'Mon' },
  2: { th: 'อังคาร', en: 'Tue' },
  3: { th: 'พุธ', en: 'Wed' },
  4: { th: 'พฤหัสบดี', en: 'Thu' },
  5: { th: 'ศุกร์', en: 'Fri' },
  6: { th: 'เสาร์', en: 'Sat' },
};

type ClassTableProps = {
  locale: Locale;
  classes: ClassWithRoster[];
};

export function ClassTable({ locale, classes }: ClassTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const tr = (th: string, en: string): string => pick(th, en, locale);

  function remove(offering: ClassOffering, onDone: () => void) {
    setBusyId(offering.id);
    startTransition(async () => {
      const result = await deleteClassOffering({ id: offering.id });
      setBusyId(null);
      onDone();
      if (result.ok) {
        toast.success(tr('ลบคลาสแล้ว', 'Class deleted'));
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  if (classes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
        {tr('ยังไม่มีคลาส กดเพิ่มคลาสใหม่เพื่อเริ่มต้น', 'No classes yet. Add one to get started.')}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{tr('คลาส', 'Class')}</TableHead>
            <TableHead>{tr('เวลา', 'Schedule')}</TableHead>
            <TableHead className="text-center">{tr('ลงทะเบียน', 'Enrolled')}</TableHead>
            <TableHead className="text-center">{tr('สถานะ', 'Status')}</TableHead>
            <TableHead className="text-right">{tr('จัดการ', 'Actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {classes.map(({ offering, roster, enrolledCount }) => {
            const day = WEEKDAY_LABEL[offering.dayOfWeek];
            const dayLabel = day ? pick(day.th, day.en, locale) : '';
            const capacityLabel =
              offering.capacity == null
                ? `${enrolledCount} / ∞`
                : `${enrolledCount} / ${offering.capacity}`;
            const full = offering.capacity != null && enrolledCount >= offering.capacity;

            return (
              <TableRow key={offering.id}>
                <TableCell>
                  <div className="font-medium">{pick(offering.nameTh, offering.nameEn, locale)}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono">{offering.slug}</span>
                    {offering.level ? <span>• {offering.level}</span> : null}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {dayLabel} {formatTime(offering.startTime)}–{formatTime(offering.endTime)}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={full ? 'secondary' : 'default'} className="tabular-nums">
                    {capacityLabel}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={offering.active ? 'default' : 'secondary'}>
                    {offering.active ? tr('เปิด', 'Active') : tr('ปิด', 'Inactive')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <RosterSheet
                      locale={locale}
                      offering={offering}
                      roster={roster}
                      enrolledCount={enrolledCount}
                    />

                    <ClassOfferingDialog locale={locale} offering={offering}>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label={tr('แก้ไข', 'Edit')}
                      >
                        <Pencil className="size-4" />
                      </Button>
                    </ClassOfferingDialog>

                    <DeleteButton
                      locale={locale}
                      name={pick(offering.nameTh, offering.nameEn, locale)}
                      disabled={isPending && busyId === offering.id}
                      onConfirm={(close) => remove(offering, close)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

const STATUS_LABEL: Record<EnrollmentStatus, { th: string; en: string }> = {
  enrolled: { th: 'ลงทะเบียน', en: 'Enrolled' },
  waitlisted: { th: 'รอคิว', en: 'Waitlisted' },
  cancelled: { th: 'ยกเลิก', en: 'Cancelled' },
};

const STATUS_VARIANT: Record<EnrollmentStatus, 'default' | 'secondary' | 'outline'> = {
  enrolled: 'default',
  waitlisted: 'secondary',
  cancelled: 'outline',
};

type RosterSheetProps = {
  locale: Locale;
  offering: ClassOffering;
  roster: RosterEntry[];
  enrolledCount: number;
};

function RosterSheet({ locale, offering, roster, enrolledCount }: RosterSheetProps) {
  const tr = (th: string, en: string): string => pick(th, en, locale);
  const name = pick(offering.nameTh, offering.nameEn, locale);
  const capacityLabel =
    offering.capacity == null ? `${enrolledCount}` : `${enrolledCount} / ${offering.capacity}`;

  const dateFmt = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'th-TH', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Bangkok',
  });

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" size="icon" variant="ghost" aria-label={tr('รายชื่อ', 'Roster')}>
          <Users className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{tr('รายชื่อผู้ลงทะเบียน', 'Enrollment roster')}</SheetTitle>
          <SheetDescription>
            {name} • {tr('ลงทะเบียนแล้ว', 'Enrolled')} {capacityLabel}
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6">
          {roster.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {tr('ยังไม่มีผู้ลงทะเบียน', 'No one has enrolled yet.')}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tr('ชื่อ', 'Name')}</TableHead>
                  <TableHead>{tr('เบอร์โทร', 'Phone')}</TableHead>
                  <TableHead>{tr('สถานะ', 'Status')}</TableHead>
                  <TableHead>{tr('เมื่อ', 'When')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roster.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.name}</TableCell>
                    <TableCell className="text-muted-foreground">{entry.phone ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[entry.status]}>
                        {pick(
                          STATUS_LABEL[entry.status].th,
                          STATUS_LABEL[entry.status].en,
                          locale,
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {dateFmt.format(entry.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

type DeleteButtonProps = {
  locale: Locale;
  name: string;
  disabled: boolean;
  onConfirm: (close: () => void) => void;
};

function DeleteButton({ locale, name, disabled, onConfirm }: DeleteButtonProps) {
  const [open, setOpen] = useState(false);
  const tr = (th: string, en: string): string => pick(th, en, locale);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          aria-label={tr('ลบ', 'Delete')}
        >
          <Trash2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{tr('ลบคลาสนี้?', 'Delete this class?')}</DialogTitle>
          <DialogDescription>
            {tr(
              `จะลบ "${name}" และรายชื่อผู้ลงทะเบียนทั้งหมดอย่างถาวร ย้อนกลับไม่ได้`,
              `This permanently removes "${name}" and all of its enrollments. This cannot be undone.`,
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={disabled}>
              {tr('ยกเลิก', 'Cancel')}
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            disabled={disabled}
            onClick={() => onConfirm(() => setOpen(false))}
          >
            {disabled ? tr('กำลังลบ…', 'Deleting…') : tr('ลบ', 'Delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
