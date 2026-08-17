import type { SupabaseClient } from '@supabase/supabase-js';

import { emitSystemEvent } from './events';
import type { AppointmentLifecycleStatus, OpdAppointmentRow } from './types';

const STATUS_DB_MAP: Record<AppointmentLifecycleStatus, string> = {
  booked: 'BOOKED',
  checked_in: 'CHECKED_IN',
  in_consultation: 'IN_CONSULTATION',
  completed: 'COMPLETED',
};

function normalizeStatus(raw?: string): AppointmentLifecycleStatus {
  const s = String(raw ?? 'booked').toLowerCase();
  if (s.includes('consult')) return 'in_consultation';
  if (s.includes('complete')) return 'completed';
  if (s.includes('check')) return 'checked_in';
  return 'booked';
}

export async function fetchOpdAppointments(
  supabase: SupabaseClient,
): Promise<OpdAppointmentRow[]> {
  const [apptRes, patientApptRes] = await Promise.all([
    supabase
      .from('appointments')
      .select(
        'id, patient_id, patient_name, doctor_name, token_number, appointment_time, status, created_at',
      )
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('patient_appointments')
      .select(
        'id, patient_id, patient_name, doctor_name, token_number, slot_time, queue_status, status, created_at',
      )
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  const merged: OpdAppointmentRow[] = [
    ...((apptRes.data ?? []) as OpdAppointmentRow[]),
    ...((patientApptRes.data ?? []) as OpdAppointmentRow[]).map((row) => ({
      ...row,
      status: row.queue_status ?? row.status,
    })),
  ];

  const seen = new Set<string>();
  return merged.filter((row) => {
    const key = row.id || `${row.patient_name}-${row.token_number}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function checkInAppointment(
  supabase: SupabaseClient,
  input: { appointmentId: string; actorId?: string },
) {
  const { appointmentId } = input;
  if (!appointmentId) throw new Error('appointmentId is required');

  const nextStatus = STATUS_DB_MAP.checked_in;
  const timestamp = new Date().toISOString();

  const apptUpdate = await supabase
    .from('appointments')
    .update({ status: nextStatus, updated_at: timestamp })
    .eq('id', appointmentId)
    .select('*')
    .maybeSingle();

  if (apptUpdate.error) {
    await supabase
      .from('appointments')
      .update({ status: nextStatus, updated_at: timestamp })
      .eq('appointment_id', appointmentId);
  }

  await supabase
    .from('patient_appointments')
    .update({ queue_status: nextStatus, status: nextStatus, updated_at: timestamp })
    .eq('id', appointmentId);

  const patientName =
    apptUpdate.data?.patient_name ||
    (await supabase.from('patient_appointments').select('patient_name').eq('id', appointmentId).maybeSingle())
      .data?.patient_name ||
    'Patient';

  await emitSystemEvent(
    supabase,
    'PATIENT_CHECKED_IN',
    {
      message: `${patientName} checked in at reception`,
      appointmentId,
      patientName,
      status: 'checked_in',
      relatedId: appointmentId,
    },
    { severity: 'info', targetRoles: ['doctor', 'hospital', 'patient'] },
  );

  await supabase.from('notifications').insert({
    title: 'Patient Checked In',
    body: `${patientName} is waiting in OPD queue`,
    category: 'opd',
    severity: 'info',
    related_id: appointmentId,
  });

  return { success: true, appointmentId, status: 'checked_in' as const, patientName };
}

export async function transitionAppointmentStatus(
  supabase: SupabaseClient,
  input: { appointmentId: string; status: AppointmentLifecycleStatus },
) {
  const dbStatus = STATUS_DB_MAP[input.status];
  const timestamp = new Date().toISOString();

  await supabase
    .from('appointments')
    .update({ status: dbStatus, updated_at: timestamp })
    .or(`id.eq.${input.appointmentId},appointment_id.eq.${input.appointmentId}`);

  await supabase
    .from('patient_appointments')
    .update({ queue_status: dbStatus, status: dbStatus, updated_at: timestamp })
    .eq('id', input.appointmentId);

  if (input.status === 'checked_in') {
    return checkInAppointment(supabase, { appointmentId: input.appointmentId });
  }

  return { success: true, appointmentId: input.appointmentId, status: input.status };
}

export function getOpdQueueCounts(rows: OpdAppointmentRow[]) {
  let booked = 0;
  let checkedIn = 0;
  let inConsult = 0;
  let completed = 0;

  for (const row of rows) {
    const status = normalizeStatus(row.status ?? row.queue_status);
    if (status === 'booked') booked += 1;
    else if (status === 'checked_in') checkedIn += 1;
    else if (status === 'in_consultation') inConsult += 1;
    else if (status === 'completed') completed += 1;
  }

  return { booked, checkedIn, inConsult, completed, active: checkedIn + inConsult + booked };
}

export { normalizeStatus, STATUS_DB_MAP };
