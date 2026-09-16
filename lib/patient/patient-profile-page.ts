import type { SupabaseClient } from '@supabase/supabase-js';

import {
  PATIENT_SESSION_STORAGE_KEY,
  readPatientAuthSession,
} from '@/lib/auth/patientAuth';
import { REGAL_HOSPITAL_CODE } from '@/lib/regal/constants';
import { persistActivePatientNode } from '@/lib/patient/active-patient-node';
import {
  fetchPatientClinicalRecordByPhone,
  hasEmergencyContact,
  hasSavedClinicalData,
  mapPatientsRowToClinicalRecord,
  normalizePatientPhone,
  type PatientClinicalRecord,
} from '@/lib/patient/patients-record';
import {
  resolvePatientUhidForSave,
  upsertPatientProfileRecord,
} from '@/lib/db/patients';
import type { FamilyMember } from '@/lib/patient/family-members';
import {
  clinicalRecordToProfileData,
  loadLocalPatientProfile,
  mergeClinicalWithLocalCache,
  persistLocalPatientProfile,
  profileDataFamilyMembers,
  profileDataToClinicalRecord,
} from '@/lib/patient/profileStore';
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
  return !hasEmergencyContact(profile);
}

function hydrateProfileFromLocalCache(
  registeredBase: PatientProfileState,
  patientId: string,
): PatientProfileState {
  const local = loadLocalPatientProfile(patientId);
  if (!local) return registeredBase;
  return profileDataToClinicalRecord(local, registeredBase);
}

export async function loadPatientProfilePageState(
  supabase: SupabaseClient,
): Promise<{ profile: PatientProfileState; isNewUser: boolean; familyMembers: FamilyMember[] } | null> {
  const identity = resolveActivePatientFormIdentity();
  if (!identity) return null;

  const registeredBase = createEmptyPatientProfile(identity);
  const localCache = loadLocalPatientProfile(identity.patient_id);
  const localFamilyMembers = localCache ? profileDataFamilyMembers(localCache) : [];

  const phone = normalizePatientPhone(identity.phone);
  if (!phone) {
    const profile = hydrateProfileFromLocalCache(registeredBase, identity.patient_id);
    return {
      profile,
      isNewUser: !hasSavedClinicalData(profile) && localFamilyMembers.length === 0,
      familyMembers: localFamilyMembers,
    };
  }

  let profile = hydrateProfileFromLocalCache(registeredBase, identity.patient_id);
  let remoteFound = false;

  try {
    const row = await fetchPatientClinicalRecordByPhone(supabase, phone);
    if (row) {
      const remoteProfile = mapPatientsRowToClinicalRecord(row, registeredBase);
      profile = localCache
        ? mergeClinicalWithLocalCache(remoteProfile, profile)
        : remoteProfile;
      remoteFound = true;
    }
  } catch {
    /* fall back to local cache below */
  }

  const familyMembers =
    localFamilyMembers.length > 0 ? localFamilyMembers : [];

  return {
    profile,
    isNewUser: !remoteFound && !hasSavedClinicalData(profile) && familyMembers.length === 0,
    familyMembers,
  };
}

function syncSessionFromProfile(profile: PatientProfileState, uhid: string): void {
  if (typeof window === 'undefined') return;

  const resolvedUhid = uhid.trim();

  const authSession = readPatientAuthSession();
  if (authSession) {
    localStorage.setItem(
      PATIENT_SESSION_STORAGE_KEY,
      JSON.stringify({
        ...authSession,
        name: profile.full_name.trim(),
        phone: profile.phone.trim(),
        email: profile.email.trim(),
        uhid: resolvedUhid || authSession.uhid,
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
      uhid: resolvedUhid || portal.uhid,
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
  familyMembers: FamilyMember[] = [],
): Promise<PatientProfileState> {
  const identity = resolveActivePatientFormIdentity();
  if (!identity) {
    throw new Error('Session expired. Please log in again.');
  }

  const normalizedPhone = normalizePatientPhone(profile.phone.trim() || identity.phone);
  if (!normalizedPhone) {
    throw new Error('A verified phone number is required to save your profile.');
  }

  const normalizedProfile: PatientProfileState = {
    ...profile,
    patient_id: profile.patient_id || identity.patient_id,
    full_name: profile.full_name.trim() || identity.patient_name,
    phone: normalizedPhone,
    email: profile.email.trim() || identity.email,
    hospital_id: REGAL_HOSPITAL_CODE,
  };

  persistLocalPatientProfile(
    clinicalRecordToProfileData(
      normalizedProfile,
      familyMembers,
      identity.patient_id,
    ),
  );

  const portalSession = readPatientPortalSession();
  const authSession = readPatientAuthSession();
  const uhid = await resolvePatientUhidForSave(supabase, {
    hospitalId: REGAL_HOSPITAL_CODE,
    phone: normalizedPhone,
    sessionUhid: identity.uhid,
    portalUhid: portalSession?.uhid,
    authUhid: authSession?.uhid,
  });

  const savedRow = await upsertPatientProfileRecord(
    supabase,
    { ...normalizedProfile, familyMembers },
    uhid,
    REGAL_HOSPITAL_CODE,
  );

  const saved = mapPatientsRowToClinicalRecord(
    savedRow as Record<string, unknown>,
    createEmptyPatientProfile(identity),
  );
  syncSessionFromProfile(saved, uhid);
  return saved;
}
