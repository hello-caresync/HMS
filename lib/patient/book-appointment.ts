import { computeNextSmartQToken } from '@/lib/doctor/smartq-token.service';
import type { BookableDoctor } from '@/lib/doctor/bookable-doctors';
import { enqueuePatientForDoctor, ensurePatientIdPersisted } from '@/lib/clinical/bridge';
import { supabase } from '@/lib/supabaseClient';

export type BookAppointmentInput = {
  patientId: string;
  patientName: string;
  doctor: BookableDoctor;
  appointmentDate: string;
  slotTime: string;
  reasonForVisit: string;
  hospitalName: string;
};

export type BookAppointmentResult = {
  appointmentId: string;
  tokenNumber: number;
  tokenLabel: string;
};

/** Insert appointment bound to `doctors.doctor_id` UUID; token from DB trigger or client fallback. */
export async function bookAppointmentWithDoctor(
  input: BookAppointmentInput,
): Promise<BookAppointmentResult> {
  const patientId = ensurePatientIdPersisted(input.patientId);
  const doctorUuid = input.doctor.doctor_id;

  if (!doctorUuid) {
    throw new Error('Clinician UUID not loaded. Please refresh and try again.');
  }

  const { data: appointment, error: apptError } = await supabase
    .from('appointments')
    .insert({
      patient_id: patientId,
      doctor_id: doctorUuid,
      department: input.doctor.department,
      reason_for_visit: input.reasonForVisit,
      appointment_date: input.appointmentDate,
      appointment_time: input.slotTime,
      status: 'requested',
    })
    .select()
    .single();

  if (apptError) throw new Error(apptError.message);

  let tokenNumber = 0;
  let tokenLabel = '';

  const { data: triggerToken } = await supabase
    .from('opd_tokens')
    .select('token_number, sequence_number')
    .eq('appointment_id', appointment.appointment_id)
    .maybeSingle();

  if (triggerToken) {
    tokenNumber = Number(triggerToken.sequence_number ?? triggerToken.token_number) || 1;
    tokenLabel = String(triggerToken.token_number);
  } else {
    tokenNumber = await computeNextSmartQToken(input.appointmentDate, doctorUuid);
    tokenLabel = `#${tokenNumber}`;

    const { error: tokenError } = await supabase.from('opd_tokens').insert({
      appointment_id: appointment.appointment_id,
      doctor_id: doctorUuid,
      patient_id: patientId,
      token_number: tokenLabel,
      sequence_number: tokenNumber,
      status: 'ISSUED',
      estimated_wait_minutes: 15,
    });

    if (tokenError) console.warn('opd_tokens fallback notice:', tokenError.message);
  }

  const newAppointment = {
    id: String(appointment.appointment_id),
    patient_id: patientId,
    patient_name: input.patientName,
    doctor_id: doctorUuid,
    doctor_name: input.doctor.name,
    department: input.doctor.department,
    hospital_name: input.hospitalName,
    appointment_date: input.appointmentDate,
    slot_time: input.slotTime,
    token_number: tokenNumber,
    current_serving_token: 0,
    queue_status: 'requested',
  };

  const localList = JSON.parse(
    localStorage.getItem('curasync_appointments') || '[]',
  ) as Record<string, unknown>[];
  localList.unshift(newAppointment);
  localStorage.setItem('curasync_appointments', JSON.stringify(localList));
  localStorage.setItem('patient_full_name', input.patientName);

  await enqueuePatientForDoctor({
    patientId,
    patientName: input.patientName,
    doctorId: doctorUuid,
    doctorName: input.doctor.name,
    department: input.doctor.department,
    hospitalName: input.hospitalName,
    appointmentDate: input.appointmentDate,
    slotTime: input.slotTime,
    tokenNumber,
    reasonForVisit: input.reasonForVisit,
    appointmentId: String(appointment.appointment_id),
    age: 32,
    gender: 'Female',
    bloodGroup: localStorage.getItem('patient_blood_group') || 'O+',
    allergies: (() => {
      try {
        const raw = localStorage.getItem('patient_allergies');
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : String(raw).split(',').map((s) => s.trim());
      } catch {
        return [];
      }
    })(),
  });

  return {
    appointmentId: String(appointment.appointment_id),
    tokenNumber,
    tokenLabel,
  };
}
