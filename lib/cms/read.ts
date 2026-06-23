import { and, asc, eq, isNotNull, lte } from 'drizzle-orm';
import { db } from '@/lib/db';
import { announcements, siteContent } from '@/lib/db/schema';
import type { Announcement } from '@/lib/db/schema';
import {
  SECTION_KEYS,
  resolveSectionValue,
  type AllContent,
  type SectionKey,
  type SectionValue,
} from '@/lib/cms/sections';

/**
 * The shared CMS read layer (ADR-0004). Plain async functions, importable by
 * server components — NOT server actions.
 *
 * Fallback is baked in via `resolveSectionValue` (the registry helper): every
 * resolved value is parsed with the registry schema and degrades to the section
 * default on a missing row OR a validation failure (logged here, never thrown).
 * A stranger must never see a broken page because an admin saved bad data or a
 * row is absent.
 */

/** Resolve + log: warn (not throw) when a present row failed validation. */
function resolveAndLog<K extends SectionKey>(
  key: K,
  raw: unknown,
  present: boolean,
): SectionValue<K> {
  const result = resolveSectionValue(key, raw, present);
  if (result.error) {
    console.warn(
      `[cms] siteContent "${key}" failed validation; using default.`,
      result.error.issues,
    );
  }
  return result.value;
}

/**
 * Resolve one section's content. Reads the `siteContent` row for `key`, parses
 * `value` with the registry schema, and falls back to the registry default when
 * the row is missing or the stored JSON fails validation.
 */
export async function getContent<K extends SectionKey>(key: K): Promise<SectionValue<K>> {
  try {
    const row = await db.query.siteContent.findFirst({
      where: eq(siteContent.key, key),
      columns: { value: true },
    });
    return resolveAndLog(key, row?.value, row != null);
  } catch (error) {
    // DB unreachable / query error: the public site still renders the defaults.
    console.error(`[cms] getContent("${key}") failed; using default.`, error);
    return resolveSectionValue(key, undefined, false).value;
  }
}

/**
 * Resolve every registered section into one map, each through the same
 * fallback. One query (all rows), then per-key parse/fallback.
 */
export async function getAllContent(): Promise<AllContent> {
  const byKey = new Map<string, unknown>();
  try {
    const rows = await db
      .select({ key: siteContent.key, value: siteContent.value })
      .from(siteContent);
    for (const row of rows) byKey.set(row.key, row.value);
  } catch (error) {
    console.error('[cms] getAllContent() query failed; using defaults.', error);
  }

  // Build the per-key resolved value, then assemble once. Writing into a mapped
  // type through a generic key lands in write-position intersection territory in
  // TS, so we collect entries and assert the assembled record is `AllContent`
  // (sound: every `SECTION_KEYS` key is visited exactly once, each via the
  // registry-validated `resolveAndLog`).
  const entries = SECTION_KEYS.map((key) => [key, resolveAndLog(key, byKey.get(key), byKey.has(key))] as const);
  return Object.fromEntries(entries) as AllContent;
}

export type ListAnnouncementsOptions = {
  /**
   * When true (the default), return only announcements a visitor should see:
   * `active && publishedAt != null && publishedAt <= now`. When false, return
   * every announcement (for the admin list).
   */
  publishedOnly?: boolean;
};

/**
 * Announcements ordered by `sortOrder`, then `publishedAt`. With `publishedOnly`
 * (default), filters to the live set. On any DB error, returns `[]` so the
 * public page degrades gracefully rather than throwing.
 */
export async function listAnnouncements(
  options: ListAnnouncementsOptions = {},
): Promise<Announcement[]> {
  const { publishedOnly = true } = options;
  try {
    if (publishedOnly) {
      return await db
        .select()
        .from(announcements)
        .where(
          and(
            eq(announcements.active, true),
            isNotNull(announcements.publishedAt),
            lte(announcements.publishedAt, new Date()),
          ),
        )
        .orderBy(asc(announcements.sortOrder), asc(announcements.publishedAt));
    }
    return await db
      .select()
      .from(announcements)
      .orderBy(asc(announcements.sortOrder), asc(announcements.publishedAt));
  } catch (error) {
    console.error('[cms] listAnnouncements() failed; returning empty list.', error);
    return [];
  }
}
