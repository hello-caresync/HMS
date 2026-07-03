import { createClient } from "@supabase/supabase-js";

/**
 * Shared Supabase browser client for CuraSync.
 * Used across all roles for auth, queries, and realtime subscriptions.
 */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
