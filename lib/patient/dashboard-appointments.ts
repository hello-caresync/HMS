import { todayIsoDate } from '@/lib/hospital/smartq-wait';

import {
  isCancelledAppointmentStatus,
  isCompletedAppointmentStatus,
  isInProgressAppointmentStatus,
  normalizeAppointmentStatus,
  shouldTreatAsMissedAppointment,
} from './appointment-status';
import type { MyAppointmentRecord } from './my-appointments';

export type DashboardAppointmentGroups = {
  activeUpcoming: MyAppointmentRecord[];
  actionRequired: MyAppointmentRecord[];
};

function isActiveUpcomingStatus(status?: string | null): boolean {
  const normalized = normalizeAppointmentStatus(status);
  if (!normalized) return false;
  if (
    normalized.includes('CONFIRM') ||
    normalized.includes('SCHEDUL') ||
    normalized === 'CHECKED_IN' ||
    normalized.includes('WAIT') ||
    normalized.includes('PENDING') ||
    normalized.includes('BOOK') ||
    normalized.includes('ISSUED')
  ) {
    return true;
  }
  return isInProgressAppointmentStatus(status);
}

/** Active bookings scheduled for today or a future date (not missed/cancelled/completed). */
export function isActiveUpcomingAppointment(
  appt: MyAppointmentRecord,
  today: string = todayIsoDate(),
): boolean {
  if (shouldTreatAsMissedAppointment(appt)) return false;
  const combined = appt.status ?? appt.queue_status;
  if (isCancelledAppointmentStatus(combined)) return false;
  if (isCompletedAppointmentStatus(combined)) return false;
  if (!isActiveUpcomingStatus(combined)) return false;
  return appt.appointment_date >= today;
}

/** Split patient appointments into live bookings vs missed / action-required. */
export function partitionDashboardAppointments(
  appointments: MyAppointmentRecord[],
  today: string = todayIsoDate(),
): DashboardAppointmentGroups {
  const activeUpcoming: MyAppointmentRecord[] = [];
  const actionRequired: MyAppointmentRecord[] = [];

  for (const appt of appointments) {
    if (shouldTreatAsMissedAppointment(appt)) {
      actionRequired.push(appt);
    } else if (isActiveUpcomingAppointment(appt, today)) {
      activeUpcoming.push(appt);
    }
  }

  activeUpcoming.sort((a, b) => {
    const dateCompare = a.appointment_date.localeCompare(b.appointment_date);
    if (dateCompare !== 0) return dateCompare;
    return String(a.slot_time).localeCompare(String(b.slot_time));
  });

  actionRequired.sort((a, b) => b.appointment_date.localeCompare(a.appointment_date));

  return { activeUpcoming, actionRequired };
}

export function mapToDashboardVisit(appt: MyAppointmentRecord): {
  id: string;
  doctor_id?: string;
  doctor_name: string;
  department: string;
  appointment_date: string;
  appointment_time?: string;
  slot_time: string;
  token_number: number | string;
  queue_status: string;
  status?: string;
  booking_for?: string;
  reason?: string;
  symptoms?: string;
  patient_name?: string;
  is_self?: boolean;
  beneficiary_relation?: string;
  hospital_name?: string;
  fee?: string;
} {
  const tokenRaw = appt.token_number;
  const tokenNumber =
    typeof tokenRaw === 'number'
      ? tokenRaw
      : String(tokenRaw ?? '').replace(/^#/, '') || '—';

  return {
    id: appt.id,
    doctor_id: appt.doctor_id,
    doctor_name: appt.doctor_name,
    department: appt.department,
    appointment_date: appt.appointment_date,
    appointment_time: appt.slot_time,
    slot_time: appt.slot_time,
    token_number: tokenNumber,
    queue_status: appt.queue_status ?? appt.status ?? 'WAITING',
    status: appt.status,
    booking_for: appt.booking_for,
    reason: appt.reason,
    symptoms: appt.symptoms ?? appt.reason,
    patient_name: appt.patient_name,
    is_self: appt.is_self,
    beneficiary_relation: appt.beneficiary_relation,
    hospital_name: appt.hospital_name,
    fee: appt.fee,
  };
}
