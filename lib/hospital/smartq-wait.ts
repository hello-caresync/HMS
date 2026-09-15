const SLA_WAIT_MINUTES = 45;
const SESSION_CAP_MINUTES = 12 * 60;

export function todayIsoDate(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isSameLocalDay(iso?: string | null, now = new Date()): boolean {
  if (!iso) return false;
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) {
    return String(iso).slice(0, 10) === todayIsoDate(now);
  }
  return (
    value.getFullYear() === now.getFullYear() &&
    value.getMonth() === now.getMonth() &&
    value.getDate() === now.getDate()
  );
}

export function isTodayClinicAppointment(input: {
  appointment_date?: string | null;
  created_at?: string | null;
}): boolean {
  const date = String(input.appointment_date ?? '').slice(0, 10);
  if (date) return date === todayIsoDate();
  return isSameLocalDay(input.created_at);
}

function parseHourMinute(raw: string): { hours: number; minutes: number } | null {
  const value = String(raw ?? '').trim();
  if (!value) return null;

  const ampm = value.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (ampm) {
    let hours = Number(ampm[1]);
    const minutes = Number(ampm[2] ?? 0);
    const period = ampm[3].toUpperCase();
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
    return { hours, minutes };
  }

  const military = value.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (military) {
    return { hours: Number(military[1]), minutes: Number(military[2]) };
  }

  return null;
}

export function parseSlotOnDate(appointmentDate: string, slotTime?: string | null): Date | null {
  const date = String(appointmentDate || todayIsoDate()).slice(0, 10);
  const parsed = parseHourMinute(String(slotTime ?? ''));
  if (!parsed || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const stamp = new Date(`${date}T${String(parsed.hours).padStart(2, '0')}:${String(parsed.minutes).padStart(2, '0')}:00`);
  return Number.isNaN(stamp.getTime()) ? null : stamp;
}

export function clinicSessionWaitMinutes(input: {
  appointment_date?: string | null;
  slot_time?: string | null;
  created_at?: string | null;
  now?: Date;
}): number | null {
  const now = input.now ?? new Date();
  if (!isTodayClinicAppointment(input)) return null;

  const slot = parseSlotOnDate(String(input.appointment_date || todayIsoDate(now)), input.slot_time);
  if (slot) {
    const mins = Math.round((now.getTime() - slot.getTime()) / 60000);
    return Math.min(SESSION_CAP_MINUTES, Math.max(0, mins));
  }

  const created = input.created_at ? new Date(input.created_at) : null;
  if (created && !Number.isNaN(created.getTime()) && isSameLocalDay(input.created_at, now)) {
    const mins = Math.round((now.getTime() - created.getTime()) / 60000);
    return Math.min(SESSION_CAP_MINUTES, Math.max(0, mins));
  }

  return 0;
}

export function formatClinicWait(minutes: number | null): string {
  if (minutes == null) return '—';
  if (minutes < 1) return '<1m';
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export function isWaitingStatus(status: string): boolean {
  const value = String(status ?? '').toLowerCase();
  return value === 'waiting' || value === 'active' || value === 'queued' || value === 'checked-in';
}

export function isSlaBreachWaiting(status: string, waitMinutes: number | null): boolean {
  return isWaitingStatus(status) && waitMinutes != null && waitMinutes > SLA_WAIT_MINUTES;
}

export const NEXT_CLINIC_SLOTS = [
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '12:00 PM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
  '03:30 PM',
  '04:00 PM',
  '04:30 PM',
  '05:00 PM',
] as const;

export function nextOpenClinicSlot(currentSlot?: string | null, from = new Date()): { date: string; slot: string } {
  const today = todayIsoDate(from);
  const currentIndex = NEXT_CLINIC_SLOTS.findIndex(
    (slot) => slot.toLowerCase() === String(currentSlot ?? '').trim().toLowerCase(),
  );
  const start = currentIndex >= 0 ? currentIndex + 1 : 0;
  for (let index = start; index < NEXT_CLINIC_SLOTS.length; index += 1) {
    const candidate = parseSlotOnDate(today, NEXT_CLINIC_SLOTS[index]);
    if (candidate && candidate.getTime() > from.getTime()) {
      return { date: today, slot: NEXT_CLINIC_SLOTS[index] };
    }
  }

  const tomorrow = new Date(from);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return { date: todayIsoDate(tomorrow), slot: NEXT_CLINIC_SLOTS[0] };
}
