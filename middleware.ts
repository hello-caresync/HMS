import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import {
  hospitalDeskLoginUrl,
  HOSPITAL_DESK_DASHBOARD_PATH,
} from '@/lib/auth/hospital-desk-session';
import { appendRedirectQuery } from '@/lib/auth/safe-redirect';
import {
  detectPortalZone,
  hasDoctorPortalSession,
  hasHospitalDeskSession,
  hasPatientPortalSession,
  hasStaffCredentialsDeskAccess,
  isDoctorPublicPath,
  isGlobalPublicPath,
  isHospitalPublicPath,
  isPatientPublicPath,
  isStaffCredentialsAdminPath,
  normalizePathname,
  readVerifiedHospitalDeskSession,
} from '@/lib/auth/portal-route-guard';
import { createMiddlewareSupabase } from '@/lib/supabase/middleware-client';

function normalizeHospitalRole(role?: string | null): string {
  if (!role) return '';
  const normalized = role.trim().toUpperCase();
  if (normalized.includes('DOCTOR') || normalized.includes('CLINICIAN')) return 'DOCTOR';
  if (normalized.includes('ADMIN')) return 'ADMIN';
  if (normalized.includes('NURSE')) return 'NURSE';
  if (normalized.includes('RECEPTION')) return 'RECEPTIONIST';
  if (normalized.includes('PHARMAC')) return 'PHARMACIST';
  return normalized;
}

function isPublicAuthRoute(pathname: string): boolean {
  const publicAuthPaths = [
    '/hospital/login',
    '/login',
    '/doctor/login',
    '/super-vault-access',
    '/auth',
    '/',
  ];
  return publicAuthPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`) || pathname.startsWith('/auth'),
  );
}

const LEGACY_HOSPITAL_OPD_PATHS = [
  '/dashboard/opd',
  '/hospital/opd',
  '/hospital/opd-queue',
] as const;

function isLegacyHospitalOpdPath(pathname: string): boolean {
  const lower = pathname.toLowerCase();
  return LEGACY_HOSPITAL_OPD_PATHS.some(
    (legacy) => lower === legacy || lower.startsWith(`${legacy}/`),
  );
}

function isSuperAdminSession(request: NextRequest): boolean {
  const roleCookie =
    request.cookies.get('regal_role')?.value ?? request.cookies.get('nexora_role')?.value;
  if (roleCookie === 'super_admin') return true;

  const vaultSession = request.cookies.get('nexora_superadmin_session')?.value;
  if (vaultSession) return true;

  const legacySession = request.cookies.get('curasync_superadmin_session')?.value;
  return Boolean(legacySession);
}

function redirectWithCookies(
  request: NextRequest,
  destination: string,
  applyCookies: (response: NextResponse) => NextResponse,
): NextResponse {
  const url = new URL(destination, request.url);
  return applyCookies(NextResponse.redirect(url));
}

/** Block non-admin hospital desk users from credential vault routes. */
function enforceStaffCredentialsRbac(
  request: NextRequest,
  path: string,
  applyCookies: (response: NextResponse) => NextResponse,
): NextResponse | null {
  if (!isStaffCredentialsAdminPath(path)) return null;
  if (isSuperAdminSession(request)) return null;
  if (hasStaffCredentialsDeskAccess(request)) return null;

  return redirectWithCookies(
    request,
    `${HOSPITAL_DESK_DASHBOARD_PATH}?unauthorized=staff-credentials`,
    applyCookies,
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public auth routes — always show login forms; never auto-skip on stale doctor cookies.
  if (isPublicAuthRoute(pathname)) {
    return NextResponse.next({ request });
  }

  const path = normalizePathname(pathname);

  if (
    path.startsWith('/api') ||
    path.startsWith('/_next') ||
    isGlobalPublicPath(path)
  ) {
    return NextResponse.next({ request });
  }

  const { getUser, applyCookies } = createMiddlewareSupabase(request);
  const supabaseUser = await getUser();
  const supabaseUserId = supabaseUser?.id ?? null;

  if (isLegacyHospitalOpdPath(path)) {
    if (hasHospitalDeskSession(request)) {
      return redirectWithCookies(request, HOSPITAL_DESK_DASHBOARD_PATH, applyCookies);
    }
    return redirectWithCookies(request, hospitalDeskLoginUrl(path), applyCookies);
  }

  if (path === '/hospital/dashboard' || path.startsWith('/hospital/dashboard?')) {
    const suffix = path.slice('/hospital/dashboard'.length);
    return redirectWithCookies(request, `${HOSPITAL_DESK_DASHBOARD_PATH}${suffix}`, applyCookies);
  }

  if (path === '/dashboard' || path.startsWith('/dashboard/')) {
    const hospitalSession = request.cookies.get('hospital_session')?.value;
    if (!hospitalSession) {
      return redirectWithCookies(request, hospitalDeskLoginUrl(path), applyCookies);
    }

    const verified = readVerifiedHospitalDeskSession(request);
    if (verified) {
      const staffRole = normalizeHospitalRole(verified.staffType);
      if (staffRole === 'DOCTOR') {
        return redirectWithCookies(request, '/doctor/dashboard', applyCookies);
      }
    }

    const credentialsDenied = enforceStaffCredentialsRbac(request, path, applyCookies);
    if (credentialsDenied) return credentialsDenied;

    return applyCookies(NextResponse.next({ request }));
  }

  if (path === '/doctor/dashboard' || path.startsWith('/doctor/dashboard/')) {
    if (!hasDoctorPortalSession(request)) {
      return redirectWithCookies(
        request,
        appendRedirectQuery('/doctor/login', path),
        applyCookies,
      );
    }
    return applyCookies(NextResponse.next({ request }));
  }

  if (path === '/super-admin/dashboard' || path.startsWith('/super-admin/dashboard/')) {
    if (isSuperAdminSession(request)) {
      return redirectWithCookies(request, '/super-vault-access', applyCookies);
    }
    return redirectWithCookies(
      request,
      appendRedirectQuery('/super-admin/login', '/super-vault-access'),
      applyCookies,
    );
  }

  const superAdminVaultPaths = [
    '/super-vault-access',
    '/super-admin/tenants',
    '/super-admin/staff-credentials',
  ] as const;

  const isSuperAdminVaultPath = superAdminVaultPaths.some(
    (vaultPath) => path === vaultPath || path.startsWith(`${vaultPath}/`),
  );

  if (isSuperAdminVaultPath) {
    if (!isSuperAdminSession(request)) {
      return redirectWithCookies(
        request,
        appendRedirectQuery('/super-admin/login', path),
        applyCookies,
      );
    }
    return applyCookies(NextResponse.next({ request }));
  }

  const zone = detectPortalZone(path);

  if (zone === 'patient') {
    const authenticated = hasPatientPortalSession(request, supabaseUserId);

    if (isPatientPublicPath(path)) {
      if (authenticated && (path === '/patient/login' || path === '/patient/register')) {
        return redirectWithCookies(request, '/patient/dashboard', applyCookies);
      }
      return applyCookies(NextResponse.next({ request }));
    }

    if (!authenticated) {
      return redirectWithCookies(
        request,
        appendRedirectQuery('/patient/login', path),
        applyCookies,
      );
    }

    return applyCookies(NextResponse.next({ request }));
  }

  if (zone === 'doctor') {
    if (isDoctorPublicPath(path)) {
      return applyCookies(NextResponse.next({ request }));
    }

    if (!hasDoctorPortalSession(request)) {
      return redirectWithCookies(
        request,
        appendRedirectQuery('/doctor/login', path),
        applyCookies,
      );
    }

    return applyCookies(NextResponse.next({ request }));
  }

  if (zone === 'hospital') {
    const verifiedDesk = readVerifiedHospitalDeskSession(request);

    if (isHospitalPublicPath(path)) {
      return applyCookies(NextResponse.next({ request }));
    }

    if (!verifiedDesk) {
      return redirectWithCookies(request, hospitalDeskLoginUrl(path), applyCookies);
    }

    const credentialsDenied = enforceStaffCredentialsRbac(request, path, applyCookies);
    if (credentialsDenied) return credentialsDenied;

    return applyCookies(NextResponse.next({ request }));
  }

  if (zone === 'hospital_desk') {
    const hospitalSession = request.cookies.get('hospital_session')?.value;
    if (!hospitalSession) {
      return redirectWithCookies(request, hospitalDeskLoginUrl(path), applyCookies);
    }

    const credentialsDenied = enforceStaffCredentialsRbac(request, path, applyCookies);
    if (credentialsDenied) return credentialsDenied;

    return applyCookies(NextResponse.next({ request }));
  }

  return applyCookies(NextResponse.next({ request }));
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)',
  ],
};
