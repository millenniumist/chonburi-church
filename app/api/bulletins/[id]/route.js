import { NextResponse } from 'next/server';
import { getBulletinById } from '@/lib/bulletins';
import { withLogging, logError } from '@/lib/logger';

// GET - Serve bulletin file from Cloudinary
async function getHandler(request, { params }) {
  try {
    const bulletin = await getBulletinById(params.id);

    if (!bulletin || !bulletin.isActive) {
      return NextResponse.json({ error: 'Bulletin not found' }, { status: 404 });
    }

    if (bulletin.cloudinaryUrl) {
      return NextResponse.redirect(bulletin.cloudinaryUrl);
    }

    // No file available
    return NextResponse.json(
      { error: 'Bulletin file not available' },
      { status: 404 }
    );
  } catch (error) {
    logError(request, error, { operation: 'serve_bulletin', bulletin_id: params.id });
    return NextResponse.json(
      { error: 'Failed to serve bulletin', details: error.message },
      { status: 500 }
    );
  }
}

export const GET = withLogging(getHandler);
