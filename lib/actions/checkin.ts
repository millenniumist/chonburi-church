'use server';

import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { attendances, services, siteConfig, users } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth';
import { bangkokNow, timeToMinutes } from '@/lib/datetime';
import { haversineMeters } from '@/lib/geo';
import type { ActionResult } from '@/lib/forms';

/** Result payload of a check-in attempt. */
export type CheckInResult = {
  verified: boolean;
  distanceMeters: number;
  withinWindow: boolean;
  /** Was the user already allowed to order before this check-in? */
  alreadyQualified: boolean;
  /** The name (already localized-ready as a raw Th/En pair is not returned; this is the Thai name) of the active service window, if any. */
  serviceName: string | null;
};

const coordsSchema = z.object({
  lat: z.number().finite().min(-90).max(90),
  lng: z.number().finite().min(-180).max(180),
});

/**
 * GPS check-in. The browser only sends lat/lng; ALL verification happens here.
 *
 * Invariants (see CONTEXT.md):
 *  - The server computes haversine distance against the church coords and checks
 *    the current Bangkok time is inside an active service window.
 *  - One verified attendance flips a visitor's `orderingEnabled` to `true`.
 *  - At most one attendance per (user, serviceDate) — a second tap is idempotent.
 */
export async function checkInAction(input: {
  lat: number;
  lng: number;
}): Promise<ActionResult<CheckInResult>> {
  const user = await requireUser();

  const parsed = coordsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'ตำแหน่งไม่ถูกต้อง / Invalid location.' };
  }
  const { lat, lng } = parsed.data;

  const [config] = await db.select().from(siteConfig).where(eq(siteConfig.id, 1)).limit(1);
  if (!config) {
    return {
      ok: false,
      error: 'ยังไม่ได้ตั้งค่าตำแหน่งโบสถ์ / Church location is not configured yet.',
    };
  }

  const now = bangkokNow();

  // Find an active service whose window contains the current Bangkok time.
  const activeServices = await db
    .select()
    .from(services)
    .where(and(eq(services.active, true), eq(services.dayOfWeek, now.dayOfWeek)));

  const service =
    activeServices.find(
      (s) => timeToMinutes(s.startTime) <= now.minutes && now.minutes <= timeToMinutes(s.endTime),
    ) ?? null;

  const withinWindow = service !== null;

  const distanceMeters = haversineMeters(
    { lat: config.churchLat, lng: config.churchLng },
    { lat, lng },
  );
  const withinRadius = distanceMeters <= config.checkinRadiusMeters;

  const verified = withinWindow && withinRadius;

  // Capture the qualification state BEFORE we potentially flip it.
  const alreadyQualified = user.orderingEnabled;

  // Record the attendance. Idempotent on (userId, serviceDate): a second tap
  // the same day does nothing.
  await db
    .insert(attendances)
    .values({
      userId: user.id,
      serviceId: service?.id ?? null,
      serviceDate: now.date,
      latitude: lat,
      longitude: lng,
      distanceMeters,
      verified,
      method: 'gps',
    })
    .onConflictDoNothing({ target: [attendances.userId, attendances.serviceDate] });

  // A verified check-in qualifies a visitor to order.
  if (verified && user.role === 'visitor' && !user.orderingEnabled) {
    await db
      .update(users)
      .set({ orderingEnabled: true, updatedAt: new Date() })
      .where(eq(users.id, user.id));
  }

  return {
    ok: true,
    data: {
      verified,
      distanceMeters,
      withinWindow,
      alreadyQualified,
      serviceName: service?.nameTh ?? null,
    },
  };
}
