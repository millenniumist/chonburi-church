import { expect, test } from '@playwright/test';

/**
 * Editorial CMS round-trip (ADR-0004). Asserts the load-bearing flow for this
 * slice:
 *   1. A signed-out visitor cannot reach `/admin/content` (auth redirect).
 *   2. An admin edits the hero heading on `/admin/content`, saves, and the
 *      public landing reflects the new heading.
 *
 * Runs against the seeded throwaway DB the Playwright `globalSetup` prepares
 * (`drizzle-kit push --force` + `npm run db:seed`). The seed creates the admin
 * user `admin@church.local` / `change-me-now` (overridable via SEED_ADMIN_*).
 */

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@church.local';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'change-me-now';

async function login(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/login');
  await page.locator('#email').fill(ADMIN_EMAIL);
  await page.locator('#password').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: /เข้าสู่ระบบ|sign in|log in|login/i }).click();
  // Login redirects away from /login on success.
  await page.waitForURL((url) => !url.pathname.startsWith('/login'));
}

test('signed-out visitor is redirected away from /admin/content', async ({ page }) => {
  await page.goto('/admin/content');
  // requireUser() redirects to /login; requireRole would redirect to / — either
  // way the visitor must NOT land on the editor.
  await expect(page).not.toHaveURL(/\/admin\/content/);
});

test('admin edits the hero heading and the public landing reflects it', async ({ page }) => {
  const unique = `Hero edited ${Date.now()}`;

  await login(page);

  await page.goto('/admin/content');
  await expect(page).toHaveURL(/\/admin\/content/);

  // The hero heading (Thai field) is the first heading input in the Hero card.
  const heroThai = page.locator('#hero-heading-th');
  await expect(heroThai).toBeVisible();
  await heroThai.fill(unique);

  // Save the Hero section: its Save button is the first one on the page.
  await page.getByRole('button', { name: /บันทึก|save/i }).first().click();

  // Wait for the success toast (sonner) before navigating.
  await expect(page.getByText(/บันทึกเนื้อหาแล้ว|content saved/i)).toBeVisible();

  // The public landing (Thai default) renders the hero heading in an <h1>.
  await page.goto('/');
  await expect(page.locator('h1').filter({ hasText: unique })).toBeVisible();
});
