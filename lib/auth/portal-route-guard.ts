import type { NextRequest } from 'next/server';

import {
  isHospitalCredentialAdmin,
  isStaffCredentialsAdminPath,
  resolveHospitalSessionRole,
} from '@/lib/auth/hospital-rbac';

export const CURASYNC_DOCTOR_SESSION_COOKIE = 'curasync_doctor_session';

export const PATIENT_PUBLIC_PATHS = ['/patient/login', '/patient/register'] as const;
export const DOCTOR_PUBLIC_PATHS = ['/doctor/login'] as const;
export const HOSPITAL_PUBLIC_PATHS = ['/hospital/login'] as const;

/** Global paths that must never pass through portal auth guards. */
export const GLOBAL_PUBLIC_PATHS = [
  '/',
  '/login',
  '/ops/platform-root',
  '/super-admin/login',
  '/admin/login',
  '/staff/login',
  '/vendor/login',
  '/vendor/portal/login',
] as const;

export type PortalZone = 'patient' | 'doctor' | 'hospital' | 'hospital_desk' | 'none';

export function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

export function isGlobalPublicPath(pathname: string): boolean {
  const path = normalizePathname(pathname);
  return GLOBAL_PUBLIC_PATHS.some((entry) => path === entry || path.startsWith(`${entry}/`));
}

export function isPublicPortalPath(pathname: string): boolean {
  const path = normalizePathname(pathname);
  return (
    PATIENT_PUBLIC_PATHS.some((entry) => path === entry || path.startsWith(`${entry}/`)) ||
    DOCTOR_PUBLIC_PATHS.some((entry) => path === entry || path.startsWith(`${entry}/`)) ||
    HOSPITAL_PUBLIC_PATHS.some((entry) => path === entry || path.startsWith(`${entry}/`))
  );
}

export function detectPortalZone(pathname: string): PortalZone {
  const path = normalizePathname(pathname);
  if (path.startsWith('/patient')) return 'patient';
  if (path.startsWith('/doctor')) return 'doctor';
  if (path.startsWith('/hospital')) return 'hospital';
  if (path.startsWith('/dashboard') || path.startsWith('/staff')) return 'hospital_desk';
  return 'none';
}

export function isPatientPublicPath(pathname: string): boolean {
  const path = normalizePathname(pathname);
  return PATIENT_PUBLIC_PATHS.some((entry) => path === entry || path.startsWith(`${entry}/`));
}

export function isDoctorPublicPath(pathname: string): boolean {
  const path = normalizePathname(pathname);
  return DOCTOR_PUBLIC_PATHS.some((entry) => path === entry || path.startsWith(`${entry}/`));
}

export function isHospitalPublicPath(pathname: string): boolean {
  const path = normalizePathname(pathname);
  return HOSPITAL_PUBLIC_PATHS.some((entry) => path === entry || path.startsWith(`${entry}/`));
}

function readRoleCookie(request: NextRequest): string {
  return (
    request.cookies.get('regal_role')?.value ??
    request.cookies.get('nexora_role')?.value ??
    ''
  )
    .trim()
    .toLowerCase();
}

function decodeCookieJson(raw: string | undefined): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw)) as Record<string, unknown>;
  } catch {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

/** Resolve desk role from session cookies set at hospital login. */
export function readHospitalDeskRoleFromRequest(request: NextRequest): string {
  const roleCookie = request.cookies.get('curasync_session_role')?.value?.trim();
  if (roleCookie) return roleCookie;

  const active = decodeCookieJson(request.cookies.get('curasync_active_session')?.value);
  if (active) {
    return resolveHospitalSessionRole({
      staff_type: typeof active.staff_type === 'string' ? active.staff_type : null,
      role: typeof active.role === 'string' ? active.role : null,
    });
  }

  const staff = decodeCookieJson(request.cookies.get('curasync_staff_session')?.value);
  if (staff) {
    return resolveHospitalSessionRole({
      staff_type: typeof staff.staff_type === 'string' ? staff.staff_type : null,
      role: typeof staff.role === 'string' ? staff.role : null,
    });
  }

  const session = decodeCookieJson(request.cookies.get('curasync_session')?.value);
  if (session && typeof session.role === 'string') {
    return session.role;
  }

  return 'STAFF';
}

export function hasStaffCredentialsDeskAccess(request: NextRequest): boolean {
  return isHospitalCredentialAdmin(readHospitalDeskRoleFromRequest(request));
}

export { isStaffCredentialsAdminPath };

export function hasHospitalDeskSession(request: NextRequest): boolean {
  const cookies = request.cookies;
  if (cookies.get('curasync_active_session')?.value) return true;
  if (cookies.get('curasync_session')?.value) return true;
  if (cookies.get('auth-token')?.value) return true;

  const role = cookies.get('curasync_session_role')?.value ?? '';
  return ['Admin', 'Staff', 'Nurse', 'Pharmacist', 'Doctor'].includes(role);
}

export function hasDoctorPortalSession(request: NextRequest): boolean {
  const role = readRoleCookie(request);
  if (role !== 'doctor') return false;
  return Boolean(request.cookies.get(CURASYNC_DOCTOR_SESSION_COOKIE)?.value);
}

export function hasPatientPortalSession(request: NextRequest, supabaseUserId: string | null): boolean {
  if (supabaseUserId) return true;
  const role = readRoleCookie(request);
  return role === 'patient' && Boolean(request.cookies.get('curasync_patient_session')?.value);
}
