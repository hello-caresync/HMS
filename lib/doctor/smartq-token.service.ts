import { supabase } from '@/lib/supabaseClient';

import { DOCTOR_STORAGE_KEYS, readJsonStorage } from './storage-keys';

type LocalAppointment = {
  doctor_name?: string;
  appointment_date?: string;
  token_number?: number;
};

/** SmartQ sequential token: max(localCount, dbCount) + 1 per doctor per date */
export async function computeNextSmartQToken(
  doctorName: string,
  appointmentDate: string,
): Promise<number> {

  let dbMax = 0;
  try {
    const { data, error } = await supabase
      .from('patient_appointments')
      .select('token_number')
      .eq('doctor_name', doctorName)
      .eq('appointment_date', appointmentDate);

    if (!error && data?.length) {
      dbMax = Math.max(...data.map((row) => Number(row.token_number) || 0));
    }
  } catch {
    /* offline — rely on local count */
  }

  const localList = readJsonStorage<LocalAppointment[]>(DOCTOR_STORAGE_KEYS.appointments, []);
  const localMax = localList
    .filter((a) => a.doctor_name === doctorName && a.appointment_date === appointmentDate)
    .reduce((max, a) => Math.max(max, Number(a.token_number) || 0), 0);

  return Math.max(dbMax, localMax) + 1;
}
