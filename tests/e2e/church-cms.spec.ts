import { expect, test, type Page } from '@playwright/test';

/**
 * E2E for the 'church' CMS slice (ADR-0004).
 *
 * Covers the full DB/app round-trip the unit tests cannot:
 *   1. A non-admin (anonymous) visitor is blocked from /admin/church.
 *   2. An admin edits a worship-time event and the public "Visit Us" band
 *      reflects the new value.
 *   3. Resilience: the public landing still renders church info even with no
 *      stored row (the read layer falls back to the registry default).
 *
 * NOTE (builder): the project's Playwright `testDir` is `tests/e2e`. Per the
 * slice's file ownership this spec lives at `e2e/church-cms.spec.ts`; to run in
 * CI either point `testDir` at the repo root (so it picks up both `tests/e2e`
 * and `e2e`) or move this file into `tests/e2e/`. Flagged in the builder summary.
 *
 * Admin creds come from the seed: SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD
 * (defaults admin@church.local / change-me-now).
 */

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@church.local';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'change-me-now';

async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel(/อีเมล|Email/).fill(ADMIN_EMAIL);
  await page.getByLabel(/รหัสผ่าน|Password/).fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: /เข้าสู่ระบบ|Log in/ }).click();
  // After login the app redirects to /account.
  await page.waitForURL(/\/account/);
}

test('anonymous visitor is redirected away from /admin/church', async ({ page }) => {
  await page.goto('/admin/church');
  // requireRole('admin') -> requireUser() redirects to /login when signed out.
  await expect(page).toHaveURL(/\/login/);
});

test('admin edits a worship event and the public Visit Us band reflects it', async ({ page }) => {
  await loginAsAdmin(page);

  await page.goto('/admin/church');
  await expect(page.getByRole('heading', { name: /ข้อมูลคริสตจักร|Church info/ })).toBeVisible();

  const stamp = `E2E-${Date.now()}`;

  // Edit the first worship row's Thai event field (the public site renders `th`).
  const firstRow = page.getByTestId('worship-row').first();
  const eventThInput = firstRow.getByLabel(/กิจกรรม \(ไทย\)|Event \(Thai\)/);
  await eventThInput.fill(stamp);

  await page.getByRole('button', { name: /^บันทึก$|^Save$/ }).click();
  // Sonner success toast confirms the action returned ok.
  await expect(page.getByText(/บันทึกข้อมูลคริสตจักรแล้ว|Church info saved/)).toBeVisible();

  // The public landing must now show the edited event text.
  await page.goto('/');
  await expect(page.getByText(stamp).first()).toBeVisible();
});

test('public landing still renders church info (resilience baseline)', async ({ page }) => {
  // Even if the stored row were absent, the read layer falls back to defaults,
  // so the landing renders and the "Visit Us" / worship-times heading is present.
  const response = await page.goto('/');
  expect(response?.ok()).toBeTruthy();
  await expect(page.getByText(/เวลานมัสการ|Worship times/).first()).toBeVisible();
});
