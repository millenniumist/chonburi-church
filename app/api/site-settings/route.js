import { NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/payload-cms';
import { withLogging, logError } from '@/lib/logger';

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
};

async function getHandler(request) {
  try {
    const payload = await getPayloadClient();
    const settings = await payload.findGlobal({ slug: 'site-settings' });
    return NextResponse.json(
      { colorTheme: settings?.colorTheme || 'bw' },
      { headers: CACHE_HEADERS }
    );
  } catch (error) {
    logError(request, error, { operation: 'fetch_site_settings' });
    return NextResponse.json({ colorTheme: 'bw' }, { headers: CACHE_HEADERS });
  }
}

export const GET = withLogging(getHandler);
