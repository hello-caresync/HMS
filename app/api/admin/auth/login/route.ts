export const runtime = 'edge';

import { NextResponse } from 'next/server';

import {
  buildSuperAdminSessionPayload,
  createSuperAdminSessionToken,
  normalizeSuperAdminEmail,
  normalizeSuperAdminPasscode,
  SUPER_ADMIN_INVALID_CREDENTIALS_MESSAGE,
  SUPER_ADMIN_ROOT_EMAIL,
  SUPER_ADMIN_ROOT_PASSCODE,
  verifySuperAdminCredentials,
} from '@/lib/auth/superAdminAuth';

const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24,
};

export async function POST(req: Request) {
  const body = (await req.json()) as {
    email?: string;
    password?: string;
    passcode?: string;
  };

  const email = normalizeSuperAdminEmail(body.email);
  const passcode = normalizeSuperAdminPasscode(body.passcode ?? body.password);

  if (!email || !passcode) {
    return NextResponse.json(
      { success: false, error: SUPER_ADMIN_INVALID_CREDENTIALS_MESSAGE },
      { status: 400 },
    );
  }

  if (email === SUPER_ADMIN_ROOT_EMAIL && passcode === SUPER_ADMIN_ROOT_PASSCODE) {
    const rootSession = {
      id: 'SUPER-ADMIN-ROOT',
      email,
      role: 'SUPER_ADMIN',
      name: 'Root Platform Admin',
      authenticated_at: new Date().toISOString(),
    };

    const response = NextResponse.json({
      success: true,
      role: 'SUPER_ADMIN',
      token: 'root-token',
      redirect: '/super-admin/dashboard',
    });

    response.cookies.set('platform_root', 'true', {
      ...SESSION_COOKIE_OPTIONS,
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 7,
    });
    response.cookies.set('regal_role', 'super_admin', {
      ...SESSION_COOKIE_OPTIONS,
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 7,
    });
    response.cookies.set('super_admin_session', JSON.stringify(rootSession), {
      ...SESSION_COOKIE_OPTIONS,
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 7,
    });
    response.cookies.set('hospital_session', JSON.stringify(rootSession), {
      ...SESSION_COOKIE_OPTIONS,
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 7,
    });
    response.cookies.set('auth-token', 'root-token', SESSION_COOKIE_OPTIONS);

    return response;
  }

  if (!verifySuperAdminCredentials(email, passcode)) {
    return NextResponse.json(
      { success: false, error: SUPER_ADMIN_INVALID_CREDENTIALS_MESSAGE },
      { status: 401 },
    );
  }

  const token = createSuperAdminSessionToken();
  const session = buildSuperAdminSessionPayload(email, token);

  const response = NextResponse.json({
    success: true,
    role: 'super_admin',
    facility_node: session.facility_node,
    token,
    user: {
      email: session.email,
      role: 'super_admin',
    },
  });

  response.cookies.set('regal_role', 'super_admin', {
    ...SESSION_COOKIE_OPTIONS,
    httpOnly: false,
  });
  response.cookies.set('platform_root', 'true', {
    ...SESSION_COOKIE_OPTIONS,
    httpOnly: false,
  });
  response.cookies.set(
    'super_admin_session',
    JSON.stringify({
      email: session.email,
      role: 'SUPER_ADMIN',
      authenticated_at: session.authenticatedAt,
      token,
      facility_node: session.facility_node,
      portal_access: session.portal_access,
    }),
    {
      ...SESSION_COOKIE_OPTIONS,
      httpOnly: false,
    },
  );
  response.cookies.set('nexora_superadmin_session', token, SESSION_COOKIE_OPTIONS);
  response.cookies.set('auth-token', token, SESSION_COOKIE_OPTIONS);

  return response;
}
