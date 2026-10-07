import { NextResponse } from 'next/server';
import { GATE_COOKIE, gateToken } from '@/lib/site-gate';

export async function POST(request) {
  const form = await request.formData();
  const password = String(form.get('password') || '');
  const next = String(form.get('next') || '/');
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/';
  const expected = process.env.SITE_PASSWORD;

  if (!expected || password !== expected) {
    const url = new URL('/unlock', request.url);
    url.searchParams.set('next', safeNext);
    url.searchParams.set('error', '1');
    return NextResponse.redirect(url, 303);
  }

  const res = NextResponse.redirect(new URL(safeNext, request.url), 303);
  res.cookies.set(GATE_COOKIE, await gateToken(expected), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
