'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { FileText, Pencil, Trash2 } from 'lucide-react';
import { deleteDonation, type DonationWithMember } from '@/lib/actions/admin-donations';
import { formatBaht } from '@/lib/donations/format';
import { pick, type Locale } from '@/lib/i18n';
import type { DonationFund, DonationMethod } from '@/lib/db/schema';
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
import { DonationDialog, type MemberOption } from '@/components/admin-catalog/donation-dialog';

const FUND_LABELS: Record<DonationFund, { th: string; en: string }> = {
  general: { th: 'ทั่วไป', en: 'General' },
  tithe: { th: 'สิบลด', en: 'Tithe' },
  missions: { th: 'พันธกิจ', en: 'Missions' },
  building: { th: 'อาคาร', en: 'Building' },
  other: { th: 'อื่น ๆ', en: 'Other' },
};

const METHOD_LABELS: Record<DonationMethod, { th: string; en: string }> = {
  cash: { th: 'เงินสด', en: 'Cash' },
  transfer: { th: 'โอนเงิน', en: 'Transfer' },
  promptpay: { th: 'พร้อมเพย์', en: 'PromptPay' },
  other: { th: 'อื่น ๆ', en: 'Other' },
};

type DonationTableProps = {
  locale: Locale;
  /** Donations (admin view), newest first, joined with member name. */
  items: DonationWithMember[];
  /** Members available as the donor in the edit dialog. */
  members: MemberOption[];
};

/** A donation's displayed donor: the member name, else the snapshot donorName. */
function donorLabel(item: DonationWithMember, locale: Locale): string {
  return item.member?.name ?? item.donorName ?? pick('ไม่ระบุ', 'Unknown', locale);
}

/** Format a YYYY-MM-DD gift date for display. */
function formatDate(value: string, locale: Locale): string {
  // Interpret the calendar date as Bangkok wall-clock noon to avoid TZ drift.
  const date = new Date(`${value}T12:00:00+07:00`);
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'th-TH', {
    timeZone: 'Asia/Bangkok',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/** The calendar year of a YYYY-MM-DD gift date. */
function yearOf(value: string): number {
  return Number(value.slice(0, 4));
}

export function DonationTable({ locale, items, members }: DonationTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const tr = (th: string, en: string): string => pick(th, en, locale);

  function remove(item: DonationWithMember, onDone: () => void) {
    setBusyId(item.id);
    startTransition(async () => {
      const result = await deleteDonation({ id: item.id });
      onDone();
      setBusyId(null);
      if (result.ok) {
        toast.success(tr('ลบการบริจาคแล้ว', 'Donation deleted'));
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
        {tr('ยังไม่มีรายการบริจาคในปีนี้', 'No donations recorded for this year.')}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{tr('วันที่', 'Date')}</TableHead>
            <TableHead>{tr('ผู้บริจาค', 'Donor')}</TableHead>
            <TableHead>{tr('กองทุน', 'Fund')}</TableHead>
            <TableHead>{tr('ช่องทาง', 'Method')}</TableHead>
            <TableHead className="text-right">{tr('จำนวนเงิน', 'Amount')}</TableHead>
            <TableHead className="text-right">{tr('จัดการ', 'Actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const busy = isPending && busyId === item.id;
            return (
              <TableRow key={item.id}>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {formatDate(item.receivedAt, locale)}
                </TableCell>
                <TableCell className="font-medium">{donorLabel(item, locale)}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {pick(FUND_LABELS[item.fund].th, FUND_LABELS[item.fund].en, locale)}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {pick(METHOD_LABELS[item.method].th, METHOD_LABELS[item.method].en, locale)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-right font-medium tabular-nums">
                  {formatBaht(item.amount)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    {item.memberId != null ? (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        asChild
                        aria-label={tr('ใบรับรองการถวาย', 'Giving statement')}
                      >
                        <Link
                          href={`/admin/donations/statement/${item.memberId}?year=${yearOf(item.receivedAt)}`}
                        >
                          <FileText className="size-4" />
                        </Link>
                      </Button>
                    ) : null}

                    <DonationDialog locale={locale} members={members} donation={item}>
                      <Button type="button" size="icon" variant="ghost" aria-label={tr('แก้ไข', 'Edit')}>
                        <Pencil className="size-4" />
                      </Button>
                    </DonationDialog>

                    <DeleteButton
                      locale={locale}
                      name={donorLabel(item, locale)}
                      disabled={busy}
                      onConfirm={(close) => remove(item, close)}
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
          aria-label={tr('ลบ', 'Delete')}
        >
          <Trash2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{tr('ลบการบริจาคนี้?', 'Delete this donation?')}</DialogTitle>
          <DialogDescription>
            {tr(
              `จะลบการบริจาคของ "${name}" ออกอย่างถาวร การกระทำนี้ย้อนกลับไม่ได้`,
              `This permanently removes the donation from "${name}". This cannot be undone.`,
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
