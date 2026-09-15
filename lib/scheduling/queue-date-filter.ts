import { todayIsoDate } from '@/lib/hospital/smartq-wait';

export { todayIsoDate } from '@/lib/hospital/smartq-wait';

export type QueueDateFilterMode = 'today' | 'tomorrow' | 'upcoming' | 'custom';

export type QueueDateFilter = {
  mode: QueueDateFilterMode;
  customDate?: string;
};

export const DEFAULT_QUEUE_DATE_FILTER: QueueDateFilter = { mode: 'today' };

export function tomorrowIsoDate(now = new Date()): string {
  const next = new Date(now);
  next.setDate(next.getDate() + 1);
  return todayIsoDate(next);
}

/** Resolve the clinic date for a queue row (appointment_date preferred, created_at fallback). */
export function resolveAppointmentRowDate(row: Record<string, unknown>): string {
  const explicit = String(row.appointment_date ?? '').slice(0, 10);
  if (explicit) return explicit;
  return String(row.created_at ?? '').slice(0, 10);
}

export function matchesQueueDateFilter(
  row: Record<string, unknown>,
  filter: QueueDateFilter = DEFAULT_QUEUE_DATE_FILTER,
  now = new Date(),
): boolean {
  const rowDate = resolveAppointmentRowDate(row);
  const today = todayIsoDate(now);
  const tomorrow = tomorrowIsoDate(now);

  if (!rowDate) {
    return filter.mode === 'today';
  }

  switch (filter.mode) {
    case 'today':
      return rowDate === today;
    case 'tomorrow':
      return rowDate === tomorrow;
    case 'upcoming':
      return rowDate >= today;
    case 'custom': {
      const target = String(filter.customDate ?? '').slice(0, 10);
      return Boolean(target) && rowDate === target;
    }
    default:
      return rowDate === today;
  }
}

export function isFutureAppointmentDate(isoDate: string, now = new Date()): boolean {
  const normalized = String(isoDate ?? '').slice(0, 10);
  if (!normalized) return false;
  return normalized > todayIsoDate(now);
}

export function formatQueueDateBadge(isoDate: string): string {
  const normalized = String(isoDate ?? '').slice(0, 10);
  if (!normalized) return 'Scheduled';
  const parsed = new Date(`${normalized}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return `Scheduled: ${normalized}`;
  return `Scheduled: ${parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

export function formatQueueSlotTime(raw?: string | null): string {
  const value = String(raw ?? '').trim();
  if (!value) return '—';
  if (/am|pm/i.test(value)) return value;
  const match = value.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return value;
  const hours = Number(match[1]);
  const minutes = match[2];
  if (!Number.isFinite(hours)) return value;
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes} ${period}`;
}

export function queueDateFilterKey(filter: QueueDateFilter): string {
  if (filter.mode === 'custom') {
    return `custom:${String(filter.customDate ?? '').slice(0, 10)}`;
  }
  return filter.mode;
}
