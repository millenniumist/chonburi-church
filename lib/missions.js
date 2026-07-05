// Missions are managed in the Payload CMS (Missions collection). The site
// reads them through the Payload local API; the legacy Prisma table in
// cc_financial is no longer read.
import { getPayloadClient, lexicalToText } from './payload-cms';

export const DEFAULT_LOCALE = 'th';

function toText(value) {
  if (typeof value === 'string') return value;
  return null;
}

function labelList(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => item?.label)
    .filter((label) => typeof label === 'string' && label.length > 0);
}

function imageList(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => item?.url)
    .filter((url) => typeof url === 'string' && url.length > 0);
}

// Payload stores scripture as a single textarea: line 1 is the reference,
// the remaining lines are the verse text.
function normalizeScripture(scripture) {
  if (typeof scripture !== 'string' || scripture.trim().length === 0) {
    return {
      reference: null,
      text: null,
    };
  }

  const trimmed = scripture.trim();
  const newlineIndex = trimmed.indexOf('\n');

  if (newlineIndex === -1) {
    return { reference: trimmed, text: null };
  }

  const reference = trimmed.slice(0, newlineIndex).trim();
  const text = trimmed.slice(newlineIndex + 1).trim();

  return {
    reference: reference || null,
    text: text || null,
  };
}

export function normalizeMission(record, locale = DEFAULT_LOCALE) {
  const title = toText(record.title);
  const theme = toText(record.theme);
  const summary = toText(record.summary);
  const description = lexicalToText(record.description) || null;
  const focusAreas = labelList(record.focusAreas);
  const scripture = normalizeScripture(record.scripture);
  const nextSteps = labelList(record.nextSteps);

  return {
    id: record.slug,
    slug: record.slug,
    title,
    theme,
    summary,
    description,
    focusAreas,
    scripture,
    nextSteps,
    pinned: Boolean(record.pinned),
    heroImageUrl: record.heroImageUrl ?? null,
    images: imageList(record.imageUrls),
    startDate: record.startDate ?? null,
    endDate: record.endDate ?? null,
    updatedAt: record.updatedAt,
    createdAt: record.createdAt,
    // Kept for shape compatibility; values are for the requested locale only
    // (the old Prisma admin that read the raw {th, en} objects is gone).
    translations: {
      title,
      theme,
      summary,
      description,
      focusAreas,
      scripture,
      nextSteps,
    },
  };
}

export async function getMissions({ page = 1, pageSize = 6, locale = DEFAULT_LOCALE, highlightOnly = false } = {}) {
  const payload = await getPayloadClient();

  const { docs: pinnedRecords } = await payload.find({
    collection: 'missions',
    locale,
    fallbackLocale: 'th',
    where: { pinned: { equals: true } },
    sort: '-updatedAt',
    pagination: false,
  });

  // If only highlights are requested, skip fetching regular missions and pagination
  if (highlightOnly) {
    return {
      pinned: pinnedRecords.map((mission) => normalizeMission(mission, locale)),
      missions: [],
      pagination: {
        page: 1,
        pageSize: 0,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  }

  const safePageSize = Math.max(1, pageSize);
  const requestedPage = Math.max(1, page);

  const baseQuery = {
    collection: 'missions',
    locale,
    fallbackLocale: 'th',
    where: { pinned: { equals: false } },
    sort: '-updatedAt',
    limit: safePageSize,
  };

  let result = await payload.find({ ...baseQuery, page: requestedPage });

  const totalItems = result.totalDocs;
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
  const safePage = Math.min(requestedPage, totalPages);

  // The old implementation clamped out-of-range pages to the last page.
  if (safePage !== requestedPage) {
    result = await payload.find({ ...baseQuery, page: safePage });
  }

  return {
    pinned: pinnedRecords.map((mission) => normalizeMission(mission, locale)),
    missions: result.docs.map((mission) => normalizeMission(mission, locale)),
    pagination: {
      page: safePage,
      pageSize: safePageSize,
      totalItems,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPreviousPage: safePage > 1,
    },
  };
}

export async function getMissionBySlug(slug, { locale = DEFAULT_LOCALE } = {}) {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: 'missions',
    locale,
    fallbackLocale: 'th',
    where: { slug: { equals: slug } },
    limit: 1,
  });

  const record = docs[0];
  return record ? normalizeMission(record, locale) : null;
}

export async function getAllMissions({ locale = DEFAULT_LOCALE } = {}) {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: 'missions',
    locale,
    fallbackLocale: 'th',
    sort: '-updatedAt',
    pagination: false,
  });

  const normalized = docs.map((mission) => normalizeMission(mission, locale));
  // Preserve the old ordering: pinned first, then by updatedAt desc.
  return [
    ...normalized.filter((mission) => mission.pinned),
    ...normalized.filter((mission) => !mission.pinned),
  ];
}
