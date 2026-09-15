export const runtime = 'edge';

import { NextResponse } from 'next/server';

import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const { email, password } = (await req.json()) as { email?: string; password?: string };

  if (!email || !password) {
    return NextResponse.json({ success: false, error: 'Email and password required' }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const normalizedEmail = email.trim().toLowerCase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error || !data.user) {
    return NextResponse.json({ success: false, error: 'Invalid email or password.' }, { status: 401 });
  }

  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('id, uhid, name, full_name, phone')
    .eq('id', data.user.id)
    .maybeSingle();

  if (patientError || !patient?.id) {
    return NextResponse.json(
      { success: false, error: 'No patient profile found for this account.' },
      { status: 403 },
    );
  }

  return NextResponse.json({
    success: true,
    accessToken: data.session?.access_token,
    user: {
      patientId: String(patient.id),
      email: normalizedEmail,
      fullName: patient.full_name ?? patient.name ?? 'Patient',
      mrn: patient.uhid ?? String(patient.id),
    },
  });
}
