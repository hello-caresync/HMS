export const runtime = 'edge';

import { NextResponse } from 'next/server';

import {
  buildSuperAdminSessionPayload,
  createSuperAdminSessionToken,
  normalizeSuperAdminEmail,
  normalizeSuperAdminPasscode,
  SUPER_ADMIN_INVALID_CREDENTIALS_MESSAGE,
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
  response.cookies.set('nexora_superadmin_session', token, SESSION_COOKIE_OPTIONS);
  response.cookies.set('auth-token', token, SESSION_COOKIE_OPTIONS);

  return response;
}
