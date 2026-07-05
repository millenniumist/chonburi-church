// Page copy (landing hero/featured/promo sections, etc.) is managed in the
// Payload CMS ("Page Sections" collection). All reads go through the Payload
// local API; the legacy Prisma pageContent table is no longer read by the site.
import { getPayloadClient, lexicalToText } from './payload-cms';

export const DEFAULT_LOCALE = 'th';
const LOCALE_KEYS = new Set(['th', 'en', 'th-TH', 'en-US']);

function pickLocalized(value, locale = DEFAULT_LOCALE) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    return value[locale] ?? value.th ?? value.en ?? null;
  }
  return null;
}

// Payload richText values are Lexical documents ({ root: { children: [...] } })
function isLexical(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) && 'root' in value;
}

function isLocalizedObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const keys = Object.keys(value);
  return keys.length > 0 && keys.every((key) => LOCALE_KEYS.has(key));
}

function resolveValue(value, locale = DEFAULT_LOCALE) {
  if (value === null || value === undefined) return value;
  if (isLexical(value)) {
    return lexicalToText(value);
  }
  if (Array.isArray(value)) {
    return value.map((entry) => resolveValue(entry, locale));
  }
  if (isLocalizedObject(value)) {
    const localized = value[locale] ?? value.th ?? value.en ?? Object.values(value)[0];
    return resolveValue(localized, locale);
  }
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [key, resolveValue(val, locale)])
    );
  }
  return value;
}

// Keeps the raw {th, en} translations shape, but flattens Lexical documents
// (per-locale richText) into plain strings.
function translationValue(value) {
  if (value === null || value === undefined) return value ?? null;
  if (isLexical(value)) return lexicalToText(value);
  if (isLocalizedObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [key, isLexical(val) ? lexicalToText(val) : val])
    );
  }
  return value;
}

// Expects a Payload doc fetched with locale: 'all' (localized fields arrive as
// {th, en} objects), mirroring the raw JSON columns the old Prisma rows held.
export function normalizeContent(record, locale = DEFAULT_LOCALE) {
  return {
    id: record.id,
    page: record.page,
    section: record.section,
    title: pickLocalized(record.title, locale),
    subtitle: pickLocalized(record.subtitle, locale),
    description: pickLocalized(record.description, locale),
    body: resolveValue(record.body, locale),
    metadata: record.metadata ?? null,
    translations: {
      title: record.title ?? null,
      subtitle: record.subtitle ?? null,
      description: record.description ?? null,
      body: translationValue(record.body),
    },
    updatedAt: record.updatedAt,
    createdAt: record.createdAt,
  };
}

export async function getPageContent({ page, sections, locale = DEFAULT_LOCALE } = {}) {
  if (!page) {
    throw new Error('Page identifier is required to retrieve content.');
  }

  const where = { page: { equals: page } };
  if (sections) {
    where.section = Array.isArray(sections) ? { in: sections } : { equals: sections };
  }

  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: 'page-content',
    locale: 'all',
    where,
    sort: 'section',
    limit: 100,
  });

  return docs.map((record) => normalizeContent(record, locale));
}

export async function getPageSection(page, section, locale = DEFAULT_LOCALE) {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: 'page-content',
    locale: 'all',
    where: {
      page: { equals: page },
      section: { equals: section },
    },
    limit: 1,
  });

  if (!docs.length) return null;
  return normalizeContent(docs[0], locale);
}
