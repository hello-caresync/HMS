import type { SupabaseClient } from '@supabase/supabase-js';

import { HOSPITAL_DESK_DASHBOARD_PATH } from '@/lib/auth/hospital-desk-session';
import { isHospitalAdminRole } from '@/lib/auth/hospital-admin-auth';
import { HOSPITAL_TENANT_ID, REGAL_HOSPITAL_NAME } from '@/lib/regal/constants';

/** Canonical portal identity table — email + passcode_key authentication. */
export const HOSPITAL_STAFF_TABLE = 'hospital_staff';

export const HOSPITAL_USER_CREDENTIALS_TABLE = 'hospital_user_credentials';

/** Legacy Super Admin onboard table — provisioning helpers only. */
export const HOSPITAL_STAFF_CREDENTIALS_TABLE = 'hospital_staff_credentials';

export const HOSPITAL_LOGIN_INVALID_MESSAGE = 'Invalid email or passcode.';

export type HospitalCredentialRole = 'admin' | 'doctor' | 'staff' | 'nurse';

export type HospitalUserCredential = {
  id: string;
  hospital_id: string;
  hospital_name: string;
  employee_id: string;
  email: string;
  full_name: string;
  role: HospitalCredentialRole;
  department: string;
  phone?: string;
  portal_access: string;
  is_active: boolean;
};

export type HospitalAuthUser = HospitalUserCredential & {
  staff_type: string;
  passcode: string;
};

export type CredentialUpsertInput = {
  hospital_id: string;
  hospital_name?: string;
  employee_id?: string;
  email: string;
  full_name: string;
  role: HospitalCredentialRole | string;
  department?: string;
  passcode: string;
  phone?: string;
  portal_access?: string;
  is_active?: boolean;
};

export type HospitalAuthResult =
  | { ok: true; user: HospitalAuthUser }
  | { ok: false; error: string };

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

export function normalizeCredentialRole(raw?: string | null): HospitalCredentialRole {
  const value = String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  if (isHospitalAdminRole(value) || value.includes('admin')) return 'admin';
  if (value.includes('nurse')) return 'nurse';
  if (value.includes('doctor') || value === 'surgeon') return 'doctor';
  return 'staff';
}

export function credentialRoleToStaffType(role: HospitalCredentialRole): string {
  if (role === 'admin') return 'Admin';
  if (role === 'doctor') return 'Doctor';
  if (role === 'nurse') return 'Nurse';
  return 'Staff';
}

const LEGACY_HOSPITAL_OPD_ROUTES = [
  '/dashboard/opd',
  '/hospital/opd',
  '/hospital/opd-queue',
  '/hospital/billing',
  '/hospital/pharmacy',
  '/hospital/admissions',
] as const;

/** Normalizes legacy desk routes to the main hospital ERP dashboard. */
export function normalizeHospitalPostLoginRoute(route?: string | null): string {
  const trimmed = route?.trim() ?? '';
  if (!trimmed || !trimmed.startsWith('/')) return HOSPITAL_DESK_DASHBOARD_PATH;

  const lower = trimmed.toLowerCase();
  if (lower === '/dashboard' || lower.startsWith('/dashboard?')) {
    return HOSPITAL_DESK_DASHBOARD_PATH;
  }

  if (
    LEGACY_HOSPITAL_OPD_ROUTES.some(
      (legacy) => lower === legacy || lower.startsWith(`${legacy}/`),
    )
  ) {
    return HOSPITAL_DESK_DASHBOARD_PATH;
  }

  if (lower === '/hospital' || lower === '/hospital/') return HOSPITAL_DESK_DASHBOARD_PATH;
  return trimmed;
}

export function resolveCredentialDashboardRoute(
  role: HospitalCredentialRole,
  portalAccess?: string | null,
): string {
  if (role === 'admin') return HOSPITAL_DESK_DASHBOARD_PATH;
  if (role === 'doctor') return '/doctor/dashboard';

  const route = portalAccess?.trim();
  if (route && route.startsWith('/')) {
    return normalizeHospitalPostLoginRoute(route);
  }

  return HOSPITAL_DESK_DASHBOARD_PATH;
}

function nextEmployeeId(role: HospitalCredentialRole): string {
  const prefix = role === 'admin' ? 'RH-A' : role === 'nurse' || role === 'staff' ? 'RH-S' : 'RH-D';
  return `${prefix}${Date.now().toString().slice(-4)}`;
}

export function mapCredentialRow(row: Record<string, unknown>): HospitalUserCredential {
  const role = normalizeCredentialRole(String(row.role ?? row.staff_type ?? 'staff'));
  const employeeId = String(row.staff_id_code ?? row.employee_id ?? '').trim().toUpperCase();

  return {
    id: String(row.id ?? ''),
    hospital_id: String(row.hospital_id ?? HOSPITAL_TENANT_ID),
    hospital_name: String(row.hospital_name ?? REGAL_HOSPITAL_NAME),
    employee_id: employeeId,
    email: String(row.email ?? '').toLowerCase(),
    full_name: String(row.full_name ?? row.name ?? 'Hospital User'),
    role,
    department: String(row.department ?? 'Operations'),
    phone: typeof row.phone === 'string' ? row.phone : undefined,
    portal_access: resolveCredentialDashboardRoute(role, String(row.portal_access ?? '')),
    is_active: row.is_active !== false,
  };
}

/** Map a `public.hospital_staff` row into the shared portal session shape. */
export function mapHospitalStaffAuthRow(row: Record<string, unknown>): HospitalUserCredential {
  return mapCredentialRow(row);
}

function toAuthUser(credential: HospitalUserCredential, passcode: string): HospitalAuthUser {
  return {
    ...credential,
    staff_type: credentialRoleToStaffType(credential.role),
    passcode,
  };
}

/**
 * Authenticate against `public.hospital_staff` using email (or staff_id_code) + passcode_key.
 */
export async function authenticateHospitalUser(
  supabase: SupabaseClient,
  identifier: string,
  passcode: string,
): Promise<HospitalAuthResult> {
  const cleanIdentifier = identifier.trim();
  const cleanPasscode = passcode.trim();

  if (!cleanIdentifier || !cleanPasscode) {
    return { ok: false, error: 'Enter your Employee ID or email and security passcode.' };
  }

  const isEmail = cleanIdentifier.includes('@');
  let query = supabase
    .from(HOSPITAL_STAFF_TABLE)
    .select('*')
    .eq('passcode_key', cleanPasscode)
    .eq('is_active', true);

  if (isEmail) {
    query = query.eq('email', cleanIdentifier.toLowerCase());
  } else {
    query = query.eq('staff_id_code', cleanIdentifier.toUpperCase());
  }

  const { data, error } = await query.maybeSingle();

  if (error || !data) {
    return { ok: false, error: HOSPITAL_LOGIN_INVALID_MESSAGE };
  }

  const credential = mapHospitalStaffAuthRow(asRecord(data));
  return { ok: true, user: toAuthUser(credential, cleanPasscode) };
}

export async function upsertHospitalUserCredential(
  supabase: SupabaseClient,
  input: CredentialUpsertInput,
): Promise<{ ok: boolean; credential?: HospitalUserCredential; error?: string }> {
  const role = normalizeCredentialRole(input.role);
  const email = input.email.trim().toLowerCase();
  const passcode = input.passcode.trim();

  if (!input.full_name.trim()) return { ok: false, error: 'Full name is required.' };
  if (!email) return { ok: false, error: 'Email is required.' };
  if (!passcode) return { ok: false, error: 'Security passcode is required.' };

  const employeeId = (input.employee_id?.trim() || nextEmployeeId(role)).toUpperCase();

  // Never send `id` — Postgres generates UUID PK; RH-D codes live in employee_id only.
  const payload = {
    hospital_id: input.hospital_id.trim() || HOSPITAL_TENANT_ID,
    hospital_name: input.hospital_name?.trim() || REGAL_HOSPITAL_NAME,
    employee_id: employeeId,
    email,
    full_name: input.full_name.trim(),
    role,
    department:
      input.department?.trim() ||
      (role === 'admin' ? 'Hospital Administration' : role === 'doctor' ? 'General Medicine' : 'Operations'),
    passcode,
    phone: input.phone?.trim() || null,
    portal_access: input.portal_access ?? resolveCredentialDashboardRoute(role),
    is_active: input.is_active ?? true,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(HOSPITAL_USER_CREDENTIALS_TABLE)
    .upsert(payload, { onConflict: 'email' })
    .select()
    .maybeSingle();

  if (error) {
    const message = error.message || 'Could not save credential';
    if (/duplicate|unique|already exists/i.test(message)) {
      return { ok: false, error: 'That email is already assigned to another credential.' };
    }
    return { ok: false, error: message };
  }

  return { ok: true, credential: mapCredentialRow(asRecord(data)) };
}

export async function fetchHospitalUserCredentials(
  supabase: SupabaseClient,
  hospitalId?: string,
): Promise<HospitalUserCredential[]> {
  let query = supabase
    .from(HOSPITAL_USER_CREDENTIALS_TABLE)
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (hospitalId) {
    query = query.eq('hospital_id', hospitalId);
  }

  const { data, error } = await query;
  if (error || !Array.isArray(data)) return [];
  return data.map((row) => mapCredentialRow(asRecord(row)));
}
