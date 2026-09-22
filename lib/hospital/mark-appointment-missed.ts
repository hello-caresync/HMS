import type { SupabaseClient } from '@supabase/supabase-js';

import { APPOINTMENT_LIFECYCLE } from '@/lib/patient/appointment-status';

const MISSED_PAYLOAD = {
  status: APPOINTMENT_LIFECYCLE.MISSED,
  queue_status: APPOINTMENT_LIFECYCLE.MISSED,
} as const;

/** Persists MISSED on `public.appointments` (and legacy mirror) by id or appointment_id. */
export async function markAppointmentMissedInDatabase(
  supabase: SupabaseClient,
  appointmentId: string,
): Promise<{ ok: boolean; error?: string }> {
  const id = String(appointmentId).trim();
  if (!id) return { ok: false, error: 'Missing appointment id' };

  const timestamp = new Date().toISOString();
  const payload = {
    ...MISSED_PAYLOAD,
    missed_at: timestamp,
    updated_at: timestamp,
  };

  const byAppointmentId = await supabase
    .from('appointments')
    .update(payload)
    .eq('appointment_id', id)
    .select('appointment_id')
    .maybeSingle();

  if (!byAppointmentId.error && byAppointmentId.data) {
    await syncLegacyAndQueue(supabase, id, timestamp);
    return { ok: true };
  }

  const byId = await supabase
    .from('appointments')
    .update(payload)
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (!byId.error && byId.data) {
    await syncLegacyAndQueue(supabase, id, timestamp);
    return { ok: true };
  }

  return {
    ok: false,
    error: byAppointmentId.error?.message ?? byId.error?.message ?? 'Mark missed failed',
  };
}

async function syncLegacyAndQueue(supabase: SupabaseClient, appointmentId: string, timestamp: string) {
  await supabase
    .from('patient_appointments')
    .update({
      status: APPOINTMENT_LIFECYCLE.MISSED,
      queue_status: APPOINTMENT_LIFECYCLE.MISSED,
      updated_at: timestamp,
    })
    .eq('id', appointmentId);

  await supabase
    .from('hospital_opd_queue')
    .update({
      status: APPOINTMENT_LIFECYCLE.MISSED,
      queue_status: APPOINTMENT_LIFECYCLE.MISSED,
      updated_at: timestamp,
    })
    .or(`appointment_id.eq.${appointmentId},id.eq.${appointmentId}`);

  await supabase.from('notifications').insert({
    title: 'Missed Appointment',
    body: 'You missed your scheduled OPD window. Please reschedule from the Patient App.',
    category: 'appointments',
    severity: 'warning',
    related_id: appointmentId,
    target_audience: 'patient',
  });
}
