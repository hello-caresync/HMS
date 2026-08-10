import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    // Graceful fetch interceptor to swallow uncaught "Failed to fetch" browser exceptions
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

export function getSupabaseBrowserClient() {
  return supabase;
}