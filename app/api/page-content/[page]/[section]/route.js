import { NextResponse } from 'next/server';
import { getPageSection, DEFAULT_LOCALE } from '@/lib/page-content';
import { withLogging, logError } from '@/lib/logger';

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
};

async function getHandler(request, { params }) {
  const { page, section } = params;
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale') || DEFAULT_LOCALE;

  try {
    const record = await getPageSection(page, section, locale);
    if (!record) {
      return NextResponse.json({ error: 'Page content not found' }, { status: 404, headers: CACHE_HEADERS });
    }

    return NextResponse.json({ section: record }, { headers: CACHE_HEADERS });
  } catch (error) {
    logError(request, error, { operation: 'load_page_content_section', page, section });
    return NextResponse.json({ error: 'Unable to load page content section' }, { status: 500, headers: CACHE_HEADERS });
  }
}

export const GET = withLogging(getHandler);
