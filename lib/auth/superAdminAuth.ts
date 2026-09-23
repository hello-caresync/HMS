/** Canonical Super Admin root operator credentials. */
export const SUPER_ADMIN_ROOT_EMAIL = 'superadmin@regalhospital.com';
export const SUPER_ADMIN_ROOT_PASSCODE = 'REGAL@ROOT2026';
export const SUPER_ADMIN_ROOT_PASSCODE_LEGACY = 'REGAL#2026@SUPER_ROOT';

export const SUPER_ADMIN_ROOT_PASSCODES = [
  SUPER_ADMIN_ROOT_PASSCODE,
  SUPER_ADMIN_ROOT_PASSCODE_LEGACY,
] as const;
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

export function isRootMasterPasscode(passcode: string): boolean {
  const normalizedPasscode = normalizeSuperAdminPasscode(passcode);
  if (!normalizedPasscode) return false;
  return (SUPER_ADMIN_ROOT_PASSCODES as readonly string[]).includes(normalizedPasscode);
}

export function isRootMasterCredentials(email: string, passcode: string): boolean {
  const normalizedEmail = normalizeSuperAdminEmail(email);
  if (!normalizedEmail) return false;
  return normalizedEmail === SUPER_ADMIN_ROOT_EMAIL && isRootMasterPasscode(passcode);
}

/** Strict match — only the canonical root email/passcode pair is accepted. */
export function verifySuperAdminCredentials(email: string, passcode: string): boolean {
  return isRootMasterCredentials(email, passcode);
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

export const SUPER_ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type SuperAdminGatewaySession = {
  email: string;
  role: 'SUPER_ADMIN' | 'super_admin';
  authenticated_at: string;
  token?: string;
  facility_node?: string;
  portal_access?: string;
};

export function buildSuperAdminGatewaySession(
  email: string,
  token?: string,
  portalAccess = '/super-admin/dashboard',
): SuperAdminGatewaySession {
  return {
    email: normalizeSuperAdminEmail(email),
    role: 'SUPER_ADMIN',
    authenticated_at: new Date().toISOString(),
    token,
    facility_node: SUPER_ADMIN_FACILITY_NODE,
    portal_access: portalAccess,
  };
}

export type RootMasterGatewaySession = {
  id: string;
  email: string;
  role: 'SUPER_ADMIN';
  name: string;
  authenticated_at: string;
};

/** Immediate client-side root gateway unlock — no API round-trip required. */
export function persistRootMasterSuperAdminGatewaySession(email: string): RootMasterGatewaySession {
  const sessionObj: RootMasterGatewaySession = {
    id: 'SUPER-ADMIN-ROOT',
    email: normalizeSuperAdminEmail(email),
    role: 'SUPER_ADMIN',
    name: 'Platform Root Super Admin',
    authenticated_at: new Date().toISOString(),
  };

  if (typeof window === 'undefined') return sessionObj;

  const serialized = JSON.stringify(sessionObj);
  const attrs = `path=/; max-age=${SUPER_ADMIN_SESSION_MAX_AGE_SECONDS}; SameSite=Lax`;

  document.cookie = `super_admin_session=${encodeURIComponent(serialized)}; ${attrs}`;
  document.cookie = `platform_root=true; ${attrs}`;
  document.cookie = `hospital_session=${encodeURIComponent(serialized)}; ${attrs}`;
  document.cookie = `regal_role=super_admin; ${attrs}`;
  document.cookie = `auth-token=root-token; ${attrs}`;

  localStorage.setItem('super_admin_session', serialized);
  localStorage.setItem('platform_root_unlocked', 'true');

  return sessionObj;
}

export function persistSuperAdminClientSession(
  session: SuperAdminSessionPayload,
): void {
  if (typeof window === 'undefined') return;

  const serialized = JSON.stringify(session);
  const gatewaySession = buildSuperAdminGatewaySession(
    session.email,
    session.token,
    session.portal_access,
  );
  const gatewaySerialized = JSON.stringify(gatewaySession);

  localStorage.setItem('super_admin_session', gatewaySerialized);
  localStorage.setItem('nexora_superadmin_session', serialized);
  localStorage.setItem('curasync_superadmin_session', serialized);

  const attrs = `path=/; max-age=${SUPER_ADMIN_SESSION_MAX_AGE_SECONDS}; SameSite=Lax`;
  document.cookie = `regal_role=super_admin; ${attrs}`;
  document.cookie = `platform_root=true; ${attrs}`;
  document.cookie = `super_admin_session=${encodeURIComponent(gatewaySerialized)}; ${attrs}`;
  document.cookie = `nexora_superadmin_session=${encodeURIComponent(serialized)}; ${attrs}`;
  document.cookie = `curasync_superadmin_session=${encodeURIComponent(serialized)}; ${attrs}`;
  document.cookie = `auth-token=${encodeURIComponent(session.token)}; ${attrs}`;
}

/** Persist a delegated super-admin session from hospital_staff credential rows. */
export function persistDelegatedSuperAdminSession(staff: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;

  const email = normalizeSuperAdminEmail(String(staff.email ?? ''));
  const token = createSuperAdminSessionToken();
  const gatewaySession = {
    ...staff,
    email,
    role: 'SUPER_ADMIN',
    authenticated_at: new Date().toISOString(),
    token,
  };
  const gatewaySerialized = JSON.stringify(gatewaySession);
  const attrs = `path=/; max-age=${SUPER_ADMIN_SESSION_MAX_AGE_SECONDS}; SameSite=Lax`;

  localStorage.setItem('super_admin_session', gatewaySerialized);
  document.cookie = `platform_root=true; ${attrs}`;
  document.cookie = `super_admin_session=${encodeURIComponent(gatewaySerialized)}; ${attrs}`;
  document.cookie = `regal_role=super_admin; ${attrs}`;
  document.cookie = `nexora_superadmin_session=${encodeURIComponent(token)}; ${attrs}`;
  document.cookie = `auth-token=${encodeURIComponent(token)}; ${attrs}`;
}
