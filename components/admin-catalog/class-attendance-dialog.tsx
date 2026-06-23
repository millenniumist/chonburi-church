'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { markAttendance, type AttendanceInput } from '@/lib/actions/admin-class-attendance';
import { pick, type Locale } from '@/lib/i18n';
import type { Member } from '@/lib/db/schema';
import { Button } from '@/components/ui/button';
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

type ClassAttendanceDialogProps = {
  locale: Locale;
  /** The selected class offering id (the register is scoped to this). */
  classOfferingId: string;
  /** The selected session date (YYYY-MM-DD). */
  sessionDate: string;
  /** Directory members available to mark present. */
  members: Member[];
  /** The trigger element (a button). */
  children: React.ReactNode;
};

export function ClassAttendanceDialog({
  locale,
  classOfferingId,
  sessionDate,
  members,
  children,
}: ClassAttendanceDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [memberId, setMemberId] = useState<string>('');
  const tr = (th: string, en: string): string => pick(th, en, locale);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    if (!memberId) {
      toast.error(tr('กรุณาเลือกสมาชิก', 'Please select a member.'));
      return;
    }

    const payload: AttendanceInput = {
      classOfferingId,
      memberId,
      sessionDate,
      note: String(data.get('note') ?? ''),
    };

    startTransition(async () => {
      const result = await markAttendance(payload);

      if (result.ok) {
        toast.success(tr('ทำเครื่องหมายแล้ว', 'Marked present'));
        setOpen(false);
        form.reset();
        setMemberId('');
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
        if (next) setMemberId('');
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{tr('เพิ่มผู้เข้าร่วม', 'Add member present')}</DialogTitle>
          <DialogDescription>
            {tr(
              'เลือกสมาชิกที่มาเข้าร่วมในวันที่เลือก',
              'Select a member who attended on the chosen date.',
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="memberId">{tr('สมาชิก', 'Member')}</Label>
            <Select value={memberId || undefined} onValueChange={setMemberId}>
              <SelectTrigger id="memberId" className="w-full">
                <SelectValue placeholder={tr('เลือกสมาชิก', 'Select a member')} />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="note">{tr('หมายเหตุ (ไม่บังคับ)', 'Note (optional)')}</Label>
            <Textarea id="note" name="note" rows={2} />
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
              {isPending ? tr('กำลังบันทึก…', 'Saving…') : tr('เพิ่ม', 'Add')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
