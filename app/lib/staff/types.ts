import type { InternalStaffRole } from '../auth/hospital/types';

export type ContractStatus = 'active' | 'inactive' | 'on_leave' | 'terminated';

export type PersonalDetails = {
  fullName: string;
  email: string;
  phone: string;
  /** Stored internally — display via masking rules only */
  governmentId: string;
  emergencyContact?: string;
};

export type HospitalEmployeeProfile = {
  /** Canonical tracking ID e.g. EMP-2026-042 */
  employeeId: string;
  personal: PersonalDetails;
  contractStatus: ContractStatus;
  /** Operational active flag for ERP access */
  isActive: boolean;
  department: string;
  roleCode: InternalStaffRole;
  shiftBlockId: string;
  joinedAt: string;
  lastModifiedAt: string;
};

export type ShiftAllocation = {
  shiftId: string;
  label: string;
  startTime: string;
  endTime: string;
  /** 0 = Sunday … 6 = Saturday */
  daysOfWeek: number[];
  staffIds: string[];
};

export type PermissionCategory =
  | 'patient_operations'
  | 'clinical_actions'
  | 'financial_stock';

export type MatrixPermissionDefinition = {
  key: string;
  label: string;
  category: PermissionCategory;
  /** Maps to IAM permission slug when applicable */
  iamKey?: string;
  sensitive?: boolean;
};

export type PermissionCategoryMeta = {
  id: PermissionCategory;
  label: string;
};

export const PERMISSION_CATEGORIES: PermissionCategoryMeta[] = [
  { id: 'patient_operations', label: 'Patient Operations' },
  { id: 'clinical_actions', label: 'Clinical Actions' },
  { id: 'financial_stock', label: 'Financial & Stock' },
];

/** Granular operational permissions rendered in the RBAC matrix */
export const MATRIX_PERMISSION_DEFINITIONS: MatrixPermissionDefinition[] = [
  {
    key: 'register_patient',
    label: 'Register Patient',
    category: 'patient_operations',
    iamKey: 'patients_register',
  },
  {
    key: 'view_master_index',
    label: 'View Master Index',
    category: 'patient_operations',
    iamKey: 'patients_view',
  },
  {
    key: 'merge_profiles',
    label: 'Merge Profiles',
    category: 'patient_operations',
    iamKey: 'patients_register',
    sensitive: true,
  },
  {
    key: 'manage_appointments',
    label: 'Manage Appointments',
    category: 'patient_operations',
    iamKey: 'appointments_manage',
  },
  {
    key: 'issue_tokens',
    label: 'Issue Queue Tokens',
    category: 'patient_operations',
    iamKey: 'token_issue',
  },
  {
    key: 'log_vitals',
    label: 'Log Vitals',
    category: 'clinical_actions',
    iamKey: 'vitals_entry',
  },
  {
    key: 'write_care_notes',
    label: 'Write Care Notes',
    category: 'clinical_actions',
    iamKey: 'mar_charting',
  },
  {
    key: 'administer_meds',
    label: 'Administer Meds',
    category: 'clinical_actions',
    iamKey: 'mar_charting',
    sensitive: true,
  },
  {
    key: 'bed_matrix',
    label: 'Bed Matrix Control',
    category: 'clinical_actions',
    iamKey: 'bed_matrix',
  },
  {
    key: 'collect_payments',
    label: 'Collect Payments',
    category: 'financial_stock',
    iamKey: 'payments_collect',
  },
  {
    key: 'dispense_drugs',
    label: 'Dispense Drugs',
    category: 'financial_stock',
    iamKey: 'pharmacy_dispense',
    sensitive: true,
  },
  {
    key: 'approve_purchase_orders',
    label: 'Approve Purchase Orders',
    category: 'financial_stock',
    iamKey: 'procurement_manage',
    sensitive: true,
  },
  {
    key: 'inventory_write',
    label: 'Adjust Inventory',
    category: 'financial_stock',
    iamKey: 'inventory_write',
  },
  {
    key: 'billing_write',
    label: 'Modify Billing Ledger',
    category: 'financial_stock',
    iamKey: 'billing_write',
  },
];

/** Roles displayed as matrix columns (Phase 1 subset) */
export const MATRIX_ROLE_CODES = [
  'receptionist',
  'nurse',
  'pharmacist',
  'cashier',
  'store_manager',
] as const satisfies readonly InternalStaffRole[];

export type MatrixRoleCode = (typeof MATRIX_ROLE_CODES)[number];

export type RolePermissionMatrix = Record<
  InternalStaffRole,
  Record<string, boolean>
>;

export type CreateStaffDraft = {
  fullName: string;
  email: string;
  phone: string;
  governmentId: string;
  department: string;
  roleCode: InternalStaffRole;
  shiftBlockId: string;
};
