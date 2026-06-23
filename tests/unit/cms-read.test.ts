import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SECTIONS } from '@/lib/cms/sections';

/**
 * Read-layer fallback (ADR-0004): the public site must never break. We mock the
 * db module so these stay pure-logic (no Postgres, no env). Each test controls
 * what the query layer returns and asserts the resolved value.
 */

// Mutable handles the mock closes over; each test sets the behaviour it needs.
const findFirst = vi.fn();
const select = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      siteContent: {
        findFirst: (...args: unknown[]) => findFirst(...args),
      },
    },
    select: (...args: unknown[]) => select(...args),
  },
}));

// Import after the mock is registered.
const { getContent, getAllContent, listAnnouncements } = await import('@/lib/cms/read');

beforeEach(() => {
  findFirst.mockReset();
  select.mockReset();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getContent', () => {
  it('returns the parsed stored value when valid', async () => {
    const stored = {
      heading: { th: 'หัวข้อ', en: 'Heading' },
      body: { th: 'เนื้อหา', en: 'Body' },
      primaryCta: { th: 'หลัก', en: 'Primary' },
      secondaryCta: { th: 'รอง', en: 'Secondary' },
    };
    findFirst.mockResolvedValue({ value: stored });
    expect(await getContent('hero')).toEqual(stored);
  });

  it('falls back to the registry default when the row is missing', async () => {
    findFirst.mockResolvedValue(undefined);
    expect(await getContent('gospel')).toEqual(SECTIONS.gospel.default);
  });

  it('falls back to the default when the stored value fails validation', async () => {
    findFirst.mockResolvedValue({ value: { heading: 'not bilingual' } });
    expect(await getContent('hero')).toEqual(SECTIONS.hero.default);
  });

  it('falls back to the default when the query throws (DB down)', async () => {
    findFirst.mockRejectedValue(new Error('connection refused'));
    expect(await getContent('story')).toEqual(SECTIONS.story.default);
  });
});

describe('getAllContent', () => {
  it('resolves every section, mixing stored rows and defaults', async () => {
    const storedVerse = {
      text: { th: 'พระวจนะ', en: 'A verse' },
      reference: { th: 'อ้างอิง', en: 'Ref 1:1' },
    };
    select.mockReturnValue({
      from: () => Promise.resolve([{ key: 'verse', value: storedVerse }]),
    });
    const all = await getAllContent();
    expect(all.verse).toEqual(storedVerse); // from DB
    expect(all.hero).toEqual(SECTIONS.hero.default); // missing -> default
    expect(all.church).toEqual(SECTIONS.church.default);
  });

  it('returns all defaults when the query throws', async () => {
    select.mockImplementation(() => {
      throw new Error('boom');
    });
    const all = await getAllContent();
    expect(all.hero).toEqual(SECTIONS.hero.default);
    expect(all.firstVisit).toEqual(SECTIONS.firstVisit.default);
  });
});

describe('listAnnouncements', () => {
  it('returns an empty list (never throws) when the query fails', async () => {
    select.mockImplementation(() => {
      throw new Error('boom');
    });
    expect(await listAnnouncements()).toEqual([]);
    expect(await listAnnouncements({ publishedOnly: false })).toEqual([]);
  });

  it('passes the rows through for the published query', async () => {
    const rows = [{ id: 'a' }, { id: 'b' }];
    select.mockReturnValue({
      from: () => ({ where: () => ({ orderBy: () => Promise.resolve(rows) }) }),
    });
    expect(await listAnnouncements({ publishedOnly: true })).toBe(rows);
  });

  it('passes the rows through for the admin (all) query', async () => {
    const rows = [{ id: 'x' }];
    select.mockReturnValue({
      from: () => ({ orderBy: () => Promise.resolve(rows) }),
    });
    expect(await listAnnouncements({ publishedOnly: false })).toBe(rows);
  });
});
