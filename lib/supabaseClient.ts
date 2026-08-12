import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const FALLBACK_URL = 'https://placeholder.supabase.co';
const FALLBACK_KEY = 'placeholder-key';

function resolveSupabaseEnv() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim() || FALLBACK_URL;
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim() || FALLBACK_KEY;
  const isPlaceholder = url === FALLBACK_URL || anonKey === FALLBACK_KEY || !url.startsWith('http');
  return { url, anonKey, isPlaceholder };
}

let client: SupabaseClient | null = null;

function createSafeClient(): SupabaseClient {
  const { url, anonKey, isPlaceholder } = resolveSupabaseEnv();

  if (isPlaceholder && typeof window !== 'undefined') {
    console.warn(
      'Supabase public env vars missing — using placeholder client (offline/local mode).',
    );
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: typeof window !== 'undefined' && !isPlaceholder,
      autoRefreshToken: typeof window !== 'undefined' && !isPlaceholder,
      detectSessionInUrl: false,
    },
    global: {
      fetch: async (...args) => {
        try {
          return await fetch(...args);
        } catch (err) {
          console.warn('Supabase endpoint unreachable. Operating in offline/local mode:', err);
          return new Response(JSON.stringify({ error: 'Network unavailable' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      },
    },
  });
}

/** Shared browser/edge-safe Supabase client (never throws on missing env). */
export const supabase: SupabaseClient = (() => {
  try {
    client = createSafeClient();
    return client;
  } catch (err) {
    console.warn('Supabase client init failed; retrying with placeholders:', err);
    client = createClient(FALLBACK_URL, FALLBACK_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return client;
  }
})();

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;
  return supabase;
}
