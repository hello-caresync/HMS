import { setNexoraRoleCookie } from '@/lib/auth/role-cookies';
import { CACHE_KEYS, writeLocalJson } from '@/lib/persistence/local-cache';

export const SESSION_KEYS = {
  admin: 'curasync_active_session',
  staff: 'curasync_staff_session',
  vendor: 'curasync_vendor_session',
  patient: 'curasync_patient_session',
  superAdmin: 'nexora_superadmin_session',
  doctor: 'active_doctor_session',
} as const;

export type StaffPortalSession = {
  id: string;
  hospital_id: string;
  hospital_name: string;
  full_name: string;
  staff_type: string;
  department: string;
  email: string;
  portal_access: string;
};

export type VendorSession = {
  id: string;
  company_name: string;
  vendor_name?: string;
  rep_email: string;
  email?: string;
  category: string;
  hospital_id?: string;
  vendor_code?: string;
  token?: string;
};

export function parseJsonSession<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

const COOKIE_ATTRS = 'path=/; max-age=86400; SameSite=Lax';

function mirrorSessionCookie(name: string, payload: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(payload)}; ${COOKIE_ATTRS}`;
}

export function persistStaffPortalSession(session: StaffPortalSession): void {
  if (typeof window === 'undefined') return;

  const hospitalSession = {
    ...session,
    role: session.staff_type,
    hospitalId: session.hospital_id,
    hospitalName: session.hospital_name,
    portal_access: session.portal_access || '/dashboard',
  };
  const payload = JSON.stringify(hospitalSession);

  localStorage.setItem(SESSION_KEYS.staff, payload);
  localStorage.setItem('curasync_staff_session', payload);
  localStorage.setItem('curasync_admin_session', payload);
  localStorage.setItem(SESSION_KEYS.admin, payload);
  writeLocalJson(CACHE_KEYS.hospitalInfo, {
    id: session.hospital_id || 'HOSP-01',
    nodeCode: session.hospital_id || 'HOSP-01',
    name: session.hospital_name || 'Regal Hospital',
    adminName: session.full_name || 'Hospital User',
    adminEmail: session.email || '',
  });
  setNexoraRoleCookie('staff');
  document.cookie = `${SESSION_KEYS.staff}=${encodeURIComponent(payload)}; ${COOKIE_ATTRS}`;
}

export function getStaffPortalSession(): StaffPortalSession | null {
  if (typeof window === 'undefined') return null;
  return parseJsonSession<StaffPortalSession>(localStorage.getItem(SESSION_KEYS.staff));
}

const HOSPITAL_APP_ROLES = ['Admin', 'Nurse', 'Receptionist', 'Pharmacist', 'Staff'] as const;

export function isHospitalAppRole(role?: string | null): boolean {
  if (!role || role === 'Doctor' || role === 'SuperAdmin') return false;
  return (HOSPITAL_APP_ROLES as readonly string[]).includes(role);
}

/** Hospital workspace administrators who may access the credentials vault. */
export function isHospitalAdminRole(role?: string | null): boolean {
  const normalized = String(role ?? '')
    .trim()
    .toLowerCase();
  return normalized === 'admin' || normalized === 'superadmin';
}

export function isHospitalAdminSession(session?: StaffPortalSession | null): boolean {
  return isHospitalAdminRole(session?.staff_type);
}

export function readHospitalAppSession(): StaffPortalSession | null {
  if (typeof window === 'undefined') return null;

  const keys = [SESSION_KEYS.admin, 'curasync_admin_session', SESSION_KEYS.staff];
  for (const key of keys) {
    const parsed = parseJsonSession<
      StaffPortalSession & { role?: string; hospitalId?: string; hospitalName?: string }
    >(localStorage.getItem(key));
    const hospitalId = parsed?.hospital_id || parsed?.hospitalId;
    if (!parsed || !hospitalId) continue;

    const staffType = parsed.staff_type || parsed.role || 'Staff';
    return {
      id: parsed.id || '',
      hospital_id: hospitalId,
      hospital_name: parsed.hospital_name || parsed.hospitalName || 'Hospital Node',
      full_name: parsed.full_name || 'Hospital User',
      staff_type: staffType,
      department: parsed.department || '',
      email: parsed.email || '',
      portal_access: parsed.portal_access || '/dashboard',
    };
  }

  return null;
}

export function persistVendorSession(session: VendorSession): void {
  if (typeof window === 'undefined') return;
  const payload = JSON.stringify(session);
  localStorage.setItem(SESSION_KEYS.vendor, payload);
  localStorage.setItem('vendor_session', payload);
  setNexoraRoleCookie('vendor');
  mirrorSessionCookie(SESSION_KEYS.vendor, payload);
}

export function getVendorSession(): VendorSession | null {
  if (typeof window === 'undefined') return null;
  return (
    parseJsonSession<VendorSession>(localStorage.getItem(SESSION_KEYS.vendor)) ??
    parseJsonSession<VendorSession>(localStorage.getItem('vendor_session'))
  );
}

export function resolveVendorCompanyDisplayName(session: VendorSession | null | undefined): string {
  if (!session) return 'Vendor Portal';

  const company = String(session.company_name ?? session.vendor_name ?? '').trim();
  if (company) return company;

  const fullName = String((session as VendorSession & { full_name?: string }).full_name ?? '').trim();
  if (fullName) {
    const fromParen = fullName.match(/\(([^)]+)\)/)?.[1]?.trim();
    if (fromParen) return fromParen;
    return fullName;
  }

  return 'Vendor Portal';
}

export function resolveStaffDepartmentRoute(staffType: string): string {
  const role = staffType.trim();
  if (role === 'Admin') return '/hospital/login';
  if (role === 'Doctor') return '/doctor/dashboard';
  if (['Nurse', 'Pharmacist', 'Receptionist', 'Staff'].includes(role)) return '/dashboard';
  return '/hospital/login';
}
