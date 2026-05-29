import { cache } from 'react';
import { redirect } from 'next/navigation';
import { getSessionToken } from '@/lib/auth/cookies';
import { validateSessionToken } from '@/lib/auth/session';
import type { User, UserRole } from '@/lib/db/schema';

/**
 * The current signed-in user, or null. Wrapped in React `cache` so multiple
 * calls within one request hit the session store only once.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = await getSessionToken();
  if (!token) return null;
  const { user } = await validateSessionToken(token);
  return user;
});

/** Require any signed-in user; redirect to /login otherwise. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

/** Require one of the given roles; redirect home otherwise. */
export async function requireRole(...roles: UserRole[]): Promise<User> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect('/');
  return user;
}

/** Require a user who is allowed to place orders (the qualification gate). */
export async function requireOrderingEnabled(): Promise<User> {
  const user = await requireUser();
  if (!user.orderingEnabled) redirect('/account');
  return user;
}

export {
  generateSessionToken,
  createSession,
  validateSessionToken,
  invalidateSession,
  invalidateAllUserSessions,
} from '@/lib/auth/session';
export { hashPassword, verifyPassword } from '@/lib/auth/password';
export { setSessionCookie, deleteSessionCookie, getSessionToken } from '@/lib/auth/cookies';
