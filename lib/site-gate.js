// Optional whole-site password (set SITE_PASSWORD, e.g. on the dev
// environment only). The cookie holds a hash of the password, so changing
// the password logs everyone out.
export const GATE_COOKIE = 'site_gate';

export async function gateToken(password) {
  const data = new TextEncoder().encode(`${password}:chonburi-site-gate`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}
