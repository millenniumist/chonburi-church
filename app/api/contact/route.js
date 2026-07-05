import { NextResponse } from 'next/server';
import { getContactInfo } from '@/lib/contact-info';
import { withLogging, logError } from '@/lib/logger';

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
};

async function getHandler(request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale') || 'th';

  try {
    const info = await getContactInfo(locale);
    if (!info) {
      return NextResponse.json(
        { error: 'Contact information not configured' },
        {
          status: 404,
          headers: CACHE_HEADERS,
        }
      );
    }
    return NextResponse.json(info, {
      headers: CACHE_HEADERS,
    });
  } catch (error) {
    logError(request, error, { operation: 'fetch_contact_info' });
    return NextResponse.json(
      { error: 'Unable to load contact info' },
      {
        status: 500,
        headers: CACHE_HEADERS,
      }
    );
  }
}

export const GET = withLogging(getHandler);
