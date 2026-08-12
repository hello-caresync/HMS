import { supabase } from '@/lib/supabaseClient';
import { getDoctorSession } from '@/lib/doctor/session';
import { resolveDoctorIdFromDb } from '@/lib/doctor/command-center/supabase-service';
import type { DoctorRecord } from '@/lib/doctor/command-center/types';

export type AuthenticatedDoctor = DoctorRecord & {
  doctor_id: string;
  authEmail?: string;
  source: 'supabase_auth' | 'session';
};

/**
 * Strict Supabase Auth resolution — email must match a row in `doctors`.
 * Throws if the user is not authenticated or has no doctor profile.
 */
export async function requireSupabaseDoctorAuth(): Promise<AuthenticatedDoctor> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    throw new Error('Doctor is not logged in');
  }

  const { data: doctor, error } = await supabase
    .from('doctors')
    .select('*')
    .eq('email', user.email)
    .single();

  if (error || !doctor?.doctor_id) {
    throw error ?? new Error('Doctor profile not found for authenticated email');
  }

  return {
    ...(doctor as DoctorRecord),
    doctor_id: String(doctor.doctor_id),
    authEmail: user.email,
    source: 'supabase_auth',
  };
}

/**
 * Resolve logged-in clinician — Supabase Auth first, session fallback for local demo.
 */
export async function getAuthenticatedDoctor(): Promise<AuthenticatedDoctor> {
  try {
    return await requireSupabaseDoctorAuth();
  } catch {
    /* fall through to session-based resolution */
  }

  const session = getDoctorSession();
  const resolvedId = await resolveDoctorIdFromDb(
    session.employeeId,
    session.fullName || session.doctor_name,
    session.email,
  );

  if (resolvedId) {
    try {
      const { data: doctor } = await supabase
        .from('doctors')
        .select('*')
        .eq('doctor_id', resolvedId)
        .maybeSingle();

      if (doctor) {
        return {
          ...(doctor as DoctorRecord),
          doctor_id: String(doctor.doctor_id),
          authEmail: session.email,
          source: 'session',
        };
      }
    } catch {
      /* offline */
    }

    return {
      doctor_id: resolvedId,
      full_name: session.fullName || session.doctor_name,
      email: session.email,
      department: session.department,
      registration_number: session.employeeId,
      specialization: session.specialization,
      authEmail: session.email,
      source: 'session',
    };
  }

  throw new Error('Doctor is not logged in');
}
