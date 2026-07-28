/**
 * Prisma removed for Cloudflare Pages edge bundle size.
 * Doctor APIs use mock clinical data + optional Supabase (@/lib/supabase/client).
 */

export { getSupabase } from '@/lib/supabase/client';

/** @deprecated Prisma removed — use mock services in lib/doctor/server/clinical-service.ts */
export async function getPrisma(): Promise<never> {
  throw new Error('Prisma has been removed from the Doctor App. Use mock/Supabase data services.');
}
