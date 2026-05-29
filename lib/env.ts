import { z } from 'zod';

/**
 * Validated server environment. Importing this anywhere on the server guarantees
 * the required variables exist and are well-formed — fail fast at boot, not at
 * the first request. Never import this from a Client Component.
 */
const schema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SESSION_COOKIE_NAME: z.string().min(1).default('cag_session'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', z.flattenError(parsed.error).fieldErrors);
  throw new Error('Invalid environment variables');
}

export const env = parsed.data;
