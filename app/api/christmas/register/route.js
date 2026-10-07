import { NextResponse, after } from 'next/server';
import { randomBytes } from 'node:crypto';
import { getPayloadClient } from '@/lib/payload-cms';
import { getChristmasEvent, validateAnswers, displayNameFor } from '@/lib/christmas';
import { sendEmail } from '@/lib/brevo';
import { firstEmailAnswer, renderChristmasEmail } from '@/lib/christmas-email';
import { withLogging, logError, logger } from '@/lib/logger';

async function postHandler(request) {
  try {
    const event = await getChristmasEvent();
    if (!event.enabled) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
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

    // Confirmation email runs after the response so Brevo can't slow or
    // break registration; the outcome is recorded on the registration.
    const to = firstEmailAnswer(event.formFields, answers);
    const ticketUrl = `${new URL(request.url).origin}/christmas/ticket/${registration.tId}`;
    after(async () => {
      let emailStatus = 'skipped';
      try {
        if (to) {
          const mail = renderChristmasEmail({ event, registration, ticketUrl });
          ({ status: emailStatus } = await sendEmail({
            to: { email: to, name: registration.displayName || undefined },
            ...mail,
            tags: ['christmas-registration'],
          }));
        }
      } catch (error) {
        emailStatus = 'failed';
        logger.error({ err: error.message, tId: registration.tId }, 'christmas confirmation email failed');
      }
      await payload.update({ collection: 'christmas-registrations', id: registration.id, data: { emailStatus } });
    });

    return NextResponse.json({ tId: registration.tId }, { status: 201 });
  } catch (error) {
    logError(request, error, { operation: 'christmas_register' });
    return NextResponse.json({ error: 'Unable to register' }, { status: 500 });
  }
}

export const POST = withLogging(postHandler);
