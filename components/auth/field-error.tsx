import { cn } from '@/lib/utils';

/** Renders the first Zod field error for a form field, if any. */
export function FieldError({
  errors,
  id,
  className,
}: {
  errors: string[] | undefined;
  id?: string;
  className?: string;
}) {
  const first = errors?.[0];
  if (!first) return null;
  return (
    <p id={id} className={cn('text-sm text-destructive', className)} role="alert">
      {first}
    </p>
  );
}
