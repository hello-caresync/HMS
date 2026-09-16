import type { FamilyMember } from '@/lib/patient/family-members';
import type { PatientClinicalRecord } from '@/lib/patient/patients-record';

export interface PatientProfileData {
  patientId: string;
  fullName: string;
  phone: string;
  email: string;
  age: string;
  gender: string;
  bloodGroup: string;
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
  residentialAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  familyMembers: Array<{
    id: string;
    fullName: string;
    relationship: string;
    age: string;
    gender: string;
    bloodGroup?: string;
  }>;
  updatedAt: string;
}

export const PATIENT_PROFILE_STORAGE_PREFIX = 'regal_hospital_patient_profile';

export function patientProfileStorageKey(patientId: string): string {
  const scoped = String(patientId || '').trim();
  return scoped
    ? `${PATIENT_PROFILE_STORAGE_PREFIX}_${scoped}`
    : PATIENT_PROFILE_STORAGE_PREFIX;
}

function normalizeStoredFamilyMember(raw: Record<string, unknown>): PatientProfileData['familyMembers'][number] | null {
  const fullName = String(raw.fullName || raw.full_name || '').trim();
  if (!fullName) return null;

  return {
    id: String(raw.id || crypto.randomUUID()),
    fullName,
    relationship: String(raw.relationship || raw.relation || 'Other'),
    age: String(raw.age ?? '').trim(),
    gender: String(raw.gender || 'Other'),
    bloodGroup: raw.bloodGroup
      ? String(raw.bloodGroup)
      : raw.blood_group
        ? String(raw.blood_group)
        : undefined,
  };
}

function parseStoredProfile(raw: string | null, patientId: string): PatientProfileData | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const storedPatientId = String(parsed.patientId ?? parsed.patient_id ?? patientId).trim();
    if (storedPatientId && patientId && storedPatientId !== patientId) return null;

    const emergency = (parsed.emergencyContact ?? parsed.emergency_contact) as
      | Record<string, unknown>
      | undefined;
    const address = (parsed.residentialAddress ?? parsed.residential_address ?? parsed.address) as
      | Record<string, unknown>
      | undefined;
    const familyRaw = parsed.familyMembers ?? parsed.family_members;
    const familyMembers = Array.isArray(familyRaw)
      ? familyRaw
          .map((item) => normalizeStoredFamilyMember(item as Record<string, unknown>))
          .filter((item): item is PatientProfileData['familyMembers'][number] => Boolean(item))
      : [];

    return {
      patientId: storedPatientId || patientId,
      fullName: String(parsed.fullName ?? parsed.full_name ?? '').trim(),
      phone: String(parsed.phone ?? '').trim(),
      email: String(parsed.email ?? '').trim(),
      age: String(parsed.age ?? '').trim(),
      gender: String(parsed.gender ?? '').trim(),
      bloodGroup: String(parsed.bloodGroup ?? parsed.blood_group ?? '').trim(),
      emergencyContact: {
        name: String(emergency?.name ?? parsed.emergency_contact_name ?? '').trim(),
        phone: String(emergency?.phone ?? parsed.emergency_contact_phone ?? '').trim(),
        relation: String(emergency?.relation ?? parsed.emergency_contact_relation ?? '').trim(),
      },
      residentialAddress: {
        street: String(address?.street ?? parsed.address ?? '').trim(),
        city: String(address?.city ?? parsed.city ?? '').trim(),
        state: String(address?.state ?? parsed.state ?? '').trim(),
        postalCode: String(address?.postalCode ?? address?.postal_code ?? parsed.postal_code ?? '').trim(),
      },
      familyMembers,
      updatedAt: String(parsed.updatedAt ?? parsed.updated_at ?? new Date().toISOString()),
    };
  } catch {
    return null;
  }
}

export function loadLocalPatientProfile(patientId: string): PatientProfileData | null {
  if (typeof window === 'undefined' || !patientId.trim()) return null;
  return parseStoredProfile(
    localStorage.getItem(patientProfileStorageKey(patientId)),
    patientId,
  );
}

export function persistLocalPatientProfile(data: PatientProfileData): void {
  if (typeof window === 'undefined' || !data.patientId.trim()) return;

  const payload: PatientProfileData = {
    ...data,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(patientProfileStorageKey(data.patientId), JSON.stringify(payload));
}

export function clinicalRecordToProfileData(
  record: PatientClinicalRecord,
  familyMembers: FamilyMember[],
  patientId: string,
): PatientProfileData {
  return {
    patientId,
    fullName: record.full_name.trim(),
    phone: record.phone.trim(),
    email: record.email.trim(),
    age: record.age.trim(),
    gender: record.gender.trim(),
    bloodGroup: record.blood_group.trim(),
    emergencyContact: {
      name: record.emergency_contact_name.trim(),
      phone: record.emergency_contact_phone.trim(),
      relation: record.emergency_contact_relation.trim(),
    },
    residentialAddress: {
      street: record.address.trim(),
      city: record.city.trim(),
      state: record.state.trim(),
      postalCode: record.postal_code.trim(),
    },
    familyMembers: familyMembers.map((member) => ({
      id: member.id,
      fullName: member.fullName,
      relationship: member.relationship,
      age: member.age,
      gender: member.gender,
      bloodGroup: member.bloodGroup,
    })),
    updatedAt: new Date().toISOString(),
  };
}

export function profileDataToClinicalRecord(
  data: PatientProfileData,
  base: PatientClinicalRecord,
): PatientClinicalRecord {
  return {
    ...base,
    patient_id: data.patientId || base.patient_id,
    full_name: data.fullName || base.full_name,
    phone: data.phone || base.phone,
    email: data.email || base.email,
    age: data.age,
    gender: data.gender,
    blood_group: data.bloodGroup,
    emergency_contact_name: data.emergencyContact.name,
    emergency_contact_phone: data.emergencyContact.phone,
    emergency_contact_relation: data.emergencyContact.relation,
    address: data.residentialAddress.street,
    city: data.residentialAddress.city,
    state: data.residentialAddress.state,
    postal_code: data.residentialAddress.postalCode,
  };
}

export function profileDataFamilyMembers(data: PatientProfileData): FamilyMember[] {
  return data.familyMembers.map((member) => ({
    id: member.id,
    fullName: member.fullName,
    relationship: (['Spouse', 'Child', 'Parent', 'Sibling', 'Other'].includes(member.relationship)
      ? member.relationship
      : 'Other') as FamilyMember['relationship'],
    age: member.age,
    gender: (['Male', 'Female', 'Other'].includes(member.gender)
      ? member.gender
      : 'Other') as FamilyMember['gender'],
    bloodGroup: member.bloodGroup,
  }));
}

/** Prefer remote values; fill empty remote fields from local cache. */
export function mergeClinicalWithLocalCache(
  remote: PatientClinicalRecord,
  local: PatientClinicalRecord,
): PatientClinicalRecord {
  const pick = (remoteValue: string, localValue: string) =>
    remoteValue.trim() ? remoteValue : localValue;

  return {
    ...remote,
    age: pick(remote.age, local.age),
    gender: pick(remote.gender, local.gender),
    blood_group: pick(remote.blood_group, local.blood_group),
    emergency_contact_name: pick(remote.emergency_contact_name, local.emergency_contact_name),
    emergency_contact_phone: pick(remote.emergency_contact_phone, local.emergency_contact_phone),
    emergency_contact_relation: pick(
      remote.emergency_contact_relation,
      local.emergency_contact_relation,
    ),
    address: pick(remote.address, local.address),
    city: pick(remote.city, local.city),
    state: pick(remote.state, local.state),
    postal_code: pick(remote.postal_code, local.postal_code),
  };
}

export function hasLocalProfileCache(patientId: string): boolean {
  return Boolean(loadLocalPatientProfile(patientId));
}
