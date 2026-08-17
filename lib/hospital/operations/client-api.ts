import { createClient } from '@/lib/supabase/client';

/** Try App Router API first; fall back to direct Supabase ops (static export / Cloudflare). */
export async function postHospitalApi<T>(
  path: string,
  body: Record<string, unknown>,
  fallback: () => Promise<T>,
): Promise<T> {
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) return (await res.json()) as T;
  } catch {
    /* API unavailable in static export */
  }
  return fallback();
}

export function getOpsSupabase() {
  return createClient();
}
