import { getPayloadClient } from '@/lib/payload-cms';
import { getChristmasEvent } from '@/lib/christmas';

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

// Staff-only CSV of all Christmas registrations (Payload session cookie).
// Answer columns follow the current form config, then any older keys.
export async function GET(request) {
  const payload = await getPayloadClient();
  const { user } = await payload.auth({ headers: request.headers });
  if (!user) return new Response('Unauthorized', { status: 401 });

  const [{ formFields }, { docs }] = await Promise.all([
    getChristmasEvent(),
    payload.find({ collection: 'christmas-registrations', pagination: false, sort: 'createdAt', depth: 0 }),
  ]);

  const keys = formFields.map((f) => f.name);
  for (const d of docs) for (const k of Object.keys(d.answers || {})) if (!keys.includes(k)) keys.push(k);
  const labels = Object.fromEntries(formFields.map((f) => [f.name, f.label]));

  const header = ['ticket', ...keys.map((k) => labels[k] || k), 'attendance', 'staffNotes', 'eventYear', 'createdAt'];
  const rows = docs.map((d) =>
    [d.tId, ...keys.map((k) => d.answers?.[k]), d.attendance, d.staffNotes, d.eventYear, d.createdAt].map(csvCell).join(',')
  );

  return new Response('﻿' + [header.map(csvCell).join(','), ...rows].join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="christmas-registrations-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
