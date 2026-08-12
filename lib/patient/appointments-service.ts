import { supabase } from '@/lib/supabaseClient';
import { normalizeAppointmentStatus } from '@/lib/doctor/appointment-status';
import { resolvePatientDbId } from '@/lib/patient/constants';

export type PatientAppointmentRow = {
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  patient_name?: string;
  doctor_name?: string;
  department?: string;
  reason_for_visit?: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  token_number?: string;
  sequence_number?: number;
  estimated_wait_minutes?: number;
  queue_position?: number;
};

export async function fetchPatientAppointments(
  sessionPatientId?: string | null,
): Promise<PatientAppointmentRow[]> {
  const patientId = resolvePatientDbId(sessionPatientId);

  try {
    const { data, error } = await supabase
      .from('doctor_appointments_view')
      .select('*')
      .eq('patient_id', patientId)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (!error && data?.length) {
      return enrichQueuePositions(data.map(mapPatientRow));
    }
  } catch {
    /* view fallback below */
  }

  try {
    const { data } = await supabase
      .from('appointments')
      .select(
        '*, patient_profiles(full_name), doctors(full_name), opd_tokens(token_number, sequence_number, estimated_wait_minutes, doctor_id, status)',
      )
      .eq('patient_id', patientId)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (!data?.length) return [];

    const rows = data.map((row: Record<string, unknown>) => {
      const profile = Array.isArray(row.patient_profiles)
        ? row.patient_profiles[0]
        : row.patient_profiles;
      const doctor = Array.isArray(row.doctors) ? row.doctors[0] : row.doctors;
      const token = Array.isArray(row.opd_tokens) ? row.opd_tokens[0] : row.opd_tokens;

      return mapPatientRow({
        appointment_id: row.appointment_id,
        patient_id: row.patient_id,
        doctor_id: row.doctor_id,
        patient_name: profile?.full_name,
        doctor_name: doctor?.full_name,
        department: row.department,
        reason_for_visit: row.reason_for_visit,
        appointment_date: row.appointment_date,
        appointment_time: row.appointment_time,
        status: row.status,
        token_number: token?.token_number,
        sequence_number: token?.sequence_number,
        estimated_wait_minutes: token?.estimated_wait_minutes,
      });
    });

    return enrichQueuePositions(rows);
  } catch {
    return [];
  }
}

function mapPatientRow(row: Record<string, unknown>): PatientAppointmentRow {
  return {
    appointment_id: String(row.appointment_id ?? ''),
    patient_id: String(row.patient_id ?? ''),
    doctor_id: String(row.doctor_id ?? ''),
    patient_name: row.patient_name ? String(row.patient_name) : undefined,
    doctor_name: row.doctor_name ? String(row.doctor_name) : undefined,
    department: row.department ? String(row.department) : undefined,
    reason_for_visit: row.reason_for_visit ? String(row.reason_for_visit) : undefined,
    appointment_date: String(row.appointment_date ?? ''),
    appointment_time: String(row.appointment_time ?? ''),
    status: normalizeAppointmentStatus(String(row.status ?? 'requested')),
    token_number: row.token_number ? String(row.token_number) : undefined,
    sequence_number: row.sequence_number != null ? Number(row.sequence_number) : undefined,
    estimated_wait_minutes:
      row.estimated_wait_minutes != null ? Number(row.estimated_wait_minutes) : undefined,
  };
}

async function enrichQueuePositions(
  rows: PatientAppointmentRow[],
): Promise<PatientAppointmentRow[]> {
  const enriched = [...rows];

  for (const row of enriched) {
    if (!row.doctor_id || !row.sequence_number) continue;
    try {
      const { count } = await supabase
        .from('opd_tokens')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', row.doctor_id)
        .in('status', ['ISSUED', 'CALLED'])
        .lt('sequence_number', row.sequence_number);

      row.queue_position = (count ?? 0) + 1;
      if (!row.estimated_wait_minutes) {
        row.estimated_wait_minutes = Math.max(5, (row.queue_position - 1) * 12);
      }
    } catch {
      row.queue_position = row.sequence_number;
    }
  }

  return enriched;
}
