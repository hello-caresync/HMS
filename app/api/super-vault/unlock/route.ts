import { NextResponse } from 'next/server';

export const VAULT_SESSION_COOKIE = 'nexora_super_vault_session';
const VAULT_SESSION_TTL_SECONDS = 30 * 60;

export async function POST(req: Request) {
  const body = (await req.json()) as { passcode?: string };
  const passcode = body.passcode?.trim() ?? '';
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
