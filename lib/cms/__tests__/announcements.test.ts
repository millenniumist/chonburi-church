import { describe, expect, it, vi } from 'vitest';

/**
 * Pure-logic tests for the announcements admin slice (ADR-0004). These cover the
 * Zod boundary only — no DB. The integration behaviour (admin-gating, the
 * unique-slug guard, create → list round-trip, publish toggling public
 * visibility) is exercised by the Playwright e2e specs, which need a real DB.
 *
 * The action module imports `@/lib/db`, which validates DATABASE_URL at import
 * time. We mock it so importing the schemas stays pure (no Postgres, no env) —
 * the same approach as `tests/unit/cms-read.test.ts`.
 */
vi.mock('@/lib/db', () => ({ db: {} }));
vi.mock('@/lib/auth', () => ({ requireRole: vi.fn() }));
vi.mock('@/lib/locale', () => ({ getLocale: vi.fn(async () => 'th') }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const { announcementInputSchema, updateAnnouncementSchema, reorderAnnouncementsSchema } =
  await import('@/lib/actions/cms-announcements');
describe('announcementInputSchema', () => {
  const valid = {
    titleTh: 'หัวข้อ',
    titleEn: 'Title',
    bodyTh: 'เนื้อหา',
    bodyEn: 'Body',
  };

  it('accepts a minimal bilingual announcement', () => {
    const parsed = announcementInputSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      // Optional fields normalise to null / sensible defaults.
      expect(parsed.data.slug).toBeNull();
      expect(parsed.data.imageUrl).toBeNull();
      expect(parsed.data.publishedAt).toBeNull();
      expect(parsed.data.active).toBe(true);
      expect(parsed.data.sortOrder).toBe(0);
    }
  });

  it('accepts a fully-populated announcement', () => {
    const parsed = announcementInputSchema.safeParse({
      ...valid,
      slug: 'grand-opening-2026',
      imageUrl: 'https://example.com/banner.webp',
      publishedAt: '2026-05-01T03:00:00.000Z',
      active: false,
      sortOrder: 5,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.slug).toBe('grand-opening-2026');
      expect(parsed.data.imageUrl).toBe('https://example.com/banner.webp');
      expect(parsed.data.publishedAt).toBeInstanceOf(Date);
      expect(parsed.data.publishedAt?.toISOString()).toBe('2026-05-01T03:00:00.000Z');
      expect(parsed.data.active).toBe(false);
      expect(parsed.data.sortOrder).toBe(5);
    }
  });

  it.each([
    ['missing titleTh', { ...valid, titleTh: undefined }],
    ['empty titleTh', { ...valid, titleTh: '   ' }],
    ['missing titleEn', { ...valid, titleEn: undefined }],
    ['missing bodyTh', { ...valid, bodyTh: undefined }],
    ['empty bodyEn', { ...valid, bodyEn: '' }],
  ])('rejects %s', (_label, input) => {
    expect(announcementInputSchema.safeParse(input).success).toBe(false);
  });

  it('rejects a malformed slug (uppercase / spaces / symbols)', () => {
    for (const slug of ['Grand Opening', 'grand_opening', 'แอบ', 'a/b', '-leading']) {
      expect(announcementInputSchema.safeParse({ ...valid, slug }).success, slug).toBe(false);
    }
  });

  it('treats an empty-string slug as "not provided" (null)', () => {
    const parsed = announcementInputSchema.safeParse({ ...valid, slug: '' });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.slug).toBeNull();
  });

  it('rejects an invalid imageUrl but allows empty string (null)', () => {
    expect(
      announcementInputSchema.safeParse({ ...valid, imageUrl: 'not-a-url' }).success,
    ).toBe(false);
    const blank = announcementInputSchema.safeParse({ ...valid, imageUrl: '' });
    expect(blank.success).toBe(true);
    if (blank.success) expect(blank.data.imageUrl).toBeNull();
  });

  it('rejects an unparseable publishedAt but treats empty string as null', () => {
    expect(
      announcementInputSchema.safeParse({ ...valid, publishedAt: 'not-a-date' }).success,
    ).toBe(false);
    const blank = announcementInputSchema.safeParse({ ...valid, publishedAt: '' });
    expect(blank.success).toBe(true);
    if (blank.success) expect(blank.data.publishedAt).toBeNull();
  });

  it('coerces a numeric-string sortOrder and rejects a negative one', () => {
    const ok = announcementInputSchema.safeParse({ ...valid, sortOrder: '3' });
    expect(ok.success).toBe(true);
    if (ok.success) expect(ok.data.sortOrder).toBe(3);
    expect(announcementInputSchema.safeParse({ ...valid, sortOrder: -1 }).success).toBe(false);
  });
});

describe('updateAnnouncementSchema', () => {
  it('requires a uuid id on top of the base fields', () => {
    const base = { titleTh: 'a', titleEn: 'b', bodyTh: 'c', bodyEn: 'd' };
    expect(updateAnnouncementSchema.safeParse(base).success).toBe(false);
    expect(updateAnnouncementSchema.safeParse({ ...base, id: 'nope' }).success).toBe(false);
    expect(
      updateAnnouncementSchema.safeParse({
        ...base,
        id: '11111111-1111-4111-8111-111111111111',
      }).success,
    ).toBe(true);
  });
});

describe('reorderAnnouncementsSchema', () => {
  it('accepts a list of {id, sortOrder} pairs and rejects malformed ids', () => {
    const ok = reorderAnnouncementsSchema.safeParse({
      items: [
        { id: '11111111-1111-4111-8111-111111111111', sortOrder: 0 },
        { id: '22222222-2222-4222-8222-222222222222', sortOrder: 1 },
      ],
    });
    expect(ok.success).toBe(true);
    expect(
      reorderAnnouncementsSchema.safeParse({ items: [{ id: 'x', sortOrder: 0 }] }).success,
    ).toBe(false);
  });
});
