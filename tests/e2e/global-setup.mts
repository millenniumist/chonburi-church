import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/**
 * Playwright global setup (ADR-0004): bring the test database to a known state
 * before any spec runs. Pushes the Drizzle schema (`drizzle-kit push`, no
 * migration files needed) and seeds it via `npm run db:seed`. Both honour the
 * DATABASE_URL the app and webServer use, so e2e runs against a real, seeded DB.
 *
 * Point DATABASE_URL at a throwaway database before running `npm run e2e`.
 */
export default async function globalSetup(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is not set — e2e global setup needs a (throwaway) test database. See .env.example.',
    );
  }

  const run = (command: string, args: string[]): void => {
    execFileSync(command, args, { cwd: rootDir, stdio: 'inherit' });
  };

  // Push the current schema (creates/updates tables to match lib/db/schema.ts).
  run('npx', ['drizzle-kit', 'push', '--force']);
  // Seed deterministic fixtures (admin user, site content, sample announcements).
  run('npm', ['run', 'db:seed']);
}
