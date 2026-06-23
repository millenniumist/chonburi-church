import { describe, expect, it } from 'vitest';
import { SECTIONS, SECTION_KEYS, localizedSchema } from '@/lib/cms/sections';
import { site, verse, church } from '@/content/site';

/**
 * The section registry is the single source of truth for editable content
 * (ADR-0004). These tests assert that every default is valid against its own
 * schema and that the registry stays wired to `content/site.ts`.
 */
describe('cms section registry', () => {
  it('exposes the agreed section keys', () => {
    expect(new Set(SECTION_KEYS)).toEqual(
      new Set(['hero', 'gospel', 'story', 'firstVisit', 'classesTeaser', 'verse', 'church']),
    );
  });

  it('every default parses against its own schema', () => {
    for (const key of SECTION_KEYS) {
      const { schema, default: def } = SECTIONS[key];
      expect(schema.safeParse(def).success, `default for "${key}"`).toBe(true);
    }
  });

  it('defaults are sourced from content/site.ts', () => {
    expect(SECTIONS.hero.default.heading).toEqual(site.hero.heading);
    expect(SECTIONS.verse.default.reference).toEqual(verse.reference);
    expect(SECTIONS.church.default.legalName).toEqual(church.legalName);
    expect(SECTIONS.firstVisit.default.steps.length).toBe(site.firstVisit.steps.length);
    expect(SECTIONS.church.default.worshipTimes.length).toBe(church.worshipTimes.length);
  });

  it('rejects content that is not bilingual', () => {
    expect(localizedSchema.safeParse({ th: 'มี', en: 'present' }).success).toBe(true);
    expect(localizedSchema.safeParse({ th: 'มี' }).success).toBe(false);
    expect(localizedSchema.safeParse({ th: 1, en: 2 }).success).toBe(false);
  });

  it('rejects a malformed hero (missing required CTA)', () => {
    const bad = { heading: { th: 'a', en: 'b' }, body: { th: 'a', en: 'b' } };
    expect(SECTIONS.hero.schema.safeParse(bad).success).toBe(false);
  });
});
