'use client';

import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';

/**
 * A submit button bound to the enclosing form's pending state.
 * Shows `pendingLabel` and disables itself while the action is in flight.
 */
export function SubmitButton({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending} aria-busy={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}
