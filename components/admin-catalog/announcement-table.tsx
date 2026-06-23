'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, Pencil, Trash2 } from 'lucide-react';
import {
  deleteAnnouncement,
  reorderAnnouncements,
  toggleActive,
  togglePublish,
} from '@/lib/actions/cms-announcements';
import { pick, type Locale } from '@/lib/i18n';
import type { Announcement } from '@/lib/db/schema';
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
import { AnnouncementDialog } from '@/components/admin-catalog/announcement-dialog';

type AnnouncementTableProps = {
  locale: Locale;
  /** All announcements (admin view), ordered by sortOrder then publishedAt. */
  items: Announcement[];
};

/** Is this announcement currently visible to the public (active + published ≤ now)? */
function isLive(item: Announcement): boolean {
  return item.active && item.publishedAt != null && item.publishedAt.getTime() <= Date.now();
}

function formatDate(date: Date | null, locale: Locale): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'th-TH', {
    timeZone: 'Asia/Bangkok',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function AnnouncementTable({ locale, items }: AnnouncementTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const tr = (th: string, en: string): string => pick(th, en, locale);

  function run(id: string, action: () => Promise<void>) {
    setBusyId(id);
    startTransition(async () => {
      await action();
      setBusyId(null);
    });
  }

  function setPublished(item: Announcement) {
    run(item.id, async () => {
      // No publishedAt → publish now; already has one → clear it (unpublish).
      const result = await togglePublish({ id: item.id, publish: item.publishedAt == null });
      if (result.ok) {
        toast.success(
          result.data.publishedAt
            ? tr('เผยแพร่แล้ว', 'Published')
            : tr('ยกเลิกการเผยแพร่แล้ว', 'Unpublished'),
        );
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function setActive(item: Announcement) {
    run(item.id, async () => {
      const result = await toggleActive({ id: item.id, active: !item.active });
      if (result.ok) {
        toast.success(
          result.data.active ? tr('แสดงบนเว็บแล้ว', 'Now visible') : tr('ซ่อนแล้ว', 'Hidden'),
        );
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function move(index: number, direction: -1 | 1) {
    const other = index + direction;
    if (other < 0 || other >= items.length) return;
    const a = items[index];
    const b = items[other];
    if (!a || !b) return;
    run(a.id, async () => {
      const result = await reorderAnnouncements({
        items: [
          { id: a.id, sortOrder: b.sortOrder },
          { id: b.id, sortOrder: a.sortOrder },
        ],
      });
      if (result.ok) {
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function remove(item: Announcement, onDone: () => void) {
    run(item.id, async () => {
      const result = await deleteAnnouncement({ id: item.id });
      onDone();
      if (result.ok) {
        toast.success(tr('ลบประกาศแล้ว', 'Announcement deleted'));
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
        {tr('ยังไม่มีประกาศ กดเพิ่มประกาศใหม่เพื่อเริ่มต้น', 'No announcements yet. Add one to get started.')}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-24 text-center">{tr('ลำดับ', 'Order')}</TableHead>
            <TableHead>{tr('หัวข้อ', 'Title')}</TableHead>
            <TableHead>{tr('วันที่เผยแพร่', 'Published')}</TableHead>
            <TableHead className="text-center">{tr('สถานะ', 'Status')}</TableHead>
            <TableHead className="text-right">{tr('จัดการ', 'Actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => {
            const live = isLive(item);
            const busy = isPending && busyId === item.id;
            return (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      disabled={busy || index === 0}
                      aria-label={tr('เลื่อนขึ้น', 'Move up')}
                      onClick={() => move(index, -1)}
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      disabled={busy || index === items.length - 1}
                      aria-label={tr('เลื่อนลง', 'Move down')}
                      onClick={() => move(index, 1)}
                    >
                      <ArrowDown className="size-4" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{pick(item.titleTh, item.titleEn, locale)}</div>
                  <div className="text-xs text-muted-foreground">
                    {pick(item.titleEn, item.titleTh, locale === 'en' ? 'th' : 'en')}
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {formatDate(item.publishedAt, locale)}
                </TableCell>
                <TableCell className="text-center">
                  {live ? (
                    <Badge variant="default">{tr('เผยแพร่อยู่', 'Live')}</Badge>
                  ) : !item.active ? (
                    <Badge variant="secondary">{tr('ซ่อน', 'Hidden')}</Badge>
                  ) : item.publishedAt == null ? (
                    <Badge variant="outline">{tr('ฉบับร่าง', 'Draft')}</Badge>
                  ) : (
                    <Badge variant="outline">{tr('ตั้งเวลา', 'Scheduled')}</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => setPublished(item)}
                    >
                      {item.publishedAt == null ? tr('เผยแพร่', 'Publish') : tr('เลิกเผยแพร่', 'Unpublish')}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => setActive(item)}
                    >
                      {item.active ? tr('ซ่อน', 'Hide') : tr('แสดง', 'Show')}
                    </Button>

                    <AnnouncementDialog locale={locale} item={item}>
                      <Button type="button" size="icon" variant="ghost" aria-label={tr('แก้ไข', 'Edit')}>
                        <Pencil className="size-4" />
                      </Button>
                    </AnnouncementDialog>

                    <DeleteButton
                      locale={locale}
                      name={pick(item.titleTh, item.titleEn, locale)}
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
          <DialogTitle>{tr('ลบประกาศนี้?', 'Delete this announcement?')}</DialogTitle>
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
