import { NextResponse } from 'next/server';

import { authenticateDoctorCredential } from '@/lib/auth/doctorAuth';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { identifier?: string; passcode?: string };
    const identifier = String(body.identifier ?? '').trim();
    const passcode = String(body.passcode ?? '').trim();

    if (!identifier || !passcode) {
      return NextResponse.json(
        { ok: false, error: 'Enter your Doctor ID or hospital email and security passcode.' },
        { status: 400 },
      );
    }

    const supabase = createServerSupabase();
    const result = await authenticateDoctorCredential(supabase, identifier, passcode);

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 401 });
    }

    if (result.kind === 'admin') {
      return NextResponse.json(
        {
          ok: false,
          kind: 'admin',
          redirectTo: result.redirectTo,
          error:
            'This is an Administrator account. Please sign in via the Hospital Portal at /hospital/login.',
        },
        { status: 403 },
      );
    }

    return NextResponse.json({ ok: true, kind: 'doctor', doctor: result.doctor });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Clinician registry lookup failed.';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
