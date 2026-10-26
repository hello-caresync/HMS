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

/** True when Auth returned an existing account instead of creating a new one. */
export function signupIsExistingAccount(user: {
  identities?: unknown[] | null;
  created_at?: string | null;
}): boolean {
  if (user.identities && user.identities.length === 0) return true;
  const createdAt = user.created_at ? Date.parse(user.created_at) : Number.NaN;
  if (!Number.isFinite(createdAt)) return false;
  return Date.now() - createdAt > 2 * 60 * 1000;
}

function missingColumnName(message: string): string | null {
  const match =
    message.match(/Could not find the '([^']+)' column/i) ??
    message.match(/column [\w."]+\.([a-z_]+) does not exist/i);
  return match?.[1] ?? null;
}

function isMissingSchemaError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('does not exist') ||
    lower.includes('schema cache') ||
    lower.includes('could not find') ||
    lower.includes('relation')
  );
}

async function emailExistsInTable(
  supabase: SupabaseClient,
  table: 'patient_profiles' | 'patients' | 'profiles',
  email: string,
): Promise<boolean> {
  const { data, error } = await supabase.from(table).select('id').ilike('email', email).limit(1);
  if (error) return false;
  return Array.isArray(data) && data.length > 0;
}

/** One email, one patient account. profiles has no email column in this database. */
export async function patientEmailAlreadyRegistered(
  supabase: SupabaseClient,
  email: string,
): Promise<boolean> {
  const clean = email.trim().toLowerCase();
  if (!clean) return false;

  const tables = ['patient_profiles', 'patients', 'profiles'] as const;
  for (const table of tables) {
    if (await emailExistsInTable(supabase, table, clean)) return true;
  }
  return false;
}

/** Writes the registration email where the live schema can store it. */
export async function recordPatientRegistrationEmail(
  supabase: SupabaseClient,
  params: { userId: string; email: string; fullName: string; phone: string },
): Promise<void> {
  const row: Record<string, string> = {
    id: params.userId,
    email: params.email.trim().toLowerCase(),
    full_name: params.fullName.trim(),
    phone: params.phone.trim(),
  };

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const { error } = await supabase.from('patient_profiles').upsert(row, { onConflict: 'id' });
    if (!error) return;
    const missing = missingColumnName(error.message);
    if (missing && missing !== 'id' && missing !== 'email' && missing in row) {
      delete row[missing];
      continue;
    }
    const inserted = await supabase.from('patient_profiles').insert(row);
    if (!inserted.error) return;
    const insertMissing = missingColumnName(inserted.error.message);
    if (insertMissing && insertMissing !== 'id' && insertMissing !== 'email' && insertMissing in row) {
      delete row[insertMissing];
      continue;
    }
    return;
  }
}

export async function savePatientProfileRow(
  supabase: SupabaseClient,
  params: { userId: string; email: string; fullName: string; phone: string; hospitalId: string },
): Promise<string | null> {
  const row: Record<string, string> = {
    id: params.userId,
    email: params.email.trim().toLowerCase(),
    full_name: params.fullName.trim(),
    phone: params.phone.trim(),
    role: 'PATIENT',
    hospital_id: params.hospitalId,
  };

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { error } = await supabase.from('profiles').upsert(row, { onConflict: 'id' });
    if (!error) return null;
    const missing = missingColumnName(error.message);
    if (missing && missing !== 'id' && missing in row) {
      delete row[missing];
      continue;
    }
    if (isMissingSchemaError(error.message)) return null;
    return error.message;
  }
  return null;
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
