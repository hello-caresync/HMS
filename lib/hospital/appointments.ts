import type { SupabaseClient } from '@supabase/supabase-js';

import {
  buildHospitalDirectoryOrFilter,
  hospitalDirectoryFilterIds,
  hospitalIdQueryValues,
  isUuidColumnError,
} from '@/lib/hospital/hospital-node';
import { todayIsoDate } from '@/lib/hospital/smartq-wait';
import { resolveAppointmentRowDate, tomorrowIsoDate } from '@/lib/scheduling/queue-date-filter';

/** Columns that may be absent until migrations / PostgREST cache refresh. */
export const OPTIONAL_APPOINTMENT_COLUMNS = [
  'consultation_duration_minutes',
  'slot_duration_minutes',
] as const;

const DEFAULT_CONSULTATION_DURATION_MINUTES = 20;
const MAX_SCHEMA_RETRY = 10;

export type AppointmentInsertInput = {
  patient_name: string;
  doctor_id: string;
  doctor_name: string;
  department: string;
  appointment_date: string;
  appointment_time: string;
  status?: string;
  reason?: string;
  consultation_duration_minutes?: number;
  [key: string]: unknown;
};

export function missingColumnFromPostgrestError(message: string | null | undefined): string | null {
  const text = String(message ?? '');
  const cacheMatch = text.match(/Could not find the '([^']+)' column/i);
  if (cacheMatch?.[1]) return cacheMatch[1];

  const pgMatch = text.match(/column ["']?([\w]+)["']? (?:of relation [\w.]+ )?does not exist/i);
  if (pgMatch?.[1]) return pgMatch[1];

  return null;
}

export function resolveConsultationDurationMinutes(value?: number | null): number {
  return Number.isFinite(value) && Number(value) > 0
    ? Number(value)
    : DEFAULT_CONSULTATION_DURATION_MINUTES;
}

/** Builds the core appointment payload and attaches optional duration fields when present. */
export function buildAppointmentInsertPayload(
  input: AppointmentInsertInput,
): Record<string, unknown> {
  const durationMinutes = resolveConsultationDurationMinutes(input.consultation_duration_minutes);

  const payload: Record<string, unknown> = {
    patient_name: input.patient_name,
    doctor_id: input.doctor_id,
    doctor_name: input.doctor_name,
    department: input.department,
    appointment_date: input.appointment_date,
    appointment_time: input.appointment_time,
    status: input.status ?? 'WAITING',
    reason: input.reason?.trim() || 'General Consultation',
    consultation_duration_minutes: durationMinutes,
    slot_duration_minutes: durationMinutes,
  };

  for (const [key, value] of Object.entries(input)) {
    if (key in payload) continue;
    if (value !== undefined) payload[key] = value;
  }

  return payload;
}

export function stripOptionalAppointmentColumns(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const next = { ...payload };
  for (const column of OPTIONAL_APPOINTMENT_COLUMNS) {
    delete next[column];
  }
  return next;
}

type InsertAppointmentOptions = {
  select?: string;
  table?: 'appointments' | 'patient_appointments';
};

/**
 * Inserts into appointments (or patient_appointments) and retries without columns
 * missing from the live PostgREST schema cache.
 */
export async function insertAppointmentRowResilient(
  supabase: SupabaseClient,
  payload: Record<string, unknown>,
  options: InsertAppointmentOptions = {},
): Promise<{ data: Record<string, unknown> | null; error: Error | null }> {
  const table = options.table ?? 'appointments';
  const select = options.select ?? '*';
  const dbPayload: Record<string, unknown> = { ...payload };

  let data: Record<string, unknown> | null = null;
  let lastError: { message?: string } | null = null;

  for (let attempt = 0; attempt <= MAX_SCHEMA_RETRY; attempt += 1) {
    const result = await supabase.from(table).insert([dbPayload]).select(select).maybeSingle();
    data = (result.data as Record<string, unknown> | null) ?? null;
    lastError = result.error;

    if (!result.error) {
      return { data, error: null };
    }

    const missingColumn = missingColumnFromPostgrestError(result.error.message);
    if (missingColumn && missingColumn in dbPayload) {
      delete dbPayload[missingColumn];
      continue;
    }

    if (isUuidColumnError(result.error.message) && 'hospital_id' in dbPayload) {
      delete dbPayload.hospital_id;
      continue;
    }

    break;
  }

  const message =
    lastError?.message ||
    'Failed to insert appointment record.';
  return { data: null, error: new Error(message) };
}

export type HospitalAppointmentDateFilter = 'today' | 'tomorrow' | 'upcoming' | 'all';

export type HospitalAppointmentRecord = Record<string, unknown>;

export type HospitalReceptionRow = {
  id: string;
  patient_name: string;
  doctor_id?: string;
  doctor_name: string;
  department: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  chief_complaint: string;
  token_number?: string;
  created_at?: string;
};

export const HOSPITAL_APPOINTMENT_SELECT =
  'id, appointment_id, patient_name, doctor_id, doctor_name, doctor_code, department, appointment_date, appointment_time, slot_time, time_slot, status, queue_status, reason, reason_for_visit, chief_complaint, token_number, created_at, hospital_id';

const ACTIVE_HOSPITAL_APPOINTMENT_STATUSES = new Set([
  'waiting',
  'booked',
  'pending',
  'scheduled',
  'confirmed',
  'issued',
  'called',
  'in-consultation',
  'in-progress',
]);

export function normalizeHospitalAppointmentStatus(raw: unknown): string {
  return String(raw ?? 'waiting').trim().toLowerCase().replace(/_/g, '-');
}

export function isActiveHospitalAppointmentStatus(raw: unknown): boolean {
  return ACTIVE_HOSPITAL_APPOINTMENT_STATUSES.has(normalizeHospitalAppointmentStatus(raw));
}

export function isBillingPendingStatus(raw: unknown): boolean {
  const value = normalizeHospitalAppointmentStatus(raw);
  return value === 'billing-pending' || value === 'billing';
}

/** Reception desk: exclude visits handed off to billing or fully closed. */
export function isReceptionQueueStatus(row: HospitalAppointmentRecord): boolean {
  if (isCancelledHospitalAppointment(row)) return false;
  const status = normalizeHospitalAppointmentStatus(row.status ?? row.queue_status);
  if (isBillingPendingStatus(status)) return false;
  if (/complete|done|paid|closed/.test(status)) return false;
  return true;
}

export function filterReceptionQueueAppointments<T extends HospitalAppointmentRecord>(
  rows: T[],
): T[] {
  return rows.filter(isReceptionQueueStatus);
}

/** Today's (or all) visits awaiting pharmacy + consultation settlement at the billing counter. */
export async function fetchBillingPendingAppointments(
  supabase: SupabaseClient,
  options: {
    hospitalId?: string;
    dateFilter?: Extract<HospitalAppointmentDateFilter, 'today' | 'all'>;
    limit?: number;
  } = {},
): Promise<HospitalAppointmentRecord[]> {
  const dateFilter = options.dateFilter ?? 'today';
  const rows = await fetchHospitalAppointments(supabase, {
    dateFilter,
    hospitalId: options.hospitalId,
    limit: options.limit ?? 200,
    activeOnly: false,
  });

  return rows.filter((row) => isBillingPendingStatus(row.status ?? row.queue_status));
}

export function isCancelledHospitalAppointment(row: HospitalAppointmentRecord): boolean {
  const status = normalizeHospitalAppointmentStatus(row.status ?? row.queue_status);
  return /cancel|no-show|noshow|closed/.test(status);
}

/** Client-side date filter for hospital OPD / reception views. */
export function filterHospitalAppointmentsByDate<T extends HospitalAppointmentRecord>(
  rows: T[],
  dateFilter: HospitalAppointmentDateFilter,
  now = new Date(),
): T[] {
  const today = todayIsoDate(now);
  const tomorrow = tomorrowIsoDate(now);

  if (dateFilter === 'all') {
    return rows.filter((row) => !isCancelledHospitalAppointment(row));
  }

  return rows.filter((row) => {
    if (dateFilter === 'upcoming' && isCancelledHospitalAppointment(row)) {
      return false;
    }

    const appointmentDate = resolveAppointmentRowDate(row);
    if (!appointmentDate) {
      return dateFilter === 'today';
    }
    if (dateFilter === 'today') {
      return appointmentDate === today;
    }
    if (dateFilter === 'tomorrow') {
      return appointmentDate === tomorrow;
    }
    if (dateFilter === 'upcoming') {
      return appointmentDate >= today;
    }
    return true;
  });
}

export function filterReceptionAppointmentsBySearch<T extends HospitalReceptionRow>(
  rows: T[],
  searchQuery: string,
): T[] {
  const query = searchQuery.trim().toLowerCase();
  if (!query) return rows;

  return rows.filter((row) => {
    const haystack = [
      row.patient_name,
      row.doctor_name,
      row.doctor_id,
      row.department,
      row.token_number,
      row.chief_complaint,
      row.appointment_date,
    ]
      .map((value) => String(value ?? '').toLowerCase())
      .join(' ');
    return haystack.includes(query);
  });
}

export function appointmentMatchesReceptionFilter(
  row: HospitalAppointmentRecord,
  dateFilter: HospitalAppointmentDateFilter,
  now = new Date(),
): boolean {
  return filterHospitalAppointmentsByDate([row], dateFilter, now).length > 0;
}

async function selectHospitalScopedAppointments(
  supabase: SupabaseClient,
  table: 'appointments' | 'hospital_appointments',
  hospitalId: string,
  dateFilter: HospitalAppointmentDateFilter,
  limit: number,
): Promise<HospitalAppointmentRecord[]> {
  const today = todayIsoDate();
  const tomorrow = tomorrowIsoDate();
  const buildQuery = () => {
    let query = supabase.from(table).select('*');
    if (dateFilter === 'today') {
      query = query.eq('appointment_date', today);
    } else if (dateFilter === 'tomorrow') {
      query = query.eq('appointment_date', tomorrow);
    } else if (dateFilter === 'upcoming') {
      query = query.gte('appointment_date', today);
    }
    return query;
  };

  const filterIds = hospitalDirectoryFilterIds(hospitalId);
  const orFilter = buildHospitalDirectoryOrFilter(filterIds);

  const primary = await buildQuery()
    .or(orFilter)
    .order('appointment_date', { ascending: true })
    .order('appointment_time', { ascending: true })
    .limit(limit);

  if (!primary.error && Array.isArray(primary.data)) {
    return primary.data as HospitalAppointmentRecord[];
  }

  const aliases = hospitalIdQueryValues(hospitalId);
  const fallback = await buildQuery()
    .in('hospital_id', aliases.length > 0 ? aliases : [hospitalId])
    .order('appointment_date', { ascending: true })
    .order('appointment_time', { ascending: true })
    .limit(limit);

  if (fallback.error || !Array.isArray(fallback.data)) {
    const unscoped = await buildQuery()
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true })
      .limit(limit);
    if (unscoped.error || !Array.isArray(unscoped.data)) {
      return [];
    }
    return unscoped.data as HospitalAppointmentRecord[];
  }
  return fallback.data as HospitalAppointmentRecord[];
}

/**
 * Facility-wide appointments for hospital reception / master dashboard.
 * Uses local calendar dates — not UTC `toISOString().split('T')[0]`.
 */
export async function fetchHospitalAppointments(
  supabase: SupabaseClient,
  options: {
    dateFilter?: HospitalAppointmentDateFilter;
    hospitalId?: string;
    limit?: number;
    activeOnly?: boolean;
  } = {},
): Promise<HospitalAppointmentRecord[]> {
  const dateFilter = options.dateFilter ?? 'all';
  const limit = options.limit ?? 300;
  const activeOnly = options.activeOnly ?? true;

  let rows: HospitalAppointmentRecord[] = [];

  if (options.hospitalId) {
    const [ledgerRows, hospitalRows] = await Promise.all([
      selectHospitalScopedAppointments(supabase, 'appointments', options.hospitalId, dateFilter, limit),
      selectHospitalScopedAppointments(supabase, 'hospital_appointments', options.hospitalId, dateFilter, limit),
    ]);
    const seen = new Set<string>();
    for (const row of [...ledgerRows, ...hospitalRows]) {
      const id = String(row.id ?? row.appointment_id ?? '');
      if (id && seen.has(id)) continue;
      if (id) seen.add(id);
      rows.push(row);
    }
  } else {
    const today = todayIsoDate();
    const tomorrow = tomorrowIsoDate();
    let query = supabase.from('appointments').select('*');
    if (dateFilter === 'today') {
      query = query.eq('appointment_date', today);
    } else if (dateFilter === 'tomorrow') {
      query = query.eq('appointment_date', tomorrow);
    } else if (dateFilter === 'upcoming') {
      query = query.gte('appointment_date', today);
    }
    const { data, error } = await query
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true })
      .limit(limit);

    if (error) {
      throw error;
    }
    rows = (data ?? []) as HospitalAppointmentRecord[];
  }

  if (!activeOnly) {
    return rows;
  }

  return rows.filter(
    (row) =>
      isActiveHospitalAppointmentStatus(row.status ?? row.queue_status) &&
      !isCancelledHospitalAppointment(row),
  );
}

export function mapHospitalAppointmentToReceptionRow(
  row: HospitalAppointmentRecord,
): HospitalReceptionRow {
  return {
    id: String(row.id ?? row.appointment_id ?? ''),
    patient_name: String(row.patient_name ?? row.name ?? 'Patient'),
    doctor_id: row.doctor_id ? String(row.doctor_id) : row.doctor_code ? String(row.doctor_code) : undefined,
    doctor_name: String(row.doctor_name ?? 'Doctor'),
    department: String(row.department ?? 'OPD'),
    appointment_time: String(row.appointment_time ?? row.slot_time ?? row.time_slot ?? '—'),
    appointment_date: resolveAppointmentRowDate(row),
    token_number: row.token_number ? String(row.token_number) : undefined,
    chief_complaint: String(row.chief_complaint ?? row.reason_for_visit ?? row.reason ?? ''),
    status: String(row.status ?? row.queue_status ?? 'WAITING'),
    created_at: row.created_at ? String(row.created_at) : undefined,
  };
}

export function mergeReceptionAppointmentRows(
  previous: HospitalReceptionRow[],
  incoming: HospitalReceptionRow,
): HospitalReceptionRow[] {
  const withoutDuplicate = previous.filter((row) => row.id !== incoming.id);
  return [incoming, ...withoutDuplicate].sort((a, b) => {
    const dateCompare = String(a.appointment_date).localeCompare(String(b.appointment_date));
    if (dateCompare !== 0) return dateCompare;
    return String(a.appointment_time).localeCompare(String(b.appointment_time));
  });
}
