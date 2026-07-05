import { getPayloadClient } from '@/lib/payload-cms';

// Bulletins live in the Payload CMS ('bulletins' collection); the PDF itself
// stays in Cloudinary and Payload stores its URL in fileUrl. Docs are mapped
// back to the legacy Prisma row shape consumers read (title {th,en},
// cloudinaryUrl, fileSize, localPath).

// Payload ids are numbers; route params arrive as strings.
function parseBulletinId(id) {
  if (typeof id === 'number') return Number.isInteger(id) ? id : null;
  if (typeof id !== 'string' || id.trim() === '') return null;
  const parsed = Number(id);
  return Number.isInteger(parsed) ? parsed : null;
}

function mapBulletin(doc) {
  if (!doc) return null;
  const file = doc.file && typeof doc.file === 'object' ? doc.file : null;
  return {
    id: doc.id,
    title: doc.title, // locale 'all' => { th, en }
    date: doc.date,
    localPath: null,
    cloudinaryUrl: doc.fileUrl || (file && file.url) || null,
    fileSize: (file && file.filesize) || null,
    isActive: doc.isActive,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * Get all bulletins with pagination
 */
export async function getBulletins({ page = 1, limit = 20, activeOnly = true } = {}) {
  try {
    const payload = await getPayloadClient();
    const { docs, totalDocs, totalPages } = await payload.find({
      collection: 'bulletins',
      locale: 'all',
      sort: '-date',
      page,
      limit,
      ...(activeOnly ? { where: { isActive: { equals: true } } } : {}),
    });

    return {
      bulletins: docs.map(mapBulletin),
      pagination: {
        page,
        limit,
        total: totalDocs,
        totalPages,
      },
    };
  } catch (error) {
    console.error('Error fetching bulletins:', error);
    throw error;
  }
}

/**
 * Get bulletin by ID
 */
export async function getBulletinById(id) {
  try {
    const bulletinId = parseBulletinId(id);
    if (bulletinId === null) return null;

    const payload = await getPayloadClient();
    const doc = await payload.findByID({
      collection: 'bulletins',
      id: bulletinId,
      locale: 'all',
      disableErrors: true,
    });

    return mapBulletin(doc);
  } catch (error) {
    console.error('Error fetching bulletin:', error);
    throw error;
  }
}

/**
 * Get bulletin by date
 */
export async function getBulletinByDate(date) {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const nextDay = new Date(startOfDay);
    nextDay.setDate(nextDay.getDate() + 1);

    const payload = await getPayloadClient();
    const { docs } = await payload.find({
      collection: 'bulletins',
      locale: 'all',
      where: {
        date: {
          greater_than_equal: startOfDay.toISOString(),
          less_than: nextDay.toISOString(),
        },
      },
      limit: 1,
    });

    return mapBulletin(docs[0] || null);
  } catch (error) {
    console.error('Error fetching bulletin by date:', error);
    throw error;
  }
}

/**
 * Create new bulletin
 * Accepts the legacy data shape ({ title: {th,en}, date, cloudinaryUrl, ... }).
 */
export async function createBulletin(data) {
  try {
    const payload = await getPayloadClient();
    const title = data.title || {};

    const created = await payload.create({
      collection: 'bulletins',
      locale: 'th',
      data: {
        title: title.th || title.en || '',
        date: data.date instanceof Date ? data.date.toISOString() : data.date,
        fileUrl: data.cloudinaryUrl || data.fileUrl || '',
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    if (title.en) {
      await payload.update({
        collection: 'bulletins',
        id: created.id,
        locale: 'en',
        data: { title: title.en },
      });
    }

    return await getBulletinById(created.id);
  } catch (error) {
    console.error('Error creating bulletin:', error);
    throw error;
  }
}

/**
 * Update bulletin
 * Accepts the legacy data shape ({ title: {th,en}, isActive, ... }).
 */
export async function updateBulletin(id, data) {
  try {
    const bulletinId = parseBulletinId(id);
    if (bulletinId === null) {
      throw new Error('Bulletin not found');
    }

    const payload = await getPayloadClient();

    const baseData = {};
    if (data.isActive !== undefined) baseData.isActive = data.isActive;
    if (data.date !== undefined) {
      baseData.date = data.date instanceof Date ? data.date.toISOString() : data.date;
    }
    if (data.cloudinaryUrl !== undefined || data.fileUrl !== undefined) {
      baseData.fileUrl = data.cloudinaryUrl || data.fileUrl || '';
    }
    if (data.title && data.title.th !== undefined) baseData.title = data.title.th;

    if (Object.keys(baseData).length > 0) {
      await payload.update({
        collection: 'bulletins',
        id: bulletinId,
        locale: 'th',
        data: baseData,
      });
    }

    if (data.title && data.title.en !== undefined) {
      await payload.update({
        collection: 'bulletins',
        id: bulletinId,
        locale: 'en',
        data: { title: data.title.en },
      });
    }

    return await getBulletinById(bulletinId);
  } catch (error) {
    console.error('Error updating bulletin:', error);
    throw error;
  }
}

/**
 * Delete bulletin (CMS record; the Cloudinary asset is left orphaned — harmless)
 */
export async function deleteBulletin(id) {
  try {
    const bulletinId = parseBulletinId(id);
    const bulletin = bulletinId === null ? null : await getBulletinById(bulletinId);
    if (!bulletin) {
      throw new Error('Bulletin not found');
    }

    const payload = await getPayloadClient();
    await payload.delete({
      collection: 'bulletins',
      id: bulletinId,
    });

    return bulletin;
  } catch (error) {
    console.error('Error deleting bulletin:', error);
    throw error;
  }
}

/**
 * Check if date is a Sunday
 */
export function isSunday(date) {
  return new Date(date).getDay() === 0;
}

/**
 * Format bulletin filename
 */
export function formatBulletinFilename(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `bulletin-${year}-${month}-${day}.pdf`;
}
