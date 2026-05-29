export type Locale = 'th' | 'en';

export const LOCALES: readonly Locale[] = ['th', 'en'] as const;
export const DEFAULT_LOCALE: Locale = 'th';

/** A bilingual string. Thai is the default; English is the fallback. */
export type Localized = { th: string; en: string };

/** Pick the string for a locale, falling back th → en → th. */
export function t(value: Localized, locale: Locale = DEFAULT_LOCALE): string {
  return value[locale] || value.th || value.en;
}

/**
 * Pick between two locale variants (e.g. a DB row's `nameTh` / `nameEn`),
 * falling back to whichever is non-empty. Pass `''` for nullable columns.
 */
export function pick(th: string, en: string, locale: Locale = DEFAULT_LOCALE): string {
  return (locale === 'en' ? en : th) || th || en;
}

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
