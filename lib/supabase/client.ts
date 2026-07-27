'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('⚠️ [supabase] Missing environment variables in .env.local');
}

let browserClient: SupabaseClient | null = null;

/** Singleton browser Supabase client for Client Components (Hospital + app UI). */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return browserClient;
}

/** Alias matching `@supabase/ssr` createClient naming in route handlers. */
export function createClient(): SupabaseClient {
  return getSupabaseBrowserClient();
}

export const supabase = getSupabaseBrowserClient();
