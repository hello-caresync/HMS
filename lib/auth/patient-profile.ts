import type { SupabaseClient, User } from '@supabase/supabase-js';

export const PATIENT_RBAC_DENIED =
  'Access Denied: Clinicians and staff must use their designated portal.';

export type PatientProfileRecord = {
  id: string;
  role: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  hospital_id?: string | null;
};

function normalizeRole(role: string | null | undefined): string {
  return String(role ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
}

export function isAllowedPatientRole(role: string | null | undefined): boolean {
  return normalizeRole(role) === 'PATIENT';
}

export function resolvePatientDisplayName(user: User): string {
  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  const fromMeta = metadata?.full_name ?? metadata?.name;
  if (typeof fromMeta === 'string' && fromMeta.trim()) return fromMeta.trim();
  if (user.email) return user.email.split('@')[0] ?? 'Patient';
  return 'Patient';
}

export type AuthenticatedPatientContact = {
  full_name: string;
  phone: string;
  email: string;
  hospital_id: string | null;
};

/** Resolves contact fields for the signed-in auth user — never uses placeholder phones. */
export async function fetchAuthenticatedPatientContact(
  supabase: SupabaseClient,
): Promise<AuthenticatedPatientContact | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('full_name, phone, email, hospital_id')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    const message = String(error.message ?? '').toLowerCase();
    if (
      !message.includes('does not exist') &&
      !message.includes('relation') &&
      !message.includes('schema cache')
    ) {
      throw error;
    }
  }

  const metadata = user.user_metadata as Record<string, unknown> | undefined;

  return {
    full_name: String(profile?.full_name ?? metadata?.full_name ?? resolvePatientDisplayName(user)).trim(),
    phone: String(profile?.phone ?? metadata?.phone ?? '').trim(),
    email: String(profile?.email ?? user.email ?? '').trim(),
    hospital_id: profile?.hospital_id ? String(profile.hospital_id) : null,
  };
}

export async function ensurePatientProfile(
  supabase: SupabaseClient,
  user: User,
): Promise<{ ok: true; profile: PatientProfileRecord } | { ok: false; denied: true }> {
  const { data: existing, error: readError } = await supabase
    .from('profiles')
    .select('id, role, full_name, email, phone, hospital_id')
    .eq('id', user.id)
    .maybeSingle();

  if (readError) {
    const message = String(readError.message ?? '').toLowerCase();
    if (
      !message.includes('does not exist') &&
      !message.includes('relation') &&
      !message.includes('schema cache')
    ) {
      throw readError;
    }
  }

  if (!existing) {
    const fullName = resolvePatientDisplayName(user);
    const { data: inserted, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        full_name: fullName,
        role: 'PATIENT',
      })
      .select('id, role, full_name, email, phone, hospital_id')
      .maybeSingle();

    if (insertError || !inserted) {
      throw insertError ?? new Error('Could not provision patient profile.');
    }

    return { ok: true, profile: inserted as PatientProfileRecord };
  }

  if (!isAllowedPatientRole(existing.role)) {
    return { ok: false, denied: true };
  }

  return { ok: true, profile: existing as PatientProfileRecord };
}
