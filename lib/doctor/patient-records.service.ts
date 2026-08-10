import { supabase } from '@/lib/supabaseClient';

import { DOCTOR_STORAGE_KEYS, readJsonStorage, writeJsonStorage } from './storage-keys';

export type PatientProfileRecord = {
  patient_id: string;
  full_name: string;
  phone?: string | null;
  blood_group?: string | null;
  known_allergies?: string | null;
  chronic_conditions?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
};

export type FamilyMemberRecord = {
  id: string;
  patient_id: string;
  full_name: string;
  relation: string;
};

export type PatientClinicalBundle = {
  profile: PatientProfileRecord | null;
  familyMembers: FamilyMemberRecord[];
  source: 'database' | 'local' | 'none';
};

export async function fetchPatientClinicalBundle(
  patientName: string,
): Promise<PatientClinicalBundle> {
  const localProfile = readJsonStorage<PatientProfileRecord | null>(
    DOCTOR_STORAGE_KEYS.patientProfile,
    null,
  );
  const localFamily = readJsonStorage<FamilyMemberRecord[]>(DOCTOR_STORAGE_KEYS.familyMembers, []);

  let profile: PatientProfileRecord | null = localProfile;
  let familyMembers = localFamily;
  let source: PatientClinicalBundle['source'] = profile ? 'local' : 'none';

  try {
    const { data: profiles } = await supabase
      .from('patient_profiles')
      .select('*')
      .ilike('full_name', patientName)
      .limit(1);

    if (profiles?.[0]) {
      profile = profiles[0] as PatientProfileRecord;
      writeJsonStorage(DOCTOR_STORAGE_KEYS.patientProfile, profile);
      source = 'database';

      const { data: family } = await supabase
        .from('family_members')
        .select('id, patient_id, full_name, relation')
        .eq('patient_id', profile.patient_id);

      if (family?.length) {
        familyMembers = family as FamilyMemberRecord[];
        writeJsonStorage(DOCTOR_STORAGE_KEYS.familyMembers, familyMembers);
      }
    } else if (localProfile?.full_name === patientName) {
      profile = localProfile;
      source = 'local';
    }
  } catch {
    if (localProfile?.full_name === patientName) {
      profile = localProfile;
      source = 'local';
    }
  }

  return { profile, familyMembers, source };
}
