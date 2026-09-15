import type { SupabaseClient } from '@supabase/supabase-js';

import {
  PATIENT_SESSION_STORAGE_KEY,
  readPatientAuthSession,
} from '@/lib/auth/patientAuth';
import { REGAL_HOSPITAL_CODE } from '@/lib/regal/constants';
import { persistActivePatientNode } from '@/lib/patient/active-patient-node';
import {
  clinicalRecordToPatientsRow,
  fetchPatientClinicalRecordByPhone,
  hasBaselineVitals,
  hasEmergencyContact,
  hasSavedClinicalData,
  mapPatientsRowToClinicalRecord,
  normalizePatientPhone,
  type PatientClinicalRecord,
} from '@/lib/patient/patients-record';
import {
  persistPatientPortalSession,
  readPatientPortalSession,
  resolveActivePatientFormIdentity,
  type ActivePatientFormIdentity,
} from '@/lib/patient/portal-session';

export type PatientProfileState = PatientClinicalRecord;

export function createEmptyPatientProfile(
  identity: ActivePatientFormIdentity,
): PatientProfileState {
  return {
    patient_id: identity.patient_id,
    full_name: identity.patient_name,
    phone: identity.phone,
    email: identity.email,
    age: '',
    gender: '',
    blood_group: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    allergies: '',
    chronic_conditions: '',
    current_medications: '',
    height_cm: '',
    weight_kg: '',
    bmi: '',
    blood_pressure: '',
    heart_rate_bpm: '',
    spo2_percentage: '',
    temperature_f: '',
    hospital_id: REGAL_HOSPITAL_CODE,
  };
}

export function isPatientProfileIncomplete(profile: PatientProfileState): boolean {
  return !hasEmergencyContact(profile) || !hasBaselineVitals(profile);
}

export async function loadPatientProfilePageState(
  supabase: SupabaseClient,
): Promise<{ profile: PatientProfileState; isNewUser: boolean } | null> {
  const identity = resolveActivePatientFormIdentity();
  if (!identity) return null;

  const registeredBase = createEmptyPatientProfile(identity);
  const phone = normalizePatientPhone(identity.phone);
  if (!phone) {
    return { profile: registeredBase, isNewUser: true };
  }

  try {
    const row = await fetchPatientClinicalRecordByPhone(supabase, phone);
    if (row) {
      const profile = mapPatientsRowToClinicalRecord(row, registeredBase);
      return {
        profile,
        isNewUser: !hasSavedClinicalData(profile),
      };
    }
  } catch {
    /* return clean registered base — no cross-account local cache */
  }

  return {
    profile: registeredBase,
    isNewUser: true,
  };
}

function syncSessionFromProfile(profile: PatientProfileState): void {
  if (typeof window === 'undefined') return;

  const authSession = readPatientAuthSession();
  if (authSession) {
    localStorage.setItem(
      PATIENT_SESSION_STORAGE_KEY,
      JSON.stringify({
        ...authSession,
        name: profile.full_name.trim(),
        phone: profile.phone.trim(),
        email: profile.email.trim(),
      }),
    );
  }

  const portal = readPatientPortalSession();
  if (portal) {
    persistPatientPortalSession({
      ...portal,
      patient_id: profile.patient_id,
      patient_name: profile.full_name.trim(),
      phone: profile.phone.trim(),
      email: profile.email.trim(),
      age: profile.age.trim() ? Number(profile.age) : null,
      gender: profile.gender.trim() || undefined,
    });
  }

  persistActivePatientNode(profile.patient_id, profile.full_name.trim());
  localStorage.setItem('patient_full_name', profile.full_name.trim());
}

export async function savePatientProfilePageState(
  supabase: SupabaseClient,
  profile: PatientProfileState,
): Promise<PatientProfileState> {
  const identity = resolveActivePatientFormIdentity();
  if (!identity) {
    throw new Error('Session expired. Please log in again.');
  }

  const normalizedPhone = normalizePatientPhone(profile.phone.trim() || identity.phone);
  if (!normalizedPhone) {
    throw new Error('A verified phone number is required to save your profile.');
  }

  const payload = clinicalRecordToPatientsRow({
    ...profile,
    patient_id: profile.patient_id || identity.patient_id,
    full_name: profile.full_name.trim() || identity.patient_name,
    phone: normalizedPhone,
    email: profile.email.trim() || identity.email,
    hospital_id: REGAL_HOSPITAL_CODE,
  });

  const { error } = await supabase
    .from('patients')
    .upsert(payload, { onConflict: 'phone' });

  if (error) {
    throw new Error(error.message || 'Could not save profile.');
  }

  const saved = mapPatientsRowToClinicalRecord(
    payload,
    createEmptyPatientProfile(identity),
  );
  syncSessionFromProfile(saved);
  return saved;
}
