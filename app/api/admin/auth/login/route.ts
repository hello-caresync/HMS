import { NextResponse } from 'next/server';

export const runtime = 'edge';

const ROOT_EMAIL = 'superadmin@regalhospital.com';
const ROOT_PASSCODES = ['REGAL#2026@SUPER_ROOT', 'REGAL@ROOT2026'] as const;

function isAuthorizedSuperAdmin(email: string, passcode: string): boolean {
  return email === ROOT_EMAIL && ROOT_PASSCODES.includes(passcode as (typeof ROOT_PASSCODES)[number]);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; passcode?: string; password?: string };
    const email = (body.email || '').trim().toLowerCase();
    const passcode = (body.passcode || body.password || '').trim();

    if (!isAuthorizedSuperAdmin(email, passcode)) {
      return NextResponse.json({ error: 'Invalid email or passcode.' }, { status: 401 });
    }

    const sessionPayload = {
      id: 'SUPER-ADMIN-ROOT',
      email,
      role: 'SUPER_ADMIN',
      name: 'Platform Root Super Admin',
      authenticated_at: new Date().toISOString(),
    };

    const response = NextResponse.json({
      success: true,
      role: 'SUPER_ADMIN',
      redirect: '/super-admin/dashboard',
    });

    const cookieOptions = {
      path: '/',
      maxAge: 604800,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false,
    };

    response.cookies.set('platform_root', 'true', cookieOptions);
    response.cookies.set('super_admin_session', JSON.stringify(sessionPayload), cookieOptions);
    response.cookies.set('hospital_session', JSON.stringify(sessionPayload), cookieOptions);
    response.cookies.set('regal_role', 'super_admin', cookieOptions);

    return response;
  } catch {
    return NextResponse.json({ error: 'Authentication processing failed.' }, { status: 500 });
  }
}
