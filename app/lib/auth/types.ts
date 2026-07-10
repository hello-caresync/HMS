export type {
  ActivityLogEntry,
  AuthResult,
  HospitalStaffProfile,
  InternalStaffRole,
  MfaChallengeState,
  NexoraSession,
  NexoraUserRole,
  PasswordPolicyResult,
  StaffAuthMethod,
  StaffAuthResult,
  StaffDirectoryEntry,
  StaffPermission,
} from './hospital/types';

export {
  INTERNAL_STAFF_ROLES,
  STAFF_PERMISSIONS,
} from './hospital/types';

export {
  ROLE_LABELS,
  ROLE_PERMISSIONS,
  formatRoleBadge,
  hasAnyPermission,
  hasPermission,
  resolvePermissionsForRole,
} from './hospital/permissions';

export {
  STAFF_DIRECTORY,
  findStaffByCredential,
  findStaffByEmployeeId,
  getDemoAccountsByRole,
} from './hospital/staffDirectory';

export {
  authenticateBiometricBypass,
  authenticateStaff,
  buildStaffSession,
  resolvePostLoginRoute,
} from './hospital/routing';

export {
  ROUTE_PERMISSION_REQUIREMENTS,
  ROLE_ROUTE_ALLOWLIST,
  canAccessRoute,
  canPerformAction,
  resolveAccessibleModules,
} from './hospital/routeAccess';
