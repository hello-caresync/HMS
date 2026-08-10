import { supabase } from '@/lib/supabaseClient';

import { getDoctorSession } from './session';
import { DOCTOR_STORAGE_KEYS, readJsonStorage, writeJsonStorage } from './storage-keys';

export type QueueStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type PatientAppointment = {
  id: string;
  patient_id?: string;
  patient_name: string;
  doctor_name: string;
  department: string;
  hospital_name?: string;
  appointment_date: string;
  slot_time: string;
  token_number: number;
  current_serving_token?: number;
  queue_status: QueueStatus;
};

function mergeAppointments(local: PatientAppointment[], remote: PatientAppointment[]): PatientAppointment[] {
  const map = new Map<string, PatientAppointment>();
  for (const item of local) {
    map.set(item.id || `token-${item.token_number}-${item.appointment_date}`, item);
  }
  for (const item of remote) {
    const key = item.id || `token-${item.token_number}-${item.appointment_date}`;
    map.set(key, { ...map.get(key), ...item, id: item.id || key });
  }
  return Array.from(map.values()).sort((a, b) => (a.token_number || 0) - (b.token_number || 0));
}

export async function fetchDoctorQueue(doctorName?: string): Promise<PatientAppointment[]> {
  const session = getDoctorSession();
  const resolvedDoctor = doctorName ?? session.fullName;
  const today = new Date().toISOString().split('T')[0];
  const normalizedDoctor = resolvedDoctor.replace(/^Dr\.?\s*/i, '').trim().toLowerCase();

  const localAll = readJsonStorage<PatientAppointment[]>(DOCTOR_STORAGE_KEYS.appointments, []);
  const localFiltered = localAll.filter(
    (a) => {
      const appointmentDoctor = a.doctor_name
        ?.replace(/^Dr\.?\s*/i, '')
        .trim()
        .toLowerCase();
      return (
        a.appointment_date === today &&
        (a.doctor_name === resolvedDoctor || appointmentDoctor === normalizedDoctor)
      );
    },
  );

  let remote: PatientAppointment[] = [];
  try {
    const { data, error } = await supabase
      .from('patient_appointments')
      .select('*')
      .eq('doctor_name', resolvedDoctor)
      .eq('appointment_date', today)
      .order('token_number', { ascending: true });

    if (!error && data) {
      remote = data as PatientAppointment[];
    }
  } catch {
    /* offline — local only */
  }

  const merged = mergeAppointments(localFiltered, remote);
  writeJsonStorage(DOCTOR_STORAGE_KEYS.appointments, mergeAppointments(localAll, merged));
  return merged;
}

export async function updateQueueStatus(
  appointmentId: string,
  queueStatus: QueueStatus,
  currentServingToken?: number,
): Promise<void> {
  const localAll = readJsonStorage<PatientAppointment[]>(DOCTOR_STORAGE_KEYS.appointments, []);
  const updated = localAll.map((a) =>
    a.id === appointmentId
      ? {
          ...a,
          queue_status: queueStatus,
          ...(currentServingToken == null ? {} : { current_serving_token: currentServingToken }),
        }
      : a,
  );
  writeJsonStorage(DOCTOR_STORAGE_KEYS.appointments, updated);

  try {
    await supabase
      .from('patient_appointments')
      .update({
        queue_status: queueStatus,
        ...(currentServingToken == null
          ? {}
          : { current_serving_token: currentServingToken }),
      })
      .eq('id', appointmentId);
  } catch {
    /* persisted locally */
  }
}

export function getCurrentServingToken(appointments: PatientAppointment[]): number {
  const inProgress = appointments.find((a) => a.queue_status === 'IN_PROGRESS');
  if (inProgress) return inProgress.token_number;
  const completed = appointments.filter((a) => a.queue_status === 'COMPLETED');
  if (completed.length === 0) return 0;
  return Math.max(...completed.map((a) => a.token_number));
}
