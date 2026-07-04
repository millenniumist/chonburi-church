import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'node:crypto';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme';
// HMAC key for the session cookie — falls back to the admin password so no extra required env var.
const SESSION_SECRET = process.env.SESSION_SECRET || ADMIN_PASSWORD;
const SESSION_COOKIE_NAME = 'admin_session';

function sign(payload) {
  return createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
}

export async function verifyAdminAuth() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME);

  if (!session?.value) {
    return false;
  }

  try {
    const [payload, signature] = session.value.split('.');
    if (!payload || !signature) {
      return false;
    }
    const expected = Buffer.from(sign(payload));
    const actual = Buffer.from(signature);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
      return false;
    }

    const sessionData = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));

    // Check if session is expired (24 hours)
    if (Date.now() - sessionData.timestamp > 24 * 60 * 60 * 1000) {
      return false;
    }

    return sessionData.isAdmin === true;
  } catch {
    return false;
  }
}

export async function createAdminSession(username, password) {
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const sessionData = {
      isAdmin: true,
      username,
      timestamp: Date.now()
    };

    const payload = Buffer.from(JSON.stringify(sessionData)).toString('base64');
    const session = `${payload}.${sign(payload)}`;

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 // 24 hours
    });

    return true;
  }

  return false;
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
