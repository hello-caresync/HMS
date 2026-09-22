import type { SupabaseClient } from '@supabase/supabase-js';

import { verifyPassword } from '@/lib/auth/hospital/password-utils';
import { PROVISIONING_ACCESS_DENIED_MESSAGE } from '@/lib/auth/provisioning-gate';
import { isHospitalAdminRole } from '@/lib/auth/hospital-admin-auth';
import { HOSPITAL_TENANT_ID, REGAL_HOSPITAL_NAME } from '@/lib/regal/constants';

export const HOSPITAL_USER_CREDENTIALS_TABLE = 'hospital_user_credentials';

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
  if (!trimmed || !trimmed.startsWith('/')) return '/dashboard';

  const lower = trimmed.toLowerCase();
  if (
    LEGACY_HOSPITAL_OPD_ROUTES.some(
      (legacy) => lower === legacy || lower.startsWith(`${legacy}/`),
    )
  ) {
    return '/dashboard';
  }

  if (lower.startsWith('/hospital/')) return '/dashboard';
  return trimmed;
}

export function resolveCredentialDashboardRoute(
  role: HospitalCredentialRole,
  portalAccess?: string | null,
): string {
  if (role === 'admin') return '/dashboard';
  if (role === 'doctor') return '/doctor/dashboard';

  const route = portalAccess?.trim();
  if (route && route.startsWith('/')) {
    return normalizeHospitalPostLoginRoute(route);
  }

  return '/dashboard';
}

function nextEmployeeId(role: HospitalCredentialRole): string {
  const prefix = role === 'admin' ? 'RH-A' : role === 'nurse' || role === 'staff' ? 'RH-S' : 'RH-D';
  return `${prefix}${Date.now().toString().slice(-4)}`;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuidValue(value: string): boolean {
  return UUID_PATTERN.test(value.trim());
}

async function verifyStoredPasscode(
  row: Record<string, unknown>,
  rawPasscode: string,
): Promise<boolean> {
  const plainKeys = ['passcode', 'temporary_passcode', 'passcode_key', 'password'] as const;
  for (const key of plainKeys) {
    const value = row[key];
    if (typeof value === 'string' && value.length > 0 && value === rawPasscode) {
      return true;
    }
  }

  const hash = String(row.passcode_hash ?? row.password_hash ?? '');
  if (hash) {
    return verifyPassword(rawPasscode, hash);
  }

  return false;
}

export function mapCredentialRow(row: Record<string, unknown>): HospitalUserCredential {
  const role = normalizeCredentialRole(String(row.role ?? row.staff_type ?? 'staff'));
  const employeeId = String(row.employee_id ?? row.staff_id_code ?? '').trim().toUpperCase();

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
    is_active:
      row.is_active !== false &&
      String(row.status ?? 'active').toLowerCase() !== 'restricted' &&
      String(row.status ?? 'active').toLowerCase() !== 'suspended',
  };
}

function toAuthUser(credential: HospitalUserCredential, passcode: string): HospitalAuthUser {
  return {
    ...credential,
    staff_type: credentialRoleToStaffType(credential.role),
    passcode,
  };
}

async function queryCredentialTable(
  supabase: SupabaseClient,
  table: string,
  identifier: string,
): Promise<Record<string, unknown> | null> {
  const trimmed = identifier.trim();
  const lowerEmail = trimmed.toLowerCase();
  const upperCode = trimmed.toUpperCase();
  const isEmail = trimmed.includes('@');

  if (isEmail) {
    let query = supabase.from(table).select('*').ilike('email', lowerEmail);
    if (table === HOSPITAL_USER_CREDENTIALS_TABLE) query = query.eq('is_active', true);
    const { data, error } = await query.maybeSingle();
    if (!error && data) return asRecord(data);
    return null;
  }

  for (const column of ['employee_id', 'staff_id_code'] as const) {
    let query = supabase.from(table).select('*').eq(column, upperCode);
    if (table === HOSPITAL_USER_CREDENTIALS_TABLE) query = query.eq('is_active', true);
    const { data, error } = await query.maybeSingle();
    if (!error && data) return asRecord(data);
  }

  if (isUuidValue(trimmed)) {
    let query = supabase.from(table).select('*').eq('id', trimmed);
    if (table === HOSPITAL_USER_CREDENTIALS_TABLE) query = query.eq('is_active', true);
    const { data, error } = await query.maybeSingle();
    if (!error && data) return asRecord(data);
  }

  return null;
}

async function findCredentialRow(
  supabase: SupabaseClient,
  identifier: string,
): Promise<Record<string, unknown> | null> {
  const row = await queryCredentialTable(supabase, HOSPITAL_USER_CREDENTIALS_TABLE, identifier);
  if (!row) return null;

  const credential = mapCredentialRow(row);
  if (!credential.is_active) return null;

  return row;
}

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

  const row = await findCredentialRow(supabase, cleanIdentifier);
  if (!row) {
    return { ok: false, error: PROVISIONING_ACCESS_DENIED_MESSAGE };
  }

  const valid = await verifyStoredPasscode(row, cleanPasscode);
  if (!valid) {
    return { ok: false, error: PROVISIONING_ACCESS_DENIED_MESSAGE };
  }

  const credential = mapCredentialRow(row);
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
