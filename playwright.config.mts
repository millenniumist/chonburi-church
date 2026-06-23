import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { defineConfig, devices } from '@playwright/test';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

// Load env the same way the app does: .env.local first, then .env. A test DB can
// be pointed at via DATABASE_URL (e.g. a throwaway schema/database) — global
// setup pushes the schema and seeds it before any spec runs.
loadEnv({ path: path.join(rootDir, '.env.local') });
loadEnv({ path: path.join(rootDir, '.env') });

const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${PORT}`;

/**
 * End-to-end harness (ADR-0004). `globalSetup` pushes the Drizzle schema and
 * seeds the database addressed by DATABASE_URL, then the `webServer` boots the
 * Next.js dev app against the same DATABASE_URL. Specs assert the CMS round-trip
 * (admin edit → public reflects it) and resilience (public stays up when a row
 * is missing).
 */
export default defineConfig({
  testDir: path.join(rootDir, 'tests/e2e'),
  globalSetup: path.join(rootDir, 'tests/e2e/global-setup.mts'),
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    locale: 'th-TH',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `TZ=Asia/Bangkok next dev -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      TZ: 'Asia/Bangkok',
    },
  },
});
