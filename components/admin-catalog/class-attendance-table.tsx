'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { removeAttendance, type AttendanceRow } from '@/lib/actions/admin-class-attendance';
import { pick, type Locale } from '@/lib/i18n';
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

type ClassAttendanceTableProps = {
  locale: Locale;
  /** The present-member rows for the selected class + date, ordered by name. */
  rows: AttendanceRow[];
};

/** Format the marked-at timestamp as a Bangkok wall-clock time. */
function formatTime(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'th-TH', {
    timeZone: 'Asia/Bangkok',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export function ClassAttendanceTable({ locale, rows }: ClassAttendanceTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const tr = (th: string, en: string): string => pick(th, en, locale);

  function remove(row: AttendanceRow, onDone: () => void) {
    setBusyId(row.id);
    startTransition(async () => {
      const result = await removeAttendance({ id: row.id });
      onDone();
      setBusyId(null);
      if (result.ok) {
        toast.success(tr('นำออกแล้ว', 'Removed'));
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
        {tr('ยังไม่มีผู้เข้าร่วม กดเพิ่มผู้เข้าร่วมเพื่อเริ่มต้น', 'No one marked present yet. Add a member to get started.')}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{tr('ชื่อ', 'Name')}</TableHead>
            <TableHead>{tr('หมายเหตุ', 'Note')}</TableHead>
            <TableHead className="whitespace-nowrap">{tr('เวลาที่บันทึก', 'Marked at')}</TableHead>
            <TableHead className="text-right">{tr('จัดการ', 'Actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const busy = isPending && busyId === row.id;
            return (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.memberName}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{row.note ?? '—'}</TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {formatTime(row.createdAt, locale)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <DeleteButton
                      locale={locale}
                      name={row.memberName}
                      disabled={busy}
                      onConfirm={(close) => remove(row, close)}
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
          aria-label={tr('นำออก', 'Remove')}
        >
          <Trash2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{tr('นำผู้เข้าร่วมนี้ออก?', 'Remove this attendee?')}</DialogTitle>
          <DialogDescription>
            {tr(
              `จะนำ "${name}" ออกจากรายการเข้าร่วมในวันนี้`,
              `This removes "${name}" from today's register.`,
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
            {disabled ? tr('กำลังนำออก…', 'Removing…') : tr('นำออก', 'Remove')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
