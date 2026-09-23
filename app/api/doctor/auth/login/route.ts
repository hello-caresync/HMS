import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import {
  authenticateDoctorCredential,
  buildDoctorSessionForCookie,
} from '@/lib/auth/doctorAuth';
import { HOSPITAL_DESK_DASHBOARD_PATH } from '@/lib/auth/hospital-desk-session';
import { buildHospitalStaffSessionCookie } from '@/lib/auth/hospital-staff-login';
import { CURASYNC_DOCTOR_SESSION_COOKIE } from '@/lib/auth/portal-route-guard';
import { REGAL_ROLE_COOKIE } from '@/lib/auth/role-cookies';
import { readPublicSupabaseEnv } from '@/lib/supabase/env';
import { REGAL_HOSPITAL_NAME } from '@/lib/regal/constants';

const SESSION_COOKIE_OPTIONS = {
  httpOnly: false,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24,
};

export async function POST(req: Request) {
  const body = (await req.json()) as {
    identifier?: string;
    email?: string;
    doctorId?: string;
    passcode?: string;
    pin?: string;
    password?: string;
  };

  const identifier = String(body.identifier ?? body.email ?? body.doctorId ?? '').trim();
  const passcode = String(body.passcode ?? body.pin ?? body.password ?? '').trim();

  if (!identifier || !passcode) {
    return NextResponse.json(
      { success: false, error: 'Invalid email or security passcode.' },
      { status: 400 },
    );
  }

  const { url, anonKey } = readPublicSupabaseEnv();
  if (!url || !anonKey) {
    return NextResponse.json(
      { success: false, error: 'Clinician authentication service is not configured.' },
      { status: 503 },
    );
  }

  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const result = await authenticateDoctorCredential(supabase, identifier, passcode);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: 401 });
  }

  if (result.kind === 'admin') {
    const user = result.user;
    const sessionPayload = buildHospitalStaffSessionCookie(user, HOSPITAL_DESK_DASHBOARD_PATH);
    const encoded = encodeURIComponent(JSON.stringify(sessionPayload));

    const response = NextResponse.json({
      success: true,
      kind: 'admin',
      redirectTo: result.redirectTo,
      user: {
        id: user.id,
        hospital_id: user.hospital_id,
        hospital_name: user.hospital_name || REGAL_HOSPITAL_NAME,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        staff_type: user.staff_type,
        department: user.department,
        employee_id: user.employee_id,
        portal_access: HOSPITAL_DESK_DASHBOARD_PATH,
      },
    });

    response.cookies.set('hospital_session', encoded, SESSION_COOKIE_OPTIONS);
    response.cookies.set('curasync_active_session', encoded, SESSION_COOKIE_OPTIONS);
    response.cookies.set('curasync_session_role', user.staff_type, SESSION_COOKIE_OPTIONS);
    response.cookies.set(REGAL_ROLE_COOKIE, 'admin', SESSION_COOKIE_OPTIONS);
    response.cookies.set('auth-token', 'authenticated', SESSION_COOKIE_OPTIONS);

    return response;
  }

  const doctorSession = buildDoctorSessionForCookie(result.doctor);
  const encoded = encodeURIComponent(JSON.stringify(doctorSession));

  const response = NextResponse.json({
    success: true,
    kind: 'doctor',
    redirectTo: '/doctor/dashboard',
    doctor: doctorSession,
    portalSession: result.portalSession,
  });

  response.cookies.set(CURASYNC_DOCTOR_SESSION_COOKIE, encoded, SESSION_COOKIE_OPTIONS);
  response.cookies.set(REGAL_ROLE_COOKIE, 'doctor', SESSION_COOKIE_OPTIONS);
  response.cookies.set('auth-token', 'authenticated', SESSION_COOKIE_OPTIONS);

  return response;
}
