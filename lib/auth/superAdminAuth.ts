export const SUPER_ADMIN_ACCEPTED_EMAILS = [
  'superadmin@regalhospital.com',
  'superadmin@regalhms.com',
  'aishwaryaananya43@gmail.com',
] as const;

export const SUPER_ADMIN_ACCEPTED_PASSCODES = [
  'REGAL#2026@SUPER_ROOT',
  'SuperAdmin@Regal2026',
] as const;

export const SUPER_ADMIN_FACILITY_NODE = 'HOSP-01';

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

export function verifySuperAdminCredentials(email: string, passcode: string): boolean {
  const normalizedEmail = normalizeSuperAdminEmail(email);
  const normalizedPasscode = normalizeSuperAdminPasscode(passcode);

  if (!normalizedEmail || !normalizedPasscode) return false;

  const emailAllowed = (SUPER_ADMIN_ACCEPTED_EMAILS as readonly string[]).includes(
    normalizedEmail,
  );
  const passcodeAllowed = (SUPER_ADMIN_ACCEPTED_PASSCODES as readonly string[]).includes(
    normalizedPasscode,
  );

  return emailAllowed && passcodeAllowed;
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
  portalAccess = '/super-admin/dashboard',
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
  document.cookie = `nexora_superadmin_session=${encodeURIComponent(serialized)}; ${attrs}`;
  document.cookie = `curasync_superadmin_session=${encodeURIComponent(serialized)}; ${attrs}`;
  document.cookie = `auth-token=${encodeURIComponent(session.token)}; ${attrs}`;
}
