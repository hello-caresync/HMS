import type { PrismaClient } from '@prisma/client';

type PrismaGlobal = typeof globalThis & {
  __nexoraPrisma?: PrismaClient;
  __nexoraPrismaPromise?: Promise<PrismaClient>;
};

/**
 * Lazy, shared Prisma client for edge route handlers.
 * Dynamic import keeps WASM/query engine in one async chunk across routes.
 */
export async function getPrisma(): Promise<PrismaClient> {
  const g = globalThis as PrismaGlobal;
  if (g.__nexoraPrisma) return g.__nexoraPrisma;

  if (!g.__nexoraPrismaPromise) {
    g.__nexoraPrismaPromise = import('@prisma/client').then(({ PrismaClient }) => {
      const client = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      });
      g.__nexoraPrisma = client;
      return client;
    });
  }

  return g.__nexoraPrismaPromise;
}
