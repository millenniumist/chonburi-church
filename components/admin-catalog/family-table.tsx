'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Pencil, Trash2 } from 'lucide-react';
import { deleteFamily } from '@/lib/actions/admin-members';
import { pick, type Locale } from '@/lib/i18n';
import type { Family } from '@/lib/db/schema';
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
import { FamilyDialog } from '@/components/admin-catalog/family-dialog';

type FamilyTableProps = {
  locale: Locale;
  /** All families, ordered by name. */
  families: Family[];
  /** Member count per familyId (for the "members" column). */
  memberCounts: Record<string, number>;
};

export function FamilyTable({ locale, families, memberCounts }: FamilyTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const tr = (th: string, en: string): string => pick(th, en, locale);

  function remove(family: Family, onDone: () => void) {
    setBusyId(family.id);
    startTransition(async () => {
      const result = await deleteFamily({ id: family.id });
      onDone();
      setBusyId(null);
      if (result.ok) {
        toast.success(tr('ลบครอบครัวแล้ว', 'Family deleted'));
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  if (families.length === 0) {
    return (
      <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
        {tr('ยังไม่มีครอบครัว กดเพิ่มครอบครัวใหม่เพื่อเริ่มต้น', 'No families yet. Add one to get started.')}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{tr('ชื่อครอบครัว', 'Family')}</TableHead>
            <TableHead>{tr('โทรศัพท์', 'Phone')}</TableHead>
            <TableHead className="text-center">{tr('สมาชิก', 'Members')}</TableHead>
            <TableHead className="text-right">{tr('จัดการ', 'Actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {families.map((family) => {
            const busy = isPending && busyId === family.id;
            return (
              <TableRow key={family.id}>
                <TableCell>
                  <div className="font-medium">{family.name}</div>
                  {family.address ? (
                    <div className="text-xs text-muted-foreground">{family.address}</div>
                  ) : null}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {family.phone ?? '—'}
                </TableCell>
                <TableCell className="text-center text-sm text-muted-foreground">
                  {memberCounts[family.id] ?? 0}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <FamilyDialog locale={locale} family={family}>
                      <Button type="button" size="icon" variant="ghost" aria-label={tr('แก้ไข', 'Edit')}>
                        <Pencil className="size-4" />
                      </Button>
                    </FamilyDialog>

                    <DeleteButton
                      locale={locale}
                      name={family.name}
                      disabled={busy}
                      onConfirm={(close) => remove(family, close)}
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
          <DialogTitle>{tr('ลบครอบครัวนี้?', 'Delete this family?')}</DialogTitle>
          <DialogDescription>
            {tr(
              `จะลบ "${name}" ออกอย่างถาวร สมาชิกจะยังอยู่แต่จะไม่ผูกกับครอบครัวนี้`,
              `This permanently removes "${name}". Members are kept but unlinked from this family.`,
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
