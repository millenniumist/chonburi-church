'use client';

import { useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { enrollAction } from '@/lib/actions/classes';
import { IDLE_FORM_STATE } from '@/lib/forms';
import { pick, type Locale } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

type EnrollDialogProps = {
  classOfferingId: string;
  className: string;
  /** Whether a user is signed in. When true we only need a confirm button. */
  isLoggedIn: boolean;
  /** Signed-in user's display name, for a friendly confirmation line. */
  userName?: string;
  locale: Locale;
};

export function EnrollDialog({
  classOfferingId,
  className,
  isLoggedIn,
  userName,
  locale,
}: EnrollDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(enrollAction, IDLE_FORM_STATE);
  const tr = (th: string, en: string): string => pick(th, en, locale);

  useEffect(() => {
    if (state.status === 'success' && state.message) {
      toast.success(state.message);
      setOpen(false);
    }
  }, [state]);

  const guestNameError = state.fieldErrors?.guestName?.[0];
  const guestPhoneError = state.fieldErrors?.guestPhone?.[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">{tr('ลงทะเบียน', 'Enroll')}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tr('ลงทะเบียนเรียน', 'Enroll in a class')}</DialogTitle>
          <DialogDescription>
            {tr(`คลาส: ${className} (เรียนฟรี)`, `Class: ${className} (free)`)}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="classOfferingId" value={classOfferingId} />

          {isLoggedIn ? (
            <p className="text-sm text-muted-foreground">
              {userName
                ? tr(
                    `ลงทะเบียนในชื่อ ${userName} — กดยืนยันเพื่อจองที่นั่ง`,
                    `Enrolling as ${userName} — confirm to reserve your spot.`,
                  )
                : tr(
                    'กดยืนยันเพื่อจองที่นั่งในคลาสนี้',
                    'Confirm to reserve your spot in this class.',
                  )}
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="guestName">{tr('ชื่อ', 'Name')}</Label>
                <Input
                  id="guestName"
                  name="guestName"
                  autoComplete="name"
                  required
                  aria-invalid={guestNameError ? true : undefined}
                  placeholder={tr('ชื่อ-นามสกุล', 'Your full name')}
                />
                {guestNameError && <p className="text-sm text-destructive">{guestNameError}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="guestPhone">{tr('เบอร์โทร', 'Phone')}</Label>
                <Input
                  id="guestPhone"
                  name="guestPhone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  aria-invalid={guestPhoneError ? true : undefined}
                  placeholder={tr('08x-xxx-xxxx', '08x-xxx-xxxx')}
                />
                {guestPhoneError && <p className="text-sm text-destructive">{guestPhoneError}</p>}
              </div>
            </>
          )}

          {state.status === 'error' && state.message && (
            <p className="text-sm text-destructive" role="alert">
              {state.message}
            </p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={pending}>
                {tr('ยกเลิก', 'Cancel')}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending
                ? tr('กำลังลงทะเบียน…', 'Enrolling…')
                : tr('ยืนยันการลงทะเบียน', 'Confirm enrollment')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
