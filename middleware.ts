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
  resolveHospitalDeskHomePath,
} from '@/lib/auth/portal-route-guard';
import { createMiddlewareSupabase } from '@/lib/supabase/middleware-client';

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

  if (path === '/dashboard' || path.startsWith('/dashboard?')) {
    const verified = readVerifiedHospitalDeskSession(request);
    if (verified) {
      if (resolveHospitalDeskHomePath(verified.staffType) === '/doctor/dashboard') {
        return redirectWithCookies(request, '/doctor/dashboard', applyCookies);
      }
      return applyCookies(NextResponse.next({ request }));
    }
    if (!hasHospitalDeskSession(request) && !hasDoctorPortalSession(request)) {
      return redirectWithCookies(request, hospitalDeskLoginUrl(path), applyCookies);
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
    const authenticated = hasDoctorPortalSession(request);

    if (isDoctorPublicPath(path)) {
      if (authenticated && path === '/doctor/login') {
        return redirectWithCookies(request, '/doctor', applyCookies);
      }
      return applyCookies(NextResponse.next({ request }));
    }

    if (!authenticated) {
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
    const authenticated = Boolean(verifiedDesk) || hasDoctorPortalSession(request);

    if (isHospitalPublicPath(path)) {
      if (path === '/hospital/login') {
        if (verifiedDesk) {
          return redirectWithCookies(
            request,
            resolveHospitalDeskHomePath(verifiedDesk.staffType),
            applyCookies,
          );
        }
        return applyCookies(NextResponse.next({ request }));
      }
      return applyCookies(NextResponse.next({ request }));
    }

    if (!authenticated) {
      return redirectWithCookies(request, hospitalDeskLoginUrl(path), applyCookies);
    }

    const credentialsDenied = enforceStaffCredentialsRbac(request, path, applyCookies);
    if (credentialsDenied) return credentialsDenied;

    return applyCookies(NextResponse.next({ request }));
  }

  if (zone === 'hospital_desk') {
    if (!hasHospitalDeskSession(request) && !hasDoctorPortalSession(request)) {
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
