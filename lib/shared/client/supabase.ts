import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseEnvConfig {
  url: string;
  anonKey: string;
}

/** Resolve Supabase credentials from process environment (server / edge safe). */
export function resolveSupabaseEnv(): SupabaseEnvConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      '@nexora/shared: Missing SUPABASE_URL / SUPABASE_ANON_KEY environment variables',
    );
  }

  return { url, anonKey };
}

/** Headless Supabase client factory — no Next.js or React dependencies. */
export function createHeadlessSupabaseClient(
  config?: Partial<SupabaseEnvConfig>,
): SupabaseClient {
  const resolved = config?.url && config?.anonKey ? (config as SupabaseEnvConfig) : resolveSupabaseEnv();
  return createClient(resolved.url, resolved.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Optional table name registry for typed service layers (extend as schema matures). */
export const SUPABASE_TABLES = {
  auditLogs: 'audit_logs',
  inventoryLedger: 'inventory_ledger',
  invoices: 'invoices',
  payments: 'payments',
  appointments: 'appointments',
  users: 'profiles',
} as const;

export type SupabaseTableName = (typeof SUPABASE_TABLES)[keyof typeof SUPABASE_TABLES];
