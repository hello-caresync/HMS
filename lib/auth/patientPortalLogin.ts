import type { SupabaseClient } from '@supabase/supabase-js';

import { PATIENT_RBAC_DENIED } from '@/lib/auth/patient-profile';

export type PatientProfileRow = {
  id: string;
  role: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  hospital_id?: string | null;
};

export type PatientPortalAuthResult =
  | { ok: true; profile: PatientProfileRow; userId: string }
  | { ok: false; error: string }
  | { ok: false; fallback: true };

const INVALID_CREDENTIALS = 'Invalid email or password. Please verify your credentials.';

function normalizeRole(role: string | null | undefined): string {
  return String(role ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
}

export async function authenticatePatientPortalLogin(
  supabase: SupabaseClient,
  emailInput: string,
  passwordInput: string,
): Promise<PatientPortalAuthResult> {
  const email = emailInput.trim().toLowerCase();
  const password = passwordInput.trim();

  if (!email || !password || !email.includes('@')) {
    return { ok: false, fallback: true };
  }

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    return { ok: false, fallback: true };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, full_name, email, phone, hospital_id')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (profileError) {
    const message = String(profileError.message ?? '').toLowerCase();
    if (
      message.includes('does not exist') ||
      message.includes('relation') ||
      message.includes('schema cache')
    ) {
      await supabase.auth.signOut();
      return { ok: false, fallback: true };
    }
    await supabase.auth.signOut();
    return { ok: false, error: INVALID_CREDENTIALS };
  }

  if (!profile) {
    await supabase.auth.signOut();
    return { ok: false, fallback: true };
  }

  const role = normalizeRole(profile.role);

  if (role !== 'PATIENT') {
    await supabase.auth.signOut();
    return { ok: false, error: PATIENT_RBAC_DENIED };
  }

  return {
    ok: true,
    profile: profile as PatientProfileRow,
    userId: authData.user.id,
  };
}
