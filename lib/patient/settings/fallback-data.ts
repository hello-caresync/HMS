import { DEMO_PATIENT_ID, SEED_FAMILY_MEMBERS, SEED_PATIENT } from '@/lib/ecosystem/seed';

import type { FamilyMemberRecord, MedicalFacility, PatientProfileForm } from './types';

export const FALLBACK_FACILITIES: MedicalFacility[] = [
  {
    id: 'a1000000-0000-4000-a000-000000000001',
    facilityName: 'Nexora Main Campus Hospital',
    facilityType: 'hospital',
    address: '42 Healthcare Avenue, Block A',
    city: 'Kochi',
    areaPincode: '682016',
    distanceKm: 1.2,
  },
  {
    id: 'a1000000-0000-4000-a000-000000000002',
    facilityName: 'Nexora City Centre Clinic',
    facilityType: 'clinic',
    address: '18 MG Road, Level 3',
    city: 'Kochi',
    areaPincode: '682016',
    distanceKm: 1.8,
  },
  {
    id: 'a1000000-0000-4000-a000-000000000003',
    facilityName: 'Lakeside Multi-Specialty Hospital',
    facilityType: 'hospital',
    address: '7 Wellness Park Road',
    city: 'Ernakulam',
    areaPincode: '682030',
    distanceKm: 3.4,
  },
  {
    id: 'a1000000-0000-4000-a000-000000000004',
    facilityName: 'Green Valley Family Clinic',
    facilityType: 'clinic',
    address: '22 Park Lane, Edapally',
    city: 'Kochi',
    areaPincode: '682024',
    distanceKm: 2.6,
  },
];

export function defaultProfileForm(patientId: string): PatientProfileForm {
  return {
    patientId,
    fullName: SEED_PATIENT.fullName,
    email: SEED_PATIENT.email,
    phone: SEED_PATIENT.phone,
    dateOfBirth: SEED_PATIENT.dateOfBirth,
    gender: SEED_PATIENT.gender,
    bloodGroup: SEED_PATIENT.bloodGroup,
    streetAddress: '42 Healthcare Avenue, Block A',
    city: 'Kochi',
    pincode: '682016',
    emergencyContactName: SEED_PATIENT.emergencyContactName,
    emergencyContactPhone: SEED_PATIENT.emergencyContactPhone,
    knownAllergies: 'Penicillin',
    chronicConditions: 'Mild asthma (seasonal)',
    preferredHospitalId: FALLBACK_FACILITIES[0]!.id,
  };
}

export function fallbackFamilyMembers(patientId: string): FamilyMemberRecord[] {
  if (patientId !== DEMO_PATIENT_ID) return [];
  return SEED_FAMILY_MEMBERS.filter((m) => m.primaryPatientId === patientId).map((m) => ({
    id: m.id,
    primaryPatientId: m.primaryPatientId,
    fullName: m.fullName,
    relationship: m.relation === 'child' ? 'Child' : m.relation === 'parent' ? 'Father' : 'Spouse',
    dateOfBirth: m.dateOfBirth,
    gender: m.relation === 'child' ? 'Female' : 'Male',
    bloodGroup: m.relation === 'child' ? 'O+' : 'A+',
    medicalNotes: m.relation === 'parent' ? 'Type 2 diabetes — managed with medication' : 'No known allergies',
  }));
}

const LOCAL_PROFILE_KEY = 'nexora-patient-profile-local';
const LOCAL_FAMILY_KEY = 'nexora-patient-family-local';
const LOCAL_PREFERRED_KEY = 'nexora-preferred-hospital';

export function loadLocalProfile(patientId: string): PatientProfileForm | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${LOCAL_PROFILE_KEY}:${patientId}`);
    return raw ? (JSON.parse(raw) as PatientProfileForm) : null;
  } catch {
    return null;
  }
}

export function saveLocalProfile(form: PatientProfileForm) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${LOCAL_PROFILE_KEY}:${form.patientId}`, JSON.stringify(form));
}

export function loadLocalFamily(patientId: string): FamilyMemberRecord[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${LOCAL_FAMILY_KEY}:${patientId}`);
    return raw ? (JSON.parse(raw) as FamilyMemberRecord[]) : null;
  } catch {
    return null;
  }
}

export function saveLocalFamily(patientId: string, members: FamilyMemberRecord[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${LOCAL_FAMILY_KEY}:${patientId}`, JSON.stringify(members));
}

export function loadLocalPreferredHospital(patientId: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(`${LOCAL_PREFERRED_KEY}:${patientId}`);
}

export function saveLocalPreferredHospital(patientId: string, facilityId: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${LOCAL_PREFERRED_KEY}:${patientId}`, facilityId);
}
