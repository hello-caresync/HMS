import type { SupabaseClient } from '@supabase/supabase-js';

import { normalizeCredentialRole, resolveCredentialDashboardRoute } from '@/lib/auth/hospitalAuth';
import { REGAL_HOSPITAL_CODE, REGAL_HOSPITAL_NAME } from '@/lib/regal/constants';

export const HOSPITAL_STAFF_DIRECTORY_COLUMNS =
  'id, hospital_id, staff_id_code, full_name, email, passcode_key, role, department, is_active, created_at, updated_at';

export type SuperAdminStaffCredentialRow = Record<string, unknown> & {
  id: string;
  hospital_id: string;
  hospital_name: string;
  full_name: string;
  email: string;
  department: string;
  role: string;
  passcode_key: string;
  staff_id_code: string;
  portal_access: string;
  is_active: boolean;
  created_at?: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function sanitizeTenantFilterValue(value: string): string {
  return value.trim().replace(/[^0-9a-zA-Z-]/g, '');
}

function resolveStaffBadgeCode(row: Record<string, unknown>): string {
  return String(row.staff_id_code ?? row.id ?? '').trim().toUpperCase();
}

/** Map a `hospital_staff` row — no merges, mocks, or legacy tables. */
export function mapSuperAdminStaffCredentialRow(
  row: Record<string, unknown>,
): SuperAdminStaffCredentialRow | null {
  const id = String(row.id ?? '').trim();
  const fullName = String(row.full_name ?? '').trim();
  if (!id || !fullName) return null;

  const role = String(row.role ?? 'Staff').trim();
  const staffCode = resolveStaffBadgeCode(row);
  const hospitalId = String(row.hospital_id ?? REGAL_HOSPITAL_CODE).trim();
  const normalizedRole = normalizeCredentialRole(role);

  return {
    id,
    hospital_id: hospitalId,
    hospital_name: REGAL_HOSPITAL_NAME,
    full_name: fullName,
    email: String(row.email ?? '').trim().toLowerCase(),
    department: String(row.department ?? 'Operations').trim(),
    role,
    passcode_key: String(row.passcode_key ?? '').trim(),
    staff_id_code: staffCode,
    portal_access: resolveCredentialDashboardRoute(normalizedRole),
    is_active: row.is_active !== false,
    created_at: row.created_at ? String(row.created_at) : undefined,
  };
}

function mapStaffCredentialRows(data: unknown[] | null): SuperAdminStaffCredentialRow[] {
  return (data ?? [])
    .map((row) => mapSuperAdminStaffCredentialRow(asRecord(row)))
    .filter((row): row is SuperAdminStaffCredentialRow => row !== null);
}

function dedupeStaffRows(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  const seen = new Set<string>();
  const merged: Record<string, unknown>[] = [];

  for (const row of rows) {
    const key =
      String(row.id ?? '').trim() ||
      String(row.email ?? '').trim().toLowerCase() ||
      resolveStaffBadgeCode(row);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(row);
  }

  return merged;
}

function resolveHospitalIdFilters(activeHospitalId: string, activeHospitalCode: string): string[] {
  const filters = new Set<string>();

  for (const raw of [activeHospitalCode, activeHospitalId, REGAL_HOSPITAL_CODE]) {
    const sanitized = sanitizeTenantFilterValue(raw);
    if (sanitized) filters.add(sanitized);
  }

  return Array.from(filters);
}

/**
 * Super Admin vault directory — reads exclusively from `public.hospital_staff`.
 * Never merges mock arrays or credential shadow tables.
 */
export async function fetchSuperAdminStaffCredentials(
  supabase: SupabaseClient,
): Promise<{ rows: SuperAdminStaffCredentialRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from('hospital_staff')
    .select(HOSPITAL_STAFF_DIRECTORY_COLUMNS)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[super-admin] hospital_staff load failed:', error.message);
    return { rows: [], error: error.message };
  }

  return { rows: mapStaffCredentialRows(data), error: null };
}

/**
 * Tenant-scoped audit roster — filters strictly on `hospital_id` (tenant code or UUID).
 * `public.hospital_staff` has no `hospital_code` column.
 */
export async function fetchSuperAdminTenantStaffCredentials(
  supabase: SupabaseClient,
  activeHospitalId: string,
  activeHospitalCode: string,
): Promise<{ rows: SuperAdminStaffCredentialRow[]; error: string | null; raw: unknown[] }> {
  const hospitalIdentifiers = resolveHospitalIdFilters(activeHospitalId, activeHospitalCode);
  const primaryIdentifier = hospitalIdentifiers[0] ?? REGAL_HOSPITAL_CODE;

  let query = supabase
    .from('hospital_staff')
    .select(HOSPITAL_STAFF_DIRECTORY_COLUMNS)
    .order('created_at', { ascending: false });

  if (hospitalIdentifiers.length === 1) {
    query = query.eq('hospital_id', primaryIdentifier);
  } else {
    const orFilter = hospitalIdentifiers.map((id) => `hospital_id.eq.${id}`).join(',');
    query = query.or(orFilter);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[super-admin] tenant hospital_staff primary load failed:', error.message);
    return { rows: [], error: error.message, raw: [] };
  }

  const deduped = dedupeStaffRows((data ?? []).map(asRecord));
  console.log('[super-admin] Loaded credentials for tenant', primaryIdentifier, deduped);

  return {
    rows: mapStaffCredentialRows(deduped),
    error: null,
    raw: deduped,
  };
}
