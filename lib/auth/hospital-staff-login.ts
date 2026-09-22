import type { SupabaseClient } from '@supabase/supabase-js';

import {
  credentialRoleToStaffType,
  HOSPITAL_LOGIN_INVALID_MESSAGE,
  HOSPITAL_STAFF_TABLE,
  mapHospitalStaffAuthRow,
  type HospitalAuthResult,
  type HospitalAuthUser,
  type HospitalUserCredential,
} from '@/lib/auth/hospitalAuth';

export const HOSPITAL_STAFF_AUTH_SELECT =
  'id, hospital_id, staff_id_code, full_name, email, passcode_key, role, department, is_active';

/** Seven-day hospital desk session lifetime (matches login spec). */
export const HOSPITAL_SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export const HOSPITAL_SESSION_COOKIE_ATTRS = `path=/; max-age=${HOSPITAL_SESSION_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function passcodesMatch(stored: unknown, input: string): boolean {
  return String(stored ?? '').trim() === input.trim();
}

export function toAuthUser(credential: HospitalUserCredential, passcode: string): HospitalAuthUser {
  return {
    ...credential,
    staff_type: credentialRoleToStaffType(credential.role),
    passcode,
  };
}

/**
 * Direct lookup against `public.hospital_staff` by email or staff_id_code + passcode_key.
 * Never uses Supabase Auth (`auth.users` / signInWithPassword).
 */
export async function lookupActiveHospitalStaffByCredentials(
  supabase: SupabaseClient,
  identifier: string,
  passcode: string,
): Promise<{ row: Record<string, unknown> | null; error: string | null }> {
  const inputEmail = identifier.trim().toLowerCase();
  const inputPasscode = passcode.trim();

  if (!inputEmail || !inputPasscode) {
    return { row: null, error: 'missing' };
  }

  const isEmail = inputEmail.includes('@');

  if (isEmail) {
    const { data: staff, error } = await supabase
      .from(HOSPITAL_STAFF_TABLE)
      .select(HOSPITAL_STAFF_AUTH_SELECT)
      .ilike('email', inputEmail)
      .eq('passcode_key', inputPasscode)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('[hospital-staff-login] email lookup failed:', error.message);
      return { row: null, error: error.message };
    }

    if (staff) {
      return { row: asRecord(staff), error: null };
    }

    // Fallback: fetch active row by email, compare passcode in-process (handles special chars).
    const { data: byEmail, error: emailOnlyError } = await supabase
      .from(HOSPITAL_STAFF_TABLE)
      .select(HOSPITAL_STAFF_AUTH_SELECT)
      .ilike('email', inputEmail)
      .eq('is_active', true)
      .maybeSingle();

    if (emailOnlyError) {
      console.error('[hospital-staff-login] email-only lookup failed:', emailOnlyError.message);
      return { row: null, error: emailOnlyError.message };
    }

    if (byEmail && passcodesMatch(byEmail.passcode_key, inputPasscode)) {
      return { row: asRecord(byEmail), error: null };
    }

    return { row: null, error: null };
  }

  const staffCode = inputEmail.toUpperCase();
  const { data: staff, error } = await supabase
    .from(HOSPITAL_STAFF_TABLE)
    .select(HOSPITAL_STAFF_AUTH_SELECT)
    .ilike('staff_id_code', staffCode)
    .eq('passcode_key', inputPasscode)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('[hospital-staff-login] staff code lookup failed:', error.message);
    return { row: null, error: error.message };
  }

  if (staff) {
    return { row: asRecord(staff), error: null };
  }

  const { data: byCode, error: codeOnlyError } = await supabase
    .from(HOSPITAL_STAFF_TABLE)
    .select(HOSPITAL_STAFF_AUTH_SELECT)
    .ilike('staff_id_code', staffCode)
    .eq('is_active', true)
    .maybeSingle();

  if (codeOnlyError) {
    console.error('[hospital-staff-login] staff-code-only lookup failed:', codeOnlyError.message);
    return { row: null, error: codeOnlyError.message };
  }

  if (byCode && passcodesMatch(byCode.passcode_key, inputPasscode)) {
    return { row: asRecord(byCode), error: null };
  }

  return { row: null, error: null };
}

/**
 * Verify hospital portal credentials against `public.hospital_staff` only.
 * Never uses Supabase Auth (`auth.users` / signInWithPassword).
 */
export async function verifyHospitalStaffCredentials(
  supabase: SupabaseClient,
  identifier: string,
  passcode: string,
): Promise<HospitalAuthResult> {
  const inputPasscode = passcode.trim();

  if (!identifier.trim() || !inputPasscode) {
    return {
      ok: false,
      error: 'Enter your Employee ID or email and security passcode.',
    };
  }

  const { row, error } = await lookupActiveHospitalStaffByCredentials(
    supabase,
    identifier,
    inputPasscode,
  );

  if (error || !row) {
    return { ok: false, error: HOSPITAL_LOGIN_INVALID_MESSAGE };
  }

  const credential = mapHospitalStaffAuthRow(row);
  return { ok: true, user: toAuthUser(credential, inputPasscode) };
}

export type HospitalStaffSessionCookie = {
  id: string;
  hospital_id: string;
  hospitalId: string;
  staff_id_code: string;
  full_name: string;
  email: string;
  role: string;
  department: string;
  staff_type: string;
  portal_access: string;
};

export function buildHospitalStaffSessionCookie(
  source: HospitalAuthUser | Record<string, unknown>,
  portalAccess: string,
): HospitalStaffSessionCookie {
  const row = asRecord(source);
  const credential =
    'employee_id' in source && typeof (source as HospitalAuthUser).employee_id === 'string'
      ? (source as HospitalAuthUser)
      : toAuthUser(mapHospitalStaffAuthRow(row), String(row.passcode_key ?? ''));

  const rawRole = String(row.role ?? credential.staff_type ?? 'Staff').trim();

  return {
    id: credential.id,
    hospital_id: credential.hospital_id,
    hospitalId: credential.hospital_id,
    staff_id_code: String(row.staff_id_code ?? credential.employee_id ?? '').trim(),
    full_name: credential.full_name,
    email: credential.email,
    role: rawRole,
    department: credential.department,
    staff_type: credential.staff_type,
    portal_access: portalAccess,
  };
}
