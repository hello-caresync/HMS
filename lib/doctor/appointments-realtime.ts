import { resolveRawGenderFromRow } from '@/lib/clinical/format-gender';
import { loadPatientDemographicsMap } from '@/lib/clinical/enrich-queue-demographics';
import { subscribePostgresChannel } from '@/lib/realtime/subscription-lifecycle';
import { createClient } from '@/lib/supabase/client';
import { DEFAULT_ACTIVE_DOCTOR_ID, DEFAULT_PATIENT_ID } from '@/lib/doctor/command-center/supabase-service';
import { appointmentBelongsToDoctor, getDoctorSession } from '@/lib/doctor/session';
import { callNextInterleavedPatient } from '@/lib/queue/call-next';
import { inferQueueType } from '@/lib/queue/queue-mapper';
import { dedupeEncounterList } from '@/lib/queue/dedupe-encounters';

export type AppointmentQueueStatus = 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED' | string;

export interface LiveAppointmentRecord {
  id: string;
  doctor_id: string;
  doctor_name?: string;
  patient_id?: string;
  patient_name: string;
  age?: number;
  gender?: string;
  chief_complaint?: string;
  symptoms?: string;
  vitals_summary?: string;
  token_number?: string;
  appointment_date?: string;
  time_slot?: string;
  type?: string;
  fee?: string;
  hospital_name?: string;
  status: AppointmentQueueStatus;
  predicted_wait_min?: number;
  ml_duration_min?: number;
  created_at?: string;
  queue_type?: 'appointment' | 'walk_in';
  check_in_status?: string;
  triage_priority?: number;
}

function calcAge(dob?: string): number | undefined {
  if (!dob) return undefined;
  const born = new Date(dob);
  if (Number.isNaN(born.getTime())) return undefined;
  return Math.floor((Date.now() - born.getTime()) / (365.25 * 24 * 3600 * 1000));
}

export function isWaitingStatus(status: string): boolean {
  const s = status.toUpperCase();
  return (
    s === 'WAITING' ||
    s === 'BOOKED' ||
    s === 'CONFIRMED' ||
    s === 'PENDING' ||
    s === 'SCHEDULED' ||
    s === 'ACTIVE'
  );
}

export function isInConsultationStatus(status: string): boolean {
  const s = status.toUpperCase();
  return s === 'IN_CONSULTATION' || s === 'IN_PROGRESS';
}

export function isCompletedStatus(status: string): boolean {
  return status === 'COMPLETED';
}

export function isScheduledBookingStatus(status: string): boolean {
  const s = status.toUpperCase();
  return s === 'SCHEDULED' || s === 'REQUESTED';
}

/** Booked appointments not yet in the live queue or consultation. */
export function getUpcomingBookings(
  appointments: LiveAppointmentRecord[],
): LiveAppointmentRecord[] {
  return appointments.filter(
    (a) =>
      !isWaitingStatus(a.status) &&
      !isInConsultationStatus(a.status) &&
      !isCompletedStatus(a.status),
  );
}

export function getNextUpcomingBooking(
  appointments: LiveAppointmentRecord[],
): LiveAppointmentRecord | null {
  const upcoming = getUpcomingBookings(appointments);
  if (upcoming.length === 0) return null;
  return upcoming[0];
}

/** Resolve active patient: IN_CONSULTATION first, then first WAITING. */
export function resolveActivePatient(
  records: LiveAppointmentRecord[],
): LiveAppointmentRecord | null {
  const inConsultation = records.find((r) => isInConsultationStatus(r.status));
  if (inConsultation) return inConsultation;
  return records.find((r) => isWaitingStatus(r.status)) ?? null;
}

async function enrichAppointmentRows(
  rows: Record<string, unknown>[],
): Promise<LiveAppointmentRecord[]> {
  const supabase = createClient();
  const patientIds = Array.from(
    new Set(rows.map((row) => String(row.patient_id ?? '')).filter(Boolean)),
  );

  const patientMap = new Map<string, Record<string, unknown>>();
  if (patientIds.length > 0) {
    const [profilesById, profilesByPatientId, demoMap] = await Promise.all([
      supabase
        .from('patient_profiles')
        .select('id, patient_id, full_name, gender, date_of_birth, dob')
        .in('id', patientIds),
      supabase
        .from('patient_profiles')
        .select('id, patient_id, full_name, gender, date_of_birth, dob')
        .in('patient_id', patientIds),
      loadPatientDemographicsMap(supabase, patientIds),
    ]);

    for (const profile of [
      ...((profilesById.data ?? []) as Record<string, unknown>[]),
      ...((profilesByPatientId.data ?? []) as Record<string, unknown>[]),
    ]) {
      const id = String(profile.id ?? '').trim();
      const patientId = String(profile.patient_id ?? '').trim();
      if (id) patientMap.set(id, profile);
      if (patientId) patientMap.set(patientId, profile);
    }

    for (const [id, demo] of demoMap.entries()) {
      const existing = patientMap.get(id) ?? {};
      patientMap.set(id, {
        ...existing,
        gender: existing.gender ?? demo.gender,
        age: existing.age ?? demo.age,
      });
    }
  }

  return rows.map((row, index) => {
    const patientId = String(row.patient_id ?? '');
    const profile = patientMap.get(patientId);
    const dob = (profile?.date_of_birth ?? profile?.dob) as string | undefined;
    const gender =
      resolveRawGenderFromRow(row) ??
      (profile?.gender ? String(profile.gender) : undefined);

    return {
      id: String(row.appointment_id ?? row.id ?? ''),
      doctor_id: String(row.doctor_id ?? row.doctor_code ?? row.doctor_employee_id ?? ''),
      patient_id: patientId || undefined,
      patient_name: String(row.patient_name ?? profile?.full_name ?? 'Patient'),
      doctor_name: row.doctor_name ? String(row.doctor_name) : undefined,
      age: calcAge(dob) ?? (profile?.age as number | undefined),
      gender,
      chief_complaint: String(
        row.reason_for_visit ?? row.chief_complaint ?? row.reason ?? 'OPD Review',
      ),
      symptoms: String(row.symptoms ?? row.reason ?? row.chief_complaint ?? ''),
      vitals_summary: row.vitals_summary ? String(row.vitals_summary) : undefined,
      token_number: row.token_number != null ? String(row.token_number) : undefined,
      appointment_date: row.appointment_date
        ? String(row.appointment_date).slice(0, 10)
        : undefined,
      time_slot: String(row.appointment_time ?? row.time_slot ?? row.slot_time ?? 'Today'),
      type: String(row.department ?? row.type ?? 'Standard Consultation'),
      fee: row.fee ? String(row.fee) : undefined,
      hospital_name: row.hospital_name ? String(row.hospital_name) : 'Regal Hospital',
      status: String(row.status ?? row.queue_status ?? 'WAITING').toUpperCase(),
      predicted_wait_min: Number(
        row.predicted_wait_min ?? row.estimated_wait_minutes ?? 5 + index * 3,
      ),
      ml_duration_min: Number(row.ml_duration_min ?? row.estimated_duration ?? 15),
      created_at: row.created_at ? String(row.created_at) : undefined,
      queue_type: inferQueueType(row),
      check_in_status: row.check_in_status ? String(row.check_in_status) : undefined,
      triage_priority: row.triage_priority == null ? undefined : Number(row.triage_priority),
    };
  });
}

export async function fetchLiveAppointments(
  _doctorId = DEFAULT_ACTIVE_DOCTOR_ID,
): Promise<LiveAppointmentRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[fetchLiveAppointments]:', error.message);
    throw error;
  }

  const rows = await enrichAppointmentRows((data ?? []) as Record<string, unknown>[]);
  const session = getDoctorSession();
  const scoped = session
    ? rows.filter((row) =>
        appointmentBelongsToDoctor(
          {
            ...row,
            doctor_id: row.doctor_id,
            doctor_code: row.doctor_id,
            doctor_name: row.doctor_name,
          },
          session,
        ),
      )
    : rows;

  return dedupeEncounterList(scoped);
}

/** Preserve queue_status values exactly for patient_appointments cross-app sync. */
function mapStatusForPatientAppointments(status: string): string {
  return status.toUpperCase();
}

/** Update appointment by id across appointments and patient_appointments tables. */
export async function updateAppointmentRecord(
  appointmentId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const supabase = createClient();
  const withTimestamp = { ...payload, updated_at: new Date().toISOString() };
  const statusValue = payload.status ? String(payload.status) : undefined;
  const queueStatusValue = payload.queue_status
    ? String(payload.queue_status)
    : statusValue
      ? mapStatusForPatientAppointments(statusValue)
      : undefined;

  let appointmentsUpdated = false;

  const byAppointmentId = await supabase
    .from('appointments')
    .update(withTimestamp)
    .eq('appointment_id', appointmentId)
    .select('appointment_id');

  if (!byAppointmentId.error && (byAppointmentId.data?.length ?? 0) > 0) {
    appointmentsUpdated = true;
  } else {
    const byId = await supabase
      .from('appointments')
      .update(withTimestamp)
      .eq('id', appointmentId)
      .select('id');

    if (!byId.error && (byId.data?.length ?? 0) > 0) {
      appointmentsUpdated = true;
    }
  }

  const patientPayload: Record<string, unknown> = {
    ...withTimestamp,
    ...(queueStatusValue ? { queue_status: queueStatusValue } : {}),
  };

  const patientById = await supabase
    .from('patient_appointments')
    .update(patientPayload)
    .eq('id', appointmentId)
    .select('id');

  const patientUpdated = !patientById.error && (patientById.data?.length ?? 0) > 0;

  if (!appointmentsUpdated && !patientUpdated) {
    const message =
      patientById.error?.message ||
      'Unable to update appointment in appointments or patient_appointments';
    throw new Error(message);
  }
}

/**
 * Call next patient: complete current IN_CONSULTATION (if any), promote WAITING → IN_CONSULTATION.
 */
export async function callNextPatientInQueue(
  appointments: LiveAppointmentRecord[],
  activePatient: LiveAppointmentRecord | null,
): Promise<LiveAppointmentRecord | null> {
  const supabase = createClient();
  const session = getDoctorSession();

  if (activePatient && isInConsultationStatus(activePatient.status)) {
    await updateAppointmentRecord(activePatient.id, { status: 'COMPLETED', check_in_status: 'completed' });
  }

  const result = await callNextInterleavedPatient(supabase, {
    doctorId: session?.doctorId || session?.employeeId,
  });

  if (result.nextPatient) {
    const matched = appointments.find((item) => item.id === result.nextPatient?.id);
    return matched
      ? { ...matched, status: 'IN_CONSULTATION' }
      : {
          id: result.nextPatient.id,
          doctor_id: result.nextPatient.doctor_id,
          patient_id: result.nextPatient.patient_id,
          patient_name: result.nextPatient.patient_name,
          status: 'IN_CONSULTATION',
          queue_type: result.nextPatient.queue_type,
          time_slot: result.nextPatient.scheduled_time,
        };
  }

  const waitingQueue = appointments.filter((a) => isWaitingStatus(a.status));
  if (waitingQueue.length === 0) return null;
  const fallback = waitingQueue[0];
  await updateAppointmentRecord(fallback.id, { status: 'IN_CONSULTATION', check_in_status: 'in_consultation' });
  return fallback;
}

/** Emergency bypass: jump first waiting patient directly into consultation. */
export async function bypassToNextWaiting(
  appointments: LiveAppointmentRecord[],
): Promise<LiveAppointmentRecord | null> {
  const next = appointments.find((a) => isWaitingStatus(a.status));
  if (!next) return null;

  await updateAppointmentRecord(next.id, { status: 'IN_CONSULTATION' });
  return next;
}

/** Admit a scheduled booking directly into the live OPD queue. */
export async function admitAppointmentToQueue(
  appointmentId: string,
  targetStatus: 'WAITING' | 'IN_CONSULTATION' = 'IN_CONSULTATION',
): Promise<void> {
  await updateAppointmentRecord(appointmentId, { status: targetStatus });
}

/** Quick walk-in: insert an unscheduled patient straight into the OPD list. */
export async function createWalkInAppointment(patientName: string): Promise<void> {
  const supabase = createClient();
  const today = new Date();
  const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60_000)
    .toISOString()
    .split('T')[0];
  const timeLabel = today.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const { error } = await supabase.from('appointments').insert([
    {
      patient_id: DEFAULT_PATIENT_ID,
      doctor_id: DEFAULT_ACTIVE_DOCTOR_ID,
      patient_name: patientName,
      department: 'General Surgery',
      reason_for_visit: 'Walk-in / Quick triage intake',
      appointment_date: localDate,
      appointment_time: timeLabel,
      status: 'IN_CONSULTATION',
    },
  ]);

  if (error) {
    throw new Error(error.message);
  }
}

export function subscribeAppointmentsRealtime(onChange: () => void): () => void {
  const supabase = createClient();

  return subscribePostgresChannel({
    supabase,
    channelName: 'curasync_appointments_realtime',
    table: 'appointments',
    onPayload: () => onChange(),
  });
}
