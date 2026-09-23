export const runtime = 'edge';

import { NextResponse } from 'next/server';

import {
  isRootMasterCredentials,
  normalizeSuperAdminEmail,
  normalizeSuperAdminPasscode,
} from '@/lib/auth/superAdminAuth';
import { SUPER_VAULT_SESSION_COOKIE } from '@/lib/super-admin/api-auth';

export const VAULT_SESSION_COOKIE = SUPER_VAULT_SESSION_COOKIE;
const VAULT_SESSION_TTL_SECONDS = 30 * 60;
const ROOT_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export async function POST(req: Request) {
  const body = (await req.json()) as { email?: string; passcode?: string };
  const cleanEmail = normalizeSuperAdminEmail(body.email);
  const cleanPass = normalizeSuperAdminPasscode(body.passcode);

  if (isRootMasterCredentials(cleanEmail, cleanPass)) {
    const response = NextResponse.json({
      success: true,
      role: 'SUPER_ADMIN',
      redirect: '/super-admin/dashboard',
    });

    response.cookies.set('platform_root', 'true', {
      path: '/',
      maxAge: ROOT_SESSION_MAX_AGE_SECONDS,
      sameSite: 'lax',
      httpOnly: false,
    });
    response.cookies.set(
      'super_admin_session',
      JSON.stringify({ email: cleanEmail, role: 'SUPER_ADMIN' }),
      {
        path: '/',
        maxAge: ROOT_SESSION_MAX_AGE_SECONDS,
        sameSite: 'lax',
        httpOnly: false,
      },
    );
    response.cookies.set(VAULT_SESSION_COOKIE, 'unlocked', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: VAULT_SESSION_TTL_SECONDS,
    });

    return response;
  }

  const passcode = cleanPass;
  const masterKey = process.env.SUPER_VAULT_MASTER_KEY?.trim() ?? '';

  if (!masterKey) {
    return NextResponse.json(
      { success: false, error: 'Super vault is not configured on the server.' },
      { status: 503 },
    );
  }

  if (!passcode || passcode !== masterKey) {
    return NextResponse.json({ success: false, error: 'Invalid master passcode.' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(VAULT_SESSION_COOKIE, 'unlocked', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: VAULT_SESSION_TTL_SECONDS,
  });

  return response;
}
