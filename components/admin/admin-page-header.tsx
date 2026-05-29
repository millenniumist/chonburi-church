import type { ReactNode } from 'react';

type AdminPageHeaderProps = {
  title: string;
  description?: string;
  /** Optional trailing actions (e.g. a "New" button). */
  action?: ReactNode;
};

/** Consistent page heading for admin screens. */
export function AdminPageHeader({ title, description, action }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="flex items-center gap-2">{action}</div> : null}
    </div>
  );
}
