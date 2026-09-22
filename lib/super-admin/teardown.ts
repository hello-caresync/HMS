import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { readPublicSupabaseEnv } from '@/lib/supabase/env';
import { isUuidValue } from '@/lib/utils/formatters';

export type TeardownResult = {
  ok: boolean;
  error?: string;
  deleted?: Record<string, unknown>;
  staff_id?: string;
  hospital_id?: string;
  hospital_code?: string;
};

export type ResolvedHospitalRecord = {
  id: string;
  hospital_code: string;
};

export type ResolveHospitalTarget =
  | string
  | {
      id?: string | null;
      hospital_code?: string | null;
      code?: string | null;
    };

function collectHospitalLookupCandidates(target: ResolveHospitalTarget): string[] {
  if (typeof target === 'string') {
    return Array.from(new Set([target.trim()].filter(Boolean)));
  }

  return Array.from(
    new Set(
      [target.id, target.hospital_code, target.code]
        .map((value) => String(value ?? '').trim())
        .filter(Boolean),
    ),
  );
}

function buildHospitalLookupFilter(candidates: string[]): string {
  const filters = new Set<string>();

  for (const candidate of candidates) {
    if (isUuidValue(candidate)) {
      filters.add(`id.eq.${candidate}`);
    }
    filters.add(`hospital_code.eq.${candidate.toUpperCase()}`);
  }

  return Array.from(filters).join(',');
}

function parseRpcPayload(data: unknown): TeardownResult {
  if (!data || typeof data !== 'object') {
    return { ok: false, error: 'Teardown RPC returned an empty response.' };
  }

  const payload = data as Record<string, unknown>;
  if (payload.ok === true) {
    return {
      ok: true,
      deleted: payload.deleted as Record<string, unknown> | undefined,
      staff_id: payload.staff_id ? String(payload.staff_id) : undefined,
      hospital_id: payload.hospital_id ? String(payload.hospital_id) : undefined,
      hospital_code: payload.hospital_code ? String(payload.hospital_code) : undefined,
    };
  }

  return {
    ok: false,
    error: String(payload.error ?? 'Teardown operation failed.'),
  };
}

export function createSuperAdminServiceClient(): SupabaseClient | null {
  const { url, anonKey } = readPublicSupabaseEnv();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? '';

  if (!url) return null;
  const key = serviceKey || anonKey;
  if (!key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Resolve canonical `hospitals.id` + `hospital_code` before any cascade deletes. */
export async function resolveHospitalRecord(
  supabase: SupabaseClient,
  target: ResolveHospitalTarget,
): Promise<{ hospital: ResolvedHospitalRecord | null; error: string | null }> {
  const candidates = collectHospitalLookupCandidates(target);
  if (!candidates.length) {
    return { hospital: null, error: 'Hospital tenant id or code is required.' };
  }

  const lookupFilter = buildHospitalLookupFilter(candidates);
  const { data: hosp, error } = await supabase
    .from('hospitals')
    .select('id, hospital_code')
    .or(lookupFilter)
    .maybeSingle();

  if (error) {
    if (isOptionalSchemaError(error.message)) {
      return { hospital: null, error: 'Hospital tenant record could not be resolved.' };
    }
    return { hospital: null, error: error.message };
  }

  if (!hosp?.id) {
    return { hospital: null, error: 'Hospital tenant record could not be resolved.' };
  }

  const fallbackCode = candidates.find((candidate) => !isUuidValue(candidate))?.toUpperCase();

  return {
    hospital: {
      id: String(hosp.id),
      hospital_code: String(hosp.hospital_code ?? fallbackCode ?? candidates[0])
        .trim()
        .toUpperCase(),
    },
    error: null,
  };
}

function isOptionalSchemaError(message: string): boolean {
  return /relation .* does not exist|schema cache|column .* does not exist|invalid input syntax for type uuid|42703|42P01|22P02|PGRST204/i.test(
    message,
  );
}

function filterUuidValues(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(isUuidValue)));
}

async function safeOptionalDelete(
  label: string,
  action: () => Promise<number>,
): Promise<number> {
  try {
    return await action();
  } catch (err) {
    console.warn(`[super-admin] Skipping optional delete (${label}):`, err);
    return 0;
  }
}

async function deleteScopedRows(
  supabase: SupabaseClient,
  table: string,
  buildFilter: (
    query: ReturnType<ReturnType<SupabaseClient['from']>['delete']>,
  ) => ReturnType<ReturnType<SupabaseClient['from']>['delete']>,
  optional = false,
): Promise<number> {
  const { error, count } = await buildFilter(supabase.from(table).delete({ count: 'exact' }));
  if (error) {
    if (optional && isOptionalSchemaError(error.message)) {
      console.warn(`[super-admin] Skipping optional delete on ${table}:`, error.message);
      return 0;
    }
    throw new Error(`${table}: ${error.message}`);
  }
  return count ?? 0;
}

async function deleteByForeignIds(
  supabase: SupabaseClient,
  table: string,
  column: string,
  parentTable: string,
  parentFilter: (
    query: ReturnType<ReturnType<SupabaseClient['from']>['select']>,
  ) => ReturnType<ReturnType<SupabaseClient['from']>['select']>,
): Promise<number> {
  const { data: parentRows, error: parentError } = await parentFilter(
    supabase.from(parentTable).select('id'),
  );

  if (parentError) {
    if (isOptionalSchemaError(parentError.message)) {
      console.warn(`[super-admin] Skipping linked delete for ${table} via ${parentTable}:`, parentError.message);
      return 0;
    }
    throw new Error(`${parentTable}: ${parentError.message}`);
  }

  const ids = (parentRows ?? [])
    .map((row) => String((row as { id?: string }).id ?? ''))
    .filter(Boolean);

  const scopedIds = filterUuidValues(ids);
  if (!scopedIds.length) return 0;

  return deleteScopedRows(supabase, table, (query) => query.in(column, scopedIds), true);
}

/** `clinical_notes` has no `hospital_id` — purge via queue, doctor, and patient links. */
async function deleteClinicalNotesForHospital(
  supabase: SupabaseClient,
  trueId: string,
  hospitalCode: string,
): Promise<number> {
  return safeOptionalDelete('clinical_notes', async () => {
    let deleted = 0;
    const textScope = `hospital_id.eq.${hospitalCode},hospital_id.eq.${trueId}`;
    const staffDoctorScope = `hospital_id.eq.${trueId},hospital_id.eq.${hospitalCode}`;

    deleted += await deleteByForeignIds(
      supabase,
      'clinical_notes',
      'queue_id',
      'opd_queue',
      (query) => query.eq('hospital_id', trueId),
    );

    deleted += await deleteByForeignIds(
      supabase,
      'clinical_notes',
      'patient_id',
      'patients',
      (query) => query.or(textScope),
    );

    const { data: doctors, error: doctorsError } = await supabase
      .from('doctors')
      .select('id')
      .or(staffDoctorScope);

    if (doctorsError && !isOptionalSchemaError(doctorsError.message)) {
      throw new Error(`doctors: ${doctorsError.message}`);
    }

    const { data: staff, error: staffError } = await supabase
      .from('hospital_staff')
      .select('id')
      .or(staffDoctorScope);

    if (staffError && !isOptionalSchemaError(staffError.message)) {
      throw new Error(`hospital_staff: ${staffError.message}`);
    }

    const doctorUuidKeys = filterUuidValues(
      [...(doctors ?? []), ...(staff ?? [])].map((row) =>
        String((row as { id?: string }).id ?? ''),
      ),
    );

    if (doctorUuidKeys.length) {
      deleted += await deleteScopedRows(
        supabase,
        'clinical_notes',
        (query) => query.in('doctor_id', doctorUuidKeys),
        true,
      );
    }

    return deleted;
  });
}

/** Permanently delete one staff credential row and linked doctor/credential shadows. */
export async function purgeHospitalStaffMember(
  supabase: SupabaseClient,
  staffId: string,
): Promise<TeardownResult> {
  const { data, error } = await supabase.rpc('purge_hospital_staff_member', {
    p_staff_id: staffId,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return parseRpcPayload(data);
}

/**
 * Permanently purge a hospital tenant using direct Supabase table deletes.
 * Always resolves the true `hospitals.id` before touching child tables.
 */
export async function purgeHospitalTenant(
  supabase: SupabaseClient,
  targetId: string,
  options?: { hospital_code?: string | null },
): Promise<TeardownResult> {
  const trimmedTarget = targetId.trim();
  const trimmedCode = String(options?.hospital_code ?? '').trim();

  if (!trimmedTarget && !trimmedCode) {
    return { ok: false, error: 'Hospital tenant id or code is required.' };
  }

  const { hospital, error: resolveError } = await resolveHospitalRecord(supabase, {
    id: trimmedTarget || trimmedCode,
    hospital_code: trimmedCode || trimmedTarget,
  });
  if (resolveError || !hospital) {
    return { ok: false, error: resolveError ?? 'Hospital tenant record could not be resolved.' };
  }

  const trueId = hospital.id;
  const hospitalCode = hospital.hospital_code;
  const deleted: Record<string, number> = {};

  const staffDoctorScope = `hospital_id.eq.${trueId},hospital_id.eq.${hospitalCode}`;
  const textScope = `hospital_id.eq.${hospitalCode},hospital_id.eq.${trueId}`;
  const uuidScope = `hospital_id.eq.${trueId},hospital_code.eq.${hospitalCode}`;

  try {
    deleted.medical_records = await safeOptionalDelete('medical_records', () =>
      deleteByForeignIds(
        supabase,
        'medical_records',
        'appointment_id',
        'appointments',
        (query) => query.eq('hospital_id', trueId),
      ),
    );

    deleted.clinical_notes = await deleteClinicalNotesForHospital(supabase, trueId, hospitalCode);

    deleted.consultations = await safeOptionalDelete('consultations', () =>
      deleteScopedRows(supabase, 'consultations', (query) => query.or(textScope), true),
    );

    deleted.patients = await safeOptionalDelete('patients', () =>
      deleteScopedRows(supabase, 'patients', (query) => query.or(textScope), true),
    );

    deleted.hospital_patient_counters = await safeOptionalDelete('hospital_patient_counters', () =>
      deleteScopedRows(supabase, 'hospital_patient_counters', (query) => query.or(textScope), true),
    );

    deleted.billing_invoices = await safeOptionalDelete('billing_invoices', () =>
      deleteScopedRows(supabase, 'billing_invoices', (query) => query.or(textScope), true),
    );

    deleted.hospital_invoices = await safeOptionalDelete('hospital_invoices', () =>
      deleteScopedRows(supabase, 'hospital_invoices', (query) => query.or(textScope), true),
    );

    deleted.emergency_triage = await safeOptionalDelete('emergency_triage', () =>
      deleteScopedRows(supabase, 'emergency_triage', (query) => query.or(uuidScope), true),
    );

    deleted.emergency_alerts = await safeOptionalDelete('emergency_alerts', () =>
      deleteScopedRows(supabase, 'emergency_alerts', (query) => query.or(uuidScope), true),
    );

    deleted.opd_queue = await deleteScopedRows(supabase, 'opd_queue', (query) =>
      query.eq('hospital_id', trueId),
    );

    deleted.appointments = await deleteScopedRows(supabase, 'appointments', (query) =>
      query.eq('hospital_id', trueId),
    );

    deleted.lab_orders = await safeOptionalDelete('lab_orders', () =>
      deleteScopedRows(supabase, 'lab_orders', (query) => query.or(uuidScope), true),
    );

    deleted.radiology_orders = await safeOptionalDelete('radiology_orders', () =>
      deleteScopedRows(supabase, 'radiology_orders', (query) => query.or(uuidScope), true),
    );

    deleted.doctor_schedules = await safeOptionalDelete('doctor_schedules', () =>
      deleteScopedRows(supabase, 'doctor_schedules', (query) => query.or(uuidScope), true),
    );

    deleted.doctor_time_slots = await safeOptionalDelete('doctor_time_slots', () =>
      deleteScopedRows(supabase, 'doctor_time_slots', (query) => query.or(uuidScope), true),
    );

    deleted.shipments = await safeOptionalDelete('shipments', () =>
      deleteByForeignIds(
        supabase,
        'shipments',
        'po_id',
        'purchase_orders',
        (query) => query.eq('hospital_id', trueId),
      ),
    );

    deleted.invoices = await safeOptionalDelete('invoices', () =>
      deleteByForeignIds(
        supabase,
        'invoices',
        'po_id',
        'purchase_orders',
        (query) => query.eq('hospital_id', trueId),
      ),
    );

    deleted.purchase_orders = await safeOptionalDelete('purchase_orders', () =>
      deleteScopedRows(supabase, 'purchase_orders', (query) => query.eq('hospital_id', trueId), true),
    );

    deleted.channel_messages = await safeOptionalDelete('channel_messages', () =>
      deleteScopedRows(supabase, 'channel_messages', (query) => query.eq('hospital_id', trueId), true),
    );

    deleted.system_notifications = await safeOptionalDelete('system_notifications', () =>
      deleteScopedRows(
        supabase,
        'system_notifications',
        (query) => query.eq('hospital_id', trueId),
        true,
      ),
    );

    deleted.system_events = await safeOptionalDelete('system_events', () =>
      deleteScopedRows(supabase, 'system_events', (query) => query.eq('hospital_id', trueId), true),
    );

    deleted.hospital_user_credentials = await safeOptionalDelete('hospital_user_credentials', () =>
      deleteScopedRows(supabase, 'hospital_user_credentials', (query) => query.or(textScope), true),
    );

    deleted.hospital_staff_credentials = await safeOptionalDelete('hospital_staff_credentials', () =>
      deleteScopedRows(
        supabase,
        'hospital_staff_credentials',
        (query) => query.or(textScope),
        true,
      ),
    );

    deleted.hospital_staff = await deleteScopedRows(supabase, 'hospital_staff', (query) =>
      query.or(staffDoctorScope),
    );

    deleted.doctors = await deleteScopedRows(supabase, 'doctors', (query) =>
      query.or(staffDoctorScope),
    );

    deleted.hospital_suppliers = await safeOptionalDelete('hospital_suppliers', () =>
      deleteScopedRows(supabase, 'hospital_suppliers', (query) => query.or(textScope), true),
    );

    deleted.hospital_tenants = await safeOptionalDelete('hospital_tenants', () =>
      deleteScopedRows(supabase, 'hospital_tenants', (query) => query.eq('hospital_id', hospitalCode), true),
    );

    const { error: hospitalDeleteError, count: hospitalsDeleted } = await supabase
      .from('hospitals')
      .delete({ count: 'exact' })
      .eq('id', trueId);

    if (hospitalDeleteError) {
      throw new Error(`hospitals: ${hospitalDeleteError.message}`);
    }

    deleted.hospitals = hospitalsDeleted ?? 0;

    return {
      ok: true,
      hospital_id: trueId,
      hospital_code: hospitalCode,
      deleted,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Hospital tenant purge failed.';
    return { ok: false, error: message, hospital_id: trueId, hospital_code: hospitalCode };
  }
}
