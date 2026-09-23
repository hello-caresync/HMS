import type { SupabaseClient } from '@supabase/supabase-js';

import { HOSPITAL_DESK_DASHBOARD_PATH } from '@/lib/auth/hospital-desk-session';
import {
  credentialRoleToStaffType,
  HOSPITAL_LOGIN_INVALID_MESSAGE,
  HOSPITAL_STAFF_TABLE,
  mapHospitalStaffAuthRow,
  normalizeCredentialRole,
  type HospitalAuthResult,
  type HospitalAuthUser,
  type HospitalUserCredential,
} from '@/lib/auth/hospitalAuth';
import { REGAL_HOSPITAL_CODE } from '@/lib/regal/constants';

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

/** Resilient tenant pin — always allow canonical Regal node staff. */
export function staffMatchesLoginTargetNode(
  staffHospitalId: string,
  targetNode?: string | null,
): boolean {
  if (!targetNode?.trim()) return true;

  const staffNode = String(staffHospitalId ?? '').trim().toLowerCase();
  const target = targetNode.trim().toLowerCase();

  if (!staffNode) return true;
  if (staffNode === REGAL_HOSPITAL_CODE.toLowerCase()) return true;
  if (staffNode === target) return true;

  return false;
}

export function resolveHospitalStaffLoginRoute(role?: string | null): string {
  const normalized = normalizeCredentialRole(role);
  if (normalized === 'admin') return HOSPITAL_DESK_DASHBOARD_PATH;
  if (normalized === 'doctor') return '/doctor/dashboard';
  return HOSPITAL_DESK_DASHBOARD_PATH;
}

export type HospitalStaffLoginResult =
  | { ok: true; staff: Record<string, unknown> }
  | { ok: false; error: string; serviceError?: boolean };

/**
 * Direct verification against `public.hospital_staff` by email or staff_id_code.
 * Passcode is compared in-process so special characters (e.g. `#`, `@`) never break PostgREST filters.
 */
export async function authenticateHospitalStaffLogin(
  supabase: SupabaseClient,
  identifier: string,
  passcode: string,
  targetNode?: string | null,
): Promise<HospitalStaffLoginResult> {
  const inputId = identifier.trim().toLowerCase();
  const inputPasscode = passcode.trim();

  if (!inputId || !inputPasscode) {
    return {
      ok: false,
      error: 'Enter your Employee ID or email and security passcode.',
    };
  }

  const staffCodeLookup = inputId.includes('@') ? null : inputId.toUpperCase();
  const collected: Record<string, unknown>[] = [];

  const appendUnique = (rows: unknown[] | null | undefined) => {
    for (const row of rows ?? []) {
      const record = asRecord(row);
      const key = String(record.id ?? record.email ?? record.staff_id_code ?? '').trim();
      if (!key || collected.some((existing) => String(existing.id ?? '') === key)) continue;
      collected.push(record);
    }
  };

  if (inputId.includes('@')) {
    const { data, error } = await supabase
      .from(HOSPITAL_STAFF_TABLE)
      .select(HOSPITAL_STAFF_AUTH_SELECT)
      .ilike('email', inputId)
      .eq('is_active', true);

    if (error) {
      console.error('Staff query error:', error);
      return {
        ok: false,
        error: 'Authentication service error. Please try again.',
        serviceError: true,
      };
    }

    appendUnique(data);
  }

  if (staffCodeLookup) {
    const { data, error } = await supabase
      .from(HOSPITAL_STAFF_TABLE)
      .select(HOSPITAL_STAFF_AUTH_SELECT)
      .ilike('staff_id_code', staffCodeLookup)
      .eq('is_active', true);

    if (error) {
      console.error('Staff query error:', error);
      return {
        ok: false,
        error: 'Authentication service error. Please try again.',
        serviceError: true,
      };
    }

    appendUnique(data);
  }

  const staff = collected.find((row) => passcodesMatch(row.passcode_key, inputPasscode)) ?? null;

  if (!staff) {
    return { ok: false, error: HOSPITAL_LOGIN_INVALID_MESSAGE };
  }

  if (!staffMatchesLoginTargetNode(String(staff.hospital_id ?? ''), targetNode)) {
    return { ok: false, error: HOSPITAL_LOGIN_INVALID_MESSAGE };
  }

  return { ok: true, staff };
}

/**
 * Direct lookup against `public.hospital_staff` by email or staff_id_code + passcode_key.
 * Never uses Supabase Auth (`auth.users` / signInWithPassword).
 */
export async function lookupActiveHospitalStaffByCredentials(
  supabase: SupabaseClient,
  identifier: string,
  passcode: string,
  targetNode?: string | null,
): Promise<{ row: Record<string, unknown> | null; error: string | null }> {
  const result = await authenticateHospitalStaffLogin(
    supabase,
    identifier,
    passcode,
    targetNode,
  );

  if (result.ok) {
    return { row: result.staff, error: null };
  }

  if (result.serviceError) {
    return { row: null, error: result.error };
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
  targetNode?: string | null,
): Promise<HospitalAuthResult> {
  const result = await authenticateHospitalStaffLogin(
    supabase,
    identifier,
    passcode,
    targetNode,
  );

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  const credential = mapHospitalStaffAuthRow(result.staff);
  return { ok: true, user: toAuthUser(credential, passcode.trim()) };
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
