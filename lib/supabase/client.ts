import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

let browserClient: SupabaseClient | null = null;

/**
 * Creates or retrieves a single browser-side Supabase client instance.
 * Includes a custom fetch wrapper to gracefully handle network failures.
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (browserClient) {
    return browserClient;
  }

  browserClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      fetch: async (...args) => {
        try {
          return await fetch(...args);
        } catch (err) {
          console.warn('Supabase fetch notice (operating in offline/fallback mode):', err);
          return new Response(JSON.stringify({ error: 'Network connection unavailable' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      },
    },
  });

  return browserClient;
}

// Named export for convenience
export const supabase = getSupabaseBrowserClient();

// Default export
export default supabase;