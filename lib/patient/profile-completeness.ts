import type { SupabaseClient } from '@supabase/supabase-js';

import { fetchAuthenticatedPatientContact } from '@/lib/auth/patient-profile';
import { resolveActivePatientFormIdentity } from '@/lib/patient/portal-session';
import { loadPatientProfilePageState } from '@/lib/patient/patient-profile-page';
import type { PatientClinicalRecord } from '@/lib/patient/patients-record';
import {
  isProfileComplete,
  profileIncompleteBookingMessage,
  type PatientProfile,
  type ProfileCompletenessResult,
} from '@/lib/utils/profileCompleteness';

export function clinicalRecordToPatientProfile(
  record: PatientClinicalRecord,
): PatientProfile {
  const ageValue = record.age?.trim();
  return {
    id: record.patient_id,
    full_name: record.full_name,
    phone: record.phone,
    gender: record.gender,
    age: ageValue ? ageValue : undefined,
    address: record.address,
    emergency_contact_name: record.emergency_contact_name,
    emergency_contact_phone: record.emergency_contact_phone,
  };
}

/** Loads the signed-in patient's profile snapshot for booking eligibility checks. */
export async function loadPatientProfileForCompleteness(
  supabase: SupabaseClient,
): Promise<PatientProfile | null> {
  const identity = resolveActivePatientFormIdentity();
  if (!identity) return null;

  try {
    const pageState = await loadPatientProfilePageState(supabase);
    if (pageState?.profile) {
      return clinicalRecordToPatientProfile(pageState.profile);
    }
  } catch {
    /* fall through to auth contact */
  }

  const authContact = await fetchAuthenticatedPatientContact(supabase);
  return {
    id: identity.patient_id,
    full_name: authContact?.full_name || identity.patient_name,
    phone: authContact?.phone || identity.phone,
    gender: identity.gender,
    age: identity.age ?? undefined,
  };
}

export async function evaluatePatientProfileCompleteness(
  supabase: SupabaseClient,
): Promise<ProfileCompletenessResult & { profile: PatientProfile | null }> {
  const profile = await loadPatientProfileForCompleteness(supabase);
  const result = isProfileComplete(profile);
  return { ...result, profile };
}

export async function assertProfileCompleteForBooking(
  supabase: SupabaseClient,
): Promise<void> {
  const { complete, missingFields } = await evaluatePatientProfileCompleteness(supabase);
  if (!complete) {
    throw new Error(profileIncompleteBookingMessage(missingFields));
  }
}
