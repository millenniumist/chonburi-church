// Contact info lives in the Payload CMS "Contact Info" global; edits happen
// in the Payload admin. Fetched with locale 'all' so localized fields come
// back as { th, en } objects, matching the shape of the old Prisma JSON
// columns that pickLocalized/mapWorshipTimes were written against.
import { getPayloadClient } from '@/lib/payload-cms';

const DEFAULT_LOCALE = 'th';

function pickLocalized(value, locale = DEFAULT_LOCALE) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    return value[locale] ?? value.th ?? value.en ?? null;
  }
  return null;
}

function mapWorshipTimes(times, locale = DEFAULT_LOCALE) {
  if (!Array.isArray(times)) return [];

  return times.map((entry, index) => ({
    id: index,
    day: pickLocalized(entry.day, locale),
    event: pickLocalized(entry.event, locale),
    time: entry.time ?? null,
    raw: entry,
  }));
}

async function findContactInfoRecord() {
  const payload = await getPayloadClient();
  return payload.findGlobal({
    slug: 'contact-info',
    locale: 'all',
    fallbackLocale: 'th',
  });
}

export async function getContactInfo(locale = DEFAULT_LOCALE) {
  const record = await findContactInfoRecord();
  if (!record) return null;

  return {
    name: pickLocalized(record.name, locale),
    nameTranslations: record.name,
    phone: record.phone,
    email: record.email,
    address: {
      raw: record.address,
      th: pickLocalized(record.address, 'th'),
      en: pickLocalized(record.address, 'en'),
      current: pickLocalized(record.address, locale),
    },
    social: record.social ?? {},
    mapEmbedUrl: record.mapEmbedUrl,
    coordinates: record.coordinates ?? null,
    worshipTimes: mapWorshipTimes(record.worshipTimes, locale),
    raw: record,
  };
}

export async function getContactInfoTranslations() {
  const record = await findContactInfoRecord();
  if (!record) return null;
  return record;
}
