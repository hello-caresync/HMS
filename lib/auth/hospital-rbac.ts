/** Canonical hospital desk RBAC — admin credential vault & provisioning gates. */

export const HOSPITAL_CREDENTIAL_ADMIN_ROLES = [
  'ADMIN',
  'SUPER_ADMIN',
  'HOSPITAL_ADMIN',
  'SUPERADMIN',
] as const;

export type HospitalCredentialAdminRole = (typeof HOSPITAL_CREDENTIAL_ADMIN_ROLES)[number];

export function normalizeHospitalRole(role?: string | null): string {
  return String(role ?? 'STAFF')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
}

/** True for Admin, Super Admin, and Hospital Admin desk roles. */
export function isHospitalCredentialAdmin(role?: string | null): boolean {
  const normalized = normalizeHospitalRole(role);
  return (HOSPITAL_CREDENTIAL_ADMIN_ROLES as readonly string[]).includes(normalized);
}

export function resolveHospitalSessionRole(
  session?: { staff_type?: string | null; role?: string | null } | null,
): string {
  return session?.staff_type?.trim() || session?.role?.trim() || 'STAFF';
}

export function canManageStaffCredentials(
  session?: { staff_type?: string | null; role?: string | null } | null,
): boolean {
  const staffType = session?.staff_type ?? null;
  const role = session?.role ?? staffType;
  return isHospitalCredentialAdmin(staffType) || isHospitalCredentialAdmin(role);
}

/** Routes that require hospital administrator privileges. */
export const STAFF_CREDENTIALS_ADMIN_PATHS = [
  '/dashboard/staff-credentials',
  '/hospital/staff-credentials',
] as const;

export function isStaffCredentialsAdminPath(pathname: string): boolean {
  const path =
    pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  return STAFF_CREDENTIALS_ADMIN_PATHS.some(
    (entry) => path === entry || path.startsWith(`${entry}/`),
  );
}
