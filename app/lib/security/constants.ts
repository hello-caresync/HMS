/** How often the client watchdog pings `/api/auth/session` */
export const SESSION_PING_INTERVAL_MS = 60_000;

/** Idle threshold before forced logout (matches ERP policy) */
export const IDLE_THRESHOLD_MS = 15 * 60 * 1000;

/** Absolute session lifetime from issuance */
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

/** MFA OTP resend cooldown */
export const MFA_RESEND_COOLDOWN_SEC = 60;

/** Simulated MFA — required for elevated internal roles in Phase 1 */
export const MFA_REQUIRED_ROLES = [
  'hospital_admin',
  'finance_team',
  'it_admin',
] as const;

/** Demo OTP accepted in simulation mode */
export const MFA_DEMO_CODE = '123456';

export const SECURITY_SESSION_STORAGE_KEY = 'nexora_secure_staff_session';
export const LOGIN_HISTORY_STORAGE_KEY = 'nexora_login_history';
export const PENDING_MFA_STORAGE_KEY = 'nexora_pending_mfa_challenge';
