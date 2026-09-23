import { NextResponse } from 'next/server';

import {
  isRootMasterCredentials,
  SUPER_ADMIN_ROOT_EMAIL,
} from '@/lib/auth/superAdminAuth';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = (body.email || body.username || '').trim().toLowerCase();
    const passcode = (body.passcode || body.password || '').trim();

    if (isRootMasterCredentials(email, passcode)) {
      const sessionPayload = {
        id: 'SUPER-ADMIN-ROOT',
        email: email || SUPER_ADMIN_ROOT_EMAIL,
        role: 'SUPER_ADMIN',
        name: 'Platform Root Super Admin',
        authenticated_at: new Date().toISOString(),
      };

      const response = NextResponse.json({
        success: true,
        role: 'SUPER_ADMIN',
        redirect: '/super-vault-access',
      });

      // Set platform security cookies for middleware & dashboard access
      response.cookies.set('platform_root', 'true', {
        path: '/',
        maxAge: 604800,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });

      response.cookies.set('super_admin_session', JSON.stringify(sessionPayload), {
        path: '/',
        maxAge: 604800,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });

      return response;
    }

    return NextResponse.json(
      { error: 'Invalid email or passcode.' },
      { status: 401 },
    );
  } catch {
    return NextResponse.json(
      { error: 'Failed to process login request.' },
      { status: 500 },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: 'POST, OPTIONS',
    },
  });
}
