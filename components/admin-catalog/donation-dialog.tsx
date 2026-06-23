'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  createDonation,
  updateDonation,
  type DonationInput,
} from '@/lib/actions/admin-donations';
import { pick, type Locale } from '@/lib/i18n';
import type { Donation, DonationFund, DonationMethod } from '@/lib/db/schema';
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

/** A directory member, minimal shape for the donor Select. */
export type MemberOption = { id: string; name: string };

type DonationDialogProps = {
  locale: Locale;
  /** Members available as the donor (a direct query from the page). */
  members: MemberOption[];
  /** When provided, the dialog edits this donation; otherwise it creates one. */
  donation?: Donation;
  children: React.ReactNode;
};

// Bilingual labels keyed by the DB enums. The `Record<…, …>` annotation is
// exhaustive: adding a value to the schema enum forces a label here (compile
// error otherwise), so the form's options can never drift from the DB enum.
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

const FUND_VALUES = Object.keys(FUND_LABELS) as DonationFund[];
const METHOD_VALUES = Object.keys(METHOD_LABELS) as DonationMethod[];

/** Narrow the untyped Radix Select string back to a DonationFund. */
function isFund(value: string): value is DonationFund {
  return value in FUND_LABELS;
}

/** Narrow the untyped Radix Select string back to a DonationMethod. */
function isMethod(value: string): value is DonationMethod {
  return value in METHOD_LABELS;
}

/** Today as a YYYY-MM-DD value for `<input type="date">` (Asia/Bangkok). */
function today(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());
}

// The donor Select uses this sentinel for "no member" (free-text donor name).
const NO_MEMBER = 'none';

export function DonationDialog({ locale, members, donation, children }: DonationDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [memberId, setMemberId] = useState<string>(donation?.memberId ?? NO_MEMBER);
  const [fund, setFund] = useState<DonationFund>(donation?.fund ?? 'general');
  const [method, setMethod] = useState<DonationMethod>(donation?.method ?? 'cash');
  const tr = (th: string, en: string): string => pick(th, en, locale);

  const isEdit = donation != null;

  function reset() {
    setMemberId(donation?.memberId ?? NO_MEMBER);
    setFund(donation?.fund ?? 'general');
    setMethod(donation?.method ?? 'cash');
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const payload: DonationInput = {
      memberId: memberId === NO_MEMBER ? '' : memberId,
      donorName: String(data.get('donorName') ?? ''),
      fund,
      amountBaht: Number(data.get('amountBaht') ?? 0),
      method,
      receivedAt: String(data.get('receivedAt') ?? ''),
      note: String(data.get('note') ?? ''),
    };

    startTransition(async () => {
      const result = isEdit
        ? await updateDonation({ id: donation.id, ...payload })
        : await createDonation(payload);

      if (result.ok) {
        toast.success(
          isEdit
            ? tr('บันทึกการแก้ไขแล้ว', 'Changes saved')
            : tr('บันทึกการบริจาคแล้ว', 'Donation recorded'),
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
            {isEdit ? tr('แก้ไขการบริจาค', 'Edit donation') : tr('บันทึกการบริจาคใหม่', 'Record a donation')}
          </DialogTitle>
          <DialogDescription>
            {tr(
              'เลือกสมาชิก หรือกรอกชื่อผู้บริจาคโดยตรง จำนวนเงินเป็นบาท',
              'Choose a member, or enter a donor name directly. Amount is in baht.',
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="memberId">{tr('สมาชิก (ไม่บังคับ)', 'Member (optional)')}</Label>
            <Select value={memberId} onValueChange={setMemberId}>
              <SelectTrigger id="memberId" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_MEMBER}>
                  {tr('— ไม่ระบุสมาชิก —', '— No member —')}
                </SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="donorName">{tr('ชื่อผู้บริจาค (ไม่บังคับ)', 'Donor name (optional)')}</Label>
            <Input
              id="donorName"
              name="donorName"
              defaultValue={donation?.donorName ?? ''}
              placeholder={tr('เว้นว่างเพื่อใช้ชื่อสมาชิก', 'Leave blank to use the member name')}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="fund">{tr('กองทุน', 'Fund')}</Label>
              <Select
                value={fund}
                onValueChange={(v) => {
                  if (isFund(v)) setFund(v);
                }}
              >
                <SelectTrigger id="fund" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FUND_VALUES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {pick(FUND_LABELS[value].th, FUND_LABELS[value].en, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="method">{tr('ช่องทาง', 'Method')}</Label>
              <Select
                value={method}
                onValueChange={(v) => {
                  if (isMethod(v)) setMethod(v);
                }}
              >
                <SelectTrigger id="method" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METHOD_VALUES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {pick(METHOD_LABELS[value].th, METHOD_LABELS[value].en, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="amountBaht">{tr('จำนวนเงิน (บาท)', 'Amount (baht)')}</Label>
              <Input
                id="amountBaht"
                name="amountBaht"
                type="number"
                required
                min={0.01}
                step={0.01}
                inputMode="decimal"
                defaultValue={donation ? (donation.amount / 100).toFixed(2) : ''}
                placeholder="500.00"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="receivedAt">{tr('วันที่รับ', 'Received on')}</Label>
              <Input
                id="receivedAt"
                name="receivedAt"
                type="date"
                required
                defaultValue={donation?.receivedAt ?? today()}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="note">{tr('หมายเหตุ (ไม่บังคับ)', 'Note (optional)')}</Label>
            <Textarea id="note" name="note" rows={2} defaultValue={donation?.note ?? ''} />
          </div>

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
                  : tr('บันทึกการบริจาค', 'Record donation')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
