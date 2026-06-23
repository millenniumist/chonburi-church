// Pure-logic unit tests for the catalog `imageUrl` validation (images slice).
//
// We import the class-offering Zod schemas from the admin action module. That
// module transitively constructs a pg Pool at load, which is LAZY — no socket is
// opened until a query runs — so setting DATABASE_URL to a dummy value is enough
// to import it without any real database. No query is ever executed here; this
// file exercises Zod validation only (the PM invariant: schema accepts a valid
// imageUrl, coerces empty string to null, and rejects a non-URL string).

import { beforeAll, describe, expect, it } from 'vitest';

// Set BEFORE importing the action module so `@/lib/env` validation passes and
// the pg Pool can be constructed (lazily). The value is never connected to.
process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test';

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
type CatalogModule = typeof import('@/lib/actions/admin-catalog');
let classOfferingSchema: CatalogModule['classOfferingSchema'];
let updateClassOfferingSchema: CatalogModule['updateClassOfferingSchema'];
let menuItemSchema: CatalogModule['menuItemSchema'];

beforeAll(async () => {
  const mod = await import('@/lib/actions/admin-catalog');
  classOfferingSchema = mod.classOfferingSchema;
  updateClassOfferingSchema = mod.updateClassOfferingSchema;
  menuItemSchema = mod.menuItemSchema;
});

// A complete, valid class-offering create payload sans imageUrl. Each test
// spreads this and overrides `imageUrl` to isolate that field's behaviour.
const baseClass = {
  slug: 'english-p1',
  kind: 'english',
  nameTh: 'อังกฤษ',
  nameEn: 'English',
  startTime: '13:00',
  endTime: '15:00',
} as const;

describe('classOfferingSchema imageUrl (create)', () => {
  it('accepts a valid https URL and keeps it', () => {
    const parsed = classOfferingSchema.safeParse({
      ...baseClass,
      imageUrl: 'https://example.com/class.webp',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.imageUrl).toBe('https://example.com/class.webp');
    }
  });

  it('coerces an empty string to null (treated as "not provided")', () => {
    const parsed = classOfferingSchema.safeParse({ ...baseClass, imageUrl: '' });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.imageUrl).toBeNull();
    }
  });

  it('rejects a whitespace-only string (matches menu: trims, then fails .url())', () => {
    // Parity with menuItemSchema: a trimmed-to-empty string is NOT the empty
    // literal branch, so the `.url()` branch rejects it. Only a literal '' (or
    // omission) coerces to null.
    const parsed = classOfferingSchema.safeParse({ ...baseClass, imageUrl: '   ' });
    expect(parsed.success).toBe(false);
    const menu = menuItemSchema.safeParse({
      slug: 'latte',
      nameTh: 'ลาเต้',
      nameEn: 'Latte',
      imageUrl: '   ',
    });
    expect(menu.success).toBe(false);
  });

  it('defaults to null when imageUrl is omitted entirely', () => {
    const parsed = classOfferingSchema.safeParse({ ...baseClass });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.imageUrl).toBeNull();
    }
  });

  it('rejects a non-URL string with a validation error', () => {
    const parsed = classOfferingSchema.safeParse({ ...baseClass, imageUrl: 'not a url' });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.some((i) => i.path.includes('imageUrl'))).toBe(true);
    }
  });
});

describe('updateClassOfferingSchema imageUrl (update)', () => {
  // A syntactically valid v4 UUID (correct version + variant nibbles) so the
  // `id` field passes and we exercise only the imageUrl behaviour.
  const baseUpdate = {
    ...baseClass,
    id: '3f1a7c2e-9b4d-4e7a-8c1f-2a6d5b9e0c11',
  } as const;

  it('accepts a valid URL', () => {
    const parsed = updateClassOfferingSchema.safeParse({
      ...baseUpdate,
      imageUrl: 'https://example.com/x.png',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.imageUrl).toBe('https://example.com/x.png');
    }
  });

  it('coerces empty string to null on update', () => {
    const parsed = updateClassOfferingSchema.safeParse({ ...baseUpdate, imageUrl: '' });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.imageUrl).toBeNull();
    }
  });

  it('rejects a malformed imageUrl on update', () => {
    const parsed = updateClassOfferingSchema.safeParse({
      ...baseUpdate,
      imageUrl: 'http://',
    });
    expect(parsed.success).toBe(false);
  });
});

describe('parity with menuItemSchema.imageUrl (shared behaviour)', () => {
  const baseMenu = { slug: 'latte', nameTh: 'ลาเต้', nameEn: 'Latte' } as const;

  it('class and menu agree: valid URL passes on both', () => {
    const url = 'https://example.com/img.jpg';
    const cls = classOfferingSchema.safeParse({ ...baseClass, imageUrl: url });
    const menu = menuItemSchema.safeParse({ ...baseMenu, imageUrl: url });
    expect(cls.success && menu.success).toBe(true);
  });

  it('class and menu agree: empty string -> null on both', () => {
    const cls = classOfferingSchema.safeParse({ ...baseClass, imageUrl: '' });
    const menu = menuItemSchema.safeParse({ ...baseMenu, imageUrl: '' });
    if (cls.success && menu.success) {
      expect(cls.data.imageUrl).toBeNull();
      expect(menu.data.imageUrl).toBeNull();
    } else {
      throw new Error('both should parse');
    }
  });

  it('class and menu agree: a non-URL string is rejected on both', () => {
    const cls = classOfferingSchema.safeParse({ ...baseClass, imageUrl: 'nope' });
    const menu = menuItemSchema.safeParse({ ...baseMenu, imageUrl: 'nope' });
    expect(cls.success).toBe(false);
    expect(menu.success).toBe(false);
  });
});
