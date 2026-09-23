import { NextResponse } from 'next/server';

import {
  buildHospitalStaffSessionCookie,
  HOSPITAL_SESSION_COOKIE_MAX_AGE_SECONDS,
  lookupActiveHospitalStaffByCredentials,
  toAuthUser,
} from '@/lib/auth/hospital-staff-login';
import { HOSPITAL_DESK_DASHBOARD_PATH } from '@/lib/auth/hospital-desk-session';
import {
  HOSPITAL_LOGIN_INVALID_MESSAGE,
  mapHospitalStaffAuthRow,
} from '@/lib/auth/hospitalAuth';
import { REGAL_ROLE_COOKIE } from '@/lib/auth/role-cookies';
import { createClient } from '@supabase/supabase-js';
import { readPublicSupabaseEnv } from '@/lib/supabase/env';
import { REGAL_HOSPITAL_NAME } from '@/lib/regal/constants';

const SESSION_COOKIE_OPTIONS = {
  httpOnly: false,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: HOSPITAL_SESSION_COOKIE_MAX_AGE_SECONDS,
};

export async function POST(req: Request) {
  const body = (await req.json()) as {
    email?: string;
    identifier?: string;
    passcode?: string;
    password?: string;
    node?: string;
    tenant?: string;
  };

  const identifier = String(body.identifier ?? body.email ?? '').trim();
  const passcode = String(body.passcode ?? body.password ?? '').trim();
  const targetNode = String(body.node ?? body.tenant ?? '').trim() || undefined;

  if (!identifier || !passcode) {
    return NextResponse.json(
      { success: false, error: 'Invalid email or security passcode.' },
      { status: 400 },
    );
  }

  const { url, anonKey } = readPublicSupabaseEnv();
  if (!url || !anonKey) {
    return NextResponse.json(
      { success: false, error: 'Hospital authentication service is not configured.' },
      { status: 503 },
    );
  }

  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { row, error: lookupError } = await lookupActiveHospitalStaffByCredentials(
    supabase,
    identifier,
    passcode,
    targetNode,
  );

  if (lookupError || !row) {
    return NextResponse.json(
      { success: false, error: HOSPITAL_LOGIN_INVALID_MESSAGE },
      { status: 401 },
    );
  }

  const credential = mapHospitalStaffAuthRow(row);
  const user = toAuthUser(credential, passcode);
  const sessionPayload = buildHospitalStaffSessionCookie(row, HOSPITAL_DESK_DASHBOARD_PATH);
  const encoded = encodeURIComponent(JSON.stringify(sessionPayload));
  const deskRole =
    user.role === 'admin' ? 'admin' : user.role === 'doctor' ? 'doctor' : 'staff';

  const response = NextResponse.json({
    success: true,
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
      phone: user.phone,
      portal_access: HOSPITAL_DESK_DASHBOARD_PATH,
    },
  });

  response.cookies.set('hospital_session', encoded, SESSION_COOKIE_OPTIONS);
  response.cookies.set('user_session', encoded, SESSION_COOKIE_OPTIONS);
  response.cookies.set('curasync_active_session', encoded, SESSION_COOKIE_OPTIONS);
  response.cookies.set('curasync_session_role', user.staff_type, SESSION_COOKIE_OPTIONS);
  response.cookies.set(REGAL_ROLE_COOKIE, deskRole, SESSION_COOKIE_OPTIONS);
  response.cookies.set('auth-token', 'authenticated', SESSION_COOKIE_OPTIONS);

  return response;
}
