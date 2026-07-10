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
} from './types';

export type {
  DeviceMetadata,
  DeviceType,
  LoginHistoryEvent,
  LoginHistoryStatus,
  SessionPingRequest,
  SessionPingResponse,
  StaffSession,
} from '../security';

export {
  INTERNAL_STAFF_ROLES,
  STAFF_PERMISSIONS,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
  STAFF_DIRECTORY,
  formatRoleBadge,
  hasAnyPermission,
  hasPermission,
  resolvePermissionsForRole,
  ROUTE_PERMISSION_REQUIREMENTS,
  ROLE_ROUTE_ALLOWLIST,
  canAccessRoute,
  canPerformAction,
  resolveAccessibleModules,
} from './types';

export { logUserActivity, readActivityLog, ACTIVITY_LOG_STORAGE_KEY } from './activityLog';
export { evaluatePasswordPolicy, PASSWORD_POLICY_HINT } from './passwordPolicy';
export {
  clearSession,
  INACTIVITY_TIMEOUT_MS,
  isSessionExpired,
  readSession,
  SESSION_STORAGE_KEY,
  touchSessionActivity,
  writeSession,
} from './session';
export {
  completePasswordReset,
  completeStaffLogin,
  createMfaChallenge,
  getCurrentSession,
  initiateStaffLogin,
  refreshSessionActivity,
  requestPasswordReset,
  resendMfaChallenge,
  resolvePostLoginRoute,
  signInWithBiometricBypass,
  signInWithEmail,
  signOut,
  verifyMfaChallenge,
  verifyStaffMfa,
} from './authService';
