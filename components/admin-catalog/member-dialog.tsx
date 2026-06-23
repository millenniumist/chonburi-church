'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  createMember,
  updateMember,
  type MemberInput,
} from '@/lib/actions/admin-members';
import { pick, type Locale } from '@/lib/i18n';
import { memberStatus, type Family, type Member, type MemberStatus } from '@/lib/db/schema';
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

type MemberDialogProps = {
  locale: Locale;
  /** Families to populate the family Select. */
  families: Family[];
  /** When provided, the dialog edits this member; otherwise it creates one. */
  member?: Member;
  /** The trigger element (a button). */
  children: React.ReactNode;
};

// Bilingual labels keyed by MemberStatus. The `Record<MemberStatus, …>`
// annotation is exhaustive: adding a status to the schema enum forces a label
// here (compile error otherwise), so the form can never drift from the DB enum.
export const STATUS_LABELS: Record<MemberStatus, { th: string; en: string }> = {
  member: { th: 'สมาชิก', en: 'Member' },
  regular: { th: 'ผู้มาประจำ', en: 'Regular' },
  visitor: { th: 'ผู้มาเยี่ยม', en: 'Visitor' },
  inactive: { th: 'ไม่ใช้งาน', en: 'Inactive' },
};

const STATUS_VALUES = memberStatus.enumValues;

/** Narrow the untyped string from the Radix Select back to a MemberStatus. */
function isMemberStatus(value: string): value is MemberStatus {
  return value in STATUS_LABELS;
}

/** Sentinel value for the "— none —" family option (Radix needs a non-empty value). */
const NO_FAMILY = '__none__';

export function MemberDialog({ locale, families, member, children }: MemberDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [familyId, setFamilyId] = useState<string>(member?.familyId ?? NO_FAMILY);
  const [status, setStatus] = useState<MemberStatus>(member?.status ?? 'visitor');
  const [active, setActive] = useState(member?.active ?? true);
  const tr = (th: string, en: string): string => pick(th, en, locale);

  const isEdit = member != null;

  function reset() {
    setFamilyId(member?.familyId ?? NO_FAMILY);
    setStatus(member?.status ?? 'visitor');
    setActive(member?.active ?? true);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const payload: MemberInput = {
      name: String(data.get('name') ?? ''),
      familyId: familyId === NO_FAMILY ? '' : familyId,
      email: String(data.get('email') ?? ''),
      phone: String(data.get('phone') ?? ''),
      birthDate: String(data.get('birthDate') ?? ''),
      photoUrl: String(data.get('photoUrl') ?? ''),
      status,
      joinedAt: String(data.get('joinedAt') ?? ''),
      notes: String(data.get('notes') ?? ''),
      active,
    };

    startTransition(async () => {
      const result = isEdit
        ? await updateMember({ id: member.id, ...payload })
        : await createMember(payload);

      if (result.ok) {
        toast.success(
          isEdit
            ? tr('บันทึกการแก้ไขแล้ว', 'Changes saved')
            : tr('เพิ่มสมาชิกแล้ว', 'Member added'),
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
            {isEdit ? tr('แก้ไขสมาชิก', 'Edit member') : tr('เพิ่มสมาชิกใหม่', 'New member')}
          </DialogTitle>
          <DialogDescription>
            {tr(
              'บันทึกข้อมูลผู้คนในไดเรกทอรีของคริสตจักร',
              'Record people in the church directory.',
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">{tr('ชื่อ', 'Name')}</Label>
            <Input id="name" name="name" required defaultValue={member?.name ?? ''} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="familyId">{tr('ครอบครัว (ไม่บังคับ)', 'Family (optional)')}</Label>
              <Select value={familyId} onValueChange={setFamilyId}>
                <SelectTrigger id="familyId">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_FAMILY}>{tr('— ไม่มี —', '— none —')}</SelectItem>
                  {families.map((family) => (
                    <SelectItem key={family.id} value={family.id}>
                      {family.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="status">{tr('สถานะ', 'Status')}</Label>
              <Select
                value={status}
                onValueChange={(v) => {
                  if (isMemberStatus(v)) setStatus(v);
                }}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_VALUES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {pick(STATUS_LABELS[value].th, STATUS_LABELS[value].en, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">{tr('อีเมล (ไม่บังคับ)', 'Email (optional)')}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                defaultValue={member?.email ?? ''}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">{tr('โทรศัพท์ (ไม่บังคับ)', 'Phone (optional)')}</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                defaultValue={member?.phone ?? ''}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="birthDate">{tr('วันเกิด (ไม่บังคับ)', 'Birth date (optional)')}</Label>
              <Input
                id="birthDate"
                name="birthDate"
                type="date"
                defaultValue={member?.birthDate ?? ''}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="joinedAt">{tr('วันที่เข้าร่วม (ไม่บังคับ)', 'Joined date (optional)')}</Label>
              <Input
                id="joinedAt"
                name="joinedAt"
                type="date"
                defaultValue={member?.joinedAt ?? ''}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="photoUrl">{tr('ลิงก์รูปภาพ (ไม่บังคับ)', 'Photo URL (optional)')}</Label>
            <Input
              id="photoUrl"
              name="photoUrl"
              type="url"
              inputMode="url"
              defaultValue={member?.photoUrl ?? ''}
              placeholder="https://…"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">{tr('หมายเหตุ (ไม่บังคับ)', 'Notes (optional)')}</Label>
            <Textarea id="notes" name="notes" rows={3} defaultValue={member?.notes ?? ''} />
          </div>

          {isEdit ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={active}
                onChange={(event) => setActive(event.target.checked)}
              />
              {tr('ใช้งานอยู่ (ไม่ได้เก็บถาวร)', 'Active (not archived)')}
            </label>
          ) : null}

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
                  : tr('เพิ่มสมาชิก', 'Add member')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
