import type { InternalStaffRole, StaffPermission } from './types';

/**
 * Static RBAC matrix — maps each internal staff role to explicit ERP permissions.
 * `*` grants global access (hospital_admin only).
 */
export const ROLE_PERMISSIONS: Record<InternalStaffRole, StaffPermission[]> = {
  hospital_admin: ['*'],

  receptionist: ['patients_view', 'patients_register', 'appointments_manage', 'token_issue'],

  front_office: [
    'patients_view',
    'patients_register',
    'appointments_manage',
    'token_issue',
    'billing_read',
  ],

  nurse: ['patients_view', 'vitals_entry', 'bed_matrix', 'mar_charting', 'consultation_read'],

  lab_tech: ['patients_view', 'lab_orders', 'lab_results'],

  radiology_tech: ['patients_view', 'radiology_orders', 'radiology_reports'],

  pharmacist: ['pharmacy_dispense', 'pharmacy_verify', 'inventory_read'],

  cashier: ['patients_view', 'billing_read', 'billing_write', 'payments_collect'],

  store_manager: ['inventory_read', 'inventory_write', 'procurement_manage'],

  purchase_officer: ['inventory_read', 'procurement_manage', 'vendor_hub'],

  finance_team: ['billing_read', 'billing_write', 'payments_collect', 'finance_reports', 'reports_view'],

  hr_team: ['hr_manage', 'reports_view', 'audit_view'],

  it_admin: ['settings_manage', 'user_admin', 'audit_view'],
};

export const ROLE_LABELS: Record<InternalStaffRole, string> = {
  hospital_admin: 'Hospital Administrator',
  receptionist: 'Receptionist',
  front_office: 'Front Office',
  nurse: 'Duty Nurse',
  lab_tech: 'Lab Technician',
  radiology_tech: 'Radiology Technician',
  pharmacist: 'Pharmacist',
  cashier: 'Cashier',
  store_manager: 'Store Manager',
  purchase_officer: 'Purchase Officer',
  finance_team: 'Finance Team',
  hr_team: 'HR Team',
  it_admin: 'IT Administrator',
};

export function resolvePermissionsForRole(role: InternalStaffRole): StaffPermission[] {
  return [...ROLE_PERMISSIONS[role]];
}

export function hasPermission(
  permissions: StaffPermission[],
  required: StaffPermission,
): boolean {
  if (permissions.includes('*')) return true;
  return permissions.includes(required);
}

export function hasAnyPermission(
  permissions: StaffPermission[],
  required: StaffPermission[],
): boolean {
  return required.some((p) => hasPermission(permissions, p));
}

export function formatRoleBadge(role: InternalStaffRole, shiftLabel?: string): string {
  const base = ROLE_LABELS[role];
  return shiftLabel ? `${base} — ${shiftLabel}` : base;
}
