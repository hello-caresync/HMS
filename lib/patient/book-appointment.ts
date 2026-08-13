import { createClient } from '@/lib/supabase/client';

export interface BookAppointmentPayload {
  patient_id?: string;
  patientId?: string;
  doctor_id?: string;
  doctorId?: string;
  appointment_date?: string;
  appointment_time?: string;
  reason?: string;
  reason_for_visit?: string;
  department?: string;
}

export interface BookAppointmentResponse {
  success: boolean;
  appointment_id: string;
  token_number: number;
  token_label: string;
  message?: string;
}

export const DEFAULT_DOCTOR_ID = '56284599-9a5f-4672-9b53-b90e18146a00';
export const DEFAULT_PATIENT_ID = 'b0000000-0000-0000-0000-000000000002';
export const DEFAULT_DEPARTMENT = 'General Surgery';
export const DEFAULT_REASON = 'General Health Consultation';

const ACTIVE_BOOKING_STATUSES = ['SCHEDULED', 'WAITING', 'CONFIRMED', 'PENDING'];

/** Local calendar date YYYY-MM-DD (avoids UTC midnight drift). */
function localDateString(date = new Date()): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().split('T')[0];
}

export async function bookAppointmentWithDoctor(
  payload: BookAppointmentPayload,
): Promise<BookAppointmentResponse> {
  const supabase = createClient();

  const { data: authData } = await supabase.auth.getUser();
  const patientId =
    payload.patient_id || payload.patientId || authData?.user?.id || DEFAULT_PATIENT_ID;
  const doctorId = payload.doctor_id || payload.doctorId || DEFAULT_DOCTOR_ID;
  const department = payload.department || DEFAULT_DEPARTMENT;
  const reasonForVisit = payload.reason_for_visit || payload.reason || DEFAULT_REASON;
  const appointmentDate = payload.appointment_date || localDateString();
  const appointmentTime = payload.appointment_time || '10:00 AM';

  let tokenNumber = 1;
  try {
    const { count, error: countError } = await supabase
      .from('appointments')
      .select('appointment_id', { count: 'exact', head: true })
      .eq('doctor_id', doctorId)
      .eq('appointment_date', appointmentDate)
      .in('status', ACTIVE_BOOKING_STATUSES);

    if (!countError && count !== null) {
      tokenNumber = count + 1;
    }
  } catch (err) {
    console.warn('Failed to calculate daily token count, defaulting to T-01:', err);
  }

  const tokenLabel = `T-${tokenNumber.toString().padStart(2, '0')}`;

  const insertPayload = {
    patient_id: patientId,
    doctor_id: doctorId,
    department,
    reason_for_visit: reasonForVisit,
    appointment_date: appointmentDate,
    appointment_time: appointmentTime,
    status: 'SCHEDULED',
  };

  const { data: apptData, error: apptError } = await supabase
    .from('appointments')
    .insert([insertPayload])
    .select('appointment_id, id')
    .single();

  if (apptError) {
    const msg =
      typeof apptError === 'object' && apptError !== null && 'message' in apptError
        ? String((apptError as { message?: string }).message)
        : 'Failed to insert appointment record.';
    console.error('[Supabase Booking Error]:', msg);
    throw new Error(msg);
  }

  if (!apptData) {
    throw new Error('No appointment data returned from database.');
  }

  const appointmentId = String(apptData.appointment_id ?? apptData.id ?? '');

  return {
    success: true,
    appointment_id: appointmentId,
    token_number: tokenNumber,
    token_label: tokenLabel,
    message: `Appointment successfully booked! Your queue token is ${tokenLabel}.`,
  };
}
