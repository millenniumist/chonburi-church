'use client';

import { useRouter } from 'next/navigation';
import { type Locale } from '@/lib/i18n';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type DonationYearFilterProps = {
  locale: Locale;
  /** The currently selected calendar year. */
  year: number;
  /** Recent years to choose from, newest first. */
  years: number[];
};

/** Filter the donations list by calendar year via `?year=` in the URL. */
export function DonationYearFilter({ year, years }: DonationYearFilterProps) {
  const router = useRouter();

  return (
    <Select value={String(year)} onValueChange={(v) => router.push(`/admin/donations?year=${v}`)}>
      <SelectTrigger aria-label="Year">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {years.map((y) => (
          <SelectItem key={y} value={String(y)}>
            {y}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
