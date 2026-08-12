import { createBrowserClient } from '@supabase/ssr';
import { createClient as createSupabaseJSClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let browserClient: ReturnType<typeof createBrowserClient> | ReturnType<typeof createSupabaseJSClient> | null =
  null;

export function createClient() {
  if (browserClient) return browserClient;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      'CRITICAL: Missing Supabase environment variables! Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local',
    );
  }

  try {
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    browserClient = createSupabaseJSClient(supabaseUrl, supabaseAnonKey);
  }

  return browserClient;
}

/** Shared browser singleton for realtime subscriptions and legacy imports. */
export const supabase = createClient();

export function getSupabaseBrowserClient() {
  if (typeof window === 'undefined') return null;
  return supabase;
}
