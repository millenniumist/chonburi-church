import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

// On Vercel the Neon integration owns DATABASE_URL (shared database, public schema).
// APP_DATABASE_URL points the app at its own `cc_financial` schema; unset locally.
const datasourceUrl = process.env.APP_DATABASE_URL || process.env.DATABASE_URL;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(datasourceUrl ? { datasourceUrl } : {}),
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function getPrisma() {
  return prisma;
}

export function getDatabaseStatus() {
  return {
    currentDatabase: 'primary',
    failureCount: 0,
    lastFailoverTime: null,
    isHealthy: true,
    secondaryAvailable: false,
  };
}
