import { useEcosystemStore } from '@/lib/ecosystem/store';
import type { FamilyMember } from '@/lib/ecosystem/types';
import { getSupabaseBrowserClient } from '@/lib/supabase';

import {
  defaultProfileForm,
  FALLBACK_FACILITIES,
  fallbackFamilyMembers,
  loadLocalFamily,
  loadLocalPreferredHospital,
  loadLocalProfile,
  saveLocalFamily,
  saveLocalPreferredHospital,
  saveLocalProfile,
} from './fallback-data';
import type {
  FacilityFilter,
  FacilityRow,
  FamilyMemberInput,
  FamilyMemberRecord,
  FamilyMemberRow,
  MedicalFacility,
  PatientProfileForm,
  PatientProfileRow,
} from './types';

function mapProfileRow(row: PatientProfileRow): PatientProfileForm {
  return {
    patientId: row.patient_id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone ?? '',
    dateOfBirth: row.date_of_birth ?? '',
    gender: row.gender ?? '',
    bloodGroup: row.blood_group ?? '',
    streetAddress: row.street_address ?? '',
    city: row.city ?? '',
    pincode: row.pincode ?? '',
    emergencyContactName: row.emergency_contact_name ?? '',
    emergencyContactPhone: row.emergency_contact_phone ?? '',
    knownAllergies: row.known_allergies ?? '',
    chronicConditions: row.chronic_conditions ?? '',
    preferredHospitalId: row.preferred_hospital_id,
  };
}

function profileToRow(form: PatientProfileForm): Omit<PatientProfileRow, 'id' | 'updated_at'> {
  return {
    patient_id: form.patientId,
    full_name: form.fullName,
    email: form.email,
    phone: form.phone || null,
    date_of_birth: form.dateOfBirth || null,
    gender: form.gender || null,
    blood_group: form.bloodGroup || null,
    street_address: form.streetAddress || null,
    city: form.city || null,
    pincode: form.pincode || null,
    emergency_contact_name: form.emergencyContactName || null,
    emergency_contact_phone: form.emergencyContactPhone || null,
    known_allergies: form.knownAllergies || null,
    chronic_conditions: form.chronicConditions || null,
    preferred_hospital_id: form.preferredHospitalId,
  };
}

function mapFacilityRow(row: FacilityRow): MedicalFacility {
  return {
    id: row.id,
    facilityName: row.facility_name,
    facilityType: row.facility_type,
    address: row.address,
    city: row.city,
    areaPincode: row.area_pincode,
    distanceKm: Number(row.distance_km ?? 0),
  };
}

function mapFamilyRow(row: FamilyMemberRow): FamilyMemberRecord {
  return {
    id: row.id,
    primaryPatientId: row.primary_patient_id,
    fullName: row.full_name,
    relationship: row.relationship,
    dateOfBirth: row.date_of_birth ?? '',
    gender: row.gender ?? '',
    bloodGroup: row.blood_group ?? '',
    medicalNotes: row.medical_notes ?? '',
  };
}

function familyToEcosystem(member: FamilyMemberRecord): FamilyMember {
  const relationMap: Record<string, FamilyMember['relation']> = {
    Child: 'child',
    Father: 'parent',
    Mother: 'parent',
    Spouse: 'spouse',
  };
  return {
    id: member.id,
    primaryPatientId: member.primaryPatientId,
    fullName: member.fullName,
    relation: relationMap[member.relationship] ?? 'other',
    dateOfBirth: member.dateOfBirth,
    mrn: `FAM-${member.id.slice(0, 8).toUpperCase()}`,
  };
}

function syncFamilyToStore(members: FamilyMemberRecord[], patientId: string) {
  const others = useEcosystemStore.getState().familyMembers.filter(
    (m) => m.primaryPatientId !== patientId,
  );
  useEcosystemStore.setState({
    familyMembers: [...others, ...members.map(familyToEcosystem)],
  });
}

function syncProfileToStore(form: PatientProfileForm) {
  useEcosystemStore.getState().updatePatientProfile(form.patientId, {
    fullName: form.fullName,
    email: form.email,
    phone: form.phone,
    dateOfBirth: form.dateOfBirth,
    bloodGroup: form.bloodGroup,
    gender: form.gender,
    emergencyContactName: form.emergencyContactName,
    emergencyContactPhone: form.emergencyContactPhone,
  });
}

export async function fetchPatientProfile(patientId: string): Promise<PatientProfileForm> {
  const fallback = loadLocalProfile(patientId) ?? defaultProfileForm(patientId);
  const preferredLocal = loadLocalPreferredHospital(patientId);
  if (preferredLocal) fallback.preferredHospitalId = preferredLocal;

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    syncProfileToStore(fallback);
    return fallback;
  }

  try {
    const { data, error } = await supabase
      .from('patient_profiles')
      .select('*')
      .eq('patient_id', patientId)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      syncProfileToStore(fallback);
      return fallback;
    }

    const mapped = mapProfileRow(data as PatientProfileRow);
    if (!mapped.preferredHospitalId && preferredLocal) {
      mapped.preferredHospitalId = preferredLocal;
    }
    syncProfileToStore(mapped);
    return mapped;
  } catch {
    syncProfileToStore(fallback);
    return fallback;
  }
}

export async function upsertPatientProfile(form: PatientProfileForm): Promise<void> {
  saveLocalProfile(form);
  syncProfileToStore(form);

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;

  const { error } = await supabase.from('patient_profiles').upsert(
    { ...profileToRow(form), updated_at: new Date().toISOString() },
    { onConflict: 'patient_id' },
  );
  if (error) throw error;
}

export async function fetchFacilities(
  pincode: string,
  city: string,
  filter: FacilityFilter,
): Promise<MedicalFacility[]> {
  const supabase = getSupabaseBrowserClient();
  const pin = pincode.trim();
  const cityQ = city.trim();

  if (!supabase) {
    return filterFacilities(FALLBACK_FACILITIES, pin, cityQ, filter);
  }

  try {
    let query = supabase.from('hospitals_and_clinics').select('*').order('distance_km', { ascending: true });

    if (pin) {
      query = query.eq('area_pincode', pin);
    } else if (cityQ) {
      query = query.ilike('city', `%${cityQ}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    const mapped = ((data ?? []) as FacilityRow[]).map(mapFacilityRow);
    const result = mapped.length > 0 ? mapped : FALLBACK_FACILITIES;
    return filterFacilities(result, pin, cityQ, filter);
  } catch {
    return filterFacilities(FALLBACK_FACILITIES, pin, cityQ, filter);
  }
}

function filterFacilities(
  facilities: MedicalFacility[],
  pincode: string,
  city: string,
  filter: FacilityFilter,
): MedicalFacility[] {
  const pin = pincode.trim();
  const cityQ = city.trim().toLowerCase();

  return facilities.filter((f) => {
    const matchType =
      filter === 'all' ||
      (filter === 'hospital' && f.facilityType === 'hospital') ||
      (filter === 'clinic' && f.facilityType === 'clinic');
    const matchPin = !pin || f.areaPincode.includes(pin);
    const matchCity = !cityQ || f.city.toLowerCase().includes(cityQ);
    return matchType && (matchPin || matchCity || (!pin && !cityQ));
  });
}

export async function setPreferredHospital(
  patientId: string,
  facilityId: string,
  currentProfile: PatientProfileForm,
): Promise<PatientProfileForm> {
  saveLocalPreferredHospital(patientId, facilityId);
  const updated = { ...currentProfile, preferredHospitalId: facilityId };
  await upsertPatientProfile(updated);
  return updated;
}

export async function fetchFamilyMembers(patientId: string): Promise<FamilyMemberRecord[]> {
  const local = loadLocalFamily(patientId);
  const fallback = local ?? fallbackFamilyMembers(patientId);

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    syncFamilyToStore(fallback, patientId);
    return fallback;
  }

  try {
    const { data, error } = await supabase
      .from('patient_family_members')
      .select('*')
      .eq('primary_patient_id', patientId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const mapped = ((data ?? []) as FamilyMemberRow[]).map(mapFamilyRow);
    const result = mapped.length > 0 ? mapped : fallback;
    saveLocalFamily(patientId, result);
    syncFamilyToStore(result, patientId);
    return result;
  } catch {
    syncFamilyToStore(fallback, patientId);
    return fallback;
  }
}

export async function insertFamilyMember(
  patientId: string,
  input: FamilyMemberInput,
): Promise<FamilyMemberRecord> {
  const record: FamilyMemberRecord = {
    id: `fam-local-${Date.now()}`,
    primaryPatientId: patientId,
    ...input,
  };

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    const existing = loadLocalFamily(patientId) ?? fallbackFamilyMembers(patientId);
    const next = [...existing, record];
    saveLocalFamily(patientId, next);
    syncFamilyToStore(next, patientId);
    return record;
  }

  const { data, error } = await supabase
    .from('patient_family_members')
    .insert({
      primary_patient_id: patientId,
      full_name: input.fullName,
      relationship: input.relationship,
      date_of_birth: input.dateOfBirth || null,
      gender: input.gender || null,
      blood_group: input.bloodGroup || null,
      medical_notes: input.medicalNotes || null,
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) throw error;
  const mapped = mapFamilyRow(data as FamilyMemberRow);
  const all = await fetchFamilyMembers(patientId);
  saveLocalFamily(patientId, all);
  return mapped;
}

export async function updateFamilyMember(
  patientId: string,
  memberId: string,
  input: FamilyMemberInput,
): Promise<FamilyMemberRecord> {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    const existing = loadLocalFamily(patientId) ?? fallbackFamilyMembers(patientId);
    const next = existing.map((m) =>
      m.id === memberId ? { ...m, ...input } : m,
    );
    saveLocalFamily(patientId, next);
    syncFamilyToStore(next, patientId);
    return next.find((m) => m.id === memberId)!;
  }

  const { data, error } = await supabase
    .from('patient_family_members')
    .update({
      full_name: input.fullName,
      relationship: input.relationship,
      date_of_birth: input.dateOfBirth || null,
      gender: input.gender || null,
      blood_group: input.bloodGroup || null,
      medical_notes: input.medicalNotes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', memberId)
    .eq('primary_patient_id', patientId)
    .select('*')
    .single();

  if (error) throw error;
  await fetchFamilyMembers(patientId);
  return mapFamilyRow(data as FamilyMemberRow);
}

export async function deleteFamilyMember(patientId: string, memberId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    const existing = loadLocalFamily(patientId) ?? fallbackFamilyMembers(patientId);
    const next = existing.filter((m) => m.id !== memberId);
    saveLocalFamily(patientId, next);
    syncFamilyToStore(next, patientId);
    return;
  }

  const { error } = await supabase
    .from('patient_family_members')
    .delete()
    .eq('id', memberId)
    .eq('primary_patient_id', patientId);

  if (error) throw error;
  await fetchFamilyMembers(patientId);
}
