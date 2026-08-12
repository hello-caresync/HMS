import { supabase } from '@/lib/supabase/client';
import type {
  CompleteEncounterPayload,
  DashboardKpis,
  DiagnosisSeverity,
  EmergencyAlert,
  LabOrderStatus,
  LiveQueueRow,
  OpdTokenStatus,
  PatientRegistryRow,
} from './types';

// ═══════════════════════════════════════════════════════════════════════════════
// Dashboard service — typed models, doctor resolution, KPI fetch, status updates
// ═══════════════════════════════════════════════════════════════════════════════

export interface DoctorAppointment {
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  hospital_id?: string;
  appointment_date?: string;
  appointment_time?: string;
  token_number?: string;
  reason?: string;
  status: string;
  created_at?: string;
  patient_name?: string;
  patient_phone?: string;
  patient_gender?: string;
  patient_age?: number;
  blood_group?: string;
  allergies?: string;
  chronic_conditions?: string;
}

export interface OPDToken {
  id: string;
  appointment_id: string;
  doctor_id: string;
  patient_id: string;
  token_number: string;
  sequence_number: number;
  status: string;
  estimated_wait_minutes: number;
  created_at?: string;
  patient_profiles?: {
    full_name?: string;
    phone?: string;
    gender?: string;
    dob?: string;
    blood_group?: string;
  };
}

export interface DoctorDashboardMetrics {
  doctorId?: string;
  todaysOpd: number;
  waitingQueue: number;
  completed: number;
  inConsultation: number;
  criticalAlerts: number;
  appointmentsList: DoctorAppointment[];
  liveQueueTokens: OPDToken[];
}

function logSupabaseError(context: string, error: unknown) {
  if (!error) return;
  console.error(context, JSON.stringify(error, Object.getOwnPropertyNames(error as object), 2));
}

function calcAgeFromDob(dob?: string | null): number | undefined {
  if (!dob) return undefined;
  const born = new Date(dob);
  if (Number.isNaN(born.getTime())) return undefined;
  return Math.floor((Date.now() - born.getTime()) / (365.25 * 24 * 3600 * 1000));
}

function isWaitingStatus(status: unknown): boolean {
  const s = String(status ?? '');
  return s === 'SCHEDULED' || s === 'WAITING' || s === 'confirmed' || s === 'requested';
}

function isCompletedStatus(status: unknown): boolean {
  const s = String(status ?? '');
  return s === 'COMPLETED' || s === 'completed';
}

function isInConsultationStatus(status: unknown): boolean {
  const s = String(status ?? '');
  return s === 'IN_CONSULTATION' || s === 'in_progress';
}

function mapViewRowToDoctorAppointment(row: Record<string, unknown>): DoctorAppointment {
  const dob = (row.patient_dob as string | undefined) ?? undefined;
  const profile = row.patient_profiles as Record<string, unknown> | Record<string, unknown>[] | null;
  const p = Array.isArray(profile) ? profile[0] : profile;

  return {
    appointment_id: String(row.appointment_id ?? ''),
    patient_id: String(row.patient_id ?? ''),
    doctor_id: String(row.doctor_id ?? ''),
    hospital_id: row.hospital_id ? String(row.hospital_id) : undefined,
    appointment_date: row.appointment_date ? String(row.appointment_date).slice(0, 10) : undefined,
    appointment_time: row.appointment_time ? String(row.appointment_time) : undefined,
    token_number: row.token_number ? String(row.token_number) : undefined,
    reason: String(row.reason_for_visit ?? row.reason ?? 'General Consultation'),
    status: String(row.status ?? 'SCHEDULED'),
    created_at: row.created_at ? String(row.created_at) : undefined,
    patient_name: String(row.patient_name ?? p?.full_name ?? 'Patient'),
    patient_phone: row.patient_phone ? String(row.patient_phone) : p?.phone ? String(p.phone) : undefined,
    patient_gender: row.patient_gender ? String(row.patient_gender) : p?.gender ? String(p.gender) : undefined,
    patient_age: calcAgeFromDob(dob ?? (p?.dob as string | undefined)),
    blood_group: row.patient_blood_group
      ? String(row.patient_blood_group)
      : p?.blood_group
        ? String(p.blood_group)
        : undefined,
    allergies: row.allergies ? String(row.allergies) : undefined,
    chronic_conditions: row.chronic_conditions ? String(row.chronic_conditions) : undefined,
  };
}

function mapFallbackAppointmentRow(item: Record<string, unknown>): DoctorAppointment {
  const profile = item.patient_profiles as Record<string, unknown> | Record<string, unknown>[] | null;
  const p = Array.isArray(profile) ? profile[0] : profile;

  return {
    appointment_id: String(item.appointment_id ?? ''),
    patient_id: String(item.patient_id ?? ''),
    doctor_id: String(item.doctor_id ?? ''),
    appointment_date: item.appointment_date ? String(item.appointment_date).slice(0, 10) : undefined,
    appointment_time: item.appointment_time ? String(item.appointment_time) : undefined,
    reason: String(item.reason_for_visit ?? item.reason ?? 'General Consultation'),
    status: String(item.status ?? 'SCHEDULED'),
    created_at: item.created_at ? String(item.created_at) : undefined,
    patient_name: String(p?.full_name ?? 'Patient'),
    patient_phone: p?.phone ? String(p.phone) : undefined,
    patient_gender: p?.gender ? String(p.gender) : undefined,
    patient_age: calcAgeFromDob(p?.dob as string | undefined),
    blood_group: p?.blood_group ? String(p.blood_group) : undefined,
  };
}

function mapTokenRowToOpdToken(row: Record<string, unknown>): OPDToken {
  const profile = row.patient_profiles as OPDToken['patient_profiles'] | OPDToken['patient_profiles'][] | null;
  const p = Array.isArray(profile) ? profile[0] : profile;

  return {
    id: String(row.id ?? ''),
    appointment_id: String(row.appointment_id ?? ''),
    doctor_id: String(row.doctor_id ?? ''),
    patient_id: String(row.patient_id ?? ''),
    token_number: String(row.token_number ?? ''),
    sequence_number: Number(row.sequence_number ?? 0),
    status: String(row.status ?? 'ISSUED'),
    estimated_wait_minutes: Number(row.estimated_wait_minutes ?? 15),
    created_at: row.created_at ? String(row.created_at) : undefined,
    patient_profiles: p
      ? {
          full_name: p.full_name ? String(p.full_name) : undefined,
          phone: p.phone ? String(p.phone) : undefined,
          gender: p.gender ? String(p.gender) : undefined,
          dob: p.dob ? String(p.dob) : undefined,
          blood_group: p.blood_group ? String(p.blood_group) : undefined,
        }
      : undefined,
  };
}

/** Resolves active doctor profile by email, registration code, or name. */
export async function getActiveDoctorProfile(emailOrCode?: string) {
  const client = supabase;
  let query = client.from('doctors').select('*');

  if (emailOrCode) {
    query = query.or(
      `email.eq.${emailOrCode},registration_number.eq.${emailOrCode},full_name.ilike.%${emailOrCode}%`,
    );
  } else {
    const { data: authUser } = await client.auth.getUser();
    if (authUser?.user?.email) {
      query = query.eq('email', authUser.user.email);
    } else {
      query = query.or('registration_number.eq.RH-D06,full_name.ilike.%CHANDRAKANTH%');
    }
  }

  // limit(1) avoids PGRST116 when multiple doctor rows match the fallback OR filter
  const { data, error } = await query.limit(1);

  if (error) {
    logSupabaseError('Error resolving active doctor profile:', error);
    return null;
  }

  return data && data.length > 0 ? data[0] : null;
}

/**
 * Fetches dashboard KPIs, appointments, and live OPD tokens.
 * Falls back to direct `appointments` query when the view is unavailable.
 */
export async function getDoctorDashboardData(doctorId?: string): Promise<DoctorDashboardMetrics> {
  const client = supabase;
  let targetDoctorId = doctorId;

  if (!targetDoctorId) {
    const doctor = await getActiveDoctorProfile();
    targetDoctorId = doctor?.doctor_id ? String(doctor.doctor_id) : undefined;
  }

  let appointmentsQuery = client
    .from('doctor_appointments_view')
    .select('*')
    .order('created_at', { ascending: false });

  if (targetDoctorId) {
    appointmentsQuery = appointmentsQuery.eq('doctor_id', targetDoctorId);
  }

  let { data: appointments, error: appErr } = await appointmentsQuery;

  if (appErr) {
    console.warn(
      'Falling back to direct "appointments" table query:',
      appErr.message ?? appErr.code ?? appErr,
    );

    let fallbackQuery = client
      .from('appointments')
      .select('*, patient_profiles(*)')
      .order('created_at', { ascending: false });

    if (targetDoctorId) {
      fallbackQuery = fallbackQuery.eq('doctor_id', targetDoctorId);
    }

    const fallbackRes = await fallbackQuery;
    if (!fallbackRes.error && fallbackRes.data) {
      appointments = fallbackRes.data;
      appErr = null;
    } else if (fallbackRes.error) {
      logSupabaseError('Appointments fallback query failed:', fallbackRes.error);
    }
  }

  let tokensQuery = client
    .from('opd_tokens')
    .select('*, patient_profiles(full_name, phone, gender, dob, blood_group)')
    .order('sequence_number', { ascending: true });

  if (targetDoctorId) {
    tokensQuery = tokensQuery.eq('doctor_id', targetDoctorId);
  }

  const { data: tokens, error: tokErr } = await tokensQuery;

  if (appErr) logSupabaseError('Fetch Error (Appointments) in getDoctorDashboardData:', appErr);
  if (tokErr) logSupabaseError('Fetch Error (OPD Tokens) in getDoctorDashboardData:', tokErr);

  const rawAppointments = (appointments ?? []) as Record<string, unknown>[];
  const appList = rawAppointments.map((row) =>
    row.patient_profiles || row.reason_for_visit !== undefined
      ? mapFallbackAppointmentRow(row)
      : mapViewRowToDoctorAppointment(row),
  );

  const tokenList = ((tokens ?? []) as Record<string, unknown>[]).map(mapTokenRowToOpdToken);

  let criticalAlerts = 0;
  if (targetDoctorId) {
    try {
      const { count, error: alertErr } = await client
        .from('emergency_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', targetDoctorId)
        .eq('status', 'ACTIVE')
        .eq('severity', 'CRITICAL');
      if (alertErr) logSupabaseError('Critical alerts count failed:', alertErr);
      criticalAlerts = count ?? 0;
    } catch {
      /* optional table */
    }
  }

  return {
    doctorId: targetDoctorId,
    todaysOpd: appList.length,
    waitingQueue: appList.filter((a) => isWaitingStatus(a.status)).length,
    completed: appList.filter((a) => isCompletedStatus(a.status)).length,
    inConsultation: appList.filter((a) => isInConsultationStatus(a.status)).length,
    criticalAlerts,
    appointmentsList: appList,
    liveQueueTokens: tokenList,
  };
}

/** @deprecated Use `getDoctorDashboardData(doctorId)` — kept for hook compatibility. */
export async function getDoctorDashboardDataForDoctor(
  doctorId: string,
): Promise<DoctorDashboardMetrics> {
  return getDoctorDashboardData(doctorId);
}

/** Updates appointment lifecycle status with explicit error logging. */
export async function updateAppointmentStatus(appointmentId: string, status: string) {
  const client = supabase;

  const { data, error } = await client
    .from('appointments')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('appointment_id', appointmentId)
    .select()
    .single();

  if (error) {
    logSupabaseError(`Failed to update appointment ${appointmentId} status to ${status}:`, error);
    throw error;
  }

  return data;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Clinical consultation & prescription dispatch
// ═══════════════════════════════════════════════════════════════════════════════

export interface ConsultationMedicationItem {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface ConsultationVitalsInput {
  temperature_f?: number | null;
  bp_systolic?: number | null;
  bp_diastolic?: number | null;
  pulse_bpm?: number | null;
  spo2_percent?: number | null;
  weight_kg?: number | null;
}

export interface ConsultationClinicalInput {
  chief_complaint: string;
  clinical_findings?: string;
  diagnosis: string;
  clinical_notes?: string;
  follow_up_date?: string | null;
}

export interface ConsultationAppointmentContext {
  appointment_id: string;
  doctor_id: string;
  patient_id: string;
  patient_name?: string;
  patient_gender?: string;
  patient_age?: number;
  blood_group?: string;
  reason?: string;
}

export interface ConsultationFinalizeInput {
  appointmentId: string;
  doctorId: string;
  patientId: string;
  clinical: ConsultationClinicalInput;
  vitals: ConsultationVitalsInput;
  medications: ConsultationMedicationItem[];
  special_instructions?: string;
}

export interface ConsultationFinalizeResult {
  consultation_id: string;
  prescription_id?: string;
}

export interface PatientPrescriptionRecord {
  id: string;
  created_at: string;
  special_instructions?: string;
  medications: ConsultationMedicationItem[] | string;
  patient_id: string;
  consultation_id?: string;
  consultations?: {
    diagnosis?: string;
    chief_complaint?: string;
    clinical_notes?: string;
    follow_up_date?: string;
    doctors?: {
      full_name?: string;
      department?: string;
      specialization?: string;
    };
    vitals?: ConsultationVitalsInput[];
  };
}

/** Parse medications stored as JSON array or JSON string in Supabase. */
export function parsePrescriptionMedications(raw: unknown): ConsultationMedicationItem[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => ({
      name: String((item as ConsultationMedicationItem).name ?? ''),
      dosage: String((item as ConsultationMedicationItem).dosage ?? ''),
      frequency: String((item as ConsultationMedicationItem).frequency ?? ''),
      duration: String((item as ConsultationMedicationItem).duration ?? ''),
      instructions: String((item as ConsultationMedicationItem).instructions ?? ''),
    }));
  }
  if (typeof raw === 'string' && raw.trim()) {
    try {
      return parsePrescriptionMedications(JSON.parse(raw));
    } catch {
      return [];
    }
  }
  return [];
}

/** Load appointment + patient context for the consultation workspace. */
export async function fetchConsultationAppointmentContext(
  appointmentId: string,
): Promise<ConsultationAppointmentContext | null> {
  const client = supabase;

  const { data: viewRow, error: viewErr } = await client
    .from('doctor_appointments_view')
    .select('*')
    .eq('appointment_id', appointmentId)
    .maybeSingle();

  if (!viewErr && viewRow) {
    return {
      appointment_id: String(viewRow.appointment_id),
      doctor_id: String(viewRow.doctor_id),
      patient_id: String(viewRow.patient_id),
      patient_name: viewRow.patient_name ? String(viewRow.patient_name) : undefined,
      patient_gender: viewRow.patient_gender ? String(viewRow.patient_gender) : undefined,
      patient_age: viewRow.patient_age ? Number(viewRow.patient_age) : undefined,
      blood_group: viewRow.patient_blood_group ? String(viewRow.patient_blood_group) : undefined,
      reason: viewRow.reason_for_visit
        ? String(viewRow.reason_for_visit)
        : viewRow.reason
          ? String(viewRow.reason)
          : undefined,
    };
  }

  const { data: appt, error: apptErr } = await client
    .from('appointments')
    .select('*, patient_profiles(full_name, gender, dob, blood_group)')
    .eq('appointment_id', appointmentId)
    .maybeSingle();

  if (apptErr || !appt) {
    logSupabaseError('fetchConsultationAppointmentContext failed:', apptErr);
    return null;
  }

  const profile = appt.patient_profiles as
    | Record<string, unknown>
    | Record<string, unknown>[]
    | null;
  const p = Array.isArray(profile) ? profile[0] : profile;

  return {
    appointment_id: String(appt.appointment_id),
    doctor_id: String(appt.doctor_id),
    patient_id: String(appt.patient_id),
    patient_name: p?.full_name ? String(p.full_name) : undefined,
    patient_gender: p?.gender ? String(p.gender) : undefined,
    patient_age: calcAgeFromDob(p?.dob as string | undefined),
    blood_group: p?.blood_group ? String(p.blood_group) : undefined,
    reason: appt.reason_for_visit
      ? String(appt.reason_for_visit)
      : appt.reason
        ? String(appt.reason)
        : undefined,
  };
}

/**
 * Finalize consultation: consultations → vitals → prescriptions → appointment COMPLETED.
 * Triggers Supabase Realtime so the patient prescriptions page updates instantly.
 */
export async function finalizeConsultationAndPrescription(
  input: ConsultationFinalizeInput,
): Promise<ConsultationFinalizeResult> {
  const client = supabase;
  const meds = input.medications.filter((m) => m.name.trim() !== '');

  const { data: consultation, error: consultErr } = await client
    .from('consultations')
    .insert({
      appointment_id: input.appointmentId,
      doctor_id: input.doctorId,
      patient_id: input.patientId,
      chief_complaint: input.clinical.chief_complaint,
      diagnosis: input.clinical.diagnosis,
      clinical_notes: [input.clinical.clinical_findings, input.clinical.clinical_notes]
        .filter(Boolean)
        .join('\n\n'),
      follow_up_date: input.clinical.follow_up_date || null,
    })
    .select('id')
    .single();

  if (consultErr || !consultation?.id) {
    logSupabaseError('Consultation insert failed:', consultErr);
    throw consultErr ?? new Error('Consultation insert returned no id');
  }

  const consultationId = String(consultation.id);

  const { error: vitalsErr } = await client.from('vitals').insert({
    consultation_id: consultationId,
    patient_id: input.patientId,
    temperature_f: input.vitals.temperature_f ?? null,
    bp_systolic: input.vitals.bp_systolic ?? null,
    bp_diastolic: input.vitals.bp_diastolic ?? null,
    pulse_bpm: input.vitals.pulse_bpm ?? null,
    spo2_percent: input.vitals.spo2_percent ?? null,
    weight_kg: input.vitals.weight_kg ?? null,
  });

  if (vitalsErr) {
    logSupabaseError('Vitals insert failed:', vitalsErr);
    throw vitalsErr;
  }

  const { data: prescription, error: rxErr } = await client
    .from('prescriptions')
    .insert({
      consultation_id: consultationId,
      appointment_id: input.appointmentId,
      doctor_id: input.doctorId,
      patient_id: input.patientId,
      medications: JSON.stringify(meds),
      special_instructions: input.special_instructions ?? input.clinical.clinical_notes ?? null,
    })
    .select('id')
    .single();

  if (rxErr) {
    logSupabaseError('Prescription insert failed:', rxErr);
    throw rxErr;
  }

  await updateAppointmentStatus(input.appointmentId, 'COMPLETED');

  return {
    consultation_id: consultationId,
    prescription_id: prescription?.id ? String(prescription.id) : undefined,
  };
}

function mapOpdTokenToLiveQueueRow(token: OPDToken): LiveQueueRow {
  const p = token.patient_profiles;
  return normalizeQueueRow(
    {
      id: token.id,
      appointment_id: token.appointment_id,
      doctor_id: token.doctor_id,
      patient_id: token.patient_id,
      token_number: token.token_number,
      sequence_number: token.sequence_number,
      status: token.status,
      estimated_wait_minutes: token.estimated_wait_minutes,
      patient_name: p?.full_name,
      gender: p?.gender,
      blood_group: p?.blood_group,
      dob: p?.dob,
      phone: p?.phone,
    },
    token.doctor_id,
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Legacy queue / clinical bridge (localStorage fallbacks + RPCs)
// ═══════════════════════════════════════════════════════════════════════════════

const STORAGE = {
  queue: 'curasync_live_doctor_queue',
  patients: 'curasync_patient_registry_v2',
} as const;

function isBrowser() {
  return typeof window !== 'undefined';
}

function readLocal<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function calcAge(dob?: string): number | undefined {
  if (!dob) return undefined;
  const born = new Date(dob);
  if (Number.isNaN(born.getTime())) return undefined;
  return Math.floor((Date.now() - born.getTime()) / (365.25 * 24 * 3600 * 1000));
}

function normalizeStatus(raw: string): OpdTokenStatus {
  const s = raw.toUpperCase();
  if (s === 'ISSUED' || s === 'WAITING' || s === 'SCHEDULED') return 'ISSUED';
  if (s === 'CALLED') return 'CALLED';
  if (s === 'IN_CONSULTATION' || s === 'IN_PROGRESS') return 'IN_CONSULTATION';
  if (s === 'COMPLETED') return 'COMPLETED';
  if (s === 'SKIPPED') return 'SKIPPED';
  if (s === 'CANCELLED') return 'CANCELLED';
  return 'ISSUED';
}

function normalizeQueueRow(row: Record<string, unknown>, doctorUuid?: string): LiveQueueRow {
  const dob = row.dob as string | undefined;
  return {
    id: String(row.id ?? row.token_id ?? ''),
    token_id: String(row.token_id ?? row.id ?? ''),
    appointment_id: row.appointment_id ? String(row.appointment_id) : null,
    doctor_id: String(doctorUuid ?? row.doctor_id ?? ''),
    patient_id: String(row.patient_id ?? ''),
    token_number: String(row.token_number ?? ''),
    sequence_number: Number(row.sequence_number ?? row.token_number ?? 0),
    status: normalizeStatus(String(row.status ?? 'ISSUED')),
    estimated_wait_minutes: Number(row.estimated_wait_minutes ?? 0) || undefined,
    called_at: (row.called_at as string) || null,
    completed_at: (row.completed_at as string) || null,
    patient_name: String(row.patient_name ?? row.full_name ?? 'Patient'),
    gender: (row.gender as string) || undefined,
    blood_group: (row.blood_group as string) || undefined,
    allergies: (row.allergies as string) || undefined,
    chronic_conditions: (row.chronic_conditions as string) || undefined,
    chief_complaint: String(row.chief_complaint ?? row.reason_for_visit ?? ''),
    reason_for_visit: (row.reason_for_visit as string) || undefined,
    department: (row.department as string) || undefined,
    appointment_date: normalizeDateOnly(row.appointment_date as string | undefined),
    appointment_time: (row.appointment_time as string) || (row.slot_time as string) || undefined,
    dob,
    phone: (row.phone as string) || undefined,
    age: calcAge(dob) ?? (Number(row.age ?? row.patient_age) || undefined),
  };
}

/** Local calendar date YYYY-MM-DD (timezone-safe, not UTC midnight drift). */
export function todayLocalDate(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().split('T')[0];
}

function normalizeDateOnly(value?: string | null): string | undefined {
  if (!value) return undefined;
  return value.slice(0, 10);
}

function isTodayAppointment(dateStr?: string | null): boolean {
  if (!dateStr) return true;
  return normalizeDateOnly(dateStr) === todayLocalDate();
}

function filterTodayRows(rows: LiveQueueRow[]): LiveQueueRow[] {
  return rows.filter((r) => isTodayAppointment(r.appointment_date));
}

export type FetchDoctorQueueOptions = {
  doctorUuid?: string;
  employeeId?: string;
  doctorName?: string;
};

function resolveQueueOptions(input: string | FetchDoctorQueueOptions): FetchDoctorQueueOptions {
  return typeof input === 'string' ? { doctorUuid: input } : input;
}

/** Build ilike filters for full clinician names (e.g. "Dr CHANDRAKANTH S KESARI"). */
function buildDoctorNameFilters(fullName: string): string[] {
  const cleaned = fullName.replace(/^dr\.?\s*/i, '').trim();
  if (!cleaned) return [];

  const filters = [`full_name.ilike.%${cleaned}%`];
  const first = cleaned.split(/\s+/)[0];
  if (first && first.length > 2 && first.toLowerCase() !== cleaned.toLowerCase()) {
    filters.push(`full_name.ilike.%${first}%`);
  }
  const last = cleaned.split(/\s+/).pop();
  if (last && last.length > 2 && last !== first) {
    filters.push(`full_name.ilike.%${last}%`);
  }
  return filters;
}

/** Resolve canonical `doctors.doctor_id` UUID — matches Patient App appointment inserts. */
export async function resolveDoctorIdFromDb(
  doctorCode: string,
  doctorName: string,
  userEmail?: string,
): Promise<string | null> {
  const code = doctorCode.trim();
  const email = userEmail?.trim();
  const nameFilters = buildDoctorNameFilters(doctorName);
  if (!code && !email && nameFilters.length === 0) return null;

  const filters = [...nameFilters];
  if (code) {
    filters.push(`registration_number.eq.${code}`);
    filters.push(`doctor_code.eq.${code}`);
  }
  if (email) filters.push(`email.eq.${email}`);

  try {
    const { data: doctor, error } = await supabase
      .from('doctors')
      .select('doctor_id, full_name, registration_number')
      .or(filters.join(','))
      .single();

    if (error || !doctor?.doctor_id) return null;
    return String(doctor.doctor_id);
  } catch {
    try {
      const { data: doctor } = await supabase
        .from('doctors')
        .select('doctor_id, full_name, registration_number')
        .or(filters.join(','))
        .limit(1)
        .maybeSingle();
      return doctor?.doctor_id ? String(doctor.doctor_id) : null;
    } catch {
      return null;
    }
  }
}


function normalizeLegacyOpdQueueRow(
  row: Record<string, unknown>,
  doctorUuid: string,
  index: number,
): LiveQueueRow {
  const allergies = Array.isArray(row.allergies)
    ? (row.allergies as string[]).join(', ')
    : (row.allergies as string) || undefined;

  return normalizeQueueRow(
    {
      ...row,
      id: row.id ?? `legacy_${index}`,
      sequence_number: row.sequence_number ?? index + 1,
      status: row.status ?? 'ISSUED',
      allergies,
    },
    doctorUuid,
  );
}

function normalizeAppointmentFallbackRow(
  appt: Record<string, unknown>,
  doctorUuid: string,
  index: number,
): LiveQueueRow {
  const profile = (appt.patient_profiles ?? appt.patient_profile) as
    | Record<string, unknown>
    | Record<string, unknown>[]
    | null
    | undefined;
  const p = Array.isArray(profile) ? profile[0] : profile;
  const apptStatus = String(appt.status ?? 'SCHEDULED').toUpperCase();
  const queueStatus: OpdTokenStatus =
    apptStatus === 'WAITING' || apptStatus === 'SCHEDULED' ? 'ISSUED' : normalizeStatus(apptStatus);

  return normalizeQueueRow(
    {
      id: `appt_${appt.appointment_id}`,
      appointment_id: appt.appointment_id,
      doctor_id: doctorUuid,
      patient_id: appt.patient_id,
      token_number: appt.token_number ?? String(index + 1),
      sequence_number: Number(appt.token_number ?? index + 1),
      status: queueStatus,
      reason_for_visit: appt.reason_for_visit,
      chief_complaint: appt.reason_for_visit,
      department: appt.department,
      appointment_date: appt.appointment_date,
      appointment_time: appt.appointment_time,
      patient_name: p?.full_name,
      gender: p?.gender,
      blood_group: p?.blood_group,
      dob: p?.dob,
    },
    doctorUuid,
  );
}


async function fetchFromView(doctorUuid: string): Promise<LiveQueueRow[]> {
  try {
    const { data: queue, error } = await supabase
      .from('view_live_doctor_queue')
      .select('*')
      .eq('doctor_id', doctorUuid)
      .order('sequence_number', { ascending: true });

    if (!error && queue?.length) {
      return queue.map((r: Record<string, unknown>) => normalizeQueueRow(r, doctorUuid));
    }
  } catch {
    /* view may not exist */
  }
  return [];
}

/** Fallback when the live queue view is empty — Patient App writes `appointments` by doctor_id UUID. */
async function fetchAppointmentsFallback(doctorUuid: string): Promise<LiveQueueRow[]> {
  try {
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*, patient_profiles(full_name, gender, dob, blood_group)')
      .eq('doctor_id', doctorUuid)
      .in('status', ['SCHEDULED', 'WAITING', 'requested', 'confirmed', 'in_progress']);

    if (error || !appointments?.length) {
      const { data: plain } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', doctorUuid)
        .in('status', ['SCHEDULED', 'WAITING', 'requested', 'confirmed', 'in_progress']);

      if (!plain?.length) return [];
      return plain.map((a: Record<string, unknown>, i: number) =>
        normalizeAppointmentFallbackRow(a, doctorUuid, i),
      );
    }

    return appointments.map((a: Record<string, unknown>, i: number) =>
      normalizeAppointmentFallbackRow(a, doctorUuid, i),
    );
  } catch {
    return [];
  }
}

async function fetchFromOpdTokens(doctorUuid: string): Promise<LiveQueueRow[]> {
  try {
    const { data } = await supabase
      .from('opd_tokens')
      .select('*')
      .eq('doctor_id', doctorUuid)
      .order('sequence_number', { ascending: true });

    if (data?.length) {
      return data.map((r: Record<string, unknown>) => normalizeQueueRow(r, doctorUuid));
    }
  } catch {
    /* offline */
  }
  return [];
}

async function fetchFromLegacyOpdQueue(
  employeeId: string | undefined,
  doctorUuid: string,
  today: string,
): Promise<LiveQueueRow[]> {
  if (!employeeId) return [];
  try {
    const { data } = await supabase
      .from('opd_queue')
      .select('*')
      .eq('doctor_id', employeeId)
      .eq('appointment_date', today)
      .order('created_at', { ascending: true });

    if (data?.length) {
      return data.map((r: Record<string, unknown>, i: number) =>
        normalizeLegacyOpdQueueRow(r, doctorUuid, i),
      );
    }
  } catch {
    /* legacy table optional */
  }
  return [];
}

/** Fetch queue rows for a resolved `doctor_id` UUID (view → appointments → tokens). */
async function fetchQueueForDoctorId(
  resolvedDoctorId: string,
  employeeId?: string,
): Promise<LiveQueueRow[]> {
  const today = todayLocalDate();

  let list = filterTodayRows(await fetchFromView(resolvedDoctorId));

  if (list.length === 0) {
    list = filterTodayRows(await fetchAppointmentsFallback(resolvedDoctorId));
  }
  if (list.length === 0) {
    list = filterTodayRows(await fetchFromOpdTokens(resolvedDoctorId));
  }
  if (list.length === 0 && employeeId) {
    list = filterTodayRows(await fetchFromLegacyOpdQueue(employeeId, resolvedDoctorId, today));
  }
  if (list.length === 0) {
    list = filterTodayRows(
      readLocal<LiveQueueRow[]>(STORAGE.queue, []).filter((r) => r.doctor_id === resolvedDoctorId),
    );
  }

  const others = readLocal<LiveQueueRow[]>(STORAGE.queue, []).filter(
    (r) => r.doctor_id !== resolvedDoctorId,
  );
  writeLocal(
    STORAGE.queue,
    [...others, ...list.map((r) => ({ ...r, doctor_id: resolvedDoctorId }))],
  );

  return list;
}

/**
 * Dashboard data fetch for a resolved doctor UUID.
 * Used on initial load and realtime refetch when Patient App books appointments.
 */
export async function fetchDoctorDashboardData(
  resolvedDoctorId: string,
  scope?: Pick<FetchDoctorQueueOptions, 'employeeId'>,
): Promise<DoctorQueueSnapshot> {
  if (!resolvedDoctorId) {
    return { doctorId: '', liveQueueList: [], todaysOpd: 0, waitingQueue: 0 };
  }

  try {
    const metrics = await getDoctorDashboardData(resolvedDoctorId);
    const tokenRows = metrics.liveQueueTokens.map(mapOpdTokenToLiveQueueRow);
    const fromTokens = filterTodayRows(tokenRows);

    if (fromTokens.length > 0 || metrics.appointmentsList.length > 0) {
      const liveQueueList =
        fromTokens.length > 0
          ? fromTokens
          : await fetchQueueForDoctorId(resolvedDoctorId, scope?.employeeId);

      return {
        doctorId: resolvedDoctorId,
        liveQueueList,
        todaysOpd: metrics.todaysOpd,
        waitingQueue: metrics.waitingQueue,
      };
    }
  } catch {
    /* fall through to legacy multi-source fetch */
  }

  const liveQueueList = await fetchQueueForDoctorId(resolvedDoctorId, scope?.employeeId);
  return buildDoctorQueueSnapshot(resolvedDoctorId, liveQueueList);
}

/** Alias used by dashboard realtime handlers — refetch queue + KPIs for active doctor UUID. */
export async function refreshDoctorDashboard(
  activeDoctorId: string,
  scope?: Pick<FetchDoctorQueueOptions, 'employeeId'>,
): Promise<DoctorQueueSnapshot> {
  return fetchDoctorDashboardData(activeDoctorId, scope);
}

export type DoctorQueueSnapshot = {
  doctorId: string;
  liveQueueList: LiveQueueRow[];
  todaysOpd: number;
  waitingQueue: number;
};

/** Map queue rows → dashboard KPI fields + live list for Token #1, #2, … rendering. */
export function buildDoctorQueueSnapshot(
  doctorId: string,
  rows: LiveQueueRow[],
  criticalAlerts = 0,
): DoctorQueueSnapshot {
  const kpis = computeKpis(rows, criticalAlerts);
  return {
    doctorId,
    liveQueueList: rows,
    todaysOpd: kpis.todaysOpd,
    waitingQueue: kpis.waiting,
  };
}

/**
 * Doctor Command Center queue fetch:
 * 1. Resolve `doctor_id` UUID from `doctors` (registration_number OR full_name)
 * 2. `view_live_doctor_queue` for that UUID
 * 3. Fallback → `appointments` (SCHEDULED / WAITING)
 * 4. Last resort → `opd_tokens`, legacy `opd_queue`, local cache
 */
export async function fetchLiveDoctorQueue(
  input: string | FetchDoctorQueueOptions,
): Promise<LiveQueueRow[]> {
  const opts = resolveQueueOptions(input);
  const employeeId = opts.employeeId ?? '';
  const doctorName = opts.doctorName ?? '';

  const doctorUuid =
    (await resolveDoctorIdFromDb(employeeId, doctorName)) ?? opts.doctorUuid ?? '';

  if (!doctorUuid) return [];

  const list = await fetchQueueForDoctorId(doctorUuid, employeeId);
  return list;
}

/** Convenience: resolve doctor + fetch queue + compute KPI snapshot in one call. */
export async function fetchDoctorQueueSnapshot(
  input: string | FetchDoctorQueueOptions,
  criticalAlerts = 0,
): Promise<DoctorQueueSnapshot> {
  const opts = resolveQueueOptions(input);
  const employeeId = opts.employeeId ?? '';
  const doctorName = opts.doctorName ?? '';
  const doctorId =
    (await resolveDoctorIdFromDb(employeeId, doctorName)) ?? opts.doctorUuid ?? '';
  const liveQueueList = await fetchLiveDoctorQueue(input);
  return buildDoctorQueueSnapshot(doctorId, liveQueueList, criticalAlerts);
}

export function computeKpis(rows: LiveQueueRow[], criticalAlerts = 0): DashboardKpis {
  return {
    todaysOpd: rows.length,
    waiting: rows.filter((r) => r.status === 'ISSUED' || r.status === 'CALLED').length,
    completed: rows.filter((r) => r.status === 'COMPLETED').length,
    pendingFollowUps: rows.filter((r) => r.status === 'IN_CONSULTATION').length,
    criticalAlerts,
  };
}

/** RPC: call_next_patient(p_doctor_id) */
export async function rpcCallNextPatient(doctorUuid: string): Promise<LiveQueueRow | null> {
  try {
    const { data, error } = await supabase.rpc('call_next_patient', {
      p_doctor_id: doctorUuid,
    });
    if (error) throw error;
    if (data && typeof data === 'object') {
      return normalizeQueueRow(data as Record<string, unknown>);
    }
  } catch {
    /* fallback below */
  }

  const queue = await fetchLiveDoctorQueue({ doctorUuid });
  const next = queue.find((r) => r.status === 'ISSUED');
  if (!next) return null;

  await updateTokenStatus(next.id, 'CALLED');
  return { ...next, status: 'CALLED', called_at: new Date().toISOString() };
}

export async function updateTokenStatus(tokenId: string, status: OpdTokenStatus): Promise<void> {
  const patch: Record<string, unknown> = { status };
  if (status === 'CALLED') patch.called_at = new Date().toISOString();
  if (status === 'COMPLETED') patch.completed_at = new Date().toISOString();

  const all = readLocal<LiveQueueRow[]>(STORAGE.queue, []);
  writeLocal(
    STORAGE.queue,
    all.map((t) => (t.id === tokenId ? { ...t, status, ...patch } : t)),
  );

  try {
    await supabase.from('opd_tokens').update(patch).eq('id', tokenId);
    if (status === 'IN_CONSULTATION') {
      const row = all.find((t) => t.id === tokenId);
      if (row?.appointment_id) {
        await supabase
          .from('appointments')
          .update({ status: 'in_progress' })
          .eq('appointment_id', row.appointment_id);
      }
    }
  } catch {
    /* local ok */
  }
}

export async function startEncounter(token: LiveQueueRow, doctorUuid: string): Promise<string> {
  await updateTokenStatus(token.id, 'IN_CONSULTATION');

  if (token.appointment_id) {
    try {
      await supabase
        .from('appointments')
        .update({ status: 'in_progress' })
        .eq('appointment_id', token.appointment_id);
      await supabase.from('patient_notifications').insert({
        patient_id: token.patient_id,
        title: 'Consultation started',
        message: `Your doctor has started your consultation (Token ${token.token_number}).`,
        type: 'consultation_started',
        source_app: 'doctor_app',
      });
    } catch {
      /* ok */
    }
  }

  try {
    const { data } = await supabase
      .from('consultations')
      .insert({
        appointment_id: token.appointment_id,
        patient_id: token.patient_id,
        doctor_id: doctorUuid,
        chief_complaint: token.chief_complaint || token.reason_for_visit,
        symptoms: [],
      })
      .select('id')
      .maybeSingle();
    if (data?.id) return String(data.id);
  } catch {
    /* ok */
  }

  return `local_${token.appointment_id || token.id}`;
}

/** RPC: complete_consultation_encounter(...) — atomic sign-off */
async function persistEncounterSideEffects(
  payload: CompleteEncounterPayload,
  appointmentId?: string | null,
): Promise<void> {
  const apptId = appointmentId ?? payload.appointmentId ?? null;

  if (apptId) {
    await supabase.from('appointments').update({ status: 'completed' }).eq('appointment_id', apptId);
  }

  if (payload.vitals) {
    try {
      await supabase.from('vitals').insert({
        consultation_id: payload.consultationId,
        patient_id: payload.patientId,
        temperature: payload.vitals.temperature ? Number(payload.vitals.temperature) : null,
        blood_pressure: payload.vitals.blood_pressure || null,
        pulse: payload.vitals.pulse ? Number(payload.vitals.pulse) : null,
        spo2: payload.vitals.spo2 ? Number(payload.vitals.spo2) : null,
        weight: payload.vitals.weight ? Number(payload.vitals.weight) : null,
      });
    } catch {
      /* vitals table optional */
    }
  }

  const summary = [
    `Diagnosis: ${payload.primaryDiagnosis} (${payload.icd10Code})`,
    payload.doctorNotes ? `Notes: ${payload.doctorNotes}` : '',
    payload.prescriptions.length
      ? `Rx: ${payload.prescriptions.map((p) => p.medicine_name).join(', ')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n');

  try {
    await supabase.from('medical_records').insert({
      patient_id: payload.patientId,
      doctor_id: payload.doctorId,
      consultation_id: payload.consultationId,
      appointment_id: apptId,
      record_type: 'consultation_summary',
      summary,
      metadata: {
        icd10: payload.icd10Code,
        severity: payload.diagnosisSeverity,
        prescriptions: payload.prescriptions,
        vitals: payload.vitals,
      },
    });
  } catch {
    /* medical_records optional */
  }
}

export async function rpcCompleteConsultationEncounter(
  payload: CompleteEncounterPayload,
): Promise<void> {
  const rxJson = payload.prescriptions.map((p) => ({
    medicine_name: p.medicine_name,
    dosage: p.dosage,
    frequency: p.frequency,
    duration: p.duration,
    instructions: p.instructions,
  }));

  let rpcSucceeded = false;

  try {
    const { error } = await supabase.rpc('complete_consultation_encounter', {
      p_consultation_id: payload.consultationId,
      p_chief_complaint: payload.chiefComplaint,
      p_symptoms: payload.symptoms,
      p_clinical_examination: payload.clinicalExamination,
      p_doctor_notes: payload.doctorNotes,
      p_primary_diagnosis: payload.primaryDiagnosis,
      p_icd10_code: payload.icd10Code,
      p_diagnosis_severity: payload.diagnosisSeverity,
      p_prescriptions: rxJson,
      p_follow_up_date: payload.followUpDate || null,
    });
    if (error) throw error;
    rpcSucceeded = true;
  } catch {
    // Manual fallback writes
    await supabase
      .from('consultations')
      .update({
        chief_complaint: payload.chiefComplaint,
        symptoms: payload.symptoms,
        clinical_examination: payload.clinicalExamination,
        doctor_notes: payload.doctorNotes,
        follow_up_date: payload.followUpDate,
      })
      .eq('id', payload.consultationId);

    await supabase.from('diagnoses').insert({
      consultation_id: payload.consultationId,
      patient_id: payload.patientId,
      primary_diagnosis: payload.primaryDiagnosis,
      icd10_code: payload.icd10Code,
      severity: payload.diagnosisSeverity,
    });

    const { data: rx } = await supabase
      .from('prescriptions')
      .insert({
        consultation_id: payload.consultationId,
        patient_id: payload.patientId,
        doctor_id: payload.doctorId,
        signed_at: new Date().toISOString(),
      })
      .select('id')
      .maybeSingle();

    if (rx?.id && payload.prescriptions.length) {
      await supabase.from('prescription_items').insert(
        payload.prescriptions.map((item) => ({ prescription_id: rx.id, ...item })),
      );
    }

    if (payload.labTests?.length) {
      await supabase.from('lab_orders').insert({
        consultation_id: payload.consultationId,
        patient_id: payload.patientId,
        doctor_id: payload.doctorId,
        test_names: payload.labTests,
        status: 'ORDERED' as LabOrderStatus,
      });
    }

    const { data: consult } = await supabase
      .from('consultations')
      .select('appointment_id')
      .eq('id', payload.consultationId)
      .maybeSingle();

    if (consult?.appointment_id) {
      await supabase
        .from('opd_tokens')
        .update({ status: 'COMPLETED', completed_at: new Date().toISOString() })
        .eq('appointment_id', consult.appointment_id);
    }

    await persistEncounterSideEffects(payload, consult?.appointment_id ?? payload.appointmentId);
  }

  if (rpcSucceeded) {
    const { data: consult } = await supabase
      .from('consultations')
      .select('appointment_id')
      .eq('id', payload.consultationId)
      .maybeSingle();

    await persistEncounterSideEffects(payload, consult?.appointment_id ?? payload.appointmentId);
  }

  const rxText = payload.prescriptions
    .map((p) => `${p.medicine_name} ${p.dosage} — ${p.frequency} × ${p.duration}. ${p.instructions}`)
    .join('\n');

  try {
    await supabase.from('clinical_notes').insert({
      patient_id: payload.patientId,
      doctor_id: payload.doctorId,
      doctor_name: payload.doctorName,
      diagnosis_disease: payload.primaryDiagnosis,
      prescription: rxText,
      clinical_advice: payload.doctorNotes || payload.clinicalExamination,
    });
  } catch {
    /* ok */
  }
}

export async function searchPatients(query: string, tokenNumber?: string): Promise<PatientRegistryRow[]> {
  const q = query.trim();
  let rows: PatientRegistryRow[] = readLocal(STORAGE.patients, []);

  try {
    let dbQuery = supabase.from('patient_profiles').select('*').limit(50);
    if (q) {
      dbQuery = dbQuery.or(
        `full_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%,id.eq.${q}`,
      );
    }
    const { data } = await dbQuery;
    if (data?.length) {
      rows = data.map((r: Record<string, unknown>) => ({
        id: String(r.id),
        full_name: String(r.full_name || 'Patient'),
        email: (r.email as string) || undefined,
        phone: (r.phone as string) || undefined,
        dob: (r.dob as string) || undefined,
        gender: (r.gender as string) || undefined,
        blood_group: (r.blood_group as string) || undefined,
        allergies: (r.allergies as string) || undefined,
        chronic_conditions: (r.chronic_conditions as string) || undefined,
        emergency_contact_name: (r.emergency_contact_name as string) || undefined,
        emergency_contact_phone: (r.emergency_contact_phone as string) || undefined,
        age: calcAge(r.dob as string),
      }));
      writeLocal(STORAGE.patients, rows);
    }
  } catch {
    /* local */
  }

  if (tokenNumber) {
    try {
      const { data: tokens } = await supabase
        .from('opd_tokens')
        .select('patient_id')
        .eq('token_number', tokenNumber)
        .limit(1);
      if (tokens?.[0]?.patient_id) {
        const pid = String(tokens[0].patient_id);
        rows = rows.filter((p) => p.id === pid);
      }
    } catch {
      /* ok */
    }
  }

  if (!q) return rows;
  const lower = q.toLowerCase();
  return rows.filter(
    (p) =>
      p.full_name.toLowerCase().includes(lower) ||
      p.id.toLowerCase().includes(lower) ||
      (p.phone || '').includes(q),
  );
}

export async function getConsultationIdForAppointment(
  appointmentId: string,
): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('consultations')
      .select('id')
      .eq('appointment_id', appointmentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return data?.id ? String(data.id) : null;
  } catch {
    return null;
  }
}

export async function fetchPatientEncounters(patientId: string): Promise<{
  consultations: Record<string, unknown>[];
  notes: Record<string, unknown>[];
}> {
  try {
    const { data: consultations } = await supabase
      .from('consultations')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    const { data: notes } = await supabase
      .from('clinical_notes')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    return { consultations: consultations || [], notes: notes || [] };
  } catch {
    return { consultations: [], notes: [] };
  }
}

export async function fetchPatientLabOrders(patientId: string) {
  try {
    const { data } = await supabase
      .from('lab_orders')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    return data || [];
  } catch {
    return [];
  }
}

export async function fetchEmergencyAlerts(doctorUuid?: string): Promise<EmergencyAlert[]> {
  try {
    let q = supabase.from('emergency_alerts').select('*').order('created_at', { ascending: false }).limit(50);
    if (doctorUuid) q = q.or(`doctor_id.eq.${doctorUuid},doctor_id.is.null`);
    const { data } = await q;
    return (data || []) as EmergencyAlert[];
  } catch {
    return [];
  }
}

export async function acknowledgeEmergency(alertId: string) {
  try {
    await supabase.from('emergency_alerts').update({ status: 'ACKNOWLEDGED' }).eq('id', alertId);
  } catch {
    /* ok */
  }
}

export async function escalateEmergency(alertId: string) {
  try {
    await supabase.from('emergency_alerts').update({ status: 'ESCALATED' }).eq('id', alertId);
  } catch {
    /* ok */
  }
}

export { STORAGE as CC_STORAGE };
