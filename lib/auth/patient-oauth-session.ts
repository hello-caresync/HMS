import type { SupabaseClient } from '@supabase/supabase-js';

import {
  ensurePatientProfile,
  PATIENT_RBAC_DENIED,
  type PatientProfileRecord,
} from '@/lib/auth/patient-profile';
import { persistPatientAuthSession, type PatientAuthSession } from '@/lib/auth/patientAuth';

function mintUhid(): string {
  return `NX-PAT-${Math.floor(1000 + Math.random() * 9000)}`;
}

/** Sync local patient session from an active Supabase Auth session (email/password). */
export async function syncPatientSessionFromSupabase(
  supabase: SupabaseClient,
): Promise<{ ok: true; session: PatientAuthSession } | { ok: false; error: string }> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return { ok: false, error: 'No Supabase session.' };
  }

  const profileResult = await ensurePatientProfile(supabase, session.user);

  if (!profileResult.ok) {
    await supabase.auth.signOut();
    return { ok: false, error: PATIENT_RBAC_DENIED };
  }

  const profile: PatientProfileRecord = profileResult.profile;
  const metadata = session.user.user_metadata as Record<string, unknown> | undefined;

  const patientSession = persistPatientAuthSession({
    patientId: session.user.id,
    uhid: mintUhid(),
    email: String(profile.email ?? session.user.email ?? ''),
    name: String(profile.full_name ?? metadata?.full_name ?? 'Patient'),
    phone: String(profile.phone ?? metadata?.phone ?? ''),
    hospitalId: String(profile.hospital_id ?? metadata?.hospital_id ?? 'HOSP-01'),
    hospitalName: 'Regal Multispeciality Hospital',
  });

  return { ok: true, session: patientSession };
}
