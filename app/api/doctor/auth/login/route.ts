export const runtime = 'edge';

import { NextResponse } from 'next/server';

import { authenticateDoctorCredential } from '@/lib/auth/doctorAuth';
import { createServerSupabase } from '@/lib/supabase/server';

/** Legacy route — verifies against `public.doctors`, not Supabase Auth. */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      email?: string;
      password?: string;
      identifier?: string;
      passcode?: string;
    };

    const identifier = String(body.identifier ?? body.email ?? '').trim();
    const passcode = String(body.passcode ?? body.password ?? '').trim();

    if (!identifier || !passcode) {
      return NextResponse.json(
        { success: false, error: 'Doctor ID or email and security passcode are required.' },
        { status: 400 },
      );
    }

    const supabase = createServerSupabase();
    const result = await authenticateDoctorCredential(supabase, identifier, passcode);

    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        doctorId: result.doctor.doctorId,
        fullName: result.doctor.doctorName,
        email: result.doctor.email,
        department: result.doctor.department,
        hospitalId: result.doctor.hospitalCode,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Clinician registry lookup failed.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
