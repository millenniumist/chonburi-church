import { NextResponse } from 'next/server';
import { getMissionBySlug, DEFAULT_LOCALE } from '@/lib/missions';
import { withLogging, logError } from '@/lib/logger';

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
};

async function getHandler(request, { params }) {
  const { slug } = params;
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale') || DEFAULT_LOCALE;

  try {
    const mission = await getMissionBySlug(slug, { locale });
    if (!mission) {
      return NextResponse.json(
        { error: 'Mission not found' },
        { status: 404, headers: CACHE_HEADERS }
      );
    }

    return NextResponse.json(mission, {
      headers: CACHE_HEADERS,
    });
  } catch (error) {
    logError(request, error, { operation: 'get_mission', slug });
    return NextResponse.json(
      { error: 'Unable to load mission' },
      { status: 500, headers: CACHE_HEADERS }
    );
  }
}

export const GET = withLogging(getHandler);
