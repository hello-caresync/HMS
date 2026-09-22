import { resolveActiveAuthUser } from '@/lib/auth/resolve-active-auth-user';
import { createClient } from '@/lib/supabase/client';
import { resolveDoctorBookingIdentity } from '@/lib/hospital/doctor-booking-identity';
import { insertAppointmentRowResilient } from '@/lib/hospital/appointments';
import { sanitizePhoneDigits, validatePhoneField } from '@/lib/hospital/indian-patient';
import { resolveHospitalUuid } from '@/lib/hospital/resolve-hospital-context';
import { REGAL_FACILITY_CODE, REGAL_HOSPITAL_CODE } from '@/lib/regal/constants';
import { createConsultationFromAppointment } from '@/lib/db/consultations';
import { readPatientPortalSession, mintPatientUhid } from '@/lib/patient/portal-session';
import { assertProfileCompleteForBooking } from '@/lib/patient/profile-completeness';
import { resolveEffectivePatientId } from '@/lib/patient/resolve-effective-patient-id';
import { assertSlotAvailableForBooking } from '@/lib/scheduling/doctor-slot-service';
import {
  classifyConditionTier,
  consultationDurationMinutes,
  normalizeSlotTime,
} from '@/lib/scheduling/dynamic-slots';

export interface BookAppointmentPayload {
  patientId?: string;
  patient_id?: string;
  patientName?: string;
  patient_name?: string;
  doctor?: {
    id?: string;
    doctor_id?: string;
    employeeId?: string;
    department?: string;
    name?: string;
    full_name?: string;
  };
  doctor_uuid?: string;
  doctor_code?: string;
  doctor_record_id?: string;
  doctor_employee_id?: string;
  doctorId?: string;
  doctor_id?: string;
  doctorName?: string;
  doctor_name?: string;
  appointmentDate?: string;
  appointment_date?: string;
  slotTime?: string;
  appointment_time?: string;
  reason?: string;
  reason_for_visit?: string;
  reasonForVisit?: string;
  department?: string;
  hospitalName?: string;
  hospitalId?: string;
  hospital_id?: string;
  phone?: string;
  booking_for?: string;
  skipProfileCheck?: boolean;
  authUserId?: string;
  userId?: string;
  [key: string]: unknown;
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
  const session = typeof window !== 'undefined' ? readPatientPortalSession() : null;
  const supabase = createClient();

  if (!payload.skipProfileCheck) {
    await assertProfileCompleteForBooking(supabase);
  }

  const fallbackAuthId = [
    payload.authUserId,
    payload.userId,
    payload.patient_id,
    payload.patientId,
    session?.patient_id,
  ]
    .map((value) => String(value ?? '').trim())
    .find(Boolean);

  const authContext = await resolveActiveAuthUser(supabase, fallbackAuthId);

  if (!authContext?.userId) {
    throw new Error('User session not found. Please log in again.');
  }

  const sessionPatientHint =
    payload.patient_id ||
    payload.patientId ||
    authContext.userId ||
    session?.patient_id ||
    DEFAULT_PATIENT_ID;
  const doctorIdentity = resolveDoctorBookingIdentity({
    doctor_uuid: payload.doctor_uuid,
    doctor_id: payload.doctor_id ?? payload.doctorId ?? payload.doctor?.doctor_id,
    id: payload.doctor_record_id ?? payload.doctor?.id,
    doctor_code: payload.doctor_code ?? payload.doctor?.employeeId,
    employee_id: payload.doctor?.employeeId,
    doctor_employee_id: payload.doctor_employee_id,
    full_name: payload.doctor_name ?? payload.doctorName ?? payload.doctor?.full_name,
    doctor_name: payload.doctor_name ?? payload.doctorName ?? payload.doctor?.name,
    name: payload.doctor?.name,
    department: payload.department ?? payload.doctor?.department,
  });

  const doctorCode = doctorIdentity.doctorCode;
  const doctorUuid = doctorIdentity.doctorUuid;
  if (!doctorCode && !doctorUuid) {
    throw new Error('Doctor selection is required.');
  }
  const doctorName = doctorIdentity.doctorName;
  if (!doctorName) {
    throw new Error('Doctor name is required.');
  }
  const department = doctorIdentity.department || payload.department || DEFAULT_DEPARTMENT;
  if (!String(department).trim()) {
    throw new Error('Doctor department is required.');
  }
  const reasonForVisit =
    payload.reason_for_visit ||
    payload.reasonForVisit ||
    payload.reason ||
    DEFAULT_REASON;
  const appointmentDate =
    payload.appointment_date || payload.appointmentDate || localDateString();
  const appointmentTime = normalizeSlotTime(
    String(payload.appointment_time || payload.slotTime || ''),
  );
  if (!appointmentTime) {
    throw new Error('Please select a valid appointment time slot.');
  }

  await assertSlotAvailableForBooking(supabase, {
    doctorId: doctorUuid || doctorCode,
    appointmentDate,
    slotTime: appointmentTime,
  });

  const conditionTier = classifyConditionTier(reasonForVisit);
  const slotDurationMinutes = consultationDurationMinutes(conditionTier);
  const patientName =
    payload.patient_name || payload.patientName || session?.patient_name || 'Verified Patient';
  const preferredHospital =
    payload.hospital_id || payload.hospitalId || session?.hospital_id || REGAL_HOSPITAL_CODE;
  const hospitalNodeTag = REGAL_HOSPITAL_CODE;
  const hospitalUuid = await resolveHospitalUuid(supabase, preferredHospital);
  const uhid = session?.uhid || mintPatientUhid();
  const phoneCheck = validatePhoneField(
    sanitizePhoneDigits(String(payload.phone ?? session?.phone ?? '')),
    true,
  );
  if (!phoneCheck.ok) {
    throw new Error(phoneCheck.message);
  }
  const phone = phoneCheck.phone!;

  const resolvedPatient = await resolveEffectivePatientId(supabase, {
    phone,
    sessionPatientId: String(sessionPatientHint),
  });
  const patientId = resolvedPatient.effectivePatientId || String(sessionPatientHint);

  let tokenNumber = 1;
  try {
    const { count, error: countError } = await supabase
      .from('appointments')
      .select('appointment_id', { count: 'exact', head: true })
      .or(
        [
          doctorUuid ? `doctor_id.eq.${doctorUuid}` : '',
          doctorCode ? `doctor_id.eq.${doctorCode}` : '',
          doctorCode ? `doctor_code.eq.${doctorCode}` : '',
          doctorCode ? `doctor_employee_id.eq.${doctorCode}` : '',
        ]
          .filter(Boolean)
          .join(','),
      )
      .eq('appointment_date', appointmentDate)
      .in('status', ACTIVE_BOOKING_STATUSES);

    if (!countError && count !== null) {
      tokenNumber = count + 1;
    }
  } catch (err) {
    console.warn('Failed to calculate daily token count, defaulting to T-01:', err);
  }

  const tokenLabel = `T-${tokenNumber.toString().padStart(2, '0')}`;

  const insertPayload: Record<string, unknown> = {
    hospital_id: hospitalNodeTag,
    hospital_code: REGAL_HOSPITAL_CODE,
    facility_code: REGAL_FACILITY_CODE,
    hospital_name: payload.hospitalName || session?.hospital_name || 'Regal Hospital',
    uhid,
    phone,
    patient_phone: phone,
    patient_name: patientName,
    doctor_id: doctorUuid || doctorCode,
    doctor_uuid: doctorUuid,
    doctor_code: doctorCode || doctorUuid,
    doctor_employee_id: doctorCode || doctorUuid,
    doctor_name: doctorName,
    department,
    reason_for_visit: reasonForVisit,
    chief_complaint: reasonForVisit,
    symptoms: reasonForVisit,
    appointment_date: appointmentDate,
    appointment_time: appointmentTime,
    slot_time: appointmentTime,
    time_slot: appointmentTime,
    slot_duration_minutes: slotDurationMinutes,
    consultation_duration_minutes: slotDurationMinutes,
    status: 'WAITING',
    queue_status: 'WAITING',
    billing_status: 'pending_checkout',
    consultation_fee: Number(payload.consultation_fee ?? payload.fee ?? 500) || 500,
    token_number: tokenLabel,
    source: 'patient_app',
    created_at: new Date().toISOString(),
  };

  if (payload.booking_for) {
    insertPayload.booking_for = payload.booking_for;
  }
  if (payload.beneficiary_relation) {
    insertPayload.beneficiary_relation = payload.beneficiary_relation;
  }

  if (patientId) {
    insertPayload.patient_id = patientId;
  }

  const { data: apptData, error: apptError } = await insertAppointmentRowResilient(
    supabase,
    insertPayload,
    { select: 'appointment_id, id' },
  );

  if (apptError) {
    console.error('[Supabase Booking Error]:', apptError.message);
    throw apptError;
  }

  if (!apptData) {
    throw new Error('No appointment data returned from database.');
  }

  const appointmentId = String(apptData.appointment_id ?? apptData.id ?? '');

  const linkedPatientUuid =
    resolvedPatient.patientRecordId ||
    (patientId && /^[0-9a-f-]{36}$/i.test(String(patientId)) ? String(patientId) : null);

  try {
    await createConsultationFromAppointment(supabase, {
      hospitalId: hospitalNodeTag,
      patientId: linkedPatientUuid,
      appointmentId,
      uhid,
      patientName,
      doctorId: String(doctorCode || doctorUuid),
      doctorName,
      department,
      symptoms: reasonForVisit,
      status: 'QUEUED',
      consultationDate: appointmentDate,
    });
  } catch {
    /* non-blocking ledger write */
  }

  try {
    await supabase.from('hospital_opd_queue').insert({
      hospital_id: hospitalUuid || hospitalNodeTag,
      hospital_code: REGAL_HOSPITAL_CODE,
      hospital_name: insertPayload.hospital_name,
      token_number: tokenLabel,
      uhid,
      patient_name: patientName,
      phone,
      department,
      doctor_id: doctorCode,
      doctor_name: doctorName,
      status: 'WAITING',
      source: 'patient_app',
      appointment_date: appointmentDate,
    });
  } catch {
    /* dashboard still reads appointments */
  }

  return {
    success: true,
    appointment_id: appointmentId,
    token_number: tokenNumber,
    token_label: tokenLabel,
    message: `Appointment successfully booked! Your queue token is ${tokenLabel}.`,
  };
}
