import { supabase } from '@/lib/supabaseClient';
import { CLINICAL_STORAGE, readJsonLocal } from '@/lib/clinical/bridge';
import type { OpdQueueItem } from '@/lib/clinical/types';
import { DOCTOR_STORAGE_KEYS, readJsonStorage } from './storage-keys';

type LocalAppointment = {
  doctor_name?: string;
  doctor_id?: string;
  appointment_date?: string;
  token_number?: number | string;
};

function maxToken(values: Array<number | string | undefined | null>): number {
  return values.reduce<number>((max, value) => Math.max(max, Number(value) || 0), 0);
}

/** SmartQ sequential token: max(local, appointments, opd_queue) + 1 per clinician per date */
export async function computeNextSmartQToken(
  doctorName: string,
  appointmentDate: string,
  doctorId?: string,
): Promise<number> {
  let dbMax = 0;

  try {
    let appointmentsQuery = supabase
      .from('patient_appointments')
      .select('token_number')
      .eq('appointment_date', appointmentDate);

    if (doctorId) {
      appointmentsQuery = appointmentsQuery.or(
        `doctor_id.eq.${doctorId},doctor_name.eq.${doctorName}`,
      );
    } else {
      appointmentsQuery = appointmentsQuery.eq('doctor_name', doctorName);
    }

    const { data, error } = await appointmentsQuery;
    if (!error && data?.length) {
      dbMax = Math.max(dbMax, maxToken(data.map((row) => row.token_number)));
    }
  } catch {
    /* offline */
  }

  try {
    let queueQuery = supabase
      .from('opd_queue')
      .select('token_number')
      .eq('appointment_date', appointmentDate);

    if (doctorId) queueQuery = queueQuery.eq('doctor_id', doctorId);
    else queueQuery = queueQuery.eq('doctor_name', doctorName);

    const { data, error } = await queueQuery;
    if (!error && data?.length) {
      dbMax = Math.max(dbMax, maxToken(data.map((row) => row.token_number)));
    }
  } catch {
    /* offline */
  }

  const localAppointments = readJsonStorage<LocalAppointment[]>(
    DOCTOR_STORAGE_KEYS.appointments,
    [],
  );
  const localApptMax = localAppointments
    .filter(
      (a) =>
        a.appointment_date === appointmentDate &&
        (doctorId ? a.doctor_id === doctorId || a.doctor_name === doctorName : a.doctor_name === doctorName),
    )
    .reduce((max, a) => Math.max(max, Number(a.token_number) || 0), 0);

  const localQueue = readJsonLocal<OpdQueueItem[]>(CLINICAL_STORAGE.opdQueue, []);
  const localQueueMax = localQueue
    .filter(
      (q) =>
        q.appointment_date === appointmentDate &&
        (doctorId ? q.doctor_id === doctorId : q.doctor_name === doctorName),
    )
    .reduce((max, q) => Math.max(max, Number(q.token_number) || 0), 0);

  return Math.max(dbMax, localApptMax, localQueueMax) + 1;
}
