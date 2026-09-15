import { NextResponse } from 'next/server';

function getAllowedAdminEmails(): string[] {
  const raw = process.env.NEXORA_ADMIN_EMAILS ?? process.env.ADMIN_DEV_EMAIL ?? '';
  return raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function POST(req: Request) {
  const body = (await req.json()) as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase() ?? '';
  const password = body.password ?? '';

  if (!email || !password) {
    return NextResponse.json({ success: false, error: 'Email and password required' }, { status: 400 });
  }

  const allowedEmails = getAllowedAdminEmails();
  const configuredPassword = process.env.NEXORA_ADMIN_PASSWORD ?? '';

  if (allowedEmails.length === 0 || !configuredPassword) {
    return NextResponse.json(
      { success: false, error: 'Admin login is not configured on the server.' },
      { status: 503 },
    );
  }

  if (!allowedEmails.includes(email) || password !== configuredPassword) {
    return NextResponse.json({ success: false, error: 'Invalid email or password.' }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    user: {
      email,
      role: 'administrator' as const,
    },
  });
}
