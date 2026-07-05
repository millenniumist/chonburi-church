import { getPayloadClient } from '@/lib/payload-cms';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const payload = await getPayloadClient();
    const { docs } = await payload.find({
      collection: 'path-configs',
      where: { isEnabled: { equals: false } },
      limit: 1000,
    });

    const paths = docs.map(doc => doc.path);

    return NextResponse.json({ paths }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=59',
      },
    });
  } catch (error) {
    console.error('Failed to fetch path config:', error);
    return NextResponse.json({ paths: [] }, { status: 500 });
  }
}
