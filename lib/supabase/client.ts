import { createBrowserClient } from '@supabase/ssr';
import { createClient as createSupabaseJSClient } from '@supabase/supabase-js';

import { SERVICE_RESTRICTED_MESSAGE } from '@/lib/auth/parseAuthError';
import { readPublicSupabaseEnv } from '@/lib/supabase/env';

const { url: supabaseUrl, anonKey: supabaseAnonKey } = readPublicSupabaseEnv();

const PLACEHOLDER_MARKERS = [
  'your-project',
  'your-anon-key',
  'your_supabase',
  'placeholder',
  'changeme',
  'example.supabase.co',
  'xxxxxxxx',
] as const;

export type SupabaseConfigStatus =
  | { ok: true; url: string; anonKey: string }
  | { ok: false; reason: string };

let configWarningLogged = false;
let browserClient: ReturnType<typeof createBrowserClient> | ReturnType<typeof createSupabaseJSClient> | null =
  null;

function looksLikePlaceholder(value: string): boolean {
  const lower = value.toLowerCase();
  return PLACEHOLDER_MARKERS.some((marker) => lower.includes(marker));
}

/** Validates public Supabase env vars before auth/network calls. */
export function getSupabaseConfigStatus(): SupabaseConfigStatus {
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      ok: false,
      reason: 'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local',
    };
  }

  if (looksLikePlaceholder(supabaseUrl) || looksLikePlaceholder(supabaseAnonKey)) {
    return {
      ok: false,
      reason: 'Supabase environment variables still contain placeholder values',
    };
  }

  if (!/^https:\/\/.+/i.test(supabaseUrl)) {
    return {
      ok: false,
      reason: 'NEXT_PUBLIC_SUPABASE_URL must be a valid https URL',
    };
  }

  if (supabaseAnonKey.split('.').length !== 3) {
    return {
      ok: false,
      reason: 'NEXT_PUBLIC_SUPABASE_ANON_KEY does not look like a valid JWT',
    };
  }

  return { ok: true, url: supabaseUrl, anonKey: supabaseAnonKey };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfigStatus().ok;
}

/** Logs once and throws if Supabase is not configured for browser auth calls. */
export function assertSupabaseConfigured(): void {
  const status = getSupabaseConfigStatus();
  if (status.ok) return;

  if (typeof window !== 'undefined' && !configWarningLogged) {
    configWarningLogged = true;
    console.warn(`[supabase] ${status.reason}. Restart \`npm run dev\` after updating .env.local.`);
  }

  throw new Error(SERVICE_RESTRICTED_MESSAGE);
}

function logMissingConfigOnce(): void {
  if (configWarningLogged) return;
  const status = getSupabaseConfigStatus();
  if (status.ok) return;

  configWarningLogged = true;
  console.warn(`[supabase] ${status.reason}`);
}

export function createClient() {
  logMissingConfigOnce();

  const { url, anonKey } = readPublicSupabaseEnv();

  if (typeof window === 'undefined') {
    return createSupabaseJSClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  if (browserClient) return browserClient;

  try {
    browserClient = createBrowserClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch {
    browserClient = createSupabaseJSClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return browserClient;
}

/** Shared browser singleton for realtime subscriptions and legacy imports. */
export const supabase = createClient();

export function getSupabaseBrowserClient() {
  if (typeof window === 'undefined') return null;
  return supabase;
}
