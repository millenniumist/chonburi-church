import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '@/lib/env';
import * as schema from '@/lib/db/schema';

/**
 * One pooled Postgres connection per process, cached on globalThis so neither
 * Next's dev hot-reload nor a warm serverless invocation opens a fresh pool.
 *
 * On Vercel each serverless instance keeps its OWN pool, so `DB_POOL_MAX` stays
 * small (default 1) and `DATABASE_URL` must point at the provider's POOLED
 * endpoint (e.g. Neon's `-pooler` host), which fans many instances into a
 * bounded server-side connection count. See ADR-0006.
 */
const globalForDb = globalThis as unknown as { __cagPool?: Pool };

const pool =
  globalForDb.__cagPool ?? new Pool({ connectionString: env.DATABASE_URL, max: env.DB_POOL_MAX });

globalForDb.__cagPool = pool;

export const db = drizzle({ client: pool, schema, casing: 'snake_case' });

export { schema };
