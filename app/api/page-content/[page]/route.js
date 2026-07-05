import { NextResponse } from 'next/server';
import { getPageContent } from '@/lib/page-content';
import { withLogging, logError } from '@/lib/logger';

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
};

async function getHandler(request, { params }) {
  const { page } = params;
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale') || 'th';
  const section = searchParams.getAll('section');

  if (!page) {
    return NextResponse.json(
      { error: 'Page parameter is required' },
      {
        status: 400,
        headers: CACHE_HEADERS,
      }
    );
  }

  try {
    const sections = section.length
      ? await getPageContent({ page, sections: section, locale })
      : await getPageContent({ page, locale });

    return NextResponse.json(
      {
        page,
        sections,
      },
      {
        headers: CACHE_HEADERS,
      }
    );
  } catch (error) {
    logError(request, error, { operation: 'fetch_page_content', page });
    return NextResponse.json(
      { error: 'Unable to load page content' },
      {
        status: 500,
        headers: CACHE_HEADERS,
      }
    );
  }
}

export const GET = withLogging(getHandler);
