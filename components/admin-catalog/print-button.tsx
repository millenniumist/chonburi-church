'use client';

import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

type PrintButtonProps = {
  /** Already-localized button label. */
  label: string;
};

/**
 * Trigger the browser's print dialog. Hidden from the printout itself
 * (`print:hidden`) so it never appears on the giving statement.
 */
export function PrintButton({ label }: PrintButtonProps) {
  return (
    <Button type="button" className="print:hidden" onClick={() => window.print()}>
      <Printer className="size-4" />
      {label}
    </Button>
  );
}
