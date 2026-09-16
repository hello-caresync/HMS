import {
  loadLocalPatientProfile,
  persistLocalPatientProfile,
  profileDataFamilyMembers,
} from '@/lib/patient/profileStore';
import { resolveActivePatientFormIdentity } from '@/lib/patient/portal-session';

export type FamilyRelationship = 'Spouse' | 'Child' | 'Parent' | 'Sibling' | 'Other';
export type FamilyGender = 'Male' | 'Female' | 'Other';

export type FamilyMember = {
  id: string;
  fullName: string;
  relationship: FamilyRelationship;
  age: string;
  gender: FamilyGender;
  bloodGroup?: string;
};

export type BeneficiaryOption = {
  id: string;
  name: string;
  relation: string;
  age?: string | number;
  gender?: string;
};

export const SELF_BENEFICIARY_ID = 'self';
export const FAMILY_MEMBERS_STORAGE_KEY = 'curasync_family_members';

export function familyMembersStorageKey(patientId: string): string {
  const scoped = String(patientId || '').trim();
  return scoped ? `${FAMILY_MEMBERS_STORAGE_KEY}_${scoped}` : FAMILY_MEMBERS_STORAGE_KEY;
}

/** Legacy book flow uses full_name / relation — normalize on read. */
function normalizeMember(raw: Record<string, unknown>): FamilyMember | null {
  const fullName = String(raw.fullName || raw.full_name || '').trim();
  if (!fullName) return null;

  const relationshipRaw = String(raw.relationship || raw.relation || 'Other');
  const relationship = (
    ['Spouse', 'Child', 'Parent', 'Sibling', 'Other'].includes(relationshipRaw)
      ? relationshipRaw
      : 'Other'
  ) as FamilyRelationship;

  const genderRaw = String(raw.gender || 'Other');
  const gender = (
    ['Male', 'Female', 'Other'].includes(genderRaw) ? genderRaw : 'Other'
  ) as FamilyGender;

  return {
    id: String(raw.id || crypto.randomUUID()),
    fullName,
    relationship,
    age: String(raw.age ?? '').trim(),
    gender,
    bloodGroup: raw.bloodGroup ? String(raw.bloodGroup) : raw.blood_group ? String(raw.blood_group) : undefined,
  };
}

function parseFamilyMembers(raw: string | null): FamilyMember[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => normalizeMember(item as Record<string, unknown>))
      .filter((item): item is FamilyMember => Boolean(item));
  } catch {
    return [];
  }
}

/** Loads dependents saved for this verified patient only — never seeds mock data. */
export function loadSavedFamilyMembers(patientId: string): FamilyMember[] {
  if (typeof window === 'undefined' || !patientId.trim()) return [];

  const profileBundle = loadLocalPatientProfile(patientId);
  if (profileBundle?.familyMembers?.length) {
    return profileDataFamilyMembers(profileBundle);
  }

  return parseFamilyMembers(localStorage.getItem(familyMembersStorageKey(patientId)));
}

/** Loads dependents saved on the profile page for this patient only. */
export function loadFamilyMembersForPatient(patientId: string): FamilyMember[] {
  return loadSavedFamilyMembers(patientId);
}

export function buildBeneficiaryOptions(
  primary: {
    id: string;
    name: string;
    age?: string | number | null;
    gender?: string;
  },
  members: FamilyMember[],
): BeneficiaryOption[] {
  return [
    {
      id: SELF_BENEFICIARY_ID,
      name: primary.name,
      relation: 'Self',
      age: primary.age ?? undefined,
      gender: primary.gender,
    },
    ...members.map((member) => ({
      id: member.id,
      name: member.fullName,
      relation: member.relationship,
      age: member.age || undefined,
      gender: member.gender,
    })),
  ];
}

export function formatBeneficiaryLabel(option: BeneficiaryOption): string {
  if (option.relation === 'Self') {
    return `${option.name} (Self)`;
  }
  return `${option.name} (${option.relation})`;
}

/** @deprecated Prefer loadSavedFamilyMembers scoped to the active patient. */
export function loadStoredFamilyMembers(): FamilyMember[] {
  return [];
}

export function persistFamilyMembers(members: FamilyMember[], patientId: string): void {
  if (typeof window === 'undefined' || !patientId.trim()) return;
  const payload = members.map((member) => ({
    ...member,
    full_name: member.fullName,
    relation: member.relationship,
    blood_group: member.bloodGroup,
  }));
  localStorage.setItem(familyMembersStorageKey(patientId), JSON.stringify(payload));

  const profileBundle = loadLocalPatientProfile(patientId);
  if (profileBundle) {
    persistLocalPatientProfile({
      ...profileBundle,
      familyMembers: members.map((member) => ({
        id: member.id,
        fullName: member.fullName,
        relationship: member.relationship,
        age: member.age,
        gender: member.gender,
        bloodGroup: member.bloodGroup,
      })),
    });
  }
}

export function loadBeneficiaryOptionsForActivePatient(): BeneficiaryOption[] {
  if (typeof window === 'undefined') return [];

  const identity = resolveActivePatientFormIdentity();
  if (!identity) return [];

  const members = loadFamilyMembersForPatient(identity.patient_id);
  return buildBeneficiaryOptions(
    {
      id: identity.patient_id,
      name: identity.patient_name,
      age: identity.age,
      gender: identity.gender,
    },
    members,
  );
}

export function beneficiaryOptionsToSelectOptions(
  options: BeneficiaryOption[],
): Array<{ id: string; name: string; relation: string }> {
  return options.map((option) => ({
    id: option.id,
    name: formatBeneficiaryLabel(option),
    relation: option.relation,
  }));
}

export function createEmptyFamilyMemberDraft(): Omit<FamilyMember, 'id'> {
  return {
    fullName: '',
    relationship: 'Spouse',
    age: '',
    gender: 'Other',
    bloodGroup: '',
  };
}
