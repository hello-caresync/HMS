/** Internal hospital back-office staff roles — ERP only (no external portal roles). */

export const INTERNAL_STAFF_ROLES = [
  'hospital_admin',
  'receptionist',
  'front_office',
  'nurse',
  'lab_tech',
  'radiology_tech',
  'pharmacist',
  'cashier',
  'store_manager',
  'purchase_officer',
  'finance_team',
  'hr_team',
  'it_admin',
] as const;

export type InternalStaffRole = (typeof INTERNAL_STAFF_ROLES)[number];

export const STAFF_PERMISSIONS = [
  'patients_view',
  'patients_register',
  'appointments_manage',
  'token_issue',
  'vitals_entry',
  'bed_matrix',
  'mar_charting',
  'consultation_read',
  'lab_orders',
  'lab_results',
  'radiology_orders',
  'radiology_reports',
  'pharmacy_dispense',
  'pharmacy_verify',
  'inventory_read',
  'inventory_write',
  'procurement_manage',
  'vendor_hub',
  'billing_read',
  'billing_write',
  'payments_collect',
  'finance_reports',
  'hr_manage',
  'assets_manage',
  'reports_view',
  'settings_manage',
  'audit_view',
  'user_admin',
  '*',
] as const;

export type StaffPermission = (typeof STAFF_PERMISSIONS)[number];

export type StaffAuthMethod = 'password' | 'biometric' | 'smart_card';

export type HospitalStaffProfile = {
  userId: string;
  employeeId: string;
  email: string;
  displayName: string;
  role: InternalStaffRole;
  department: string;
  shiftLabel: string;
  permissions: StaffPermission[];
  authMethod: StaffAuthMethod;
  issuedAtUtc: string;
  lastActivityAtUtc: string;
  mfaPending: boolean;
};

/** @deprecated Use HospitalStaffProfile */
export type StaffSession = HospitalStaffProfile;

export type StaffAuthResult =
  | { ok: true; session: StaffSession; requiresMfa: false }
  | { ok: false; error: string };

export type StaffDirectoryEntry = {
  employeeId: string;
  email: string;
  password: string;
  displayName: string;
  role: InternalStaffRole;
  department: string;
  shiftLabel: string;
};

/** @deprecated Use HospitalStaffProfile */
export type NexoraSession = HospitalStaffProfile;

/** @deprecated Use InternalStaffRole */
export type NexoraUserRole = InternalStaffRole;

export type ActivityLogEntry = {
  id: string;
  userId: string;
  action: string;
  module: string;
  timestampUtc: string;
};

export type PasswordPolicyResult = {
  valid: boolean;
  checks: {
    minLength: boolean;
    hasNumber: boolean;
    hasSymbol: boolean;
  };
};

export type MfaChallengeState = {
  pending: boolean;
  method: 'totp' | 'sms' | null;
  verificationToken: string | null;
};

export type AuthResult = StaffAuthResult;
