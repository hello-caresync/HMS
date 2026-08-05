export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
export const GENDERS = ['Female', 'Male', 'Other', 'Prefer not to say'] as const;
export const FAMILY_RELATIONSHIPS = ['Spouse', 'Child', 'Father', 'Mother'] as const;

export type BloodGroup = (typeof BLOOD_GROUPS)[number];
export type FacilityType = 'hospital' | 'clinic';
export type FacilityFilter = 'all' | 'hospital' | 'clinic';

export type PatientProfileForm = {
  patientId: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  streetAddress: string;
  city: string;
  pincode: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  knownAllergies: string;
  chronicConditions: string;
  preferredHospitalId: string | null;
};

export type PatientProfileRow = {
  id: string;
  patient_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  blood_group: string | null;
  street_address: string | null;
  city: string | null;
  pincode: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  known_allergies: string | null;
  chronic_conditions: string | null;
  preferred_hospital_id: string | null;
  updated_at?: string;
};

export type MedicalFacility = {
  id: string;
  facilityName: string;
  facilityType: FacilityType;
  address: string;
  city: string;
  areaPincode: string;
  distanceKm: number;
};

export type FacilityRow = {
  id: string;
  facility_name: string;
  facility_type: FacilityType;
  address: string;
  city: string;
  area_pincode: string;
  distance_km: number | null;
};

export type FamilyMemberRecord = {
  id: string;
  primaryPatientId: string;
  fullName: string;
  relationship: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  medicalNotes: string;
};

export type FamilyMemberRow = {
  id: string;
  primary_patient_id: string;
  full_name: string;
  relationship: string;
  date_of_birth: string | null;
  gender: string | null;
  blood_group: string | null;
  medical_notes: string | null;
};

export type FamilyMemberInput = Omit<FamilyMemberRecord, 'id' | 'primaryPatientId'>;
