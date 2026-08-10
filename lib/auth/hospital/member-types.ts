/** Member roles stored in `hospital_members.role` */
export const HOSPITAL_MEMBER_ROLES = [
  'Doctor',
  'Nurse',
  'Receptionist',
  'Billing',
  'Admin',
  'Pharmacist',
] as const;

export type HospitalMemberRole = (typeof HOSPITAL_MEMBER_ROLES)[number];

/** Login portal role selector */
export type LoginPortalRole = 'Staff' | 'Doctor' | 'Admin';

export const DEFAULT_DEPARTMENTS = [
  'Cardiology',
  'Orthopedics',
  'Emergency',
  'Pediatrics',
  'Neurology',
  'General Surgery',
  'Radiology',
  'Pharmacy',
  'Billing',
] as const;

export type HospitalRecord = {
  id: string;
  hospital_name: string;
  registration_number: string;
  tax_gstin_id: string | null;
  official_email: string;
  phone: string;
  emergency_helpline: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  total_beds: number;
  icu_beds: number;
  opd_rooms: number;
  ot_suites: number;
  onboarding_completed: boolean;
};

export type DepartmentRecord = {
  id: string;
  hospital_id: string;
  name: string;
  is_active: boolean;
};

export type HospitalMemberRecord = {
  id: string;
  hospital_id: string;
  department_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  employee_id: string;
  role: HospitalMemberRole;
  status: 'Active' | 'Suspended' | 'Inactive';
  password_hash: string;
  medical_license_number: string | null;
  specialization: string | null;
  qualification: string | null;
  experience_years: number | null;
  consultation_fee: number | null;
  opd_room_number: string | null;
};

export type OnboardingMemberDraft = {
  key: string;
  /** Supabase row id when loaded from or saved to DB */
  dbId?: string;
  hospitalId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  employeeId: string;
  role: HospitalMemberRole;
  departmentName: string;
  medicalLicenseNumber?: string;
  specialization?: string;
  qualification?: string;
  experienceYears?: number;
  consultationFee?: number;
  opdRoomNumber?: string;
};

export type IssuedCredential = {
  employeeId: string;
  email: string;
  fullName: string;
  role: HospitalMemberRole;
  temporaryPassword: string;
  assignedApp: 'Doctor App' | 'Hospital App';
};

export function memberRoleToPortalRole(role: HospitalMemberRole): LoginPortalRole {
  if (role === 'Doctor') return 'Doctor';
  if (role === 'Admin') return 'Admin';
  return 'Staff';
}

export function portalRoleAllowsMember(
  portalRole: LoginPortalRole,
  memberRole: HospitalMemberRole,
): boolean {
  return memberRoleToPortalRole(memberRole) === portalRole;
}

export function assignedAppForRole(role: HospitalMemberRole): 'Doctor App' | 'Hospital App' {
  return role === 'Doctor' ? 'Doctor App' : 'Hospital App';
}
