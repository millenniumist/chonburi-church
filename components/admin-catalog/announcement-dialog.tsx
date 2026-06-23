'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  createAnnouncement,
  updateAnnouncement,
  type AnnouncementInput,
} from '@/lib/actions/cms-announcements';
import { pick, type Locale } from '@/lib/i18n';
import type { Announcement } from '@/lib/db/schema';
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

type AnnouncementDialogProps = {
  locale: Locale;
  /** When provided, the dialog edits this announcement; otherwise it creates one. */
  item?: Announcement;
  /** The trigger element (a button). */
  children: React.ReactNode;
};

/** Format a Date as a value for `<input type="datetime-local">` (Asia/Bangkok). */
function toLocalInput(date: Date | null): string {
  if (!date) return '';
  // datetime-local has no timezone; render the Bangkok wall-clock the admin sees.
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (type: string): string => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

/** Interpret a `datetime-local` value as Bangkok wall-clock → an ISO instant. */
function fromLocalInput(value: string): string {
  if (!value) return '';
  // Append the fixed Asia/Bangkok offset so the instant is unambiguous.
  return new Date(`${value}:00+07:00`).toISOString();
}

export function AnnouncementDialog({ locale, item, children }: AnnouncementDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [active, setActive] = useState(item?.active ?? true);
  const tr = (th: string, en: string): string => pick(th, en, locale);

  const isEdit = item != null;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const payload: AnnouncementInput = {
      slug: String(data.get('slug') ?? ''),
      titleTh: String(data.get('titleTh') ?? ''),
      titleEn: String(data.get('titleEn') ?? ''),
      bodyTh: String(data.get('bodyTh') ?? ''),
      bodyEn: String(data.get('bodyEn') ?? ''),
      imageUrl: String(data.get('imageUrl') ?? ''),
      publishedAt: fromLocalInput(String(data.get('publishedAt') ?? '')),
      active,
      sortOrder: Number(data.get('sortOrder') ?? 0),
    };

    startTransition(async () => {
      const result = isEdit
        ? await updateAnnouncement({ id: item.id, ...payload })
        : await createAnnouncement(payload);

      if (result.ok) {
        toast.success(
          isEdit
            ? tr('บันทึกการแก้ไขแล้ว', 'Changes saved')
            : tr('เพิ่มประกาศแล้ว', 'Announcement added'),
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
        if (next) setActive(item?.active ?? true);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? tr('แก้ไขประกาศ', 'Edit announcement') : tr('เพิ่มประกาศใหม่', 'New announcement')}
          </DialogTitle>
          <DialogDescription>
            {tr(
              'ตั้งวันที่เผยแพร่เพื่อให้แสดงบนหน้าเว็บ เว้นว่างไว้เพื่อเก็บเป็นฉบับร่าง',
              'Set a publish date to show it on the site; leave it blank to keep a draft.',
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="titleTh">{tr('หัวข้อ (ไทย)', 'Title (Thai)')}</Label>
              <Input id="titleTh" name="titleTh" required defaultValue={item?.titleTh ?? ''} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="titleEn">{tr('หัวข้อ (อังกฤษ)', 'Title (English)')}</Label>
              <Input id="titleEn" name="titleEn" required defaultValue={item?.titleEn ?? ''} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="bodyTh">{tr('เนื้อหา (ไทย)', 'Body (Thai)')}</Label>
              <Textarea id="bodyTh" name="bodyTh" required rows={4} defaultValue={item?.bodyTh ?? ''} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="bodyEn">{tr('เนื้อหา (อังกฤษ)', 'Body (English)')}</Label>
              <Textarea id="bodyEn" name="bodyEn" required rows={4} defaultValue={item?.bodyEn ?? ''} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="slug">{tr('slug (ไม่บังคับ)', 'Slug (optional)')}</Label>
            <Input
              id="slug"
              name="slug"
              defaultValue={item?.slug ?? ''}
              placeholder="grand-opening"
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            />
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
              <Label htmlFor="publishedAt">{tr('วันที่เผยแพร่ (ไม่บังคับ)', 'Publish date (optional)')}</Label>
              <Input
                id="publishedAt"
                name="publishedAt"
                type="datetime-local"
                defaultValue={toLocalInput(item?.publishedAt ?? null)}
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
              checked={active}
              onChange={(event) => setActive(event.target.checked)}
            />
            {tr('แสดงบนเว็บไซต์ (เปิดใช้งาน)', 'Visible on the site (active)')}
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
                  : tr('เพิ่มประกาศ', 'Add announcement')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
