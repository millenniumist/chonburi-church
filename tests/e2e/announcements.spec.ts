import { expect, test, type Page } from '@playwright/test';

/**
 * Announcements CMS round-trip (ADR-0004). The seeded admin (see
 * tests/e2e/global-setup.ts → db:seed) edits the live announcement set and the
 * public landing reflects it. Also asserts the admin page is gated and the
 * public section degrades gracefully.
 *
 * Default locale is Thai (the `locale` cookie is unset → DEFAULT_LOCALE 'th'),
 * so assertions use Thai labels where the UI is bilingual.
 */

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@church.local';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'change-me-now';

async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel(/อีเมล|email/i).fill(ADMIN_EMAIL);
  await page.getByLabel(/รหัสผ่าน|password/i).fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: /เข้าสู่ระบบ|sign in|log in/i }).click();
  // Land somewhere authenticated.
  await page.waitForURL((url) => !url.pathname.startsWith('/login'));
}

test('non-admin is redirected away from the admin announcements page', async ({ page }) => {
  // Not logged in → requireRole('admin') redirects to /login (via requireUser).
  await page.goto('/admin/announcements');
  await expect(page).toHaveURL(/\/login/);
});

test('public landing renders without crashing (graceful section)', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.ok()).toBeTruthy();
  await expect(page.locator('body')).toBeVisible();
});

test('admin creates + publishes an announcement and it appears on the public page; a draft does not', async ({
  page,
}) => {
  const stamp = Date.now();
  const liveTitleTh = `ประกาศทดสอบเผยแพร่ ${stamp}`;
  const liveTitleEn = `Published test ${stamp}`;
  const draftTitleTh = `ประกาศฉบับร่าง ${stamp}`;
  const draftTitleEn = `Draft test ${stamp}`;

  await loginAsAdmin(page);
  await page.goto('/admin/announcements');
  await expect(page).toHaveURL(/\/admin\/announcements/);

  // ── Create a DRAFT (no publish date) ──────────────────────────────────────
  await page.getByRole('button', { name: /เพิ่มประกาศ|new announcement/i }).first().click();
  const draftDialog = page.getByRole('dialog');
  await draftDialog.getByLabel(/หัวข้อ \(ไทย\)|title \(thai\)/i).fill(draftTitleTh);
  await draftDialog.getByLabel(/หัวข้อ \(อังกฤษ\)|title \(english\)/i).fill(draftTitleEn);
  await draftDialog.getByLabel(/เนื้อหา \(ไทย\)|body \(thai\)/i).fill('ร่าง');
  await draftDialog.getByLabel(/เนื้อหา \(อังกฤษ\)|body \(english\)/i).fill('draft body');
  await draftDialog.getByRole('button', { name: /เพิ่มประกาศ|add announcement/i }).click();
  await expect(draftDialog).toBeHidden();
  await expect(page.getByText(draftTitleTh)).toBeVisible();

  // ── Create a row, then publish it ─────────────────────────────────────────
  await page.getByRole('button', { name: /เพิ่มประกาศ|new announcement/i }).first().click();
  const liveDialog = page.getByRole('dialog');
  await liveDialog.getByLabel(/หัวข้อ \(ไทย\)|title \(thai\)/i).fill(liveTitleTh);
  await liveDialog.getByLabel(/หัวข้อ \(อังกฤษ\)|title \(english\)/i).fill(liveTitleEn);
  await liveDialog.getByLabel(/เนื้อหา \(ไทย\)|body \(thai\)/i).fill('เผยแพร่');
  await liveDialog.getByLabel(/เนื้อหา \(อังกฤษ\)|body \(english\)/i).fill('published body');
  await liveDialog.getByRole('button', { name: /เพิ่มประกาศ|add announcement/i }).click();
  await expect(liveDialog).toBeHidden();

  // Find the live row and publish it.
  const liveRow = page.getByRole('row', { name: new RegExp(escapeRe(liveTitleTh)) });
  await expect(liveRow).toBeVisible();
  await liveRow.getByRole('button', { name: /เผยแพร่|publish/i }).click();
  await expect(liveRow.getByText(/เผยแพร่อยู่|live/i)).toBeVisible();

  // ── Public page reflects it: published shows, draft hidden ────────────────
  await page.goto('/');
  await expect(page.getByText(liveTitleTh)).toBeVisible();
  await expect(page.getByText(draftTitleTh)).toHaveCount(0);
});

/** Escape a string for use inside a RegExp. */
function escapeRe(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
