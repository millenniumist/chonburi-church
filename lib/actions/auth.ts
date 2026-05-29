'use server';

import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import {
  createSession,
  deleteSessionCookie,
  generateSessionToken,
  getSessionToken,
  hashPassword,
  invalidateSession,
  setSessionCookie,
  verifyPassword,
} from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { pick } from '@/lib/i18n';
import type { FormState } from '@/lib/forms';
import type { Locale } from '@/lib/i18n';

// ── Validation schemas (Zod at the boundary) ─────────────────────────────────

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email());

const signupSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: emailSchema,
  password: z.string().min(8).max(256),
  phone: z
    .string()
    .trim()
    .max(40)
    .optional()
    // Treat an empty string from the form as "not provided".
    .transform((v) => (v && v.length > 0 ? v : undefined)),
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(256),
});

// ── Bilingual messages ───────────────────────────────────────────────────────

function msg(th: string, en: string, locale: Locale): string {
  return pick(th, en, locale);
}

// ── signupAction ──────────────────────────────────────────────────────────────

export async function signupAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const locale = await getLocale();

  const parsed = signupSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    phone: formData.get('phone'),
  });

  if (!parsed.success) {
    return {
      status: 'error',
      message: msg('กรุณาตรวจสอบข้อมูลที่กรอก', 'Please check the form for errors.', locale),
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { name, email, password, phone } = parsed.data;

  // Reject duplicate emails before attempting to insert.
  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) {
    return {
      status: 'error',
      message: msg('อีเมลนี้ถูกใช้งานแล้ว', 'That email is already registered.', locale),
      fieldErrors: {
        email: [msg('อีเมลนี้ถูกใช้งานแล้ว', 'That email is already registered.', locale)],
      },
    };
  }

  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values({
      name,
      email,
      phone,
      passwordHash,
      role: 'visitor',
      orderingEnabled: false,
      locale,
    })
    .returning();

  if (!user) {
    return {
      status: 'error',
      message: msg('ไม่สามารถสร้างบัญชีได้ กรุณาลองใหม่', 'Could not create your account. Please try again.', locale),
    };
  }

  const token = generateSessionToken();
  const session = await createSession(token, user.id);
  await setSessionCookie(token, session.expiresAt);

  // redirect() throws — call it outside the try/catch (there is none here).
  redirect('/account');
}

// ── loginAction ────────────────────────────────────────────────────────────────

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const locale = await getLocale();

  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  // Use the same generic message for bad input and bad credentials so we don't
  // leak whether an email exists.
  const invalid: FormState = {
    status: 'error',
    message: msg('อีเมลหรือรหัสผ่านไม่ถูกต้อง', 'Invalid email or password.', locale),
  };

  if (!parsed.success) return invalid;

  const { email, password } = parsed.data;

  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user) return invalid;

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return invalid;

  const token = generateSessionToken();
  const session = await createSession(token, user.id);
  await setSessionCookie(token, session.expiresAt);

  redirect('/account');
}

// ── logoutAction ────────────────────────────────────────────────────────────────

export async function logoutAction(): Promise<void> {
  const token = await getSessionToken();
  if (token) await invalidateSession(token);
  await deleteSessionCookie();
  redirect('/');
}
