export type Locale = 'th' | 'en';

export const LOCALES: readonly Locale[] = ['th', 'en'] as const;
export const DEFAULT_LOCALE: Locale = 'th';

/** A bilingual string. Thai is the default; English is the fallback. */
export type Localized = { th: string; en: string };

/** Pick the string for a locale, falling back th → en → th. */
export function t(value: Localized, locale: Locale = DEFAULT_LOCALE): string {
  return value[locale] || value.th || value.en;
}

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
