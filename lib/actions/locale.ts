'use server';

import { cookies } from 'next/headers';
import { isLocale } from '@/lib/i18n';
import { LOCALE_COOKIE } from '@/lib/locale';

const ONE_YEAR = 60 * 60 * 24 * 365;

export async function setLocale(locale: string): Promise<void> {
  if (!isLocale(locale)) return;
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, { path: '/', maxAge: ONE_YEAR, sameSite: 'lax' });
}
