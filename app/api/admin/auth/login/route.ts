export const runtime = 'edge';

import { NextResponse } from 'next/server';

import {
  buildSuperAdminSessionPayload,
  createSuperAdminSessionToken,
  normalizeSuperAdminEmail,
  normalizeSuperAdminPasscode,
  verifySuperAdminCredentials,
} from '@/lib/auth/superAdminAuth';

const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24,
};

function getAllowedAdminEmails(): string[] {
  const raw = process.env.NEXORA_ADMIN_EMAILS ?? process.env.ADMIN_DEV_EMAIL ?? '';
  return raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

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
      { success: false, error: 'Email and passcode required' },
      { status: 400 },
    );
  }

  if (verifySuperAdminCredentials(email, passcode)) {
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

    response.cookies.set('nexora_role', 'super_admin', {
      ...SESSION_COOKIE_OPTIONS,
      httpOnly: false,
    });
    response.cookies.set('nexora_superadmin_session', token, SESSION_COOKIE_OPTIONS);
    response.cookies.set('auth-token', token, SESSION_COOKIE_OPTIONS);

    return response;
  }

  const allowedEmails = getAllowedAdminEmails();
  const configuredPassword = process.env.NEXORA_ADMIN_PASSWORD ?? '';

  if (allowedEmails.length === 0 || !configuredPassword) {
    return NextResponse.json(
      { success: false, error: 'Invalid email or passcode.' },
      { status: 401 },
    );
  }

  if (!allowedEmails.includes(email) || passcode !== configuredPassword) {
    return NextResponse.json(
      { success: false, error: 'Invalid email or passcode.' },
      { status: 401 },
    );
  }

  return NextResponse.json({
    success: true,
    role: 'administrator',
    user: {
      email,
      role: 'administrator' as const,
    },
  });
}
