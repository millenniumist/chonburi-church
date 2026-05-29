'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  createMenuItem,
  updateMenuItem,
  type MenuItemInput,
} from '@/lib/actions/admin-catalog';
import { pick, type Locale } from '@/lib/i18n';
import type { MenuItem } from '@/lib/db/schema';
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

type MenuItemDialogProps = {
  locale: Locale;
  /** When provided, the dialog edits this item; otherwise it creates a new one. */
  item?: MenuItem;
  /** The trigger element (a button). */
  children: React.ReactNode;
};

export function MenuItemDialog({ locale, item, children }: MenuItemDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [available, setAvailable] = useState(item?.available ?? true);
  const tr = (th: string, en: string): string => pick(th, en, locale);

  const isEdit = item != null;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const payload: MenuItemInput = {
      slug: String(data.get('slug') ?? ''),
      nameTh: String(data.get('nameTh') ?? ''),
      nameEn: String(data.get('nameEn') ?? ''),
      descriptionTh: String(data.get('descriptionTh') ?? ''),
      descriptionEn: String(data.get('descriptionEn') ?? ''),
      imageUrl: String(data.get('imageUrl') ?? ''),
      category: String(data.get('category') ?? 'coffee'),
      available,
      sortOrder: Number(data.get('sortOrder') ?? 0),
    };

    startTransition(async () => {
      const result = isEdit
        ? await updateMenuItem({ id: item.id, ...payload })
        : await createMenuItem(payload);

      if (result.ok) {
        toast.success(
          isEdit
            ? tr('บันทึกการแก้ไขแล้ว', 'Changes saved')
            : tr('เพิ่มเมนูแล้ว', 'Menu item added'),
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
        if (next) setAvailable(item?.available ?? true);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? tr('แก้ไขเมนู', 'Edit menu item') : tr('เพิ่มเมนูใหม่', 'New menu item')}
          </DialogTitle>
          <DialogDescription>
            {tr('กาแฟฟรีเสมอ — ไม่มีช่องราคา', 'Coffee is always free — there is no price.')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="slug">{tr('slug (ตัวพิมพ์เล็ก-ขีด)', 'Slug (lowercase-hyphen)')}</Label>
            <Input
              id="slug"
              name="slug"
              required
              defaultValue={item?.slug ?? ''}
              placeholder="latte"
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nameTh">{tr('ชื่อ (ไทย)', 'Name (Thai)')}</Label>
              <Input id="nameTh" name="nameTh" required defaultValue={item?.nameTh ?? ''} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="nameEn">{tr('ชื่อ (อังกฤษ)', 'Name (English)')}</Label>
              <Input id="nameEn" name="nameEn" required defaultValue={item?.nameEn ?? ''} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="descriptionTh">{tr('คำอธิบาย (ไทย)', 'Description (Thai)')}</Label>
              <Textarea
                id="descriptionTh"
                name="descriptionTh"
                rows={3}
                defaultValue={item?.descriptionTh ?? ''}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="descriptionEn">
                {tr('คำอธิบาย (อังกฤษ)', 'Description (English)')}
              </Label>
              <Textarea
                id="descriptionEn"
                name="descriptionEn"
                rows={3}
                defaultValue={item?.descriptionEn ?? ''}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="imageUrl">{tr('ลิงก์รูปภาพ (ไม่บังคับ)', 'Image URL (optional)')}</Label>
            <Input
              id="imageUrl"
              name="imageUrl"
              type="url"
              inputMode="url"
              defaultValue={item?.imageUrl ?? ''}
              placeholder="https://…"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="category">{tr('หมวดหมู่', 'Category')}</Label>
              <Input
                id="category"
                name="category"
                defaultValue={item?.category ?? 'coffee'}
                placeholder="coffee"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="sortOrder">{tr('ลำดับการแสดง', 'Sort order')}</Label>
              <Input
                id="sortOrder"
                name="sortOrder"
                type="number"
                min={0}
                step={1}
                defaultValue={item?.sortOrder ?? 0}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={available}
              onChange={(event) => setAvailable(event.target.checked)}
            />
            {tr('พร้อมจำหน่าย', 'Available')}
          </label>

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
                  : tr('เพิ่มเมนู', 'Add item')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
