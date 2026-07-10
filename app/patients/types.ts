/** Auto-generated UHID format: NEX-2026-XXXX (or NEX-2026-TMP-XXXX for emergency) */
export type Gender = 'Male' | 'Female' | 'Other';

export type BloodGroup =
  | 'A+'
  | 'A-'
  | 'B+'
  | 'B-'
  | 'AB+'
  | 'AB-'
  | 'O+'
  | 'O-'
  | 'Unknown';

export type BillingType = 'Self' | 'Corporate' | 'Insurance';

// ─── Core profile ───────────────────────────────────────────────────────────

export interface PatientProfile {
  id: string;
  uhid: string;
  firstName: string;
  lastName: string;
  dob: string; // ISO date YYYY-MM-DD (empty for emergency temp)
  gender: Gender;
  bloodGroup: BloodGroup;
  nationalIdOptional?: string;
  phone: string;
  email?: string;
  /** Emergency quick-reg creates a provisional record */
  isTemporary: boolean;
  estimatedAge?: number;
  registeredAt: string;
}

// ─── Related entities (FK → patientId) ──────────────────────────────────────

export interface Address {
  patientId: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface EmergencyContact {
  patientId: string;
  contactName: string;
  relationship: string;
  phone: string;
}

export interface InsuranceDetails {
  patientId: string;
  billingType: BillingType;
  providerName?: string;
  policyNumber?: string;
  corporateGroupCode?: string;
  validityDate?: string; // ISO date
}

/** Normalized relational aggregate — simulates joined DB row */
export interface PatientRecord {
  profile: PatientProfile;
  address: Address | null;
  emergencyContact: EmergencyContact | null;
  insurance: InsuranceDetails | null;
}

// ─── Form DTOs ──────────────────────────────────────────────────────────────

export type DemographicsFormData = {
  firstName: string;
  lastName: string;
  dob: string;
  gender: Gender;
  bloodGroup: BloodGroup;
  nationalIdOptional: string;
  phone: string;
  email: string;
};

export type EmergencyAddressFormData = {
  contactName: string;
  relationship: string;
  emergencyPhone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
};

export type InsuranceFormData = {
  billingType: BillingType;
  providerName: string;
  policyNumber: string;
  corporateGroupCode: string;
  validityDate: string;
};

export type EmergencyQuickRegData = {
  name: string;
  gender: Gender;
  estimatedAge: number;
};

export const GENDERS: Gender[] = ['Male', 'Female', 'Other'];

export const BLOOD_GROUPS: BloodGroup[] = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
  'Unknown',
];

export const BILLING_TYPES: BillingType[] = ['Self', 'Corporate', 'Insurance'];

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Delhi',
  'Gujarat',
  'Karnataka',
  'Kerala',
  'Maharashtra',
  'Tamil Nadu',
  'Telangana',
  'West Bengal',
] as const;
