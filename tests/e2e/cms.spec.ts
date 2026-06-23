import { expect, test } from '@playwright/test';

/**
 * CMS e2e harness (ADR-0004). The full round-trip specs (admin edit → public
 * reflects it; public stays up when a row is missing) are filled in by the
 * feature builders against the admin pages they create. This baseline asserts
 * the harness wiring: the seeded public landing renders.
 */
test('public landing renders (resilience baseline)', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.ok()).toBeTruthy();
  // The site name is the hero/footer brand; seeded from content/site.ts.
  await expect(page.locator('body')).toBeVisible();
});
