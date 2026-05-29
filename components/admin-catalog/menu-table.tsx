'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Pencil, Trash2 } from 'lucide-react';
import {
  deleteMenuItem,
  toggleMenuItemAvailable,
} from '@/lib/actions/admin-catalog';
import { pick, type Locale } from '@/lib/i18n';
import type { MenuItem } from '@/lib/db/schema';
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
import { MenuItemDialog } from '@/components/admin-catalog/menu-item-dialog';

type MenuTableProps = {
  locale: Locale;
  items: MenuItem[];
};

export function MenuTable({ locale, items }: MenuTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const tr = (th: string, en: string): string => pick(th, en, locale);

  function toggle(item: MenuItem) {
    setBusyId(item.id);
    startTransition(async () => {
      const result = await toggleMenuItemAvailable({ id: item.id, available: !item.available });
      setBusyId(null);
      if (result.ok) {
        toast.success(
          result.data.available
            ? tr('เปิดจำหน่ายแล้ว', 'Now available')
            : tr('ปิดจำหน่ายแล้ว', 'Marked unavailable'),
        );
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function remove(item: MenuItem, onDone: () => void) {
    setBusyId(item.id);
    startTransition(async () => {
      const result = await deleteMenuItem({ id: item.id });
      setBusyId(null);
      onDone();
      if (result.ok) {
        toast.success(tr('ลบเมนูแล้ว', 'Menu item deleted'));
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
        {tr('ยังไม่มีเมนู กดเพิ่มเมนูใหม่เพื่อเริ่มต้น', 'No menu items yet. Add one to get started.')}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{tr('ชื่อ', 'Name')}</TableHead>
            <TableHead>{tr('slug', 'Slug')}</TableHead>
            <TableHead>{tr('หมวดหมู่', 'Category')}</TableHead>
            <TableHead className="text-center">{tr('ลำดับ', 'Order')}</TableHead>
            <TableHead className="text-center">{tr('สถานะ', 'Status')}</TableHead>
            <TableHead className="text-right">{tr('จัดการ', 'Actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div className="font-medium">{pick(item.nameTh, item.nameEn, locale)}</div>
                <div className="text-xs text-muted-foreground">
                  {pick(item.nameEn, item.nameTh, locale === 'en' ? 'th' : 'en')}
                </div>
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">{item.slug}</TableCell>
              <TableCell>{item.category}</TableCell>
              <TableCell className="text-center tabular-nums">{item.sortOrder}</TableCell>
              <TableCell className="text-center">
                <Badge variant={item.available ? 'default' : 'secondary'}>
                  {item.available ? tr('พร้อมจำหน่าย', 'Available') : tr('ปิด', 'Hidden')}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isPending && busyId === item.id}
                    onClick={() => toggle(item)}
                  >
                    {item.available ? tr('ซ่อน', 'Hide') : tr('แสดง', 'Show')}
                  </Button>

                  <MenuItemDialog locale={locale} item={item}>
                    <Button type="button" size="icon" variant="ghost" aria-label={tr('แก้ไข', 'Edit')}>
                      <Pencil className="size-4" />
                    </Button>
                  </MenuItemDialog>

                  <DeleteButton
                    locale={locale}
                    name={pick(item.nameTh, item.nameEn, locale)}
                    disabled={isPending && busyId === item.id}
                    onConfirm={(close) => remove(item, close)}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
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
          <DialogTitle>{tr('ลบเมนูนี้?', 'Delete this item?')}</DialogTitle>
          <DialogDescription>
            {tr(
              `จะลบ "${name}" ออกอย่างถาวร การกระทำนี้ย้อนกลับไม่ได้`,
              `This permanently removes "${name}". This cannot be undone.`,
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
