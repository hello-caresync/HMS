import { ROLE_LABELS, ROLE_PERMISSIONS } from '../auth/hospital/permissions';
import type { InternalStaffRole, StaffPermission } from '../auth/hospital/types';
import { STAFF_DIRECTORY } from '../auth/hospital/staffDirectory';
import type {
  HospitalEmployeeProfile,
  MatrixRoleCode,
  RolePermissionMatrix,
  ShiftAllocation,
} from './types';
import { MATRIX_PERMISSION_DEFINITIONS, MATRIX_ROLE_CODES } from './types';

export const SHIFT_BLOCKS: ShiftAllocation[] = [
  {
    shiftId: 'SHF-OPD-MORNING',
    label: 'Morning OPD Block',
    startTime: '06:00',
    endTime: '14:00',
    daysOfWeek: [1, 2, 3, 4, 5, 6],
    staffIds: ['EMP-2045'],
  },
  {
    shiftId: 'SHF-ICU-NIGHT',
    label: 'ICU Night Watch',
    startTime: '20:00',
    endTime: '08:00',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    staffIds: ['EMP-3012'],
  },
  {
    shiftId: 'SHF-PHARM-DAY',
    label: 'Pharmacy Day Shift',
    startTime: '08:00',
    endTime: '20:00',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    staffIds: ['EMP-4020'],
  },
  {
    shiftId: 'SHF-FIN-DESK',
    label: 'Finance Desk',
    startTime: '09:00',
    endTime: '18:00',
    daysOfWeek: [1, 2, 3, 4, 5],
    staffIds: ['EMP-6044', 'EMP-2026-042'],
  },
  {
    shiftId: 'SHF-STORE-SCM',
    label: 'Store & SCM Block',
    startTime: '07:00',
    endTime: '15:00',
    daysOfWeek: [1, 2, 3, 4, 5, 6],
    staffIds: ['EMP-7055'],
  },
  {
    shiftId: 'SHF-ADMIN',
    label: 'Admin Console',
    startTime: '08:00',
    endTime: '18:00',
    daysOfWeek: [1, 2, 3, 4, 5],
    staffIds: ['EMP-1001', 'EMP-8066'],
  },
];

const EXTRA_EMPLOYEES: HospitalEmployeeProfile[] = [
  {
    employeeId: 'EMP-2026-042',
    personal: {
      fullName: 'Deepika Menon',
      email: 'deepika.menon@nexora.health',
      phone: '+91 98450 11223',
      governmentId: 'AADHAAR-8844-2291-7720',
      emergencyContact: '+91 98450 99887',
    },
    contractStatus: 'active',
    isActive: true,
    department: 'Finance & Billing',
    roleCode: 'cashier',
    shiftBlockId: 'SHF-FIN-DESK',
    joinedAt: '2026-01-15T00:00:00.000Z',
    lastModifiedAt: '2026-07-01T09:30:00.000Z',
  },
  {
    employeeId: 'EMP-2026-018',
    personal: {
      fullName: 'Rohit Banerjee',
      email: 'rohit.banerjee@nexora.health',
      phone: '+91 98765 44321',
      governmentId: 'PAN-BNRPR4829K',
    },
    contractStatus: 'on_leave',
    isActive: false,
    department: 'Central Store',
    roleCode: 'store_manager',
    shiftBlockId: 'SHF-STORE-SCM',
    joinedAt: '2024-08-01T00:00:00.000Z',
    lastModifiedAt: '2026-06-20T14:00:00.000Z',
  },
];

function directoryToEmployee(
  entry: (typeof STAFF_DIRECTORY)[number],
  shiftBlockId: string,
): HospitalEmployeeProfile {
  return {
    employeeId: entry.employeeId,
    personal: {
      fullName: entry.displayName,
      email: entry.email,
      phone: '+91 90000 00000',
      governmentId: `GOV-${entry.employeeId.replace('EMP-', '')}-MASK`,
    },
    contractStatus: 'active',
    isActive: true,
    department: entry.department,
    roleCode: entry.role,
    shiftBlockId,
    joinedAt: '2024-01-01T00:00:00.000Z',
    lastModifiedAt: new Date().toISOString(),
  };
}

const SHIFT_BY_EMPLOYEE: Record<string, string> = {
  'EMP-1001': 'SHF-ADMIN',
  'EMP-2045': 'SHF-OPD-MORNING',
  'EMP-3012': 'SHF-ICU-NIGHT',
  'EMP-4020': 'SHF-PHARM-DAY',
  'EMP-5033': 'SHF-ADMIN',
  'EMP-6044': 'SHF-FIN-DESK',
  'EMP-7055': 'SHF-STORE-SCM',
  'EMP-8066': 'SHF-ADMIN',
};

export const SEED_EMPLOYEES: HospitalEmployeeProfile[] = [
  ...STAFF_DIRECTORY.map((entry) =>
    directoryToEmployee(entry, SHIFT_BY_EMPLOYEE[entry.employeeId] ?? 'SHF-ADMIN'),
  ),
  ...EXTRA_EMPLOYEES,
];

function roleHasIamPermission(role: InternalStaffRole, iamKey: string): boolean {
  const perms = ROLE_PERMISSIONS[role];
  if (perms.includes('*')) return true;
  return perms.includes(iamKey as StaffPermission);
}

export function buildInitialPermissionMatrix(): RolePermissionMatrix {
  const matrix = {} as RolePermissionMatrix;

  for (const role of Object.keys(ROLE_PERMISSIONS) as InternalStaffRole[]) {
    matrix[role] = {};
    for (const def of MATRIX_PERMISSION_DEFINITIONS) {
      if (!def.iamKey) {
        matrix[role][def.key] = false;
        continue;
      }
      matrix[role][def.key] = roleHasIamPermission(role, def.iamKey);
    }
  }

  return matrix;
}

export function getMatrixRoleLabel(role: MatrixRoleCode): string {
  return ROLE_LABELS[role];
}

export { MATRIX_ROLE_CODES, ROLE_LABELS };
