import { createClient } from '@/lib/supabase/client';
import { DEFAULT_ACTIVE_DOCTOR_ID, DEFAULT_PATIENT_ID } from '@/lib/doctor/command-center/supabase-service';

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
    s === 'SCHEDULED'
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
    const { data: profiles } = await supabase
      .from('patient_profiles')
      .select('id, full_name, gender, date_of_birth, dob')
      .in('id', patientIds);

    for (const profile of (profiles ?? []) as Record<string, unknown>[]) {
      if (profile.id) patientMap.set(String(profile.id), profile);
    }
  }

  return rows.map((row, index) => {
    const patientId = String(row.patient_id ?? '');
    const profile = patientMap.get(patientId);
    const dob = (profile?.date_of_birth ?? profile?.dob) as string | undefined;

    return {
      id: String(row.appointment_id ?? row.id ?? ''),
      doctor_id: String(row.doctor_id ?? ''),
      patient_id: patientId || undefined,
      patient_name: String(row.patient_name ?? profile?.full_name ?? 'Patient'),
      doctor_name: row.doctor_name ? String(row.doctor_name) : undefined,
      age: calcAge(dob),
      gender: profile?.gender ? String(profile.gender) : undefined,
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

  return enrichAppointmentRows((data ?? []) as Record<string, unknown>[]);
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
  const waitingQueue = appointments.filter((a) => isWaitingStatus(a.status));

  if (waitingQueue.length === 0) {
    return null;
  }

  let nextPatient: LiveAppointmentRecord;

  if (activePatient && isWaitingStatus(activePatient.status)) {
    nextPatient = activePatient;
  } else {
    if (activePatient && isInConsultationStatus(activePatient.status)) {
      await updateAppointmentRecord(activePatient.id, { status: 'COMPLETED' });
    }
    nextPatient = waitingQueue[0];
  }

  await updateAppointmentRecord(nextPatient.id, { status: 'IN_CONSULTATION' });
  return nextPatient;
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
  const channel = supabase
    .channel('curasync_appointments_realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, onChange)
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
