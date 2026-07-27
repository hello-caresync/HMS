import { supabase } from '@/lib/supabaseClient';

/** Browser Supabase client for Realtime subscriptions (doctor portal). */
export function getSupabaseBrowserClient() {
  if (typeof window === 'undefined') return null;
  return supabase;
}

export { supabase };
