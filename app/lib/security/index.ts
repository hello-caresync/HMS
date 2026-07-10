export type {
  DeviceMetadata,
  DeviceType,
  LoginHistoryEvent,
  LoginHistoryStatus,
  PendingMfaChallenge,
  SessionPingRequest,
  SessionPingResponse,
  StaffSession,
} from './types';

export {
  IDLE_THRESHOLD_MS,
  LOGIN_HISTORY_STORAGE_KEY,
  MFA_DEMO_CODE,
  MFA_REQUIRED_ROLES,
  MFA_RESEND_COOLDOWN_SEC,
  PENDING_MFA_STORAGE_KEY,
  SECURITY_SESSION_STORAGE_KEY,
  SESSION_PING_INTERVAL_MS,
  SESSION_TTL_MS,
} from './constants';

export {
  buildStaffSession,
  clearSecuritySession,
  extendSecuritySession,
  generateActiveToken,
  isSecuritySessionExpired,
  readSecuritySession,
  writeSecuritySession,
} from './session';

export { collectDeviceMetadata } from './deviceMetadata';
export { appendLoginHistoryEvent, readLoginHistory } from './auditLog';
export {
  clearPendingMfaChallenge,
  createPendingMfaChallenge,
  isMfaRequiredForRole,
  readPendingMfaChallenge,
  verifyMfaOtp,
} from './mfa';
