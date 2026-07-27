import { NextResponse } from 'next/server';
import { z } from 'zod';

import { authenticateDoctor } from '@/lib/doctor/server/login-service';
import { apiError } from '@/lib/doctor/server/api-http';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 400 });
    }

    const result = await authenticateDoctor(parsed.data.email, parsed.data.password);
    if (!result.ok) {
      const status = result.error.code === 'NO_DOCTOR_PRIVILEGES' ? 403 : 401;
      return NextResponse.json({ success: false, error: result.error.message, code: result.error.code }, { status });
    }

    return NextResponse.json({
      success: true,
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Login failed';
    return apiError(msg, 500);
  }
}

export async function DELETE() {
  return NextResponse.json({ success: true });
}
