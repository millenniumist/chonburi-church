import { describe, expect, it } from 'vitest';
import { SECTIONS, type ChurchContent } from '@/lib/cms/sections';
import { churchInputSchema, normalizeChurchInput } from '@/lib/cms/church-input';

/**
 * Pure-logic tests for the 'church' CMS slice (no DB). The validator + reshaping
 * helper live in `@/lib/cms/church-input` (free of `@/lib/db` / `next/cache`),
 * so the suite needs no boundary mocks; the `'use server'` action that consumes
 * them lives in `@/lib/actions/cms-church`.
 *
 * `churchInputSchema` is the STRICT validator the admin action runs at the
 * boundary: it layers real-world constraints (lat/lng ranges, email + URL
 * format, required worship-time fields) on top of the registry's loose
 * `church` schema. Its output must always satisfy `ChurchContent` so it can be
 * stored as `siteContent.church`.
 *
 * `normalizeChurchInput` is the FormData/object -> structured-shape transform
 * the client form serialises into (flat keys + a worshipTimes array).
 */

// A fully-valid structured church value (the strict schema's happy path).
const validInput: ChurchContent = {
  legalName: { th: 'คริสตจักรทดสอบ', en: 'Test Church' },
  phone: '033-126404',
  email: 'hello@example.com',
  address: { th: 'ที่อยู่', en: 'Address' },
  coordinates: { latitude: 13.36, longitude: 100.98 },
  mapEmbedUrl: 'https://www.google.com/maps/embed?pb=abc',
  mapsLink: 'https://www.google.com/maps/search/?api=1&query=13.36,100.98',
  social: {
    facebook: 'https://www.facebook.com/Test',
    facebookLive: 'https://www.facebook.com/Test/live/',
    youtube: 'https://www.youtube.com/@Test',
  },
  worshipTimes: [
    { day: { th: 'วันอาทิตย์', en: 'Sunday' }, time: '10:00', event: { th: 'นมัสการ', en: 'Worship' } },
  ],
};

describe('churchInputSchema', () => {
  it('accepts the content/site.ts church default', () => {
    const parsed = churchInputSchema.safeParse(SECTIONS.church.default);
    expect(parsed.success).toBe(true);
  });

  it('accepts a fully-valid church value', () => {
    expect(churchInputSchema.safeParse(validInput).success).toBe(true);
  });

  it('produces a value that satisfies the registry church schema (round-trips through DISPLAY storage)', () => {
    const parsed = churchInputSchema.parse(validInput);
    // Whatever the strict schema outputs must be storable as siteContent.church.
    expect(SECTIONS.church.schema.safeParse(parsed).success).toBe(true);
  });

  it('rejects latitude out of range (> 90)', () => {
    const bad = { ...validInput, coordinates: { latitude: 91, longitude: 100 } };
    expect(churchInputSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects latitude out of range (< -90)', () => {
    const bad = { ...validInput, coordinates: { latitude: -91, longitude: 100 } };
    expect(churchInputSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects longitude out of range (> 180)', () => {
    const bad = { ...validInput, coordinates: { latitude: 13, longitude: 181 } };
    expect(churchInputSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects longitude out of range (< -180)', () => {
    const bad = { ...validInput, coordinates: { latitude: 13, longitude: -181 } };
    expect(churchInputSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects a malformed email', () => {
    const bad = { ...validInput, email: 'not-an-email' };
    expect(churchInputSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects a malformed mapEmbedUrl', () => {
    const bad = { ...validInput, mapEmbedUrl: 'javascript:alert(1)' };
    expect(churchInputSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects a malformed social URL', () => {
    const bad = {
      ...validInput,
      social: { ...validInput.social, facebook: 'ftp://nope' },
    };
    expect(churchInputSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects a worship-time entry missing a field (no time)', () => {
    const bad = {
      ...validInput,
      worshipTimes: [{ day: { th: 'อา', en: 'Sun' }, event: { th: 'น', en: 'W' } }],
    };
    expect(churchInputSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects a worship-time entry whose `day` is not Localized', () => {
    const bad = {
      ...validInput,
      worshipTimes: [{ day: 'Sunday', time: '10:00', event: { th: 'น', en: 'W' } }],
    };
    expect(churchInputSchema.safeParse(bad).success).toBe(false);
  });

  it('requires legalName in both languages', () => {
    const bad = { ...validInput, legalName: { th: '', en: '' } };
    expect(churchInputSchema.safeParse(bad).success).toBe(false);
  });

  it('treats an empty optional URL (mapsLink) consistently as empty string, not a validation failure', () => {
    const parsed = churchInputSchema.safeParse({ ...validInput, mapsLink: '' });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.mapsLink).toBe('');
  });

  it('trims whitespace from string fields', () => {
    const parsed = churchInputSchema.parse({ ...validInput, phone: '  033-1  ' });
    expect(parsed.phone).toBe('033-1');
  });
});

describe('normalizeChurchInput', () => {
  it('builds the structured church shape from flat form fields + a worshipTimes array', () => {
    const flat = {
      legalNameTh: 'คริสตจักร',
      legalNameEn: 'Church',
      phone: '02-000-0000',
      email: 'a@b.com',
      addressTh: 'ที่อยู่',
      addressEn: 'Addr',
      latitude: '13.5',
      longitude: '100.5',
      mapEmbedUrl: 'https://maps/embed',
      mapsLink: 'https://maps/link',
      facebook: 'https://fb/x',
      facebookLive: 'https://fb/x/live',
      youtube: 'https://yt/x',
      worshipTimes: [
        { dayTh: 'อา', dayEn: 'Sun', time: '10:00', eventTh: 'น', eventEn: 'W' },
      ],
    };
    const shaped = normalizeChurchInput(flat);
    expect(shaped).toMatchObject({
      legalName: { th: 'คริสตจักร', en: 'Church' },
      coordinates: { latitude: 13.5, longitude: 100.5 },
      worshipTimes: [{ day: { th: 'อา', en: 'Sun' }, time: '10:00', event: { th: 'น', en: 'W' } }],
    });
    // The shaped value flows straight into the strict schema.
    expect(churchInputSchema.safeParse(shaped).success).toBe(true);
  });

  it('produces a coordinates pair that the strict schema rejects when out of range (no silent clamping)', () => {
    const shaped = normalizeChurchInput({
      legalNameTh: 'c', legalNameEn: 'c', phone: '', email: 'a@b.com',
      addressTh: '', addressEn: '', latitude: '999', longitude: '100',
      mapEmbedUrl: '', mapsLink: '', facebook: '', facebookLive: '', youtube: '',
      worshipTimes: [],
    });
    expect(churchInputSchema.safeParse(shaped).success).toBe(false);
  });
});
