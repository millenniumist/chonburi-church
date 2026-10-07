import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { getPayloadClient } from '@/lib/payload-cms';
import { getChristmasEvent, validateAnswers, displayNameFor } from '@/lib/christmas';
import { withLogging, logError } from '@/lib/logger';

async function postHandler(request) {
  try {
    const event = await getChristmasEvent();
    if (!event.showForm) {
      return NextResponse.json({ error: 'Registration is closed' }, { status: 403 });
    }

    const body = await request.json();
    if (body?.pdpaConsent !== true) {
      return NextResponse.json({ error: 'Consent is required' }, { status: 400 });
    }
    const { answers, error } = validateAnswers(event.formFields, body?.answers);
    if (error) return NextResponse.json({ error }, { status: 400 });

    const payload = await getPayloadClient();
    const registration = await payload.create({
      collection: 'christmas-registrations',
      data: {
        tId: randomBytes(4).toString('hex'),
        displayName: displayNameFor(event.formFields, answers),
        summary: Object.values(answers).filter((v) => v !== null && v !== false).join(' · ').slice(0, 500),
        answers,
        eventYear: event.eventDate ? new Date(event.eventDate).getFullYear() : new Date().getFullYear(),
        attendance: false,
        pdpaConsent: true,
      },
    });

    return NextResponse.json({ tId: registration.tId }, { status: 201 });
  } catch (error) {
    logError(request, error, { operation: 'christmas_register' });
    return NextResponse.json({ error: 'Unable to register' }, { status: 500 });
  }
}

export const POST = withLogging(postHandler);
