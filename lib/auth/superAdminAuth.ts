import { verifySuperAdminVaultCredentials } from '@/lib/auth/super-admin-auth';

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

/**
 * Super Admin authentication — vault table or env-configured bootstrap only.
 * No hardcoded credential lists.
 */
export async function verifySuperAdminCredentials(
  email: string,
  passcode: string,
): Promise<boolean> {
  const normalizedEmail = normalizeSuperAdminEmail(email);
  const normalizedPasscode = normalizeSuperAdminPasscode(passcode);

  if (!normalizedEmail || !normalizedPasscode) return false;

  const vaultOk = await verifySuperAdminVaultCredentials(normalizedEmail, normalizedPasscode);
  if (vaultOk) return true;

  const allowedEmails = (process.env.NEXORA_ADMIN_EMAILS ?? process.env.ADMIN_DEV_EMAIL ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  const configuredPassword = process.env.NEXORA_ADMIN_PASSWORD ?? '';

  if (allowedEmails.length === 0 || !configuredPassword) {
    return false;
  }

  return allowedEmails.includes(normalizedEmail) && normalizedPasscode === configuredPassword;
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
