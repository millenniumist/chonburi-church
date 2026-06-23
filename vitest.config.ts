import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * Unit test harness (ADR-0004). Pure-logic tests only — no DB required.
 * Covers the section registry (schema validation, defaults) and the read-layer
 * fallback behaviour (with the db module mocked). Node environment; the `@/`
 * path alias mirrors tsconfig so imports match the app.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': rootDir,
    },
  },
  test: {
    environment: 'node',
    globals: true,
    // Keep e2e specs (Playwright) out of the Vitest run.
    include: ['tests/unit/**/*.test.ts', 'lib/**/*.test.ts'],
    exclude: ['node_modules', '.next', 'tests/e2e/**'],
  },
});
