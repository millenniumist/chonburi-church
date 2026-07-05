import { NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/payload-cms';
import { withLogging, logError } from '@/lib/logger';

async function postHandler(request) {
  try {
    const body = await request.json();
    const { name, email, message } = body;

    if (!name || !message) {
      return NextResponse.json(
        { error: 'Name and message are required' },
        { status: 400 }
      );
    }

    const payload = await getPayloadClient();
    const feedback = await payload.create({
      collection: 'feedback',
      data: {
        name,
        email: email || null,
        message,
        status: 'NEW',
      },
    });

    return NextResponse.json({ success: true, id: feedback.id }, { status: 201 });
  } catch (error) {
    logError(request, error, { operation: 'submit_feedback' });
    return NextResponse.json(
      { error: 'Unable to submit feedback' },
      { status: 500 }
    );
  }
}

export const POST = withLogging(postHandler);
