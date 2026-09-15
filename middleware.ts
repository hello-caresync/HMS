import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_LOGIN_PATHS = [
  '/',
  '/ops/platform-root',
  '/super-admin/login',
  '/hospital/login',
  '/admin/login',
  '/doctor/login',
  '/staff/login',
  '/login',
  '/patient/login',
  '/vendor/login',
  '/vendor/portal/login',
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_LOGIN_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function isSuperAdminSession(request: NextRequest): boolean {
  const roleCookie = request.cookies.get('nexora_role')?.value;
  if (roleCookie === 'super_admin') return true;

  const vaultSession = request.cookies.get('nexora_superadmin_session')?.value;
  if (vaultSession) return true;

  const legacySession = request.cookies.get('curasync_superadmin_session')?.value;
  return Boolean(legacySession);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Always pass public static assets, api routes, and designated login gates
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    isPublicPath(pathname)
  ) {
    return NextResponse.next();
  }

  // Super Admin gateway destination is the vault only — never send sessions to the old dashboard.
  if (pathname === '/super-admin/dashboard' || pathname.startsWith('/super-admin/dashboard/')) {
    const vaultUrl = new URL('/super-vault-access', request.url);
    if (isSuperAdminSession(request)) {
      return NextResponse.redirect(vaultUrl);
    }
    const loginUrl = new URL('/super-admin/login', request.url);
    loginUrl.searchParams.set('redirect', '/super-vault-access');
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === '/super-vault-access' || pathname.startsWith('/super-vault-access/')) {
    if (!isSuperAdminSession(request)) {
      const loginUrl = new URL('/super-admin/login', request.url);
      loginUrl.searchParams.set('redirect', '/super-vault-access');
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/super-vault-access',
    '/super-vault-access/:path*',
    '/super-admin/:path*',
    '/dashboard/:path*',
    '/doctor/:path*',
    '/staff/:path*',
    '/patient/:path*',
    '/vendor/:path*',
  ],
};
