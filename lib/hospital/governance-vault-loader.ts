import type { SupabaseClient } from '@supabase/supabase-js';

import {
  HOSPITAL_STAFF_CREDENTIALS_TABLE,
  HOSPITAL_USER_CREDENTIALS_TABLE,
} from '@/lib/auth/hospitalAuth';
import { hospitalDirectoryFilterIds } from '@/lib/hospital/hospital-node';
import { fetchGovernanceVendorRows } from '@/lib/hospital/procurement';
import { fetchHospitalStaffDirectory, type HospitalStaffMember } from '@/lib/hospital/staff-directory';
import { HOSPITAL_TENANT_ID } from '@/lib/regal/constants';
import { createServerSupabase } from '@/lib/supabase/server';
import { formatHospitalBadge, isUuidValue } from '@/lib/utils/formatters';

const BASELINE_CREDENTIAL_COLUMNS =
  'id, full_name, email, passcode, role, hospital_id, employee_id, created_at, phone, department, is_active';

const MINIMAL_CREDENTIAL_COLUMNS =
  'id, full_name, email, role, hospital_id, employee_id, created_at';

const BASELINE_STAFF_COLUMNS = 'id, full_name, email, role, created_at, hospital_id, staff_id_code, employee_id';
const MINIMAL_STAFF_COLUMNS = 'id, full_name, email, role, created_at, hospital_id, employee_id';

const BASELINE_DOCTOR_COLUMNS = 'id, full_name, email, created_at, doctor_code, registration_number';
const MINIMAL_DOCTOR_COLUMNS = 'id, full_name, email, created_at';

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

type SerializedPostgrestError = {
  message: string | null;
  details: string | null;
  hint: string | null;
  code: string | null;
  summary: string;
};

type SafeSelectResult = {
  rows: Record<string, unknown>[];
  error: string | null;
  ignorable: boolean;
  missingRelation: boolean;
  missingColumn: string | null;
};

const loggedIgnorableScopes = new Set<string>();

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function readPostgrestField(error: unknown, key: 'message' | 'details' | 'hint' | 'code'): string | null {
  if (!error) return null;

  if (typeof error === 'string') {
    return key === 'message' ? error.trim() || null : null;
  }

  if (typeof error !== 'object') return null;

  const direct = Reflect.get(error, key);
  if (typeof direct === 'string' && direct.trim()) {
    return direct.trim();
  }

  if (key === 'message' && error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  const record = asRecord(error);
  const nested = record[key];
  if (typeof nested === 'string' && nested.trim()) {
    return nested.trim();
  }

  return null;
}

/** Extract Postgrest / Postgres fields even when the error object serializes as `{}`. */
export function serializePostgrestError(error: unknown): SerializedPostgrestError {
  const message = readPostgrestField(error, 'message');
  const details = readPostgrestField(error, 'details');
  const hint = readPostgrestField(error, 'hint');
  const code = readPostgrestField(error, 'code');

  const parts = [message, details, hint, code].filter(Boolean) as string[];
  let summary = parts.join(' | ');

  if (!summary) {
    if (typeof error === 'string' && error.trim()) {
      summary = error.trim();
    } else {
      try {
        const encoded = JSON.stringify(error, Object.getOwnPropertyNames(error as object));
        summary = encoded && encoded !== '{}' ? encoded : 'Unknown query error';
      } catch {
        summary = 'Unknown query error';
      }
    }
  }

  return { message, details, hint, code, summary };
}

function missingColumnFromMessage(message: string | null | undefined): string | null {
  const text = String(message ?? '');
  const cacheMatch = text.match(/Could not find the '([^']+)' column/i);
  if (cacheMatch?.[1]) return cacheMatch[1];

  const pgMatch = text.match(/column ["']?([\w]+)["']? (?:of relation [\w.]+ )?does not exist/i);
  if (pgMatch?.[1]) return pgMatch[1];

  return null;
}

function isMissingRelationError(serialized: SerializedPostgrestError): boolean {
  const blob = serialized.summary.toLowerCase();
  return (
    serialized.code === '42P01' ||
    serialized.code === 'PGRST205' ||
    blob.includes('relation') && blob.includes('does not exist') ||
    blob.includes('could not find the table') ||
    blob.includes('schema cache') && blob.includes('table')
  );
}

function isIgnorableGovernanceSchemaError(serialized: SerializedPostgrestError): boolean {
  const blob = serialized.summary.toLowerCase();
  return (
    isMissingRelationError(serialized) ||
    serialized.code === 'PGRST204' ||
    serialized.code === '42501' ||
    blob.includes('permission denied') ||
    blob.includes('row-level security') ||
    blob.includes('could not find') && blob.includes('column') ||
    blob.includes('column') && blob.includes('does not exist') ||
    blob.includes('invalid input syntax for type uuid')
  );
}

function logQueryError(scope: string, error: unknown, options?: { force?: boolean }): SerializedPostgrestError {
  const serialized = serializePostgrestError(error);
  const ignorable = isIgnorableGovernanceSchemaError(serialized);

  if (ignorable && !options?.force) {
    if (!loggedIgnorableScopes.has(scope)) {
      loggedIgnorableScopes.add(scope);
      if (process.env.NODE_ENV === 'development') {
        console.debug(
          `[governance-vault] ${scope} skipped (${serialized.code ?? 'schema'}): ${serialized.summary}`,
        );
      }
    }
    return serialized;
  }

  console.error(
    `[governance-vault] ${scope}: ${serialized.summary}` +
      (serialized.code ? ` [code=${serialized.code}]` : '') +
      (serialized.details ? ` | details=${serialized.details}` : '') +
      (serialized.hint ? ` | hint=${serialized.hint}` : ''),
  );

  return serialized;
}

function buildHospitalIdOrFilter(filterIds: string[]): string {
  const parts = filterIds.filter(Boolean).map((id) => `hospital_id.eq.${id}`);
  parts.push('hospital_id.is.null');
  return parts.join(',');
}

async function runSafeSelect(
  scope: string,
  runQuery: () => PromiseLike<{ data: unknown[] | null; error: unknown }>,
): Promise<SafeSelectResult> {
  try {
    const result = await runQuery();
    if (!result.error) {
      return {
        rows: (result.data ?? []).map(asRecord),
        error: null,
        ignorable: false,
        missingRelation: false,
        missingColumn: null,
      };
    }

    const serialized = logQueryError(scope, result.error);
    const missingRelation = isMissingRelationError(serialized);
    const missingColumn = missingColumnFromMessage(serialized.summary);
    const ignorable = isIgnorableGovernanceSchemaError(serialized);

    return {
      rows: [],
      error: ignorable ? null : serialized.summary,
      ignorable,
      missingRelation,
      missingColumn,
    };
  } catch (err: unknown) {
    const serialized = logQueryError(`${scope} threw`, err, { force: true });
    return {
      rows: [],
      error: serialized.summary,
      ignorable: false,
      missingRelation: isMissingRelationError(serialized),
      missingColumn: missingColumnFromMessage(serialized.summary),
    };
  }
}

function normalizeLegacyVaultCredentialRow(row: Record<string, unknown>): Record<string, unknown> {
  const status = String(row.status ?? 'Active').trim().toLowerCase();
  return {
    ...row,
    passcode: row.passcode ?? row.temporary_passcode ?? row.passcode_key,
    role: row.role ?? row.staff_type,
    employee_id: row.employee_id ?? row.staff_id_code ?? row.badge_id ?? row.id,
    is_active: status !== 'restricted' && status !== 'suspended' && status !== 'inactive',
  };
}

async function fetchLegacyStaffCredentialRows(
  supabase: SupabaseClient,
  hospitalId?: string,
): Promise<{ rows: Record<string, unknown>[]; error: string | null }> {
  const filterIds = hospitalDirectoryFilterIds(hospitalId);
  const hospitalFilter = buildHospitalIdOrFilter(filterIds);

  const result = await runSafeSelect('legacy staff credentials', () =>
    supabase
      .from(HOSPITAL_STAFF_CREDENTIALS_TABLE)
      .select('*')
      .or(hospitalFilter)
      .order('created_at', { ascending: false }),
  );

  if (result.missingRelation) {
    return { rows: [], error: null };
  }

  const rows = result.rows
    .map(normalizeLegacyVaultCredentialRow)
    .filter((row) => row.is_active !== false);

  return { rows, error: result.error };
}

async function fetchCredentialRows(
  supabase: SupabaseClient,
  hospitalId?: string,
): Promise<{ rows: Record<string, unknown>[]; error: string | null }> {
  const filterIds = hospitalDirectoryFilterIds(hospitalId);
  const hospitalFilter = buildHospitalIdOrFilter(filterIds);

  const columnPlans = [BASELINE_CREDENTIAL_COLUMNS, MINIMAL_CREDENTIAL_COLUMNS, '*'] as const;

  for (const columns of columnPlans) {
    const scoped = await runSafeSelect(`credentials (${columns})`, () =>
      supabase
        .from(HOSPITAL_USER_CREDENTIALS_TABLE)
        .select(columns)
        .or(hospitalFilter)
        .order('created_at', { ascending: false }),
    );

    if (scoped.rows.length > 0) {
      return { rows: scoped.rows, error: null };
    }

    if (scoped.missingRelation) {
      return { rows: [], error: null };
    }

    if (!scoped.error && !scoped.missingColumn) {
      return { rows: [], error: null };
    }

    if (scoped.missingColumn && columns !== '*') {
      continue;
    }

    if (columns === '*') {
      const unscoped = await runSafeSelect('credentials (unscoped fallback)', () =>
        supabase
          .from(HOSPITAL_USER_CREDENTIALS_TABLE)
          .select('*')
          .order('created_at', { ascending: false }),
      );

      if (unscoped.missingRelation) {
        return { rows: [], error: null };
      }

      return { rows: unscoped.rows, error: unscoped.error };
    }
  }

  return { rows: [], error: null };
}

async function fetchStaffEnrichmentRows(
  supabase: SupabaseClient,
  hospitalId?: string,
): Promise<{ rows: Record<string, unknown>[]; error: string | null }> {
  const filterIds = hospitalDirectoryFilterIds(hospitalId);
  const columnPlans = [BASELINE_STAFF_COLUMNS, MINIMAL_STAFF_COLUMNS, '*'] as const;

  for (const columns of columnPlans) {
    const scoped = await runSafeSelect(`staff enrichment (${columns})`, () => {
      let query = supabase.from('hospital_staff').select(columns).order('created_at', { ascending: false });
      if (filterIds.length > 0) {
        query = query.in('hospital_id', filterIds);
      }
      return query;
    });

    if (scoped.rows.length > 0) {
      return { rows: scoped.rows, error: null };
    }

    if (scoped.missingRelation) {
      return { rows: [], error: null };
    }

    if (!scoped.error && !scoped.missingColumn) {
      return { rows: [], error: null };
    }

    if (scoped.missingColumn && columns !== '*') {
      continue;
    }

    if (columns === '*') {
      return { rows: scoped.rows, error: scoped.error };
    }
  }

  return { rows: [], error: null };
}

async function fetchDoctorEnrichmentRows(
  supabase: SupabaseClient,
): Promise<{ rows: Record<string, unknown>[]; error: string | null }> {
  const columnPlans = [BASELINE_DOCTOR_COLUMNS, MINIMAL_DOCTOR_COLUMNS, '*'] as const;

  for (const columns of columnPlans) {
    const result = await runSafeSelect(`doctor enrichment (${columns})`, () =>
      supabase.from('doctors').select(columns).order('created_at', { ascending: false }),
    );

    if (result.rows.length > 0) {
      return { rows: result.rows, error: null };
    }

    if (result.missingRelation) {
      return { rows: [], error: null };
    }

    if (!result.error && !result.missingColumn) {
      return { rows: [], error: null };
    }

    if (result.missingColumn && columns !== '*') {
      continue;
    }

    if (columns === '*') {
      return { rows: result.rows, error: result.error };
    }
  }

  return { rows: [], error: null };
}

/** Prefer service-role on the server; browser callers should pass the shared client. */
export function resolveGovernanceVaultSupabase(client?: SupabaseClient): SupabaseClient {
  if (client) return client;
  if (typeof window === 'undefined') {
    return createServerSupabase();
  }
  throw new Error('Governance vault requires a Supabase client in the browser.');
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
  supabase?: SupabaseClient,
  hospitalId?: string,
): Promise<GovernanceVaultRawData> {
  const client = resolveGovernanceVaultSupabase(supabase);
  const tenantId = hospitalId?.trim() || HOSPITAL_TENANT_ID;
  const errors: string[] = [];

  let credentialRows: GovernanceVaultCredentialRow[] = [];
  let vendorRows: Record<string, unknown>[] = [];
  let staffMembers: HospitalStaffMember[] = [];

  let rawCredentialRows: Record<string, unknown>[] = [];
  let staffEnrichmentRows: Record<string, unknown>[] = [];
  let doctorEnrichmentRows: Record<string, unknown>[] = [];

  try {
    const [credentialResult, legacyCredentialResult] = await Promise.all([
      fetchCredentialRows(client, tenantId),
      fetchLegacyStaffCredentialRows(client, tenantId),
    ]);

    const mergedByEmail = new Map<string, Record<string, unknown>>();
    for (const row of [...credentialResult.rows, ...legacyCredentialResult.rows]) {
      const email = String(row.email ?? '').trim().toLowerCase();
      if (!email) continue;
      if (!mergedByEmail.has(email)) {
        mergedByEmail.set(email, row);
      }
    }

    rawCredentialRows = Array.from(mergedByEmail.values());
    if (credentialResult.error) errors.push(credentialResult.error);
    if (legacyCredentialResult.error) errors.push(legacyCredentialResult.error);
  } catch (err: unknown) {
    const serialized = serializePostgrestError(err);
    if (!isIgnorableGovernanceSchemaError(serialized)) {
      errors.push(serialized.summary);
      console.error('[governance-vault] credentials threw:', serialized.summary);
    }
  }

  try {
    const staffResult = await fetchStaffEnrichmentRows(client, tenantId);
    staffEnrichmentRows = staffResult.rows;
    if (staffResult.error) errors.push(staffResult.error);
  } catch (err: unknown) {
    const serialized = serializePostgrestError(err);
    if (!isIgnorableGovernanceSchemaError(serialized)) {
      errors.push(serialized.summary);
      console.error('[governance-vault] staff enrichment threw:', serialized.summary);
    }
  }

  try {
    const doctorResult = await fetchDoctorEnrichmentRows(client);
    doctorEnrichmentRows = doctorResult.rows;
    if (doctorResult.error) errors.push(doctorResult.error);
  } catch (err: unknown) {
    const serialized = serializePostgrestError(err);
    if (!isIgnorableGovernanceSchemaError(serialized)) {
      errors.push(serialized.summary);
      console.error('[governance-vault] doctor enrichment threw:', serialized.summary);
    }
  }

  credentialRows = enrichCredentialRows(rawCredentialRows, staffEnrichmentRows, doctorEnrichmentRows);

  try {
    vendorRows = await fetchGovernanceVendorRows(client, tenantId);
  } catch (err: unknown) {
    const serialized = serializePostgrestError(err);
    if (!isIgnorableGovernanceSchemaError(serialized)) {
      errors.push(serialized.summary);
      console.error('[governance-vault] vendors threw:', serialized.summary);
    }
  }

  try {
    staffMembers = await fetchHospitalStaffDirectory(client, tenantId);
  } catch (err: unknown) {
    const serialized = serializePostgrestError(err);
    if (!isIgnorableGovernanceSchemaError(serialized)) {
      errors.push(serialized.summary);
      console.error('[governance-vault] staff threw:', serialized.summary);
    }
  }

  return { credentialRows, vendorRows, staffMembers, errors };
}

export { normalizeGovernanceCredentialBadge };
