import { expect, test } from '@playwright/test';

/**
 * Images slice e2e (ADR-0004): the admin can attach an image URL to a class
 * offering, and the public /classes page renders it. A class with no image
 * renders no class <img> at all (graceful absence — the keystone chose "no
 * broken image" over a placeholder for classes), and the page never errors.
 *
 * Seed fixtures (lib/db/seed.ts): admin admin@church.local / change-me-now and
 * three active classes (english-p1-p6, guitar, japanese-basic), none of which
 * has an imageUrl out of the box — so the public page starts image-free.
 *
 * NOTE on placement: playwright `testDir` is `tests/e2e`, so this spec lives
 * here alongside cms.spec.ts (the slice plan labelled it "e2e/images.spec.ts").
 */

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@church.local';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'change-me-now';

// A deterministic, syntactically valid image URL the public page must echo.
const CLASS_IMAGE_URL = 'https://example.com/e2e-class-image.webp';

async function loginAsAdmin(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/login');
  await page.locator('#email').fill(ADMIN_EMAIL);
  await page.locator('#password').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: /เข้าสู่ระบบ|Log in/ }).click();
  // loginAction redirects to /account on success.
  await page.waitForURL(/\/account|\/$/);
}

test.describe('class images (admin → public)', () => {
  test('public /classes renders without error before any image is set', async ({ page }) => {
    const response = await page.goto('/classes');
    expect(response?.ok()).toBeTruthy();
    // The classes heading is always present; the page must not 500 just because
    // offerings have no imageUrl (graceful absence).
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('admin sets a class image URL and the public page renders it', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/classes');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Open the edit dialog for the first class via its Edit (แก้ไข) trigger.
    await page.getByRole('button', { name: /แก้ไข|Edit/ }).first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Fill the new Image URL field and save.
    const imageInput = dialog.locator('#imageUrl');
    await expect(imageInput).toBeVisible();
    await imageInput.fill(CLASS_IMAGE_URL);
    await dialog.getByRole('button', { name: /^(บันทึก|Save)$/ }).click();

    // Dialog closes on a successful save.
    await expect(dialog).toBeHidden();

    // The public classes page now shows an <img> with the saved src.
    await page.goto('/classes');
    const img = page.locator(`img[src="${CLASS_IMAGE_URL}"]`);
    await expect(img).toBeVisible();
  });

  test('admin clearing the image URL removes it from the public page', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/classes');
    await page.getByRole('button', { name: /แก้ไข|Edit/ }).first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const imageInput = dialog.locator('#imageUrl');
    await imageInput.fill('');
    await dialog.getByRole('button', { name: /^(บันทึก|Save)$/ }).click();
    await expect(dialog).toBeHidden();

    // The previously-set image must be gone (empty string coerced to null).
    await page.goto('/classes');
    await expect(page.locator(`img[src="${CLASS_IMAGE_URL}"]`)).toHaveCount(0);
    // …and the page still renders fine.
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
