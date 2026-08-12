import { supabase } from '@/lib/supabaseClient';
import { CLINICAL_STORAGE, readJsonLocal } from '@/lib/clinical/bridge';
import type { OpdQueueItem } from '@/lib/clinical/types';
import { DOCTOR_STORAGE_KEYS, readJsonStorage } from './storage-keys';

type LocalAppointment = {
  doctor_id?: string;
  appointment_date?: string;
  token_number?: number | string;
};

/** SmartQ sequential token: max(appointments, opd_tokens, local) + 1 per doctor_id UUID per date */
export async function computeNextSmartQToken(
  appointmentDate: string,
  doctorId: string,
): Promise<number> {
  let dbMax = 0;

  if (!doctorId) return 1;

  try {
    const { data: apptTokens } = await supabase
      .from('appointments')
      .select('appointment_id')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', appointmentDate);

    if (apptTokens?.length) {
      const ids = apptTokens.map((a: { appointment_id?: string }) => a.appointment_id).filter(Boolean);
      if (ids.length) {
        const { data: tokens } = await supabase
          .from('opd_tokens')
          .select('token_number, sequence_number')
          .eq('doctor_id', doctorId)
          .in('appointment_id', ids);
        if (tokens?.length) {
          dbMax = Math.max(
            dbMax,
            ...tokens.map((t: { token_number?: number | string; sequence_number?: number | string }) => Number(t.sequence_number ?? t.token_number) || 0),
          );
        }
      }
    }

    const { data: directTokens } = await supabase
      .from('opd_tokens')
      .select('token_number, sequence_number')
      .eq('doctor_id', doctorId);

    if (directTokens?.length) {
      dbMax = Math.max(
        dbMax,
        ...directTokens.map((t: { token_number?: number | string; sequence_number?: number | string }) => Number(t.sequence_number ?? t.token_number) || 0),
      );
    }
  } catch {
    /* offline */
  }

  try {
    const { data } = await supabase
      .from('opd_queue')
      .select('token_number')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', appointmentDate);

    if (data?.length) {
      dbMax = Math.max(dbMax, ...data.map((row: { token_number?: number | string }) => Number(row.token_number) || 0));
    }
  } catch {
    /* legacy table optional */
  }

  const localAppointments = readJsonStorage<LocalAppointment[]>(
    DOCTOR_STORAGE_KEYS.appointments,
    [],
  );
  const localApptMax = localAppointments
    .filter((a) => a.appointment_date === appointmentDate && a.doctor_id === doctorId)
    .reduce((max, a) => Math.max(max, Number(a.token_number) || 0), 0);

  const localQueue = readJsonLocal<OpdQueueItem[]>(CLINICAL_STORAGE.opdQueue, []);
  const localQueueMax = localQueue
    .filter((q) => q.appointment_date === appointmentDate && q.doctor_id === doctorId)
    .reduce((max, q) => Math.max(max, Number(q.token_number) || 0), 0);

  return Math.max(dbMax, localApptMax, localQueueMax) + 1;
}
