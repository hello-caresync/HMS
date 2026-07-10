import type { InternalStaffRole, StaffDirectoryEntry } from './types';

/** Demo internal staff directory — back-office ERP credentials only */
export const STAFF_DIRECTORY: StaffDirectoryEntry[] = [
  {
    employeeId: 'EMP-1001',
    email: 'admin@nexora.health',
    password: 'Nexora@2026',
    displayName: 'Anita Deshmukh',
    role: 'hospital_admin',
    department: 'Hospital Administration',
    shiftLabel: 'Admin Console',
  },
  {
    employeeId: 'EMP-2045',
    email: 'reception@nexora.health',
    password: 'Nexora@2026',
    displayName: 'Kavitha Reddy',
    role: 'receptionist',
    department: 'Front Desk · OPD',
    shiftLabel: 'Morning Shift',
  },
  {
    employeeId: 'EMP-3012',
    email: 'nurse.icu@nexora.health',
    password: 'Nexora@2026',
    displayName: 'Priya S. Nair',
    role: 'nurse',
    department: 'ICU · Critical Care',
    shiftLabel: 'ICU Shift',
  },
  {
    employeeId: 'EMP-4020',
    email: 'pharmacy@nexora.health',
    password: 'Nexora@2026',
    displayName: 'Rajesh Kumar',
    role: 'pharmacist',
    department: 'Main Pharmacy',
    shiftLabel: 'Dispensary Duty',
  },
  {
    employeeId: 'EMP-5033',
    email: 'lab@nexora.health',
    password: 'Nexora@2026',
    displayName: 'Meera Iyer',
    role: 'lab_tech',
    department: 'Central Laboratory',
    shiftLabel: 'Lab Bench A',
  },
  {
    employeeId: 'EMP-6044',
    email: 'finance@nexora.health',
    password: 'Nexora@2026',
    displayName: 'Vikram Patel',
    role: 'finance_team',
    department: 'Finance & Billing',
    shiftLabel: 'Revenue Cycle',
  },
  {
    employeeId: 'EMP-7055',
    email: 'procurement@nexora.health',
    password: 'Nexora@2026',
    displayName: 'Sanjay Rao',
    role: 'purchase_officer',
    department: 'Procurement & SCM',
    shiftLabel: 'Purchase Desk',
  },
  {
    employeeId: 'EMP-8066',
    email: 'it@nexora.health',
    password: 'Nexora@2026',
    displayName: 'Arjun Mehta',
    role: 'it_admin',
    department: 'Information Technology',
    shiftLabel: 'Systems Ops',
  },
];

export function findStaffByCredential(
  identifier: string,
  password: string,
): StaffDirectoryEntry | null {
  const id = identifier.trim().toLowerCase();
  return (
    STAFF_DIRECTORY.find(
      (s) =>
        (s.email.toLowerCase() === id || s.employeeId.toLowerCase() === id) &&
        s.password === password,
    ) ?? null
  );
}

export function findStaffByEmployeeId(employeeId: string): StaffDirectoryEntry | null {
  const id = employeeId.trim().toUpperCase();
  return STAFF_DIRECTORY.find((s) => s.employeeId.toUpperCase() === id) ?? null;
}

export function getDemoAccountsByRole(role: InternalStaffRole): StaffDirectoryEntry[] {
  return STAFF_DIRECTORY.filter((s) => s.role === role);
}
