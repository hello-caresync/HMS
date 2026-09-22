import type { SupabaseClient } from '@supabase/supabase-js';

import { REGAL_HOSPITAL_NAME } from '@/lib/regal/constants';

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

function resolvePortalAccess(role: string): string {
  const normalized = role.trim().toLowerCase();
  if (normalized.includes('doctor')) return '/doctor/dashboard';
  if (normalized.includes('admin')) return '/dashboard';
  return '/dashboard';
}

/** Map a `hospital_staff` row — no merges, mocks, or legacy tables. */
export function mapSuperAdminStaffCredentialRow(
  row: Record<string, unknown>,
): SuperAdminStaffCredentialRow | null {
  const id = String(row.id ?? '').trim();
  const fullName = String(row.full_name ?? '').trim();
  if (!id || !fullName) return null;

  const role = String(row.role ?? row.staff_type ?? 'Staff').trim();
  const staffCode = String(row.staff_id_code ?? row.employee_id ?? '').trim().toUpperCase();
  const hospitalCode = String(row.hospital_code ?? row.hospital_id ?? 'HOSP-01').trim().toUpperCase();

  return {
    ...row,
    id,
    hospital_id: hospitalCode,
    hospital_name: String(row.hospital_name ?? REGAL_HOSPITAL_NAME).trim(),
    full_name: fullName,
    email: String(row.email ?? '').trim().toLowerCase(),
    department: String(row.department ?? 'Operations').trim(),
    role,
    passcode_key: String(row.passcode_key ?? row.passcode ?? row.temporary_passcode ?? '').trim(),
    staff_id_code: staffCode,
    portal_access: String(row.portal_access ?? resolvePortalAccess(role)).trim(),
    is_active: row.is_active !== false,
    created_at: row.created_at ? String(row.created_at) : undefined,
  };
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
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[super-admin] hospital_staff load failed:', error.message);
    return { rows: [], error: error.message };
  }

  const rows = (data ?? [])
    .map((row) => mapSuperAdminStaffCredentialRow(asRecord(row)))
    .filter((row): row is SuperAdminStaffCredentialRow => row !== null && row.is_active);

  return { rows, error: null };
}
