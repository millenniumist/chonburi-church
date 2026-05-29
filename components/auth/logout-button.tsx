'use client';

import { useFormStatus } from 'react-dom';
import { logoutAction } from '@/lib/actions/auth';
import { Button } from '@/components/ui/button';

function LogoutSubmit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" disabled={pending} aria-busy={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

export function LogoutButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  return (
    <form action={logoutAction}>
      <LogoutSubmit label={label} pendingLabel={pendingLabel} />
    </form>
  );
}
