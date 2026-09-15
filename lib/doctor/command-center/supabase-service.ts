import type { SupabaseClient } from '@supabase/supabase-js';

import {
  appointmentBelongsToDoctor,
  getDoctorQueueIdentifiers,
  getDoctorSession,
  resolveDoctorSessionIdentity,
  type DoctorSession,
} from '@/lib/doctor/session';
import { CACHE_KEYS, writeLocalJson } from '@/lib/persistence/local-cache';
import { fetchPatient360History } from '@/lib/doctor/patient-360-history';
import {
  DEFAULT_QUEUE_DATE_FILTER,
  matchesQueueDateFilter,
  resolveAppointmentRowDate,
  tomorrowIsoDate,
  todayIsoDate,
  type QueueDateFilter,
} from '@/lib/scheduling/queue-date-filter';
import { dedupeEncounterList } from '@/lib/queue/dedupe-encounters';
import { supabase as defaultSupabase } from '@/lib/supabase';

import type { DoctorQueueRow, LiveQueueRow, OPDToken, PatientMedicalTimelineItem } from './types';

export interface DoctorQueueItem {
  id: string;
  appointmentId?: string;
  patientId: string;
  patientName: string;
  age?: number | string;
  gender?: string;
  tokenNumber?: string;
  time?: string;
  status: 'waiting' | 'in-progress' | 'completed' | 'billing_pending' | string;
  chiefComplaint?: string;
  vitals?: {
    bp?: string;
    pulse?: string;
    temp?: string;
    spo2?: string;
    weight?: string;
  };
  appointmentType?: string;
  createdAt: string;
  department?: string;
  doctorId?: string;
  uhid?: string;
  appointmentDate?: string;
  _source_table?: string;
}

export type { QueueDateFilter } from '@/lib/scheduling/queue-date-filter';
export { DEFAULT_QUEUE_DATE_FILTER } from '@/lib/scheduling/queue-date-filter';

function normalizeQueueItemStatus(raw: unknown): DoctorQueueItem['status'] {
  const value = String(raw ?? 'waiting').toLowerCase().replace(/_/g, '-');
  if (/billing|complete|done|paid/.test(value)) return 'billing_pending';
  if (/consult|progress/.test(value)) return 'in-progress';
  if (/called/.test(value)) return 'in-progress';
  return 'waiting';
}

function mapRowToDoctorQueueItem(row: Record<string, unknown>): DoctorQueueItem {
  const id = String(row.id ?? '');
  const parsedVitals = parseVitals(row.vitals ?? row.intake_vitals);
  const vitalsObj =
    parsedVitals && typeof parsedVitals === 'object'
      ? {
          bp: parsedVitals.bp ? String(parsedVitals.bp) : undefined,
          pulse: parsedVitals.pulse ? String(parsedVitals.pulse) : undefined,
          temp: parsedVitals.temp ? String(parsedVitals.temp) : undefined,
          spo2: parsedVitals.spo2 ? String(parsedVitals.spo2) : undefined,
          weight: parsedVitals.weight ? String(parsedVitals.weight) : undefined,
        }
      : {};

  const createdAt = String(row.created_at ?? '');
  const slotTime = String(row.slot_time ?? row.appointment_time ?? row.time_slot ?? '');

  return {
    id,
    appointmentId: id,
    patientId: String(row.patient_id ?? row.patientId ?? row.uhid ?? id),
    patientName: String(row.patient_name ?? row.patientName ?? row.name ?? 'Patient'),
    age: (row.age ?? row.patient_age) as number | string | undefined,
    gender: row.gender ? String(row.gender) : undefined,
    tokenNumber: String(row.token_number ?? row.tokenNumber ?? row.uhid ?? `#${id.slice(-4)}`),
    time:
      slotTime ||
      (createdAt
        ? new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : undefined),
    status: normalizeQueueItemStatus(row.queue_status ?? row.status),
    chiefComplaint: String(row.chief_complaint ?? row.complaint ?? row.reason_for_visit ?? 'General Consultation'),
    vitals: vitalsObj,
    appointmentType: String(row.appointment_type ?? row.source ?? 'walk_in'),
    createdAt,
    department: row.department ? String(row.department) : undefined,
    doctorId: row.doctor_id ? String(row.doctor_id) : row.doctor_employee_id ? String(row.doctor_employee_id) : undefined,
    uhid: row.uhid ? String(row.uhid) : undefined,
    appointmentDate: resolveAppointmentRowDate(row),
    _source_table: 'appointments',
  };
}

export function mapAppointmentRecordToQueueRow(row: Record<string, unknown>): DoctorQueueRow {
  return doctorQueueItemToRow(mapRowToDoctorQueueItem(row));
}

export function doctorQueueItemToRow(item: DoctorQueueItem): DoctorQueueRow {
  return {
    id: item.id,
    appointment_id: item.appointmentId ?? item.id,
    patient_id: item.patientId,
    patient_name: item.patientName,
    name: item.patientName,
    uhid: item.uhid,
    age: item.age,
    gender: item.gender,
    chief_complaint: item.chiefComplaint,
    reason_for_visit: item.chiefComplaint,
    status: item.status,
    queue_status: item.status,
    token_number: item.tokenNumber,
    appointment_time: item.time,
    time_slot: item.time,
    appointment_type: item.appointmentType,
    vitals: item.vitals ?? null,
    vitals_summary: vitalsSummary(item.vitals ?? null),
    department: item.department,
    doctor_id: item.doctorId,
    appointment_date: item.appointmentDate,
    created_at: item.createdAt,
    _source_table: item._source_table ?? 'appointments',
  };
}

export function doctorQueueRowToItem(row: DoctorQueueRow): DoctorQueueItem {
  const vitals =
    row.vitals && typeof row.vitals === 'object'
      ? {
          bp: (row.vitals as Record<string, unknown>).bp
            ? String((row.vitals as Record<string, unknown>).bp)
            : undefined,
          pulse: (row.vitals as Record<string, unknown>).pulse
            ? String((row.vitals as Record<string, unknown>).pulse)
            : undefined,
          temp: (row.vitals as Record<string, unknown>).temp
            ? String((row.vitals as Record<string, unknown>).temp)
            : undefined,
          spo2: (row.vitals as Record<string, unknown>).spo2
            ? String((row.vitals as Record<string, unknown>).spo2)
            : undefined,
          weight: (row.vitals as Record<string, unknown>).weight
            ? String((row.vitals as Record<string, unknown>).weight)
            : undefined,
        }
      : {};

  return {
    id: row.id,
    appointmentId: row.appointment_id ?? row.id,
    patientId: String(row.patient_id ?? row.uhid ?? row.id),
    patientName: row.patient_name ?? row.name ?? 'Patient',
    age: row.age,
    gender: row.gender,
    tokenNumber: String(row.token_number ?? ''),
    time: row.appointment_time ?? row.time_slot,
    status: normalizeQueueItemStatus(row.status ?? row.queue_status),
    chiefComplaint: row.chief_complaint ?? row.reason_for_visit,
    vitals,
    appointmentType: row.appointment_type,
    createdAt: row.created_at ?? '',
    department: row.department,
    doctorId: row.doctor_id ?? row.doctor_employee_id,
    uhid: row.uhid,
    appointmentDate: row.appointment_date,
    _source_table: row._source_table,
  };
}

function dedupeDoctorQueueItems(items: DoctorQueueItem[]): DoctorQueueItem[] {
  return Array.from(
    new Map(items.map((item) => [item.appointmentId || item.id, item])).values(),
  );
}

export const DOCTOR_DONE_QUEUE_STATUSES = [
  'done',
  'completed',
  'complete',
  'billing_pending',
  'billing',
  'finished',
  'paid',
] as const;

export function isQueueDoneStatus(rawStatus: unknown): boolean {
  const status = String(rawStatus ?? '').trim().toLowerCase().replace(/_/g, '-');
  if (!status) return false;
  return DOCTOR_DONE_QUEUE_STATUSES.some((candidate) =>
    status.includes(String(candidate).replace(/_/g, '-')),
  );
}

function isQueueWaitingStatus(rawStatus: unknown): boolean {
  const status = String(rawStatus ?? 'waiting').trim().toLowerCase().replace(/_/g, '-');
  if (!status) return true;
  if (isQueueDoneStatus(status) || /cancel|closed|discharged/.test(status)) {
    return false;
  }

  const waitingStatuses = [
    'waiting',
    'checked-in',
    'pending',
    'booked',
    'confirmed',
    'issued',
    'called',
    'in-consultation',
    'in-progress',
    'scheduled',
  ];

  return waitingStatuses.some((candidate) => status.includes(candidate));
}

export function buildDoctorQueueOrFilter(session: DoctorSession): string {
  const identifiers = getDoctorQueueIdentifiers(session);
  const parts = new Set<string>();

  for (const code of identifiers.codes) {
    parts.add(`doctor_id.eq.${code}`);
    parts.add(`doctor_code.eq.${code}`);
    parts.add(`doctor_employee_id.eq.${code}`);
    parts.add(`doctor_uuid.eq.${code}`);
  }

  for (const token of identifiers.nameTokens) {
    parts.add(`doctor_name.ilike.%${token}%`);
  }

  return Array.from(parts).join(',');
}

async function fetchDoctorAppointmentRows(
  supabase: SupabaseClient,
  session: DoctorSession,
  orderAscending: boolean,
  dateFilter: QueueDateFilter = DEFAULT_QUEUE_DATE_FILTER,
): Promise<Record<string, unknown>[]> {
  const orFilter = buildDoctorQueueOrFilter(session);
  if (!orFilter) {
    return [];
  }

  let query = supabase.from('appointments').select('*').or(orFilter);
  const today = todayIsoDate();

  switch (dateFilter.mode) {
    case 'today':
      query = query.or(`appointment_date.eq.${today},appointment_date.is.null`);
      break;
    case 'tomorrow':
      query = query.eq('appointment_date', tomorrowIsoDate());
      break;
    case 'custom': {
      const target = String(dateFilter.customDate ?? '').slice(0, 10);
      if (target) query = query.eq('appointment_date', target);
      break;
    }
    case 'upcoming':
      query = query.gte('appointment_date', today);
      break;
    default:
      break;
  }

  const { data, error } = await query.order('created_at', { ascending: orderAscending });

  if (!error && Array.isArray(data)) {
    return data.map((row) => asRecord(row));
  }

  console.warn('Doctor queue OR filter failed, using client-side doctor match:', error);

  const { data: fallbackRows, error: fallbackError } = await supabase
    .from('appointments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);

  if (fallbackError || !Array.isArray(fallbackRows)) {
    console.error('Error fetching doctor queue fallback:', fallbackError ?? error);
    throw fallbackError ?? error;
  }

  return fallbackRows
    .map((row) => asRecord(row))
    .filter((row) => appointmentBelongsToDoctor(row, session));
}

/** Primary appointments query — scoped to doctor identifiers and selected clinic date. */
export async function fetchDoctorQueue(
  supabase: SupabaseClient,
  session: DoctorSession,
  dateFilter: QueueDateFilter = DEFAULT_QUEUE_DATE_FILTER,
): Promise<DoctorQueueItem[]> {
  const data = await fetchDoctorAppointmentRows(supabase, session, true, dateFilter);

  const rawItems = data
    .map((row) => mapRowToDoctorQueueItem(asRecord(row)))
    .filter((item, index) => {
      const row = asRecord(data[index]);
      if (!matchesQueueDateFilter(row, dateFilter)) return false;
      if (!isQueueWaitingStatus(row.queue_status ?? row.status)) return false;
      return appointmentBelongsToDoctor(row, session);
    });

  return dedupeDoctorQueueItems(rawItems);
}

/** Consultations concluded by the doctor for the selected clinic date. */
export async function fetchDoctorDoneQueue(
  supabase: SupabaseClient,
  session: DoctorSession,
  dateFilter: QueueDateFilter = DEFAULT_QUEUE_DATE_FILTER,
): Promise<DoctorQueueItem[]> {
  const data = await fetchDoctorAppointmentRows(supabase, session, false, dateFilter);

  const rawItems = data
    .map((row) => mapRowToDoctorQueueItem(asRecord(row)))
    .filter((item, index) => {
      const row = asRecord(data[index]);
      if (!matchesQueueDateFilter(row, dateFilter)) return false;
      if (!isQueueDoneStatus(row.queue_status ?? row.status)) return false;
      return appointmentBelongsToDoctor(row, session);
    });

  return dedupeDoctorQueueItems(rawItems);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function parseVitals(raw: unknown): Record<string, unknown> | string | null {
  if (raw == null) return null;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    try {
      const parsed: unknown = JSON.parse(trimmed);
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : { summary: trimmed };
    } catch {
      return { summary: trimmed };
    }
  }
  if (typeof raw === 'object') return raw as Record<string, unknown>;
  return null;
}

function vitalsSummary(raw: unknown, fallback?: unknown): string {
  const existing = String(fallback ?? '').trim();
  if (existing) return existing;
  const parsed = parseVitals(raw);
  if (!parsed) return '';
  if (typeof parsed === 'string') return parsed;
  const parts = [
    parsed.bp ? `BP ${String(parsed.bp)}` : '',
    parsed.pulse ? `HR ${String(parsed.pulse)}` : '',
    parsed.temp ? `Temp ${String(parsed.temp)}` : '',
    parsed.spo2 ? `SpO2 ${String(parsed.spo2)}` : '',
    parsed.weight ? `Wt ${String(parsed.weight)}` : '',
    parsed.summary ? String(parsed.summary) : '',
  ].filter(Boolean);
  return parts.join(' · ');
}

function mapQueueRow(row: Record<string, unknown>, sourceTable: string): DoctorQueueRow {
  const id = String(row.id ?? row.appointment_id ?? '');
  const vitals = parseVitals(row.vitals ?? row.intake_vitals);
  return {
    id,
    appointment_id: row.appointment_id ? String(row.appointment_id) : id || undefined,
    patient_id: row.patient_id ? String(row.patient_id) : row.uhid ? String(row.uhid) : null,
    patient_name: String(row.patient_name ?? row.name ?? ''),
    name: String(row.name ?? row.patient_name ?? ''),
    uhid: row.uhid ? String(row.uhid) : undefined,
    phone: row.phone ? String(row.phone) : row.patient_phone ? String(row.patient_phone) : undefined,
    patient_phone: row.patient_phone ? String(row.patient_phone) : row.phone ? String(row.phone) : undefined,
    age: (row.age ?? row.patient_age) as number | string | undefined,
    gender: row.gender ? String(row.gender) : undefined,
    blood_group: row.blood_group ? String(row.blood_group) : undefined,
    chief_complaint: String(row.chief_complaint ?? row.reason_for_visit ?? ''),
    reason_for_visit: String(row.reason_for_visit ?? row.chief_complaint ?? ''),
    status: String(row.queue_status ?? row.status ?? 'waiting'),
    queue_status: String(row.queue_status ?? row.status ?? 'waiting'),
    token_number: (row.token_number ?? row.token ?? row.uhid) as string | number | undefined,
    sequence_number: row.sequence_number != null ? Number(row.sequence_number) : undefined,
    appointment_time: String(row.appointment_time ?? row.time_slot ?? row.slot_time ?? ''),
    time_slot: String(row.time_slot ?? row.slot_time ?? row.appointment_time ?? ''),
    appointment_type: row.appointment_type ? String(row.appointment_type) : undefined,
    source: row.source ? String(row.source) : undefined,
    department: row.department ? String(row.department) : undefined,
    vitals,
    vitals_summary: vitalsSummary(vitals, row.vitals_summary),
    doctor_id: row.doctor_id ? String(row.doctor_id) : undefined,
    doctor_code: row.doctor_code ? String(row.doctor_code) : undefined,
    doctor_employee_id: row.doctor_employee_id ? String(row.doctor_employee_id) : undefined,
    doctor_name: row.doctor_name ? String(row.doctor_name) : undefined,
    appointment_date: resolveAppointmentRowDate(row),
    created_at: row.created_at ? String(row.created_at) : undefined,
    consultation_fee: row.consultation_fee as number | string | undefined,
    fee: row.fee as number | string | undefined,
    _source_table: sourceTable,
  };
}

async function selectTable(
  supabase: SupabaseClient,
  table: string,
): Promise<Record<string, unknown>[]> {
  try {
    const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false });
    if (error || !Array.isArray(data)) return [];
    return data.map((row) => asRecord(row));
  } catch {
    return [];
  }
}

export function uniqueDoctorQueue<T extends DoctorQueueRow>(rawRows: T[]): T[] {
  const byIdentity = new Map<string, T>();
  for (const row of rawRows) {
    const key = String(
      row.appointment_id || row.id || `${row.patient_id ?? ''}-${row.token_number ?? ''}`,
    ).trim();
    if (!key) continue;
    if (!byIdentity.has(key)) {
      byIdentity.set(key, row);
    }
  }
  return dedupeEncounterList(Array.from(byIdentity.values())) as T[];
}

export async function fetchDoctorQueueRows(
  supabase: SupabaseClient,
  session: DoctorSession,
  dateFilter: QueueDateFilter = DEFAULT_QUEUE_DATE_FILTER,
): Promise<DoctorQueueRow[]> {
  let primaryWaiting: DoctorQueueItem[] = [];
  let primaryDone: DoctorQueueItem[] = [];
  try {
    [primaryWaiting, primaryDone] = await Promise.all([
      fetchDoctorQueue(supabase, session, dateFilter),
      fetchDoctorDoneQueue(supabase, session, dateFilter),
    ]);
  } catch (err) {
    console.warn('Primary appointments queue fetch failed, using table fallback:', err);
  }

  const tables = [
    'patient_appointments',
    'hospital_appointments',
    'hospital_opd_queue',
  ] as const;

  const results = await Promise.all(tables.map((table) => selectTable(supabase, table)));

  const fallbackWaiting = results.flatMap((rows, index) =>
    rows
      .filter((row) => matchesQueueDateFilter(row, dateFilter))
      .filter((row) => isQueueWaitingStatus(row.queue_status ?? row.status))
      .filter((row) => appointmentBelongsToDoctor(row, session))
      .map((row) => mapQueueRow(row, tables[index])),
  );

  const fallbackDone = results.flatMap((rows, index) =>
    rows
      .filter((row) => matchesQueueDateFilter(row, dateFilter))
      .filter((row) => isQueueDoneStatus(row.queue_status ?? row.status))
      .filter((row) => appointmentBelongsToDoctor(row, session))
      .map((row) => mapQueueRow(row, tables[index])),
  );

  const primaryRows = [...primaryWaiting, ...primaryDone].map(doctorQueueItemToRow);
  const primaryKeys = new Set(
    primaryRows.map((row) => String(row.appointment_id || row.id)),
  );

  const merged = [
    ...primaryRows,
    ...fallbackWaiting.filter((row) => !primaryKeys.has(String(row.appointment_id || row.id))),
    ...fallbackDone.filter((row) => !primaryKeys.has(String(row.appointment_id || row.id))),
  ];

  const uniqueQueue = uniqueDoctorQueue(merged).sort((a, b) => {
    const tokenA = parseInt(String(a.token_number || '').replace(/\D/g, ''), 10) || 999;
    const tokenB = parseInt(String(b.token_number || '').replace(/\D/g, ''), 10) || 999;
    if (tokenA !== tokenB) return tokenA - tokenB;
    return String(a.created_at || '').localeCompare(String(b.created_at || ''));
  });

  writeLocalJson(CACHE_KEYS.doctorQueue, {
    doctorId: session.doctorId,
    appointments: uniqueQueue,
  });

  return uniqueQueue;
}

export const DEFAULT_ACTIVE_DOCTOR_ID = 'RH-D01';
export const DEFAULT_ACTIVE_DOCTOR_NAME = 'Dr. Suriraju V';
export const DEFAULT_DOCTOR_EMPLOYEE_ID = 'RH-D01';
export const DEFAULT_PATIENT_ID = 'PAT-0000';

export type { OPDToken, OpdToken, LiveQueueRow, PrescriptionItem, PatientMedicalTimelineItem, DoctorRecord } from './types';

export type DoctorDashboardMetrics = {
  doctorId: string;
  todaysOpd: number;
  waitingQueue: number;
  completed: number;
  inConsultation: number;
  criticalAlerts: number;
  liveQueueTokens: import('./types').OPDToken[];
  liveQueueList?: import('./types').LiveQueueRow[];
};

export type ConsultationMedicationItem = {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
};

export type ConsultationAppointmentContext = {
  appointment_id: string;
  patient_id?: string | null;
  patient_name?: string;
  patient_gender?: string | null;
  patient_age?: number | string | null;
  blood_group?: string | null;
  reason?: string;
  token_number?: string | number | null;
};

function normalizeQueueStatus(status?: string): LiveQueueRow['status'] {
  const value = String(status ?? '').toUpperCase();
  if (value.includes('CONSULT')) return 'IN_CONSULTATION';
  if (value.includes('CALL')) return 'CALLED';
  if (/COMPLETE|BILLING|DONE|PAID/.test(value)) return 'COMPLETED';
  if (value.includes('WAIT') || value.includes('ISSUED')) return 'ISSUED';
  return value || 'ISSUED';
}

export function toLiveQueueRow(row: DoctorQueueRow): LiveQueueRow {
  return {
    id: row.id,
    appointment_id: row.appointment_id ?? row.id,
    doctor_id: row.doctor_id,
    patient_id: row.patient_id,
    token_number: row.token_number,
    status: normalizeQueueStatus(row.status || row.queue_status),
    patient_name: row.patient_name,
    gender: row.gender,
    blood_group: row.blood_group,
    age: row.age == null ? undefined : Number(row.age) || undefined,
    chief_complaint: row.chief_complaint,
    reason_for_visit: row.reason_for_visit,
  };
}

export async function resolveDoctorIdFromDb(
  employeeId: string,
  fullName?: string,
  email?: string,
): Promise<string | null> {
  try {
    if (email) {
      const byEmail = await defaultSupabase.from('doctors').select('doctor_id').eq('email', email).maybeSingle();
      if (byEmail.data?.doctor_id) return String(byEmail.data.doctor_id);
    }
    const byCode = await defaultSupabase
      .from('doctors')
      .select('doctor_id, doctor_code, employee_id')
      .or(
        `registration_number.eq.${employeeId},doctor_code.eq.${employeeId},employee_id.eq.${employeeId},doctor_id.eq.${employeeId}`,
      )
      .maybeSingle();
    if (byCode.data) {
      const row = byCode.data as Record<string, unknown>;
      return String(row.doctor_code ?? row.employee_id ?? row.doctor_id ?? employeeId);
    }
    if (fullName) {
      const byName = await defaultSupabase.from('doctors').select('doctor_id').ilike('full_name', `%${fullName}%`).maybeSingle();
      if (byName.data?.doctor_id) return String(byName.data.doctor_id);
    }
  } catch {
    /* missing doctors table */
  }
  return employeeId || null;
}

export async function getActiveDoctorProfile(): Promise<{ doctor_id: string; full_name: string } | null> {
  const identity = resolveDoctorSessionIdentity(getDoctorSession());
  const doctorId = (await resolveDoctorIdFromDb(identity.employeeId, identity.fullName, identity.email)) || identity.employeeId;
  return { doctor_id: doctorId, full_name: identity.fullName };
}

export function formatConsultationSaveError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err && 'message' in err) return String((err as { message?: string }).message);
  return 'Could not save consultation.';
}

export async function fetchConsultationAppointmentContext(
  appointmentId: string,
): Promise<ConsultationAppointmentContext | null> {
  const tables = ['appointments', 'patient_appointments', 'hospital_appointments'] as const;
  for (const table of tables) {
    const { data } = await defaultSupabase.from(table).select('*').eq('id', appointmentId).maybeSingle();
    const row = data as Record<string, unknown> | null;
    if (row) {
      return {
        appointment_id: String(row.id ?? row.appointment_id ?? appointmentId),
        patient_id: row.patient_id ? String(row.patient_id) : null,
        patient_name: String(row.patient_name ?? row.name ?? 'Patient'),
        patient_gender: row.gender ? String(row.gender) : null,
        patient_age: (row.age ?? row.patient_age) as number | string | null,
        blood_group: row.blood_group ? String(row.blood_group) : null,
        reason: String(row.chief_complaint ?? row.reason_for_visit ?? ''),
        token_number: (row.token_number as string | number | null) ?? null,
      };
    }
  }
  return null;
}

export async function completeAppointmentAfterConsultation(input: {
  appointmentId?: string | null;
  patientId?: string | null;
  patientName?: string;
  tokenNumber?: string | number | null;
  status?: string;
}): Promise<boolean> {
  const now = new Date().toISOString();
  const status = input.status || 'billing_pending';
  const tables = ['appointments', 'patient_appointments', 'hospital_opd_queue'] as const;
  let updated = false;
  for (const table of tables) {
    if (input.appointmentId) {
      const byId = await defaultSupabase.from(table).update({ status, completed_at: now }).eq('id', input.appointmentId);
      if (!byId.error) updated = true;
      const byApt = await defaultSupabase.from(table).update({ status, completed_at: now }).eq('appointment_id', input.appointmentId);
      if (!byApt.error) updated = true;
    }
  }
  return updated;
}

export async function getConsultationIdForAppointment(appointmentId: string): Promise<string | null> {
  const { data } = await defaultSupabase
    .from('consultations')
    .select('id')
    .eq('appointment_id', appointmentId)
    .order('created_at', { ascending: false })
    .maybeSingle();
  return data?.id ? String(data.id) : appointmentId;
}

export async function fetchPatientMedicalTimeline(patientId: string): Promise<PatientMedicalTimelineItem[]> {
  const history = await fetchPatient360History(defaultSupabase, { patient_id: patientId, id: patientId });
  return history.map((item) => ({
    id: item.id,
    type: item.type,
    created_at: item.created_at,
    diagnosis: item.diagnosis,
    notes: item.clinical_notes,
    medications: item.medications,
  }));
}

export async function rpcCallNextPatient(doctorId: string): Promise<LiveQueueRow | null> {
  const session = getDoctorSession() ?? {
    doctorId,
    doctorName: DEFAULT_ACTIVE_DOCTOR_NAME,
  };
  const rows = await fetchDoctorQueueRows(defaultSupabase, session);
  const next = rows.find((row) => !/billing|complete|done|paid/i.test(String(row.status ?? '')));
  return next ? toLiveQueueRow(next) : null;
}

export async function startEncounter(token: LiveQueueRow, doctorId: string): Promise<void> {
  const id = token.appointment_id || token.id;
  await Promise.allSettled([
    defaultSupabase.from('appointments').update({ status: 'IN_CONSULTATION', queue_status: 'IN_CONSULTATION' }).eq('id', id),
    defaultSupabase.from('appointments').update({ status: 'IN_CONSULTATION' }).eq('appointment_id', id),
  ]);
  void doctorId;
}

export async function fetchDoctorDashboardMetrics(session: DoctorSession): Promise<DoctorDashboardMetrics> {
  const rows = await fetchDoctorQueueRows(defaultSupabase, session);
  const live = rows.map(toLiveQueueRow);
  return {
    doctorId: session.doctorId,
    todaysOpd: live.length,
    waitingQueue: live.filter((row) => row.status === 'ISSUED' || /wait/i.test(String(row.status))).length,
    completed: live.filter((row) => row.status === 'COMPLETED').length,
    inConsultation: live.filter((row) => row.status === 'IN_CONSULTATION').length,
    criticalAlerts: 0,
    liveQueueTokens: live as OPDToken[],
    liveQueueList: live,
  };
}
