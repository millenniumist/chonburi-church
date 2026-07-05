import { NextResponse } from 'next/server';
import { getMissions } from '@/lib/missions';
import { withLogging, logError } from '@/lib/logger';

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
};

async function getHandler(request) {
  const { searchParams } = new URL(request.url);
  const page = Number.parseInt(searchParams.get('page') || '1', 10);
  const pageSize = Number.parseInt(searchParams.get('pageSize') || '6', 10);
  const locale = searchParams.get('locale') || 'th';
  const highlightOnly = searchParams.get('highlightOnly') === 'true';

  try {
    const data = await getMissions({
      page: Number.isNaN(page) ? 1 : page,
      pageSize: Number.isNaN(pageSize) ? 6 : pageSize,
      locale,
      highlightOnly,
    });

    return NextResponse.json(data, {
      headers: CACHE_HEADERS,
    });
  } catch (error) {
    logError(request, error, { operation: 'fetch_missions' });
    return NextResponse.json(
      {
        error: 'Unable to fetch missions',
      },
      {
        status: 500,
        headers: CACHE_HEADERS,
      }
    );
  }
}

export const GET = withLogging(getHandler);
