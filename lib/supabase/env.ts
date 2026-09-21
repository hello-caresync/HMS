/** Normalized public Supabase credentials for browser + server clients. */
export function normalizeSupabaseUrl(raw: string | undefined): string {
  return raw?.trim().replace(/\/+$/, '') ?? '';
}

export function normalizeSupabaseAnonKey(raw: string | undefined): string {
  return raw?.trim() ?? '';
}

export function readPublicSupabaseEnv(): { url: string; anonKey: string } {
  return {
    url: normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: normalizeSupabaseAnonKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  };
}
