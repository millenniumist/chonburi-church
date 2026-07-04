import { prisma } from './prisma';

// Bulletin PDFs live in Cloudinary (cloudinaryUrl column); serverless has no persistent disk.

/**
 * Get all bulletins with pagination
 */
export async function getBulletins({ page = 1, limit = 20, activeOnly = true } = {}) {
  try {
    const where = activeOnly ? { isActive: true } : {};
    
    const [bulletins, total] = await Promise.all([
      prisma.bulletin.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.bulletin.count({ where }),
    ]);

    return {
      bulletins,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
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
    return await prisma.bulletin.findUnique({
      where: { id },
    });
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
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return await prisma.bulletin.findFirst({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching bulletin by date:', error);
    throw error;
  }
}

/**
 * Create new bulletin
 */
export async function createBulletin(data) {
  try {
    return await prisma.bulletin.create({
      data,
    });
  } catch (error) {
    console.error('Error creating bulletin:', error);
    throw error;
  }
}

/**
 * Update bulletin
 */
export async function updateBulletin(id, data) {
  try {
    return await prisma.bulletin.update({
      where: { id },
      data,
    });
  } catch (error) {
    console.error('Error updating bulletin:', error);
    throw error;
  }
}

/**
 * Delete bulletin (DB record; the Cloudinary asset is left orphaned — harmless)
 */
export async function deleteBulletin(id) {
  try {
    const bulletin = await getBulletinById(id);
    if (!bulletin) {
      throw new Error('Bulletin not found');
    }

    return await prisma.bulletin.delete({
      where: { id },
    });
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
