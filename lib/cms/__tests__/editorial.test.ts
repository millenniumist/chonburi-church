import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SECTIONS } from '@/lib/cms/sections';
import type { SectionKey } from '@/lib/cms/sections';

/**
 * The editorial keys this slice edits. `EDITORIAL_KEYS` is NOT exported from the
 * action module — a `'use server'` file may only export async functions — so we
 * keep the canonical list here for the schema-contract tests. The action guards
 * the same set internally; the round-trip tests below exercise that guard.
 */
const EDITORIAL_KEYS = [
  'hero',
  'gospel',
  'story',
  'firstVisit',
  'classesTeaser',
  'verse',
] as const satisfies readonly SectionKey[];

/**
 * Editorial CMS slice — unit tests (adaptive TDD, load-bearing logic only).
 *
 * Two concerns are covered here, both PURE (no Postgres, no env):
 *   1. The registry schemas for the EDITORIAL keys accept their own
 *      `content/site.ts` defaults and reject malformed shapes. This is the
 *      contract the admin form validates against and the public site falls
 *      back from — it must hold.
 *   2. The `updateEditorialSection` server action's guard + validation: a
 *      non-admin is rejected by `requireRole` BEFORE any DB write, malformed
 *      input is rejected by Zod with a bilingual message, and a valid edit
 *      upserts the row and round-trips the stored value back.
 *
 * The DB / auth / cache / locale modules are mocked so the action stays a
 * pure-logic test. Each test drives the mocks to the behaviour it needs.
 */

// ── Mocks ───────────────────────────────────────────────────────────────────

// `requireRole` either resolves (admin) or throws (a stand-in for the redirect
// Next.js performs for a non-admin). The action must call it before touching db.
// Typed with a `(...args: unknown[]) => unknown` signature so the mock fns
// accept the spread the indirection passes and `.mock.calls[i]` is `unknown[]`.
const requireRole = vi.fn<(...args: unknown[]) => unknown>();
const onConflictDoUpdate = vi.fn<(...args: unknown[]) => unknown>();
const returning = vi.fn<(...args: unknown[]) => unknown>();
const values = vi.fn<(...args: unknown[]) => unknown>(() => ({ onConflictDoUpdate }));
const insert = vi.fn<(...args: unknown[]) => unknown>(() => ({ values }));
const revalidatePath = vi.fn<(...args: unknown[]) => unknown>();
let locale: 'th' | 'en' = 'th';

vi.mock('@/lib/auth', () => ({
  requireRole: (...args: unknown[]) => requireRole(...args),
}));

vi.mock('@/lib/locale', () => ({
  getLocale: () => Promise.resolve(locale),
}));

vi.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

vi.mock('@/lib/db', () => ({
  db: {
    insert: (...args: unknown[]) => insert(...args),
  },
}));

// Import after the mocks are registered.
const { updateEditorialSection } = await import('@/lib/actions/cms-editorial');

const VALID_HERO = SECTIONS.hero.default;

beforeEach(() => {
  requireRole.mockReset().mockResolvedValue({ id: 'u1', role: 'admin' });
  insert.mockClear();
  values.mockClear();
  onConflictDoUpdate.mockReset().mockReturnValue({ returning });
  returning.mockReset();
  revalidatePath.mockReset();
  locale = 'th';
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── Registry schema contract (pure) ──────────────────────────────────────────

describe('editorial registry schemas', () => {
  const EXPECTED: SectionKey[] = ['hero', 'gospel', 'story', 'firstVisit', 'classesTeaser', 'verse'];

  it('exposes exactly the editorial keys (no church)', () => {
    expect(new Set(EDITORIAL_KEYS)).toEqual(new Set(EXPECTED));
    expect(EDITORIAL_KEYS).not.toContain('church');
  });

  it('every editorial default parses against its own schema', () => {
    for (const key of EDITORIAL_KEYS) {
      const { schema, default: def } = SECTIONS[key];
      expect(schema.safeParse(def).success, `default for "${key}"`).toBe(true);
    }
  });

  it('rejects a hero missing the .en half of a field', () => {
    const bad = {
      heading: { th: 'หัวข้อ' }, // missing en
      body: VALID_HERO.body,
      primaryCta: VALID_HERO.primaryCta,
      secondaryCta: VALID_HERO.secondaryCta,
    };
    expect(SECTIONS.hero.schema.safeParse(bad).success).toBe(false);
  });

  it('rejects a non-string body (gospel)', () => {
    const bad = { heading: { th: 'a', en: 'b' }, body: { th: 1, en: 2 } };
    expect(SECTIONS.gospel.schema.safeParse(bad).success).toBe(false);
  });

  it('rejects firstVisit when steps is not an array', () => {
    const bad = { heading: { th: 'a', en: 'b' }, steps: { th: 'a', en: 'b' } };
    expect(SECTIONS.firstVisit.schema.safeParse(bad).success).toBe(false);
    // …and accepts a well-formed Localized[] for steps.
    const good = { heading: { th: 'a', en: 'b' }, steps: [{ th: 'a', en: 'b' }] };
    expect(SECTIONS.firstVisit.schema.safeParse(good).success).toBe(true);
  });
});

// ── updateEditorialSection (guard + validation + upsert) ──────────────────────

describe('updateEditorialSection', () => {
  it('requires the admin role BEFORE any DB write', async () => {
    requireRole.mockRejectedValueOnce(new Error('NEXT_REDIRECT'));
    await expect(updateEditorialSection('hero', VALID_HERO)).rejects.toThrow();
    expect(requireRole).toHaveBeenCalledWith('admin');
    expect(insert).not.toHaveBeenCalled();
  });

  it('rejects an unknown / non-editorial key with a bilingual error', async () => {
    // `church` is a real section but NOT editable through this editorial action.
    const result = await updateEditorialSection('church' as 'hero', VALID_HERO);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.length).toBeGreaterThan(0);
    expect(insert).not.toHaveBeenCalled();
  });

  it('rejects malformed input via Zod and never writes (Thai error by default)', async () => {
    const result = await updateEditorialSection('hero', { heading: { th: 'x' } });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(typeof result.error).toBe('string');
    expect(insert).not.toHaveBeenCalled();
  });

  it('returns a bilingual error: different strings per locale', async () => {
    // Drive each locale to completion before flipping the shared mock value.
    locale = 'th';
    const thResult = await updateEditorialSection('hero', { bad: true });
    locale = 'en';
    const enResult = await updateEditorialSection('hero', { bad: true });

    expect(thResult.ok).toBe(false);
    expect(enResult.ok).toBe(false);
    if (!enResult.ok && !thResult.ok) {
      // Bilingual: the two locales must produce different strings.
      expect(enResult.error).not.toEqual(thResult.error);
      expect(enResult.error).toBe('Invalid content.');
    }
  });

  it('upserts the validated value and round-trips it back on success', async () => {
    const now = new Date();
    const row = { key: 'hero', value: VALID_HERO, updatedAt: now };
    returning.mockResolvedValue([row]);

    const result = await updateEditorialSection('hero', VALID_HERO);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.value).toEqual(VALID_HERO);

    // Inserted with the right key + parsed value…
    expect(insert).toHaveBeenCalledTimes(1);
    const insertedValues = values.mock.calls[0]?.[0] as { key: string; value: unknown };
    expect(insertedValues.key).toBe('hero');
    expect(insertedValues.value).toEqual(VALID_HERO);

    // …via onConflictDoUpdate on the key (admin re-edit overwrites the row).
    expect(onConflictDoUpdate).toHaveBeenCalledTimes(1);

    // …and revalidated both the public landing and the admin editor.
    expect(revalidatePath).toHaveBeenCalledWith('/');
    expect(revalidatePath).toHaveBeenCalledWith('/admin/content');
  });

  it('returns an error (not a throw) when the upsert returns no row', async () => {
    returning.mockResolvedValue([]);
    const result = await updateEditorialSection('hero', VALID_HERO);
    expect(result.ok).toBe(false);
  });
});
