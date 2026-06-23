/**
 * Display a satang (THB minor-unit) integer amount as baht, e.g. 123450 → "1,234.50 ฿".
 * Money is stored in satang (CONTEXT invariant 8); this is the single way out.
 */
export function formatBaht(satang: number): string {
  return (
    (satang / 100).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' ฿'
  );
}
