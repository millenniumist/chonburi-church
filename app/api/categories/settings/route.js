import { NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/payload-cms';
import { withLogging, logError } from '@/lib/logger';

const CACHE_HEADERS = {
  'Cache-Control': 'no-store, must-revalidate',
};

// GET - Retrieve category settings
async function getHandler(request) {
  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get('year');
  const year = yearParam ? Number.parseInt(yearParam, 10) : new Date().getFullYear();

  try {
    const payload = await getPayloadClient();
    const { docs } = await payload.find({
      collection: 'category-settings',
      where: { year: { equals: year } },
      limit: 1,
    });
    const settings = docs[0];

    if (settings) {
      return NextResponse.json(settings.settings, {
        headers: CACHE_HEADERS,
      });
    }

    // Return default empty settings if none exist
    return NextResponse.json(
      {
        incomeRows: [],
        expenseRows: [],
      },
      {
        headers: CACHE_HEADERS,
      }
    );
  } catch (error) {
    logError(request, error, { operation: 'load_category_settings', year });
    return NextResponse.json(
      { error: 'Unable to load category settings' },
      {
        status: 500,
        headers: CACHE_HEADERS,
      }
    );
  }
}

export const GET = withLogging(getHandler);
