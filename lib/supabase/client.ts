import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { supabase as browserSupabase } from '@/lib/supabaseClient';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

let edgeClient: SupabaseClient | null = null;

/** Edge/server Supabase client (optional). */
export function getSupabase(): SupabaseClient | null {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  if (!edgeClient) {
    edgeClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return edgeClient;
}

/** Browser Supabase client for Realtime subscriptions. */
export function getSupabaseBrowserClient() {
  if (typeof window === 'undefined') return null;
  return browserSupabase;
}

export { createClient, browserSupabase as supabase };
