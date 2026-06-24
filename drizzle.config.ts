import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Load .env.local first (gitignored, local overrides), then .env.
config({ path: '.env.local' });
config({ path: '.env' });

// Prefer a direct (unpooled) connection for DDL when present — e.g. Neon injects
// DATABASE_URL_UNPOOLED alongside the pooled DATABASE_URL. Migrations run cleaner
// over a direct connection than through a transaction pooler.
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL is not set — needed for drizzle-kit. See .env.example.');
}

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url },
  casing: 'snake_case',
  verbose: true,
  strict: true,
});
