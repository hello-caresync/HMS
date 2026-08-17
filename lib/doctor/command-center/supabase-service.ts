import { generatePostConsultationBill } from '@/lib/hospital/operations/consultation-billing-sync';
import { supabase } from '@/lib/supabase/client';
import type {
  CompleteEncounterPayload,
  DashboardKpis,
  DiagnosisSeverity,
  EmergencyAlert,
  EncounterPatientRow,
  LabOrderStatus,
  LiveQueueRow,
  PatientMedicalTimelineItem,
  OpdTokenStatus,
  PatientRegistryRow,
} from './types';

// ═══════════════════════════════════════════════════════════════════════════════
// Dashboard service — typed models, doctor resolution, KPI fetch, status updates
// ═══════════════════════════════════════════════════════════════════════════════

/** Canonical active clinician UUID in Supabase (`doctors.doctor_id`). */
export const DEFAULT_ACTIVE_DOCTOR_ID = '56284599-9a5f-4672-9b53-b90e18146a00';

/** Alias used by consultation finalize handlers. */
export const DEFAULT_DOCTOR_UUID = DEFAULT_ACTIVE_DOCTOR_ID;

export function isUuid(value: string | null | undefined): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value || '',
  );
}

export function sanitizeDoctorUuid(doctorId: string | null | undefined): string {
  return isUuid(doctorId) ? String(doctorId) : DEFAULT_ACTIVE_DOCTOR_ID;
}

export function sanitizePatientUuid(patientId: string | null | undefined): string | null {
  return isUuid(patientId) ? String(patientId) : null;
}

export function sanitizeAppointmentUuid(
  appointmentId: string | null | undefined,
): string | null {
  return isUuid(appointmentId) ? String(appointmentId) : null;
}

/** Default demo patient UUID for local/testing fallbacks. */
export const DEFAULT_PATIENT_ID = 'b0000000-0000-0000-0000-000000000002';

/** Fallback display name when doctor_name is required by prescriptions schema. */
export const DEFAULT_ACTIVE_DOCTOR_NAME = 'Dr. Chandrakanth S';

/** Statuses shown on the live OPD dashboard queue (excludes completed/cancelled). */
export const ACTIVE_APPOINTMENT_STATUSES = [
  'SCHEDULED',
  'WAITING',
  'CONFIRMED',
  'confirmed',
  'requested',
  'checked_in',
  'CHECKED_IN',
  'IN_CONSULTATION',
  'in_progress',
] as const;

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

  if (typeof error === 'string') {
    console.error(`[Supabase Error] ${context}:`, error);
    return;
  }

  if (typeof error === 'object' && error !== null) {
    const errObj = error as Record<string, unknown>;
    const message = errObj.message ?? errObj.details ?? errObj.hint ?? errObj.code;
    if (message) {
      console.error(`[Supabase Error] ${context}:`, message);
    }
    return;
  }

  console.error(`[Supabase Error] ${context}:`, String(error));
}

/** Extract a human-readable message from Supabase/JS errors for UI toasts. */
export function formatConsultationSaveError(err: unknown): string {
  if (!err) return 'Database constraint failure';
  if (typeof err === 'string') return err;
  if (err instanceof Error && err.message) return err.message;

  if (typeof err === 'object' && err !== null) {
    const e = err as Record<string, unknown>;
    const message = e.message ?? e.details ?? e.hint ?? e.code;
    if (message) return String(message);
  }

  return 'Database constraint failure';
}

function throwSaveError(context: string, error: unknown): never {
  logSupabaseError(context, error);
  throw new Error(formatConsultationSaveError(error));
}

function calcAgeFromDob(dob?: string | null): number | undefined {
  if (!dob) return undefined;
  const born = new Date(dob);
  if (Number.isNaN(born.getTime())) return undefined;
  return Math.floor((Date.now() - born.getTime()) / (365.25 * 24 * 3600 * 1000));
}

function isWaitingStatus(status: unknown): boolean {
  const s = String(status ?? '')
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
  return (
    s === 'SCHEDULED' ||
    s === 'WAITING' ||
    s === 'CONFIRMED' ||
    s === 'REQUESTED' ||
    s === 'CHECKED_IN'
  );
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
  const dob = (p?.date_of_birth ?? p?.dob) as string | undefined;

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
    patient_age: calcAgeFromDob(dob),
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
      query = query.eq('doctor_id', DEFAULT_ACTIVE_DOCTOR_ID);
    }
  }

  // limit(1) avoids PGRST116 when multiple doctor rows match the fallback OR filter
  const { data, error } = await query.limit(1);

  if (error) {
    logSupabaseError('Error resolving active doctor profile:', error);
  }

  if (data && data.length > 0) {
    return data[0];
  }

  const { data: fallbackDoctor, error: fallbackErr } = await client
    .from('doctors')
    .select('*')
    .eq('doctor_id', DEFAULT_ACTIVE_DOCTOR_ID)
    .limit(1);

  if (fallbackErr) {
    logSupabaseError('Error resolving default active doctor profile:', fallbackErr);
  }

  if (fallbackDoctor && fallbackDoctor.length > 0) {
    return fallbackDoctor[0];
  }

  return { doctor_id: DEFAULT_ACTIVE_DOCTOR_ID, full_name: 'Dr. CHANDRAKANTH S KESARI' };
}

/** Safe 2-step patient profile lookup — `patient_profiles.id` is the primary key. */
async function fetchPatientProfileMap(
  patientIds: string[],
): Promise<Record<string, Record<string, unknown>>> {
  const map: Record<string, Record<string, unknown>> = {};
  const uniqueIds = Array.from(new Set(patientIds.filter(Boolean)));
  if (uniqueIds.length === 0) return map;

  const { data: patients, error: patientErr } = await supabase
    .from('patient_profiles')
    .select('id, full_name, phone, gender, date_of_birth, dob, blood_group')
    .in('id', uniqueIds);

  if (patientErr) {
    logSupabaseError('Fetch Error (Patient Profiles):', patientErr);
    return map;
  }

  for (const p of (patients ?? []) as Record<string, unknown>[]) {
    if (p.id) map[String(p.id)] = p;
  }

  return map;
}

/**
 * Fetches dashboard KPIs, appointments, and live OPD tokens.
 * Uses a 2-step appointments fetch (no nested joins) so missing FK relationships
 * in the schema cache never block the dashboard. No appointment_date filter.
 */
export async function getDoctorDashboardData(doctorId?: string): Promise<DoctorDashboardMetrics> {
  const client = supabase;
  let targetDoctorId = doctorId;

  if (!targetDoctorId) {
    const doctor = await getActiveDoctorProfile();
    targetDoctorId = doctor?.doctor_id ? String(doctor.doctor_id) : DEFAULT_ACTIVE_DOCTOR_ID;
  }

  let apptRows: Record<string, unknown>[] = [];

  const { data: rawApptRows, error: apptError } = await client
    .from('appointments')
    .select(
      'appointment_id, patient_id, doctor_id, appointment_date, appointment_time, status, reason_for_visit, department, created_at',
    )
    .eq('doctor_id', targetDoctorId)
    .in('status', ['SCHEDULED', 'WAITING', 'CONFIRMED', 'PENDING', 'IN_CONSULTATION', 'in_progress', 'checked_in', 'CHECKED_IN'])
    .order('created_at', { ascending: false });

  if (apptError) {
    logSupabaseError('Fetch Error (Appointments) in getDoctorDashboardData:', apptError);
  } else {
    apptRows = (rawApptRows ?? []) as Record<string, unknown>[];
  }

  const patientIds = Array.from(
    new Set(apptRows.map((a) => String(a.patient_id ?? '')).filter(Boolean)),
  );

  const patientMap = await fetchPatientProfileMap(patientIds);

  const formattedAppointments = apptRows.map((appt) => ({
    ...appt,
    patient_profiles: patientMap[String(appt.patient_id ?? '')] ?? {
      full_name: 'Patient Record',
      phone: 'N/A',
    },
  }));

  let tokensQuery = client
    .from('opd_tokens')
    .select('*')
    .order('sequence_number', { ascending: true });

  if (targetDoctorId) {
    tokensQuery = tokensQuery.eq('doctor_id', targetDoctorId);
  }

  const { data: tokens, error: tokErr } = await tokensQuery;

  if (tokErr) logSupabaseError('Fetch Error (OPD Tokens) in getDoctorDashboardData:', tokErr);

  const appList = formattedAppointments.map((row) => mapFallbackAppointmentRow(row));

  const tokenPatientIds = Array.from(
    new Set(
      ((tokens ?? []) as Record<string, unknown>[])
        .map((t) => String(t.patient_id ?? ''))
        .filter(Boolean)
        .filter((id) => !patientMap[id]),
    ),
  );

  const tokenPatientMap = await fetchPatientProfileMap(tokenPatientIds);
  const mergedPatientMap = { ...patientMap, ...tokenPatientMap };

  const tokenList = ((tokens ?? []) as Record<string, unknown>[]).map((row) =>
    mapTokenRowToOpdToken({
      ...row,
      patient_profiles:
        mergedPatientMap[String(row.patient_id ?? '')] ??
        ({ full_name: 'Patient Record', phone: 'N/A' } as OPDToken['patient_profiles']),
    }),
  );

  let criticalAlerts = 0;
  try {
    if (targetDoctorId) {
      const { count, error: alertErr } = await client
        .from('emergency_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', targetDoctorId)
        .eq('status', 'ACTIVE')
        .eq('severity', 'CRITICAL');

      if (!alertErr) {
        criticalAlerts = count ?? 0;
      }
    }
  } catch {
    criticalAlerts = 0;
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
  const payload = { status, updated_at: new Date().toISOString() };

  const byAppointmentId = await client
    .from('appointments')
    .update(payload)
    .eq('appointment_id', appointmentId)
    .select()
    .maybeSingle();

  if (!byAppointmentId.error) return byAppointmentId.data;

  const byId = await client
    .from('appointments')
    .update(payload)
    .eq('id', appointmentId)
    .select()
    .maybeSingle();

  if (byId.error) {
    logSupabaseError(`Failed to update appointment ${appointmentId} status to ${status}:`, byId.error);
    throw byId.error;
  }

  return byId.data;
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
  appointmentId?: string | null;
  doctorId: string;
  patientId: string;
  patientName?: string;
  doctorName?: string;
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
      doctor_id: sanitizeDoctorUuid(String(viewRow.doctor_id ?? '')),
      patient_id: sanitizePatientUuid(String(viewRow.patient_id ?? '')) ?? DEFAULT_PATIENT_ID,
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

  let appt: Record<string, unknown> | null = null;
  let apptErr: { message?: string } | null = null;

  const byAppointmentId = await client
    .from('appointments')
    .select('*')
    .eq('appointment_id', appointmentId)
    .maybeSingle();

  if (!byAppointmentId.error && byAppointmentId.data) {
    appt = byAppointmentId.data as Record<string, unknown>;
  } else {
    const byId = await client.from('appointments').select('*').eq('id', appointmentId).maybeSingle();
    apptErr = byAppointmentId.error ?? byId.error;
    if (!byId.error && byId.data) {
      appt = byId.data as Record<string, unknown>;
    }
  }

  if (!appt) {
    const { data: patientAppt, error: patientApptErr } = await client
      .from('patient_appointments')
      .select('*')
      .eq('id', appointmentId)
      .maybeSingle();

    if (!patientApptErr && patientAppt) {
      const row = patientAppt as Record<string, unknown>;
      const patientMap = await fetchPatientProfileMap([String(row.patient_id ?? '')]);
      const p = patientMap[String(row.patient_id ?? '')];

      return {
        appointment_id: String(row.id ?? appointmentId),
        doctor_id: sanitizeDoctorUuid(String(row.doctor_id ?? '')),
        patient_id: sanitizePatientUuid(String(row.patient_id ?? '')) ?? DEFAULT_PATIENT_ID,
        patient_name: String(row.patient_name ?? p?.full_name ?? 'Patient'),
        patient_gender: p?.gender ? String(p.gender) : undefined,
        patient_age: calcAgeFromDob((p?.date_of_birth ?? p?.dob) as string | undefined),
        blood_group: p?.blood_group ? String(p.blood_group) : undefined,
        reason: row.reason
          ? String(row.reason)
          : row.chief_complaint
            ? String(row.chief_complaint)
            : undefined,
      };
    }

    logSupabaseError('fetchConsultationAppointmentContext failed:', apptErr ?? patientApptErr);
    return null;
  }

  const patientMap = await fetchPatientProfileMap([String(appt.patient_id ?? '')]);
  const p = patientMap[String(appt.patient_id ?? '')];

  return {
    appointment_id: String(appt.appointment_id ?? appt.id ?? appointmentId),
    doctor_id: sanitizeDoctorUuid(String(appt.doctor_id ?? '')),
    patient_id: sanitizePatientUuid(String(appt.patient_id ?? '')) ?? DEFAULT_PATIENT_ID,
    patient_name: p?.full_name ? String(p.full_name) : undefined,
    patient_gender: p?.gender ? String(p.gender) : undefined,
    patient_age: calcAgeFromDob((p?.date_of_birth ?? p?.dob) as string | undefined),
    blood_group: p?.blood_group ? String(p.blood_group) : undefined,
    reason: appt.reason_for_visit
      ? String(appt.reason_for_visit)
      : appt.reason
        ? String(appt.reason)
        : undefined,
  };
}

/**
 * Saves consultation + vitals + prescription for a patient (appointment optional).
 * Triggers Supabase Realtime so the patient app updates instantly.
 */
export async function savePatientClinicalEncounter(
  input: Omit<ConsultationFinalizeInput, 'appointmentId'> & { appointmentId?: string | null },
): Promise<ConsultationFinalizeResult> {
  const client = supabase;
  const doctorId = sanitizeDoctorUuid(input.doctorId);
  const patientId = sanitizePatientUuid(input.patientId) ?? DEFAULT_PATIENT_ID;
  const meds = input.medications.filter((m) => m.name.trim() !== '');
  const appointmentId = sanitizeAppointmentUuid(input.appointmentId ?? null);

  const diagnosis = input.clinical.diagnosis?.trim() || '';
  const chiefComplaint = input.clinical.chief_complaint?.trim() || '';
  const diagnosisNotes =
    input.clinical.clinical_notes?.trim() ||
    input.clinical.clinical_findings?.trim() ||
    '';
  const symptoms =
    chiefComplaint ||
    input.clinical.clinical_findings?.trim() ||
    '';
  const notes =
    [input.clinical.clinical_findings, input.clinical.clinical_notes]
      .filter(Boolean)
      .join('\n\n')
      .trim() ||
    input.clinical.clinical_notes?.trim() ||
    '';

  const consultationPayload = {
    appointment_id: appointmentId,
    doctor_id: doctorId || DEFAULT_ACTIVE_DOCTOR_ID,
    patient_id: patientId || DEFAULT_PATIENT_ID,
    chief_complaint: chiefComplaint || 'General consultation',
    clinical_notes: notes || '',
    notes: notes || '',
    diagnosis: diagnosis || '',
    diagnosis_notes: diagnosisNotes || '',
    symptoms: symptoms || '',
    follow_up_date: input.clinical.follow_up_date || null,
    status: 'COMPLETED',
  };

  // Step 1: consultations
  const { data: consultation, error: consultError } = await client
    .from('consultations')
    .insert([consultationPayload])
    .select('*')
    .single();

  if (consultError) {
    throw new Error(consultError.message || consultError.details || 'Consultation insert failed');
  }

  const recordId = consultation?.id ?? consultation?.consultation_id;
  if (!recordId) {
    throw new Error('Consultation insert returned no id');
  }

  const createdConsultationId = String(recordId);

  // Step 2: vitals (linked to consultation) — non-blocking, multi-column aliases
  const temp = input.vitals.temperature_f;
  const bpSys = input.vitals.bp_systolic;
  const bpDia = input.vitals.bp_diastolic;
  const pulse = input.vitals.pulse_bpm;
  const spo2 = input.vitals.spo2_percent;

  const weight = input.vitals.weight_kg;
  const tempValue = temp != null && temp !== '' ? parseFloat(String(temp)) : null;
  const bpSysValue = bpSys != null && bpSys !== '' ? parseInt(String(bpSys), 10) : null;
  const bpDiaValue = bpDia != null && bpDia !== '' ? parseInt(String(bpDia), 10) : null;
  const pulseValue = pulse != null && pulse !== '' ? parseInt(String(pulse), 10) : null;
  const spo2Value = spo2 != null && spo2 !== '' ? parseInt(String(spo2), 10) : null;
  const weightValue = weight != null && weight !== '' ? parseFloat(String(weight)) : null;

  const vitalsPayload = {
    consultation_id: createdConsultationId,
    patient_id: patientId || null,
    temp: tempValue,
    temperature: tempValue,
    bp_sys: bpSysValue,
    bp_systolic: bpSysValue,
    bp_dia: bpDiaValue,
    bp_diastolic: bpDiaValue,
    pulse: pulseValue,
    pulse_bpm: pulseValue,
    spo2: spo2Value,
    spo2_percent: spo2Value,
    spo2_percentage: spo2Value,
    weight: weightValue,
  };

  try {
    const { error: vitalsError } = await client.from('vitals').insert([vitalsPayload]);
    if (vitalsError) {
      console.warn('[Consultation Save] vitals insert skipped:', vitalsError.message || vitalsError);
    }
  } catch (vitalsErr) {
    console.warn('[Consultation Save] vitals insert failed (non-blocking):', vitalsErr);
  }

  // Step 3: prescriptions
  const medicineList = meds.length > 0 ? meds : [];
  const instructionsInput =
    input.special_instructions?.trim() ||
    input.clinical.clinical_notes?.trim() ||
    '';

  const patientName = input.patientName?.trim();
  const activeDoctorName = input.doctorName?.trim();
  const activeDoctorId = doctorId;

  const prescriptionPayload = {
    consultation_id: createdConsultationId || null,
    appointment_id: appointmentId || createdConsultationId || null,
    patient_id: patientId || null,
    patient_name: patientName || 'Patient',
    doctor_id: activeDoctorId || DEFAULT_ACTIVE_DOCTOR_ID,
    doctor_name: activeDoctorName || 'Dr. Chandrakanth S Kesari',
    medications: medicineList || [],
    medicines: medicineList || [],
    special_instructions: instructionsInput || '',
    instructions: instructionsInput || '',
  };

  const { data: prescription, error: rxError } = await client
    .from('prescriptions')
    .insert([prescriptionPayload])
    .select('*')
    .single();

  if (rxError) {
    throw new Error(rxError.message || rxError.details || 'Prescription insert failed');
  }

  if (appointmentId) {
    await updateAppointmentStatus(appointmentId, 'COMPLETED');
  }

  return {
    consultation_id: createdConsultationId,
    prescription_id:
      prescription?.id != null
        ? String(prescription.id)
        : prescription?.prescription_id != null
          ? String(prescription.prescription_id)
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
  return savePatientClinicalEncounter(input);
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
    apptStatus === 'WAITING' ||
    apptStatus === 'SCHEDULED' ||
    apptStatus === 'CHECKED_IN' ||
    apptStatus === 'CONFIRMED'
      ? 'ISSUED'
      : normalizeStatus(apptStatus);

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
      .select('*')
      .eq('doctor_id', doctorUuid)
      .in('status', ['SCHEDULED', 'WAITING', 'requested', 'confirmed', 'checked_in', 'CHECKED_IN', 'in_progress']);

    if (error || !appointments?.length) return [];

    const patientMap = await fetchPatientProfileMap(
      appointments.map((a: Record<string, unknown>) => String(a.patient_id ?? '')),
    );

    return appointments.map((a: Record<string, unknown>, i: number) =>
      normalizeAppointmentFallbackRow(
        {
          ...a,
          patient_profiles: patientMap[String(a.patient_id ?? '')],
        },
        doctorUuid,
        i,
      ),
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

  try {
    const apptId = payload.appointmentId ?? null;
    let patientName = 'Patient';
    let patientUhid: string | undefined;
    let consultationFee: number | undefined;

    const { data: profile } = await supabase
      .from('patient_profiles')
      .select('full_name, uhid, mrn')
      .eq('id', payload.patientId)
      .maybeSingle();
    if (profile) {
      patientName = String(profile.full_name ?? patientName);
      patientUhid = profile.uhid
        ? String(profile.uhid)
        : profile.mrn
          ? String(profile.mrn)
          : undefined;
    }

    if (apptId) {
      const byId = await supabase
        .from('appointments')
        .select('fee, patient_name, uhid')
        .eq('id', apptId)
        .maybeSingle();
      const appt = byId.data
        ?? (
          await supabase
            .from('appointments')
            .select('fee, patient_name, uhid')
            .eq('appointment_id', apptId)
            .maybeSingle()
        ).data;

      if (appt) {
        consultationFee = appt.fee != null ? Number(appt.fee) : undefined;
        patientName = String(appt.patient_name ?? patientName);
        patientUhid = patientUhid ?? (appt.uhid ? String(appt.uhid) : undefined);
      }
    }

    await generatePostConsultationBill(supabase, {
      appointmentId: apptId ?? payload.consultationId,
      patientId: payload.patientId,
      patientName,
      patientUhid,
      doctorId: payload.doctorId,
      doctorName: payload.doctorName,
      consultationFee,
      prescriptions: payload.prescriptions,
      labTests: payload.labTests,
    });
  } catch {
    /* billing bridge optional */
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

const ENCOUNTER_PATIENT_SELECT =
  'id, patient_id, patient_name, age, gender, created_at, status, queue_status';

function mapEncounterPatientRow(row: Record<string, unknown>): EncounterPatientRow {
  const rawAge = row.age;
  return {
    id: String(row.id ?? row.appointment_id ?? ''),
    patient_id: String(row.patient_id ?? ''),
    patient_name: String(row.patient_name ?? 'Patient'),
    age:
      rawAge != null && rawAge !== '' && !Number.isNaN(Number(rawAge))
        ? Number(rawAge)
        : undefined,
    gender: row.gender ? String(row.gender) : undefined,
    created_at: row.created_at ? String(row.created_at) : undefined,
    last_status: String(row.status ?? row.queue_status ?? ''),
  };
}

function dedupeEncounterPatients(rows: EncounterPatientRow[]): EncounterPatientRow[] {
  const byKey = new Map<string, EncounterPatientRow>();

  for (const row of rows) {
    const key = (row.patient_id || row.patient_name).toLowerCase();
    const existing = byKey.get(key);
    if (!existing || String(row.created_at ?? '') > String(existing.created_at ?? '')) {
      byKey.set(key, row);
    }
  }

  return Array.from(byKey.values()).sort((a, b) =>
    String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')),
  );
}

/** Load consultations, prescriptions, and vitals for a patient or appointment key. */
export async function fetchPatientMedicalTimeline(
  patientKey: string,
): Promise<PatientMedicalTimelineItem[]> {
  if (!patientKey) return [];

  try {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      patientKey,
    );

    let consultQuery = supabase
      .from('consultations')
      .select('*')
      .order('created_at', { ascending: false });

    if (isUUID) {
      consultQuery = consultQuery.or(
        `patient_id.eq.${patientKey},appointment_id.eq.${patientKey}`,
      );
    } else {
      consultQuery = consultQuery.ilike('patient_name', `%${patientKey}%`);
    }

    let prescQuery = supabase
      .from('prescriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (isUUID) {
      prescQuery = prescQuery.or(`patient_id.eq.${patientKey},appointment_id.eq.${patientKey}`);
    } else {
      prescQuery = prescQuery.ilike('patient_name', `%${patientKey}%`);
    }

    let vitalsQuery = supabase.from('vitals').select('*').order('created_at', { ascending: false });

    if (isUUID) {
      vitalsQuery = vitalsQuery.or(
        `patient_id.eq.${patientKey},consultation_id.eq.${patientKey}`,
      );
    }

    const [consultRes, prescRes, vitalsRes] = await Promise.all([
      consultQuery,
      prescQuery,
      vitalsQuery,
    ]);

    const consultations = (consultRes.data ?? []) as Record<string, unknown>[];
    const prescriptions = (prescRes.data ?? []) as Record<string, unknown>[];
    const vitals = (vitalsRes.data ?? []) as Record<string, unknown>[];

    const timeline: PatientMedicalTimelineItem[] = [
      ...consultations.map((c) => ({
        id: String(c.id ?? ''),
        type: 'CONSULTATION',
        title: String(c.chief_complaint || 'Clinical Encounter'),
        diagnosis: String(c.diagnosis || 'Clinical evaluation completed'),
        notes: String(c.clinical_notes || c.notes || ''),
        doctor_name: String(c.doctor_name || 'Dr. Chandrakanth S. Kesari'),
        date: c.created_at ? String(c.created_at) : undefined,
        raw: c,
      })),
      ...prescriptions.map((p) => ({
        id: String(p.id ?? p.prescription_id ?? ''),
        type: 'PRESCRIPTION',
        title: 'Prescription Dispatched',
        medications: (p.medications || p.medicines || []) as unknown[],
        instructions: String(p.special_instructions || p.instructions || ''),
        doctor_name: String(p.doctor_name || 'Dr. Chandrakanth S. Kesari'),
        date: p.created_at ? String(p.created_at) : undefined,
        raw: p,
      })),
      ...vitals.map((v) => ({
        id: String(v.id ?? ''),
        type: 'VITALS',
        title: 'Recorded Vitals',
        vitalsSummary: `BP: ${v.bp_sys || v.bp_systolic || 120}/${v.bp_dia || v.bp_diastolic || 80} • HR: ${v.pulse || v.pulse_bpm || 72} bpm • SpO2: ${v.spo2 || v.spo2_percent || 98}%`,
        date: v.created_at ? String(v.created_at) : undefined,
        raw: v,
      })),
    ].sort(
      (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
    );

    return timeline;
  } catch (err) {
    console.error('Error in fetchPatientMedicalTimeline:', err);
    return [];
  }
}

/** Search distinct patients from appointments, patient_appointments, and consultations. */
export async function searchEncounterPatients(query: string): Promise<EncounterPatientRow[]> {
  const q = query.trim();

  try {
    if (q.length < 2) {
      const [appointmentsRes, patientApptRes] = await Promise.all([
        supabase
          .from('appointments')
          .select(ENCOUNTER_PATIENT_SELECT)
          .in('status', ['COMPLETED', 'completed'])
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('patient_appointments')
          .select(ENCOUNTER_PATIENT_SELECT)
          .in('queue_status', ['COMPLETED'])
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      const rows = [
        ...((appointmentsRes.data ?? []) as Record<string, unknown>[]),
        ...((patientApptRes.data ?? []) as Record<string, unknown>[]),
      ].map(mapEncounterPatientRow);

      return dedupeEncounterPatients(rows).slice(0, 10);
    }

    const pattern = `%${q}%`;
    const results: EncounterPatientRow[] = [];

    const [appointmentsRes, patientApptRes, consultationsRes] = await Promise.all([
      supabase
        .from('appointments')
        .select(ENCOUNTER_PATIENT_SELECT)
        .ilike('patient_name', pattern)
        .order('created_at', { ascending: false }),
      supabase
        .from('patient_appointments')
        .select(ENCOUNTER_PATIENT_SELECT)
        .ilike('patient_name', pattern)
        .order('created_at', { ascending: false }),
      supabase
        .from('consultations')
        .select('id, patient_id, patient_name, created_at')
        .ilike('patient_name', pattern)
        .order('created_at', { ascending: false }),
    ]);

    for (const row of (appointmentsRes.data ?? []) as Record<string, unknown>[]) {
      results.push(mapEncounterPatientRow(row));
    }
    for (const row of (patientApptRes.data ?? []) as Record<string, unknown>[]) {
      results.push(mapEncounterPatientRow(row));
    }

    if (!consultationsRes.error) {
      for (const row of (consultationsRes.data ?? []) as Record<string, unknown>[]) {
        results.push({
          id: String(row.id ?? ''),
          patient_id: String(row.patient_id ?? ''),
          patient_name: String(row.patient_name ?? 'Patient'),
          created_at: row.created_at ? String(row.created_at) : undefined,
          last_status: 'CONSULTATION',
        });
      }
    }

    if (results.length === 0) {
      const { data: profiles } = await supabase
        .from('patient_profiles')
        .select('id, full_name, gender, dob, date_of_birth')
        .ilike('full_name', pattern)
        .limit(20);

      for (const profile of (profiles ?? []) as Record<string, unknown>[]) {
        results.push({
          id: String(profile.id ?? ''),
          patient_id: String(profile.id ?? ''),
          patient_name: String(profile.full_name ?? 'Patient'),
          gender: profile.gender ? String(profile.gender) : undefined,
          age: calcAgeFromDob(String(profile.date_of_birth ?? profile.dob ?? '')),
        });
      }

      const patientIds = ((profiles ?? []) as Record<string, unknown>[])
        .map((profile) => String(profile.id ?? ''))
        .filter(Boolean);

      if (patientIds.length > 0) {
        const { data: linkedConsultations } = await supabase
          .from('consultations')
          .select('id, patient_id, created_at, chief_complaint, status')
          .in('patient_id', patientIds)
          .order('created_at', { ascending: false });

        for (const row of (linkedConsultations ?? []) as Record<string, unknown>[]) {
          const profile = ((profiles ?? []) as Record<string, unknown>[]).find(
            (entry) => String(entry.id) === String(row.patient_id),
          );

          results.push({
            id: String(row.id ?? ''),
            patient_id: String(row.patient_id ?? ''),
            patient_name: String(profile?.full_name ?? 'Patient'),
            created_at: row.created_at ? String(row.created_at) : undefined,
            last_status: String(row.status ?? 'CONSULTATION'),
          });
        }
      }
    }

    return dedupeEncounterPatients(results);
  } catch (err) {
    console.error('[searchEncounterPatients]:', err);
    return [];
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
