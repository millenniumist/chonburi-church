'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Pencil, Trash2 } from 'lucide-react';
import { deleteMember, type MemberWithFamily } from '@/lib/actions/admin-members';
import { pick, type Locale } from '@/lib/i18n';
import type { Family, MemberStatus } from '@/lib/db/schema';
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
import { MemberDialog, STATUS_LABELS } from '@/components/admin-catalog/member-dialog';

type MemberTableProps = {
  locale: Locale;
  /** All members joined with their family name, ordered by name. */
  members: MemberWithFamily[];
  /** Families to populate the edit dialog's family Select. */
  families: Family[];
};

const STATUS_VARIANTS: Record<MemberStatus, 'default' | 'secondary' | 'outline'> = {
  member: 'default',
  regular: 'secondary',
  visitor: 'outline',
  inactive: 'secondary',
};

export function MemberTable({ locale, members, families }: MemberTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const tr = (th: string, en: string): string => pick(th, en, locale);

  function remove(member: MemberWithFamily, onDone: () => void) {
    setBusyId(member.id);
    startTransition(async () => {
      const result = await deleteMember({ id: member.id });
      onDone();
      setBusyId(null);
      if (result.ok) {
        toast.success(tr('ลบสมาชิกแล้ว', 'Member deleted'));
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  if (members.length === 0) {
    return (
      <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
        {tr('ยังไม่มีสมาชิก กดเพิ่มสมาชิกใหม่เพื่อเริ่มต้น', 'No members yet. Add one to get started.')}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{tr('ชื่อ', 'Name')}</TableHead>
            <TableHead className="text-center">{tr('สถานะ', 'Status')}</TableHead>
            <TableHead>{tr('ครอบครัว', 'Family')}</TableHead>
            <TableHead>{tr('โทรศัพท์', 'Phone')}</TableHead>
            <TableHead>{tr('อีเมล', 'Email')}</TableHead>
            <TableHead className="text-right">{tr('จัดการ', 'Actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => {
            const busy = isPending && busyId === member.id;
            return (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="font-medium">{member.name}</div>
                  {!member.active ? (
                    <div className="text-xs text-muted-foreground">{tr('เก็บถาวรแล้ว', 'Archived')}</div>
                  ) : null}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={STATUS_VARIANTS[member.status]}>
                    {pick(STATUS_LABELS[member.status].th, STATUS_LABELS[member.status].en, locale)}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {member.familyName ?? '—'}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {member.phone ?? '—'}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {member.email ?? '—'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <MemberDialog locale={locale} families={families} member={member}>
                      <Button type="button" size="icon" variant="ghost" aria-label={tr('แก้ไข', 'Edit')}>
                        <Pencil className="size-4" />
                      </Button>
                    </MemberDialog>

                    <DeleteButton
                      locale={locale}
                      name={member.name}
                      disabled={busy}
                      onConfirm={(close) => remove(member, close)}
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
          <DialogTitle>{tr('ลบสมาชิกนี้?', 'Delete this member?')}</DialogTitle>
          <DialogDescription>
            {tr(
              `จะลบ "${name}" ออกอย่างถาวร หากต้องการเก็บประวัติไว้ ให้ปิดการใช้งานแทนการลบ`,
              `This permanently removes "${name}". To keep their history, archive them instead of deleting.`,
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
