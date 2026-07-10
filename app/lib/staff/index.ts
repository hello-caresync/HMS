export type {
  ContractStatus,
  CreateStaffDraft,
  HospitalEmployeeProfile,
  MatrixPermissionDefinition,
  MatrixRoleCode,
  PermissionCategory,
  PermissionCategoryMeta,
  PersonalDetails,
  RolePermissionMatrix,
  ShiftAllocation,
} from './types';

export {
  MATRIX_PERMISSION_DEFINITIONS,
  MATRIX_ROLE_CODES,
  PERMISSION_CATEGORIES,
} from './types';

export {
  buildInitialPermissionMatrix,
  getMatrixRoleLabel,
  MATRIX_ROLE_CODES as MATRIX_DISPLAY_ROLES,
  ROLE_LABELS,
  SEED_EMPLOYEES,
  SHIFT_BLOCKS,
} from './seedStaff';

export { formatEmployeeId, formatShiftDays, maskGovernmentId } from './utils';
