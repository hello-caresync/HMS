import { supabase } from '@/lib/supabaseClient';
import type { ClinicalAppointmentStatus } from '@/lib/doctor/appointment-status';

export type DoctorAppointmentRow = {
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  patient_name: string;
  patient_age?: number;
  patient_gender?: string;
  patient_blood_group?: string;
  doctor_name?: string;
  department?: string;
  reason_for_visit?: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  token_number?: string;
  sequence_number?: number;
  token_status?: string;
  estimated_wait_minutes?: number;
};

function calcAge(dob?: string | null): number | undefined {
  if (!dob) return undefined;
  const born = new Date(dob);
  if (Number.isNaN(born.getTime())) return undefined;
  return Math.floor((Date.now() - born.getTime()) / (365.25 * 24 * 3600 * 1000));
}

function todayLocalDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Load appointments for a clinician UUID via `doctor_appointments_view`. */
export async function fetchDoctorAppointments(
  doctorId: string,
  options?: { todayOnly?: boolean },
): Promise<DoctorAppointmentRow[]> {
  if (!doctorId) return [];

  const todayOnly = options?.todayOnly ?? true;

  try {
    let query = supabase
      .from('doctor_appointments_view')
      .select('*')
      .eq('doctor_id', doctorId)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (todayOnly) {
      query = query.eq('appointment_date', todayLocalDate());
    }

    const { data, error } = await query;
    if (!error && data?.length) {
      return data.map(mapAppointmentRow);
    }
  } catch {
    /* view may not exist yet */
  }

  try {
    let fallback = supabase
      .from('appointments')
      .select(
        '*, patient_profiles(full_name, gender, dob, blood_group), doctors(full_name), opd_tokens(token_number, sequence_number, status, estimated_wait_minutes)',
      )
      .eq('doctor_id', doctorId)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (todayOnly) {
      fallback = fallback.eq('appointment_date', todayLocalDate());
    }

    const { data } = await fallback;
    if (!data?.length) return [];

    return data.map((row: Record<string, unknown>) => {
      const profile = Array.isArray(row.patient_profiles)
        ? row.patient_profiles[0]
        : row.patient_profiles;
      const doctor = Array.isArray(row.doctors) ? row.doctors[0] : row.doctors;
      const token = Array.isArray(row.opd_tokens) ? row.opd_tokens[0] : row.opd_tokens;

      return mapAppointmentRow({
        appointment_id: row.appointment_id,
        patient_id: row.patient_id,
        doctor_id: row.doctor_id,
        patient_name: profile?.full_name,
        patient_gender: profile?.gender,
        patient_dob: profile?.dob,
        patient_blood_group: profile?.blood_group,
        doctor_name: doctor?.full_name,
        department: row.department,
        reason_for_visit: row.reason_for_visit,
        appointment_date: row.appointment_date,
        appointment_time: row.appointment_time,
        status: row.status,
        token_number: token?.token_number,
        sequence_number: token?.sequence_number,
        token_status: token?.status,
        estimated_wait_minutes: token?.estimated_wait_minutes,
      });
    });
  } catch {
    return [];
  }
}

function mapAppointmentRow(row: Record<string, unknown>): DoctorAppointmentRow {
  const dob = row.patient_dob as string | undefined;
  return {
    appointment_id: String(row.appointment_id ?? ''),
    patient_id: String(row.patient_id ?? ''),
    doctor_id: String(row.doctor_id ?? ''),
    patient_name: String(row.patient_name ?? 'Patient'),
    patient_age: calcAge(dob),
    patient_gender: row.patient_gender ? String(row.patient_gender) : undefined,
    patient_blood_group: row.patient_blood_group ? String(row.patient_blood_group) : undefined,
    doctor_name: row.doctor_name ? String(row.doctor_name) : undefined,
    department: row.department ? String(row.department) : undefined,
    reason_for_visit: row.reason_for_visit ? String(row.reason_for_visit) : undefined,
    appointment_date: String(row.appointment_date ?? ''),
    appointment_time: String(row.appointment_time ?? ''),
    status: String(row.status ?? 'requested'),
    token_number: row.token_number ? String(row.token_number) : undefined,
    sequence_number: row.sequence_number != null ? Number(row.sequence_number) : undefined,
    token_status: row.token_status ? String(row.token_status) : undefined,
    estimated_wait_minutes:
      row.estimated_wait_minutes != null ? Number(row.estimated_wait_minutes) : undefined,
  };
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: ClinicalAppointmentStatus,
): Promise<void> {
  const dbStatus = status;

  const { error } = await supabase
    .from('appointments')
    .update({ status: dbStatus })
    .eq('appointment_id', appointmentId);

  if (error) throw new Error(error.message);

  if (status === 'confirmed') {
    try {
      const { data: appt } = await supabase
        .from('appointments')
        .select('patient_id')
        .eq('appointment_id', appointmentId)
        .maybeSingle();

      if (appt?.patient_id) {
        await supabase.from('patient_notifications').insert({
          patient_id: appt.patient_id,
          title: 'Appointment confirmed',
          message: 'Your appointment has been confirmed by the doctor.',
          type: 'appointment_confirmed',
          source_app: 'doctor_app',
        });
      }
    } catch {
      /* optional table */
    }
  }

  if (status === 'in_progress') {
    try {
      const { data: appt } = await supabase
        .from('appointments')
        .select('patient_id, doctor_id')
        .eq('appointment_id', appointmentId)
        .maybeSingle();

      if (appt?.patient_id) {
        await supabase.from('patient_notifications').insert({
          patient_id: appt.patient_id,
          title: 'Consultation started',
          message: 'Your doctor has started your consultation.',
          type: 'consultation_started',
          source_app: 'doctor_app',
        });
      }

      await supabase
        .from('opd_tokens')
        .update({ status: 'IN_CONSULTATION' })
        .eq('appointment_id', appointmentId);
    } catch {
      /* ok */
    }
  }

  if (status === 'completed') {
    try {
      await supabase
        .from('opd_tokens')
        .update({ status: 'COMPLETED', completed_at: new Date().toISOString() })
        .eq('appointment_id', appointmentId);

      const { data: appt } = await supabase
        .from('appointments')
        .select('patient_id')
        .eq('appointment_id', appointmentId)
        .maybeSingle();

      if (appt?.patient_id) {
        await supabase.from('patient_notifications').insert({
          patient_id: appt.patient_id,
          title: 'Consultation completed',
          message: 'Consultation completed. Prescription ready in inbox.',
          type: 'consultation_completed',
          source_app: 'doctor_app',
        });
      }
    } catch {
      /* ok */
    }
  }
}

export async function confirmAppointment(appointmentId: string) {
  return updateAppointmentStatus(appointmentId, 'confirmed');
}

export async function startConsultationAppointment(appointmentId: string) {
  return updateAppointmentStatus(appointmentId, 'in_progress');
}

export async function completeAppointment(appointmentId: string) {
  return updateAppointmentStatus(appointmentId, 'completed');
}
