import { NextResponse } from 'next/server';
import { getNavigationItems } from '@/lib/navigation';
import { getChristmasLink } from '@/lib/christmas';
import { withLogging, logError } from '@/lib/logger';

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
};

async function getHandler(request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale') || 'th';

  try {
    const [items, christmas] = await Promise.all([getNavigationItems({ locale }), getChristmasLink()]);
    if (christmas) {
      items.push({ id: 'christmas', href: christmas.href, label: christmas.label, order: 999, active: true });
    }
    return NextResponse.json(
      { items },
      {
        headers: CACHE_HEADERS,
      }
    );
  } catch (error) {
    logError(request, error, { operation: 'fetch_navigation_items' });
    return NextResponse.json(
      { error: 'Unable to load navigation items' },
      {
        status: 500,
        headers: CACHE_HEADERS,
      }
    );
  }
}

export const GET = withLogging(getHandler);
