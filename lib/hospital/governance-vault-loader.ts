import type { SupabaseClient } from '@supabase/supabase-js';

import { HOSPITAL_USER_CREDENTIALS_TABLE } from '@/lib/auth/hospitalAuth';
import {
  buildHospitalDirectoryOrFilter,
  hospitalDirectoryFilterIds,
} from '@/lib/hospital/hospital-node';
import { fetchGovernanceVendorRows } from '@/lib/hospital/procurement';
import { fetchHospitalStaffDirectory, type HospitalStaffMember } from '@/lib/hospital/staff-directory';
import { HOSPITAL_TENANT_ID } from '@/lib/regal/constants';

const GOVERNANCE_CREDENTIAL_COLUMNS =
  'id, full_name, email, passcode, role, hospital_id, employee_id, created_at, phone, department, is_active, passcode_key, temporary_passcode, portal_pin';

export type GovernanceVaultRawData = {
  credentialRows: Record<string, unknown>[];
  vendorRows: Record<string, unknown>[];
  staffMembers: HospitalStaffMember[];
  errors: string[];
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function logQueryError(scope: string, error: { message?: string; code?: string } | null): string | null {
  if (!error?.message) return null;
  console.error(`[governance-vault] ${scope}:`, {
    message: error.message,
    code: error.code,
  });
  return error.message;
}

async function fetchCredentialRows(
  supabase: SupabaseClient,
  hospitalId?: string,
): Promise<{ rows: Record<string, unknown>[]; error: string | null }> {
  const filterIds = hospitalDirectoryFilterIds(hospitalId);
  const scoped = await supabase
    .from(HOSPITAL_USER_CREDENTIALS_TABLE)
    .select(GOVERNANCE_CREDENTIAL_COLUMNS)
    .or(buildHospitalDirectoryOrFilter(filterIds))
    .order('created_at', { ascending: false });

  if (!scoped.error && Array.isArray(scoped.data) && scoped.data.length > 0) {
    return { rows: scoped.data.map(asRecord), error: null };
  }

  const scopedError = logQueryError('credentials (scoped columns)', scoped.error);
  const fallback = await supabase
    .from(HOSPITAL_USER_CREDENTIALS_TABLE)
    .select('*')
    .or(buildHospitalDirectoryOrFilter(filterIds))
    .order('created_at', { ascending: false });

  if (!fallback.error && Array.isArray(fallback.data) && fallback.data.length > 0) {
    return { rows: fallback.data.map(asRecord), error: scopedError };
  }

  const unscoped = await supabase
    .from(HOSPITAL_USER_CREDENTIALS_TABLE)
    .select('*')
    .order('created_at', { ascending: false });

  if (!unscoped.error && Array.isArray(unscoped.data)) {
    return {
      rows: unscoped.data.map(asRecord),
      error: logQueryError('credentials (fallback)', fallback.error) ?? scopedError,
    };
  }

  return {
    rows: [],
    error: logQueryError('credentials (unscoped)', unscoped.error) ?? scopedError,
  };
}

/** Independent, resilient loaders for the governance vault directory table. */
export async function fetchGovernanceVaultDirectory(
  supabase: SupabaseClient,
  hospitalId?: string,
): Promise<GovernanceVaultRawData> {
  const tenantId = hospitalId?.trim() || HOSPITAL_TENANT_ID;
  const errors: string[] = [];

  let credentialRows: Record<string, unknown>[] = [];
  let vendorRows: Record<string, unknown>[] = [];
  let staffMembers: HospitalStaffMember[] = [];

  try {
    const credentialResult = await fetchCredentialRows(supabase, tenantId);
    credentialRows = credentialResult.rows;
    if (credentialResult.error) errors.push(credentialResult.error);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Credential fetch failed';
    errors.push(message);
    console.error('[governance-vault] credentials threw:', err);
  }

  try {
    vendorRows = await fetchGovernanceVendorRows(supabase, tenantId);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Vendor fetch failed';
    errors.push(message);
    console.error('[governance-vault] vendors threw:', err);
  }

  try {
    staffMembers = await fetchHospitalStaffDirectory(supabase, tenantId);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Staff roster fetch failed';
    errors.push(message);
    console.error('[governance-vault] staff threw:', err);
  }

  return { credentialRows, vendorRows, staffMembers, errors };
}
