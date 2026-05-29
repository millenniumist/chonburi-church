import { createHash, randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { sessions, users } from '@/lib/db/schema';
import type { Session, User } from '@/lib/db/schema';

const DAY_MS = 1000 * 60 * 60 * 24;
const SESSION_TTL_MS = DAY_MS * 30;
const RENEW_WHEN_WITHIN_MS = DAY_MS * 15;

/** A fresh, opaque session token — this is what goes in the cookie. */
export function generateSessionToken(): string {
  return randomBytes(24).toString('base64url');
}

/** The DB only ever stores the hash, so a leaked DB can't mint sessions. */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createSession(token: string, userId: string): Promise<Session> {
  const id = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const [session] = await db
    .insert(sessions)
    .values({ id, userId, expiresAt })
    .returning();
  // `returning()` always yields the inserted row here.
  return session as Session;
}

export type SessionValidationResult =
  | { session: Session; user: User }
  | { session: null; user: null };

export async function validateSessionToken(token: string): Promise<SessionValidationResult> {
  const id = hashToken(token);
  const [row] = await db
    .select({ session: sessions, user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, id));

  if (!row) return { session: null, user: null };

  const { session, user } = row;

  if (Date.now() >= session.expiresAt.getTime()) {
    await db.delete(sessions).where(eq(sessions.id, id));
    return { session: null, user: null };
  }

  // Sliding expiry: extend if we're inside the renewal window.
  if (Date.now() >= session.expiresAt.getTime() - RENEW_WHEN_WITHIN_MS) {
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await db.update(sessions).set({ expiresAt }).where(eq(sessions.id, id));
    session.expiresAt = expiresAt;
  }

  return { session, user };
}

export async function invalidateSession(token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
}

export async function invalidateAllUserSessions(userId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}
