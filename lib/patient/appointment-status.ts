/** Canonical lifecycle values for `public.appointments.status`. */
export const APPOINTMENT_LIFECYCLE = {
  CONFIRMED: 'CONFIRMED',
  CHECKED_IN: 'CHECKED_IN',
  COMPLETED: 'COMPLETED',
  MISSED: 'MISSED',
  CANCELLED: 'CANCELLED',
} as const;

export type AppointmentLifecycleValue =
  (typeof APPOINTMENT_LIFECYCLE)[keyof typeof APPOINTMENT_LIFECYCLE];

export function normalizeAppointmentStatus(value?: string | null): string {
  return String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/-/g, '_')
    .replace(/\s+/g, '_');
}

export function isMissedAppointmentStatus(value?: string | null): boolean {
  const status = normalizeAppointmentStatus(value);
  return status === 'MISSED' || status.includes('NO_SHOW') || status.includes('NOSHOW');
}

export function isCancelledAppointmentStatus(value?: string | null): boolean {
  return normalizeAppointmentStatus(value).includes('CANCEL');
}

export function isCompletedAppointmentStatus(value?: string | null): boolean {
  const status = normalizeAppointmentStatus(value);
  return status.includes('COMPLET') || status.includes('DONE');
}

export function isInProgressAppointmentStatus(value?: string | null): boolean {
  const status = normalizeAppointmentStatus(value);
  return (
    status.includes('CHECKED_IN') ||
    status.includes('CHECKEDIN') ||
    status.includes('CONSULT') ||
    status.includes('IN_CONSULTATION') ||
    status.includes('IN_PROGRESS')
  );
}

const UNATTENDED_BOOKING_STATUSES = new Set([
  'SCHEDULED',
  'WAITING',
  'CONFIRMED',
  'PENDING',
  'BOOKED',
  'ISSUED',
  'CONFIRMED',
]);

function isUnattendedBookingStatus(value?: string | null): boolean {
  const status = normalizeAppointmentStatus(value);
  if (!status) return false;
  if (UNATTENDED_BOOKING_STATUSES.has(status)) return true;
  return (
    status.includes('SCHEDUL') ||
    status.includes('WAIT') ||
    status.includes('CONFIRM') ||
    status.includes('BOOK') ||
    status.includes('PENDING')
  );
}

/** Parses `YYYY-MM-DD` + `HH:MM` (24h or 12h) into a local Date. */
export function parseAppointmentDateTime(date: string, slotTime?: string | null): Date | null {
  const day = String(date ?? '').slice(0, 10);
  if (!day) return null;

  const rawSlot = String(slotTime ?? '').trim();
  if (!rawSlot || rawSlot === '—') {
    const fallback = new Date(`${day}T23:59:59`);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }

  const match = rawSlot.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) {
    const fallback = new Date(`${day}T23:59:59`);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;

  const parsed = new Date(`${day}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** True when the scheduled slot (+ grace) is in the past. */
export function isAppointmentWindowPassed(
  date: string,
  slotTime?: string | null,
  graceMinutes = 30,
): boolean {
  const slotStart = parseAppointmentDateTime(date, slotTime);
  if (!slotStart) {
    const today = new Date().toISOString().slice(0, 10);
    return String(date).slice(0, 10) < today;
  }
  const deadline = new Date(slotStart.getTime() + graceMinutes * 60 * 1000);
  return Date.now() > deadline.getTime();
}

export function shouldTreatAsMissedAppointment(input: {
  appointment_date: string;
  slot_time?: string | null;
  status?: string | null;
  queue_status?: string | null;
}): boolean {
  const combined = input.status ?? input.queue_status;
  if (isMissedAppointmentStatus(combined)) return true;
  if (
    isCancelledAppointmentStatus(combined) ||
    isCompletedAppointmentStatus(combined) ||
    isInProgressAppointmentStatus(combined)
  ) {
    return false;
  }
  if (!isUnattendedBookingStatus(combined)) return false;
  return isAppointmentWindowPassed(input.appointment_date, input.slot_time);
}
