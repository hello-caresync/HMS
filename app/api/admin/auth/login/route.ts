import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = (body.email || body.username || '').trim().toLowerCase();
    const passcode = (body.passcode || body.password || '').trim();

    // Check Root Master Super Admin credentials
    const isMasterEmail = email === 'superadmin@regalhospital.com';
    const isMasterPasscode =
      passcode === 'REGAL#2026@SUPER_ROOT' ||
      passcode === 'REGAL@ROOT2026';

    if (isMasterEmail && isMasterPasscode) {
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
