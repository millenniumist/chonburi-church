import { NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/payload-cms';
import { withLogging, logError } from '@/lib/logger';

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
};

async function getHandler(request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale') || 'th';

  try {
    const payload = await getPayloadClient();
    const landing = await payload.findGlobal({
      slug: 'landing-page',
      locale,
      fallbackLocale: 'th',
    });
    // An uploaded/selected image wins over the pasted URL; components only
    // ever see a resolved imageUrl string.
    for (const key of ['hero', 'featured', 'promo']) {
      const section = landing?.[key];
      if (section && typeof section === 'object') {
        section.imageUrl = section.image?.url || section.imageUrl;
        delete section.image;
      }
    }
    return NextResponse.json(landing, { headers: CACHE_HEADERS });
  } catch (error) {
    logError(request, error, { operation: 'fetch_landing_page' });
    return NextResponse.json(
      { error: 'Unable to load landing content' },
      { status: 500, headers: CACHE_HEADERS }
    );
  }
}

export const GET = withLogging(getHandler);
