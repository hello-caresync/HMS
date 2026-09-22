/** Canonical Super Admin root operator credentials. */
export const SUPER_ADMIN_ROOT_EMAIL = 'superadmin@regalhospital.com';
export const SUPER_ADMIN_ROOT_PASSCODE = 'REGAL#2026@SUPER_ROOT';
export const SUPER_ADMIN_FACILITY_NODE = 'HOSP-01';
export const SUPER_ADMIN_DEFAULT_PORTAL = '/super-vault-access';

export const SUPER_ADMIN_INVALID_CREDENTIALS_MESSAGE = 'Invalid email or passcode.';

export type SuperAdminSessionPayload = {
  email: string;
  role: 'super_admin';
  accessLevel: 'level_0_root';
  facility_node: string;
  token: string;
  authenticatedAt: string;
  portal_access: string;
};

export function normalizeSuperAdminEmail(value?: string | null): string {
  return String(value ?? '').trim().toLowerCase();
}

export function normalizeSuperAdminPasscode(value?: string | null): string {
  return String(value ?? '').trim();
}

/** Strict match — only the canonical root email/passcode pair is accepted. */
export function verifySuperAdminCredentials(email: string, passcode: string): boolean {
  const normalizedEmail = normalizeSuperAdminEmail(email);
  const normalizedPasscode = normalizeSuperAdminPasscode(passcode);

  if (!normalizedEmail || !normalizedPasscode) return false;

  return (
    normalizedEmail === SUPER_ADMIN_ROOT_EMAIL &&
    normalizedPasscode === SUPER_ADMIN_ROOT_PASSCODE
  );
}

export function createSuperAdminSessionToken(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `sa_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

export function buildSuperAdminSessionPayload(
  email: string,
  token: string,
  portalAccess = SUPER_ADMIN_DEFAULT_PORTAL,
): SuperAdminSessionPayload {
  return {
    email: normalizeSuperAdminEmail(email),
    role: 'super_admin',
    accessLevel: 'level_0_root',
    facility_node: SUPER_ADMIN_FACILITY_NODE,
    token,
    authenticatedAt: new Date().toISOString(),
    portal_access: portalAccess,
  };
}

export function persistSuperAdminClientSession(
  session: SuperAdminSessionPayload,
): void {
  if (typeof window === 'undefined') return;

  const serialized = JSON.stringify(session);
  localStorage.setItem('super_admin_session', serialized);
  localStorage.setItem('nexora_superadmin_session', serialized);
  localStorage.setItem('curasync_superadmin_session', serialized);

  const attrs = 'path=/; max-age=86400; SameSite=Lax';
  document.cookie = `regal_role=super_admin; ${attrs}`;
  document.cookie = `nexora_superadmin_session=${encodeURIComponent(serialized)}; ${attrs}`;
  document.cookie = `curasync_superadmin_session=${encodeURIComponent(serialized)}; ${attrs}`;
  document.cookie = `auth-token=${encodeURIComponent(session.token)}; ${attrs}`;
}
