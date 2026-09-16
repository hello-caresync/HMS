import type { SupabaseClient } from '@supabase/supabase-js';

import { HOSPITAL_USER_CREDENTIALS_TABLE } from '@/lib/auth/hospitalAuth';
import {
  buildHospitalDirectoryOrFilter,
  hospitalDirectoryFilterIds,
} from '@/lib/hospital/hospital-node';
import { fetchGovernanceVendorRows } from '@/lib/hospital/procurement';
import { fetchHospitalStaffDirectory, type HospitalStaffMember } from '@/lib/hospital/staff-directory';
import { HOSPITAL_TENANT_ID } from '@/lib/regal/constants';
import { formatHospitalBadge, isUuidValue } from '@/lib/utils/formatters';

const BASELINE_CREDENTIAL_COLUMNS =
  'id, full_name, email, passcode, role, hospital_id, employee_id, created_at, phone, department, is_active';

const BASELINE_STAFF_COLUMNS = 'id, full_name, email, role, created_at, hospital_id, staff_id_code, employee_id';
const BASELINE_DOCTOR_COLUMNS = 'id, full_name, email, created_at, doctor_code, registration_number';

export type GovernanceVaultCredentialRow = Record<string, unknown> & {
  badge_id: string;
  staff_id?: string | null;
  doctor_id?: string | null;
  doctor_code?: string | null;
};

export type GovernanceVaultRawData = {
  credentialRows: GovernanceVaultCredentialRow[];
  vendorRows: Record<string, unknown>[];
  staffMembers: HospitalStaffMember[];
  errors: string[];
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function extractQueryError(error: unknown): string | null {
  if (!error) return null;
  if (typeof error === 'string') return error.trim() || null;
  if (error instanceof Error) return error.message.trim() || null;

  const record = asRecord(error);
  const parts = [record.message, record.details, record.hint, record.code]
    .map((part) => String(part ?? '').trim())
    .filter(Boolean);

  if (parts.length > 0) return parts.join(' | ');

  try {
    const serialized = JSON.stringify(error);
    if (serialized && serialized !== '{}') return serialized;
  } catch {
    /* ignore circular structures */
  }

  return 'Unknown query error';
}

function logQueryError(scope: string, error: unknown): string | null {
  const message = extractQueryError(error);
  if (!message) return null;

  const record = asRecord(error);
  console.error(`[governance-vault] ${scope}:`, {
    message,
    details: record.details ?? null,
    hint: record.hint ?? null,
    code: record.code ?? null,
  });
  return message;
}

async function runSafeSelect(
  supabase: SupabaseClient,
  table: string,
  columns: string,
  scope: string,
  runQuery: () => PromiseLike<{ data: unknown[] | null; error: unknown }>,
): Promise<{ rows: Record<string, unknown>[]; error: string | null }> {
  try {
    const result = await runQuery();
    if (!result.error) {
      return { rows: (result.data ?? []).map(asRecord), error: null };
    }

    const message = logQueryError(scope, result.error);
    return { rows: [], error: message };
  } catch (err: unknown) {
    const message = extractQueryError(err) ?? `${scope} threw unexpectedly`;
    console.error(`[governance-vault] ${scope} threw:`, message);
    return { rows: [], error: message };
  }
}

async function fetchCredentialRows(
  supabase: SupabaseClient,
  hospitalId?: string,
): Promise<{ rows: Record<string, unknown>[]; error: string | null }> {
  const filterIds = hospitalDirectoryFilterIds(hospitalId);
  const hospitalFilter = buildHospitalDirectoryOrFilter(filterIds);

  const scoped = await runSafeSelect(
    supabase,
    HOSPITAL_USER_CREDENTIALS_TABLE,
    BASELINE_CREDENTIAL_COLUMNS,
    'credentials (scoped baseline)',
    () =>
      supabase
        .from(HOSPITAL_USER_CREDENTIALS_TABLE)
        .select(BASELINE_CREDENTIAL_COLUMNS)
        .or(hospitalFilter)
        .order('created_at', { ascending: false }),
  );

  if (scoped.rows.length > 0 || !scoped.error) {
    return scoped;
  }

  const fallback = await runSafeSelect(
    supabase,
    HOSPITAL_USER_CREDENTIALS_TABLE,
    '*',
    'credentials (fallback select *)',
    () =>
      supabase
        .from(HOSPITAL_USER_CREDENTIALS_TABLE)
        .select('*')
        .or(hospitalFilter)
        .order('created_at', { ascending: false }),
  );

  if (fallback.rows.length > 0 || !fallback.error) {
    return { rows: fallback.rows, error: scoped.error ?? fallback.error };
  }

  const unscoped = await runSafeSelect(
    supabase,
    HOSPITAL_USER_CREDENTIALS_TABLE,
    '*',
    'credentials (unscoped fallback)',
    () =>
      supabase
        .from(HOSPITAL_USER_CREDENTIALS_TABLE)
        .select('*')
        .order('created_at', { ascending: false }),
  );

  return {
    rows: unscoped.rows,
    error: unscoped.error ?? fallback.error ?? scoped.error,
  };
}

async function fetchStaffEnrichmentRows(
  supabase: SupabaseClient,
  hospitalId?: string,
): Promise<{ rows: Record<string, unknown>[]; error: string | null }> {
  const filterIds = hospitalDirectoryFilterIds(hospitalId);
  if (filterIds.length === 0) {
    return runSafeSelect(
      supabase,
      'hospital_staff',
      BASELINE_STAFF_COLUMNS,
      'staff enrichment (unscoped)',
      () =>
        supabase
          .from('hospital_staff')
          .select(BASELINE_STAFF_COLUMNS)
          .order('created_at', { ascending: false }),
    );
  }

  return runSafeSelect(
    supabase,
    'hospital_staff',
    BASELINE_STAFF_COLUMNS,
    'staff enrichment (scoped)',
    () =>
      supabase
        .from('hospital_staff')
        .select(BASELINE_STAFF_COLUMNS)
        .in('hospital_id', filterIds)
        .order('created_at', { ascending: false }),
  );
}

async function fetchDoctorEnrichmentRows(
  supabase: SupabaseClient,
): Promise<{ rows: Record<string, unknown>[]; error: string | null }> {
  return runSafeSelect(
    supabase,
    'doctors',
    BASELINE_DOCTOR_COLUMNS,
    'doctor enrichment',
    () =>
      supabase
        .from('doctors')
        .select(BASELINE_DOCTOR_COLUMNS)
        .order('created_at', { ascending: false }),
  );
}

function normalizeGovernanceCredentialBadge(row: Record<string, unknown>): string {
  const staffId = String(row.staff_id ?? row.staff_id_code ?? row.employee_id ?? '').trim();
  const doctorId = String(row.doctor_id ?? '').trim();
  const doctorCode = String(row.doctor_code ?? row.registration_number ?? '').trim();
  const badgeId = String(row.badge_id ?? '').trim();

  return formatHospitalBadge({
    id: String(row.id ?? ''),
    badge_id: badgeId && !isUuidValue(badgeId) ? badgeId : null,
    staff_id: staffId && !isUuidValue(staffId) ? staffId : null,
    doctor_id: doctorId && !isUuidValue(doctorId) ? doctorId : null,
    doctor_code: doctorCode && !isUuidValue(doctorCode) ? doctorCode : null,
    email: String(row.email ?? ''),
    name: String(row.full_name ?? row.name ?? ''),
    role: String(row.role ?? row.staff_type ?? ''),
  });
}

function enrichCredentialRows(
  credentialRows: Record<string, unknown>[],
  staffRows: Record<string, unknown>[],
  doctorRows: Record<string, unknown>[],
): GovernanceVaultCredentialRow[] {
  const staffByEmail = new Map<string, Record<string, unknown>>();
  for (const row of staffRows) {
    const email = String(row.email ?? '').trim().toLowerCase();
    if (email) staffByEmail.set(email, row);
  }

  const doctorByEmail = new Map<string, Record<string, unknown>>();
  for (const row of doctorRows) {
    const email = String(row.email ?? '').trim().toLowerCase();
    if (email) doctorByEmail.set(email, row);
  }

  const seen = new Set<string>();
  const normalized: GovernanceVaultCredentialRow[] = [];

  for (const row of credentialRows) {
    const email = String(row.email ?? '').trim().toLowerCase();
    const dedupeKey = email || String(row.id ?? '');
    if (!dedupeKey || seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const staff = email ? staffByEmail.get(email) : undefined;
    const doctor = email ? doctorByEmail.get(email) : undefined;

    const staffCode = String(staff?.staff_id_code ?? staff?.employee_id ?? row.employee_id ?? '').trim();
    const doctorCode = String(
      doctor?.doctor_code ?? doctor?.registration_number ?? row.doctor_code ?? '',
    ).trim();

    const merged: Record<string, unknown> = {
      ...row,
      staff_id: staff?.id ?? row.staff_id ?? null,
      staff_id_code: staffCode || null,
      doctor_id: doctor?.id ?? row.doctor_id ?? null,
      doctor_code: doctorCode || null,
      employee_id: staffCode || row.employee_id || doctorCode || null,
    };

    const badge_id = normalizeGovernanceCredentialBadge(merged);
    normalized.push({
      ...merged,
      badge_id,
      staff_id:
        merged.staff_id != null && merged.staff_id !== ''
          ? String(merged.staff_id)
          : staffCode || null,
      doctor_id:
        merged.doctor_id != null && merged.doctor_id !== ''
          ? String(merged.doctor_id)
          : null,
      doctor_code: doctorCode || null,
    });
  }

  return normalized;
}

/** Independent, resilient loaders for the governance vault directory table. */
export async function fetchGovernanceVaultDirectory(
  supabase: SupabaseClient,
  hospitalId?: string,
): Promise<GovernanceVaultRawData> {
  const tenantId = hospitalId?.trim() || HOSPITAL_TENANT_ID;
  const errors: string[] = [];

  let credentialRows: GovernanceVaultCredentialRow[] = [];
  let vendorRows: Record<string, unknown>[] = [];
  let staffMembers: HospitalStaffMember[] = [];

  let rawCredentialRows: Record<string, unknown>[] = [];
  let staffEnrichmentRows: Record<string, unknown>[] = [];
  let doctorEnrichmentRows: Record<string, unknown>[] = [];

  try {
    const credentialResult = await fetchCredentialRows(supabase, tenantId);
    rawCredentialRows = credentialResult.rows;
    if (credentialResult.error) errors.push(credentialResult.error);
  } catch (err: unknown) {
    const message = extractQueryError(err) ?? 'Credential fetch failed';
    errors.push(message);
    console.error('[governance-vault] credentials threw:', message);
  }

  try {
    const staffResult = await fetchStaffEnrichmentRows(supabase, tenantId);
    staffEnrichmentRows = staffResult.rows;
    if (staffResult.error) errors.push(staffResult.error);
  } catch (err: unknown) {
    const message = extractQueryError(err) ?? 'Staff enrichment failed';
    errors.push(message);
    console.error('[governance-vault] staff enrichment threw:', message);
  }

  try {
    const doctorResult = await fetchDoctorEnrichmentRows(supabase);
    doctorEnrichmentRows = doctorResult.rows;
    if (doctorResult.error) errors.push(doctorResult.error);
  } catch (err: unknown) {
    const message = extractQueryError(err) ?? 'Doctor enrichment failed';
    errors.push(message);
    console.error('[governance-vault] doctor enrichment threw:', message);
  }

  credentialRows = enrichCredentialRows(rawCredentialRows, staffEnrichmentRows, doctorEnrichmentRows);

  try {
    vendorRows = await fetchGovernanceVendorRows(supabase, tenantId);
  } catch (err: unknown) {
    const message = extractQueryError(err) ?? 'Vendor fetch failed';
    errors.push(message);
    console.error('[governance-vault] vendors threw:', message);
  }

  try {
    staffMembers = await fetchHospitalStaffDirectory(supabase, tenantId);
  } catch (err: unknown) {
    const message = extractQueryError(err) ?? 'Staff roster fetch failed';
    errors.push(message);
    console.error('[governance-vault] staff threw:', message);
  }

  return { credentialRows, vendorRows, staffMembers, errors };
}

export { normalizeGovernanceCredentialBadge };
