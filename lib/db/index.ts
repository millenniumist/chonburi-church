import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '@/lib/env';
import * as schema from '@/lib/db/schema';

/**
 * One pooled Postgres connection per process. The pool is cached on globalThis
 * in dev so Next's hot-reload doesn't open a new pool on every edit. `max: 5`
 * matches the Raspberry Pi's modest connection budget.
 */
const globalForDb = globalThis as unknown as { __cagPool?: Pool };

const pool = globalForDb.__cagPool ?? new Pool({ connectionString: env.DATABASE_URL, max: 5 });

if (env.NODE_ENV !== 'production') globalForDb.__cagPool = pool;

export const db = drizzle({ client: pool, schema, casing: 'snake_case' });

export { schema };
