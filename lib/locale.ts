import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, isLocale, type Locale } from '@/lib/i18n';

export const LOCALE_COOKIE = 'locale';

/** The active locale for this request (from the `locale` cookie; default th). */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return value && isLocale(value) ? value : DEFAULT_LOCALE;
}
