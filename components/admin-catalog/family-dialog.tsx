'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  createFamily,
  updateFamily,
  type FamilyInput,
} from '@/lib/actions/admin-members';
import { pick, type Locale } from '@/lib/i18n';
import type { Family } from '@/lib/db/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type FamilyDialogProps = {
  locale: Locale;
  /** When provided, the dialog edits this family; otherwise it creates one. */
  family?: Family;
  /** The trigger element (a button). */
  children: React.ReactNode;
};

export function FamilyDialog({ locale, family, children }: FamilyDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const tr = (th: string, en: string): string => pick(th, en, locale);

  const isEdit = family != null;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const payload: FamilyInput = {
      name: String(data.get('name') ?? ''),
      address: String(data.get('address') ?? ''),
      phone: String(data.get('phone') ?? ''),
      notes: String(data.get('notes') ?? ''),
    };

    startTransition(async () => {
      const result = isEdit
        ? await updateFamily({ id: family.id, ...payload })
        : await createFamily(payload);

      if (result.ok) {
        toast.success(
          isEdit
            ? tr('บันทึกการแก้ไขแล้ว', 'Changes saved')
            : tr('เพิ่มครอบครัวแล้ว', 'Family added'),
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? tr('แก้ไขครอบครัว', 'Edit family') : tr('เพิ่มครอบครัวใหม่', 'New family')}
          </DialogTitle>
          <DialogDescription>
            {tr(
              'รวมสมาชิกที่อยู่บ้านเดียวกันเข้าเป็นครอบครัวเดียว',
              'Group members who share a household into one family.',
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">{tr('ชื่อครอบครัว', 'Family name')}</Label>
            <Input id="name" name="name" required defaultValue={family?.name ?? ''} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="address">{tr('ที่อยู่ (ไม่บังคับ)', 'Address (optional)')}</Label>
            <Textarea id="address" name="address" rows={2} defaultValue={family?.address ?? ''} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">{tr('โทรศัพท์ (ไม่บังคับ)', 'Phone (optional)')}</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              defaultValue={family?.phone ?? ''}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">{tr('หมายเหตุ (ไม่บังคับ)', 'Notes (optional)')}</Label>
            <Textarea id="notes" name="notes" rows={3} defaultValue={family?.notes ?? ''} />
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
                  : tr('เพิ่มครอบครัว', 'Add family')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
