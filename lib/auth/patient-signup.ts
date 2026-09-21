import type { AuthError, AuthResponse } from '@supabase/supabase-js';

import { extractErrorMessage } from '@/lib/auth/parseAuthError';
import type { SupabaseClient } from '@supabase/supabase-js';

export type PatientSignUpMetadata = {
  full_name: string;
  phone: string;
  role: 'PATIENT';
  hospital_id: string;
  hospital_name?: string | null;
  hospital_code?: string | null;
};

export function logSupabaseAuthError(context: string, error: AuthError | null | undefined): void {
  if (!error) return;
  const label = error.message || error.name || 'Auth error';
  console.warn(`Auth request failed [${context}]:`, label);
}

/** True when Auth returned 500 due to DB trigger / profile provisioning — not a network fault. */
export function isDatabaseTriggerSignupError(error: AuthError | null | undefined): boolean {
  if (!error) return false;
  if (error.name === 'AuthRetryableFetchError') return false;

  const message = extractErrorMessage(error).toLowerCase();
  if (!message) return false;

  return (
    message.includes('database error') ||
    message.includes('saving new user') ||
    message.includes('trigger') ||
    message.includes('profiles') ||
    message.includes('duplicate key')
  );
}

export async function signUpPatientAccount(
  supabase: SupabaseClient,
  params: {
    email: string;
    password: string;
    metadata: PatientSignUpMetadata;
  },
): Promise<AuthResponse> {
  const email = params.email.trim().toLowerCase();

  let withMetadata: AuthResponse;
  try {
    withMetadata = await supabase.auth.signUp({
      email,
      password: params.password,
      options: {
        data: params.metadata,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('Network or fetch error reaching Supabase [signUp(metadata)]:', message || 'fetch failed');
    return {
      data: { user: null, session: null },
      error: {
        name: 'AuthRetryableFetchError',
        message: message || '{}',
        status: 500,
      } as AuthError,
    };
  }

  if (!withMetadata.error) {
    return withMetadata;
  }

  logSupabaseAuthError('signUp(metadata)', withMetadata.error);

  if (!isDatabaseTriggerSignupError(withMetadata.error)) {
    return withMetadata;
  }

  console.warn(
    '[patient-auth] Metadata signup failed (likely auth.users → profiles trigger). Retrying plain signup…',
  );

  try {
    const plain = await supabase.auth.signUp({
      email,
      password: params.password,
    });

    if (plain.error) {
      logSupabaseAuthError('signUp(plain)', plain.error);
    }

    return plain;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('Network or fetch error reaching Supabase [signUp(plain)]:', message || 'fetch failed');
    return {
      data: { user: null, session: null },
      error: {
        name: 'AuthRetryableFetchError',
        message: message || '{}',
        status: 500,
      } as AuthError,
    };
  }
}
