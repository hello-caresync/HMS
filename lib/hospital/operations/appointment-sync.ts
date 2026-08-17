import type { SupabaseClient } from '@supabase/supabase-js';

import { ensureDoctorUuid } from '@/lib/doctor/command-center/doctor-context';
import { DEFAULT_ACTIVE_DOCTOR_ID } from '@/lib/doctor/command-center/supabase-service';
import {
  REGAL_FACILITY_CODE,
  REGAL_HOSPITAL_ID,
} from '@/lib/regal/constants';

import type { AppointmentLifecycleStatus } from './types';

export { REGAL_HOSPITAL_ID, REGAL_FACILITY_CODE };

export type WalkInRegistrationInput = {
  patient_name: string;
  doctor_id: string;
  doctor_name: string;
  department: string;
  chief_complaint: string;
  fee?: number;
  age?: string;
  gender?: string;
  token_number?: string;
  uhid?: string;
};

export type PatientOnlineBookingInput = {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_uhid?: string;
  doctor_id: string;
  doctor_name: string;
  department: string;
  appointment_date: string;
  appointment_time: string;
  slot_time?: string;
  fee?: string | number;
  reason?: string;
  token_number: number | string;
};

function formatTokenLabel(token: number | string): string {
  if (typeof token === 'string' && /^T-\d+$/i.test(token.trim())) {
    return token.trim().toUpperCase();
  }
  const numeric = typeof token === 'number' ? token : Number(String(token).replace(/\D/g, ''));
  const seq = Number.isFinite(numeric) && numeric > 0 ? numeric : 1;
  return `T-${String(seq).padStart(2, '0')}`;
}

function parseFeeAmount(fee?: string | number): number {
  if (typeof fee === 'number' && Number.isFinite(fee)) return fee;
  const parsed = Number(String(fee ?? '').replace(/[^\d.]/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 800;
}

function dedupeAppointmentRows(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  const seen = new Set<string>();
  const merged: Record<string, unknown>[] = [];

  for (const row of rows) {
    const key = String(row.appointment_id ?? row.id ?? '');
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(row);
  }

  return merged;
}

/** Map legacy patient_appointments rows into hospital OPD shape. */
export function normalizePatientAppointmentToHospital(
  row: Record<string, unknown>,
): Record<string, unknown> {
  const tokenNumber = row.token_number ?? row.token;
  return normalizeHospitalAppointmentRow({
    id: row.id,
    appointment_id: row.id,
    hospital_id: REGAL_HOSPITAL_ID,
    facility_code: REGAL_FACILITY_CODE,
    hospital_code: REGAL_FACILITY_CODE,
    patient_id: row.patient_id,
    patient_name: row.patient_name,
    patient_uhid: row.patient_uhid ?? row.uhid,
    doctor_code: row.doctor_id,
    doctor_employee_id: row.doctor_id,
    doctor_id: row.doctor_id,
    doctor_name: row.doctor_name,
    department: row.department,
    appointment_date: row.appointment_date,
    appointment_time: row.appointment_time ?? row.slot_time,
    slot_time: row.slot_time ?? row.appointment_time,
    appointment_type: row.appointment_type ?? 'OPD Consultation',
    token_number: tokenNumber != null ? formatTokenLabel(tokenNumber as string | number) : 'T-01',
    queue_number: row.queue_number ?? row.token_number,
    status: row.queue_status ?? row.status ?? 'confirmed',
    chief_complaint: row.reason ?? row.chief_complaint,
    reason_for_visit: row.reason ?? row.chief_complaint,
    fee: parseFeeAmount(row.fee as string | number | undefined),
    source: 'PATIENT_APP',
    created_at: row.created_at,
    updated_at: row.updated_at ?? row.created_at,
  });
}

/** Count next OPD token for a clinician on a given date (appointments + patient_appointments). */
export async function calculateNextOpdTokenNumber(
  supabase: SupabaseClient,
  doctorEmployeeId: string,
  doctorName: string,
  appointmentDate: string,
): Promise<number> {
  const doctorKey = doctorName.replace(/^Dr\.?\s*/i, '').split(/\s+/)[0] ?? doctorName;
  let highest = 0;

  const appointmentQueries = await Promise.all([
    supabase
      .from('appointments')
      .select('token_number, queue_number')
      .eq('appointment_date', appointmentDate)
      .or(`doctor_code.eq.${doctorEmployeeId},doctor_employee_id.eq.${doctorEmployeeId},doctor_name.ilike.%${doctorKey}%`),
    supabase
      .from('patient_appointments')
      .select('token_number')
      .eq('appointment_date', appointmentDate)
      .ilike('doctor_name', `%${doctorKey}%`),
  ]);

  for (const result of appointmentQueries) {
    for (const row of result.data ?? []) {
      const record = row as Record<string, unknown>;
      const tokenRaw = record.token_number ?? record.queue_number;
      if (tokenRaw == null) continue;
      const match = String(tokenRaw).match(/(\d+)/);
      if (match) highest = Math.max(highest, Number(match[1]));
    }
  }

  return highest + 1;
}

export type AppointmentSyncResult = {
  ok: boolean;
  error?: string;
  appointmentId?: string;
  patientId?: string;
  doctorUuid?: string;
  row?: Record<string, unknown>;
};

const DOCTOR_STATUS: Record<AppointmentLifecycleStatus, string> = {
  booked: 'booked',
  checked_in: 'checked_in',
  in_consultation: 'in_progress',
  completed: 'completed',
};

const TOKEN_STATUS: Record<AppointmentLifecycleStatus, string> = {
  booked: 'ISSUED',
  checked_in: 'ISSUED',
  in_consultation: 'IN_CONSULTATION',
  completed: 'COMPLETED',
};

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function clockNow(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function newUhid(): string {
  return `RH-2026-${String(Math.floor(100000 + Math.random() * 900000))}`;
}

function parseTokenSequence(token: string): number {
  const match = token.match(/^T-(\d+)$/i);
  return match ? Number(match[1]) : 1;
}

export function nextWalkInToken(existing: { token_number?: unknown }[]): string {
  const highest = existing.reduce((max, row) => {
    const match = String(row.token_number ?? '').match(/^T-(\d+)$/i);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `T-${String(highest + 1).padStart(2, '0')}`;
}

/** Map DB status values to hospital OPD lifecycle labels. */
export function hospitalStatusFromDb(raw: unknown): AppointmentLifecycleStatus {
  const s = String(raw ?? 'booked').toLowerCase().replace(/[\s-]+/g, '_');
  if (s.includes('complete')) return 'completed';
  if (s === 'in_progress' || s.includes('consult')) return 'in_consultation';
  if (s.includes('check') || s === 'confirmed' || s === 'waiting' || s === 'scheduled') {
    return 'checked_in';
  }
  if (s === 'booked') return 'booked';
  return 'booked';
}

/** Normalize a Supabase appointments row for the hospital OPD UI. */
export function normalizeHospitalAppointmentRow(row: Record<string, unknown>): Record<string, unknown> {
  const id = row.id ?? row.appointment_id;
  const employeeCode = row.doctor_code ?? row.doctor_employee_id;

  return {
    ...row,
    id: String(id ?? ''),
    appointment_id: String(row.appointment_id ?? id ?? ''),
    token_number: row.token_number ?? row.token,
    doctor_id: employeeCode ? String(employeeCode) : String(row.doctor_id ?? ''),
    doctor_uuid: row.doctor_id,
    status: hospitalStatusFromDb(row.status),
    chief_complaint: row.chief_complaint ?? row.reason_for_visit ?? row.reason,
  };
}

export async function resolveDoctorUuidForHospital(
  employeeId: string,
  doctorName: string,
  department: string,
): Promise<string> {
  if (employeeId === 'RH-D02') {
    try {
      const uuid = await ensureDoctorUuid(employeeId, doctorName, department);
      return uuid || DEFAULT_ACTIVE_DOCTOR_ID;
    } catch {
      return DEFAULT_ACTIVE_DOCTOR_ID;
    }
  }

  try {
    return await ensureDoctorUuid(employeeId, doctorName, department);
  } catch {
    return DEFAULT_ACTIVE_DOCTOR_ID;
  }
}

async function upsertPatientRecords(
  supabase: SupabaseClient,
  input: {
    patientId: string;
    uhid: string;
    name: string;
    gender?: string;
    department?: string;
    chief_complaint?: string;
    doctor_id?: string;
    doctor_name?: string;
  },
): Promise<void> {
  const now = new Date().toISOString();

  await supabase.from('patient_profiles').upsert(
    {
      id: input.patientId,
      full_name: input.name,
      gender: input.gender || 'Female',
    },
    { onConflict: 'id' },
  );

  const patientPayload: Record<string, unknown> = {
    id: input.patientId,
    uhid: input.uhid,
    full_name: input.name,
    department: input.department,
    status: 'Active',
    updated_at: now,
  };

  const { error } = await supabase.from('patients').upsert(patientPayload, { onConflict: 'id' });
  if (error) {
    await supabase.from('patients').insert(patientPayload);
  }

  const extendedPayload = {
    ...patientPayload,
    name: input.name,
    chief_complaint: input.chief_complaint,
    doctor_id: input.doctor_id,
    doctor_name: input.doctor_name,
    ehr_status: 'Active',
    admission_status: 'OPD',
    last_visit: todayStr(),
    created_at: now,
  };

  await supabase.from('patients').upsert(extendedPayload, { onConflict: 'id' });
}

async function insertAppointmentRow(
  supabase: SupabaseClient,
  payload: Record<string, unknown>,
): Promise<{ data: Record<string, unknown> | null; error: string | null }> {
  const { data, error } = await supabase.from('appointments').insert(payload).select('*').single();
  if (!error && data) return { data: data as Record<string, unknown>, error: null };

  const minimal: Record<string, unknown> = {
    appointment_id: payload.appointment_id,
    patient_id: payload.patient_id,
    doctor_id: payload.doctor_id,
    department: payload.department,
    reason_for_visit: payload.reason_for_visit,
    appointment_date: payload.appointment_date,
    appointment_time: payload.appointment_time,
    status: payload.status,
  };

  const retry = await supabase.from('appointments').insert(minimal).select('*').single();
  if (!retry.error && retry.data) {
    const merged = { ...retry.data, ...payload };
    await supabase
      .from('appointments')
      .update({
        hospital_id: payload.hospital_id,
        facility_code: payload.facility_code,
        hospital_code: payload.hospital_code,
        token_number: payload.token_number,
        uhid: payload.uhid,
        patient_uhid: payload.patient_uhid,
        patient_name: payload.patient_name,
        doctor_name: payload.doctor_name,
        doctor_code: payload.doctor_code,
        appointment_time: payload.appointment_time,
        slot_time: payload.slot_time,
        chief_complaint: payload.chief_complaint,
        reason_for_visit: payload.reason_for_visit,
        fee: payload.fee,
        updated_at: payload.updated_at,
      })
      .eq('appointment_id', payload.appointment_id);

    return { data: merged as Record<string, unknown>, error: null };
  }

  const legacy: Record<string, unknown> = {
    id: payload.id,
    patient_name: payload.patient_name,
    token: payload.token_number,
    department: payload.department,
    provider: payload.doctor_name,
    scheduled_time: payload.appointment_time,
    status: 'Checked In',
  };

  const legacyRetry = await supabase.from('appointments').insert(legacy).select('*').single();
  if (!legacyRetry.error && legacyRetry.data) {
    return { data: legacyRetry.data as Record<string, unknown>, error: null };
  }

  return {
    data: null,
    error: error?.message ?? retry.error?.message ?? legacyRetry.error?.message ?? 'Insert failed',
  };
}

async function ensureOpdToken(
  supabase: SupabaseClient,
  input: {
    appointmentId: string;
    doctorUuid: string;
    patientId: string;
    tokenNumber: string;
    status?: string;
  },
): Promise<void> {
  const seq = parseTokenSequence(input.tokenNumber);
  const payload = {
    appointment_id: input.appointmentId,
    doctor_id: input.doctorUuid,
    patient_id: input.patientId,
    token_number: input.tokenNumber,
    sequence_number: seq,
    status: input.status ?? 'ISSUED',
    estimated_wait_minutes: Math.max(5, (seq - 1) * 12),
  };

  const existing = await supabase
    .from('opd_tokens')
    .select('id')
    .eq('appointment_id', input.appointmentId)
    .maybeSingle();

  if (existing.data?.id) {
    await supabase.from('opd_tokens').update(payload).eq('id', existing.data.id);
    return;
  }

  await supabase.from('opd_tokens').insert(payload);
}

async function syncLegacyOpdQueue(
  supabase: SupabaseClient,
  input: {
    token_number: string;
    patient_id: string;
    patient_name: string;
    doctor_id: string;
    doctor_name: string;
    department: string;
    age?: string;
    gender?: string;
    status: string;
  },
): Promise<void> {
  try {
    await supabase.from('opd_queue').insert({
      token_number: input.token_number,
      patient_id: input.patient_id,
      patient_name: input.patient_name,
      doctor_id: input.doctor_id,
      doctor_name: input.doctor_name,
      age: Number(input.age || 24),
      gender: input.gender || 'Female',
      status: input.status,
      appointment_date: todayStr(),
      department: input.department,
    });
  } catch {
    /* legacy table optional */
  }
}

/** Persist walk-in check-in to appointments + patient_profiles + opd_tokens. */
export async function registerWalkInAppointment(
  supabase: SupabaseClient,
  input: WalkInRegistrationInput,
  existingAppointments: { token_number?: unknown }[] = [],
): Promise<AppointmentSyncResult> {
  const appointmentId = crypto.randomUUID();
  const patientId = crypto.randomUUID();
  const uhid = input.uhid || newUhid();
  const tokenNumber = input.token_number || nextWalkInToken(existingAppointments);
  const now = new Date().toISOString();
  const today = todayStr();

  const doctorUuid = await resolveDoctorUuidForHospital(
    input.doctor_id,
    input.doctor_name,
    input.department,
  );

  await upsertPatientRecords(supabase, {
    patientId,
    uhid,
    name: input.patient_name.trim(),
    gender: input.gender,
    department: input.department,
    chief_complaint: input.chief_complaint,
    doctor_id: input.doctor_id,
    doctor_name: input.doctor_name,
  });

  const payload: Record<string, unknown> = {
    id: appointmentId,
    appointment_id: appointmentId,
    hospital_id: REGAL_HOSPITAL_ID,
    facility_code: REGAL_FACILITY_CODE,
    hospital_code: REGAL_FACILITY_CODE,
    token_number: tokenNumber,
    uhid,
    patient_uhid: uhid,
    patient_id: patientId,
    patient_name: input.patient_name.trim(),
    age: input.age || '24',
    gender: input.gender || 'Female',
    doctor_id: doctorUuid,
    doctor_code: input.doctor_id,
    doctor_employee_id: input.doctor_id,
    doctor_name: input.doctor_name,
    department: input.department,
    appointment_date: today,
    appointment_time: clockNow(),
    status: 'checked_in',
    chief_complaint: input.chief_complaint.trim() || 'General Consultation',
    reason_for_visit: input.chief_complaint.trim() || 'General Consultation',
    fee: input.fee ?? 800,
    source: 'WALK_IN',
    updated_at: now,
    created_at: now,
  };

  const { data, error } = await insertAppointmentRow(supabase, payload);
  if (error) {
    return { ok: false, error };
  }

  await ensureOpdToken(supabase, {
    appointmentId,
    doctorUuid,
    patientId,
    tokenNumber,
    status: 'ISSUED',
  });

  await syncLegacyOpdQueue(supabase, {
    token_number: tokenNumber,
    patient_id: patientId,
    patient_name: input.patient_name.trim(),
    doctor_id: input.doctor_id,
    doctor_name: input.doctor_name,
    department: input.department,
    age: input.age,
    gender: input.gender,
    status: 'SCHEDULED',
  });

  const row = normalizeHospitalAppointmentRow(data ?? payload);

  return {
    ok: true,
    appointmentId,
    patientId,
    doctorUuid,
    row,
  };
}

/** Persist patient-app online booking to unified appointments ledger for hospital reception. */
export async function registerPatientOnlineBooking(
  supabase: SupabaseClient,
  input: PatientOnlineBookingInput,
): Promise<AppointmentSyncResult> {
  const appointmentId = input.id;
  const uhid = input.patient_uhid || newUhid();
  const tokenNumber = formatTokenLabel(input.token_number);
  const now = new Date().toISOString();
  const clinicalReason = input.reason?.trim() || 'General OPD Consultation';

  const doctorUuid = await resolveDoctorUuidForHospital(
    input.doctor_id,
    input.doctor_name,
    input.department,
  );

  await upsertPatientRecords(supabase, {
    patientId: input.patient_id,
    uhid,
    name: input.patient_name.trim(),
    department: input.department,
    chief_complaint: clinicalReason,
    doctor_id: input.doctor_id,
    doctor_name: input.doctor_name,
  });

  const payload: Record<string, unknown> = {
    id: appointmentId,
    appointment_id: appointmentId,
    hospital_id: REGAL_HOSPITAL_ID,
    facility_code: REGAL_FACILITY_CODE,
    hospital_code: REGAL_FACILITY_CODE,
    token_number: tokenNumber,
    uhid,
    patient_uhid: uhid,
    patient_id: input.patient_id,
    patient_name: input.patient_name.trim(),
    doctor_id: doctorUuid,
    doctor_code: input.doctor_id,
    doctor_employee_id: input.doctor_id,
    doctor_name: input.doctor_name,
    department: input.department,
    appointment_date: input.appointment_date,
    appointment_time: input.appointment_time,
    slot_time: input.slot_time ?? input.appointment_time,
    appointment_type: 'OPD Consultation',
    queue_number: parseTokenSequence(tokenNumber),
    status: 'confirmed',
    chief_complaint: clinicalReason,
    reason_for_visit: clinicalReason,
    fee: parseFeeAmount(input.fee),
    source: 'PATIENT_APP',
    updated_at: now,
    created_at: now,
  };

  const { data, error } = await insertAppointmentRow(supabase, payload);
  if (error) {
    return { ok: false, error };
  }

  await ensureOpdToken(supabase, {
    appointmentId,
    doctorUuid,
    patientId: input.patient_id,
    tokenNumber,
    status: 'ISSUED',
  });

  const row = normalizeHospitalAppointmentRow(data ?? payload);

  return {
    ok: true,
    appointmentId,
    patientId: input.patient_id,
    doctorUuid,
    row,
  };
}

/** Update appointment lifecycle across hospital + doctor apps. */
export async function transitionHospitalAppointment(
  supabase: SupabaseClient,
  appointmentId: string,
  status: AppointmentLifecycleStatus,
  meta?: { doctorEmployeeId?: string; token_number?: string },
): Promise<AppointmentSyncResult> {
  const now = new Date().toISOString();
  const dbStatus = DOCTOR_STATUS[status];
  const tokenStatus = TOKEN_STATUS[status];
  const patch = { status: dbStatus, updated_at: now };

  let updated = false;
  for (const column of ['appointment_id', 'id'] as const) {
    const { error } = await supabase.from('appointments').update(patch).eq(column, appointmentId);
    if (!error) {
      updated = true;
      break;
    }
  }

  const tokenPatch: Record<string, unknown> = { status: tokenStatus };
  if (status === 'in_consultation') tokenPatch.called_at = now;
  if (status === 'completed') tokenPatch.completed_at = now;

  await supabase.from('opd_tokens').update(tokenPatch).eq('appointment_id', appointmentId);

  if (meta?.doctorEmployeeId && meta.token_number) {
    const queueStatus =
      status === 'in_consultation'
        ? 'IN_CONSULTATION'
        : status === 'completed'
          ? 'COMPLETED'
          : status === 'checked_in'
            ? 'SCHEDULED'
            : 'SCHEDULED';

    await supabase
      .from('opd_queue')
      .update({ status: queueStatus, updated_at: now })
      .eq('doctor_id', meta.doctorEmployeeId)
      .eq('token_number', meta.token_number);
  }

  return { ok: updated, appointmentId, error: updated ? undefined : 'Appointment update failed' };
}

async function loadPatientAppointmentsFallback(
  supabase: SupabaseClient,
): Promise<Record<string, unknown>[]> {
  try {
    const { data, error } = await supabase
      .from('patient_appointments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error || !data?.length) return [];
    return data.map((row) =>
      normalizePatientAppointmentToHospital(row as Record<string, unknown>),
    );
  } catch {
    return [];
  }
}

async function queryAppointmentsForFacility(
  supabase: SupabaseClient,
  facilityCode: string,
): Promise<Record<string, unknown>[]> {
  const facilityFilter = await supabase
    .from('appointments')
    .select('*')
    .or(
      `facility_code.eq.${facilityCode},hospital_code.eq.${facilityCode},hospital_id.eq.${REGAL_HOSPITAL_ID}`,
    )
    .order('created_at', { ascending: false })
    .limit(200);

  if (!facilityFilter.error && facilityFilter.data?.length) {
    return facilityFilter.data as Record<string, unknown>[];
  }

  const hospitalFilter = await supabase
    .from('appointments')
    .select('*')
    .eq('hospital_id', REGAL_HOSPITAL_ID)
    .order('created_at', { ascending: false })
    .limit(200);

  if (!hospitalFilter.error && hospitalFilter.data?.length) {
    return hospitalFilter.data as Record<string, unknown>[];
  }

  const unfiltered = await supabase
    .from('appointments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (unfiltered.error || !unfiltered.data?.length) return [];
  return unfiltered.data as Record<string, unknown>[];
}

/** Live-only appointment load for hospital OPD — never injects seed data. */
export async function loadHospitalAppointmentsLive(
  supabase: SupabaseClient,
  facilityCode: string = REGAL_FACILITY_CODE,
): Promise<Record<string, unknown>[]> {
  try {
    const [appointmentRows, legacyRows] = await Promise.all([
      queryAppointmentsForFacility(supabase, facilityCode),
      loadPatientAppointmentsFallback(supabase),
    ]);

    const normalizedAppointments = appointmentRows.map((row) =>
      normalizeHospitalAppointmentRow(row),
    );
    const merged = dedupeAppointmentRows([...normalizedAppointments, ...legacyRows]);

    return merged.sort((left, right) => {
      const leftTs = Date.parse(String(left.created_at ?? '')) || 0;
      const rightTs = Date.parse(String(right.created_at ?? '')) || 0;
      return rightTs - leftTs;
    });
  } catch {
    return [];
  }
}
