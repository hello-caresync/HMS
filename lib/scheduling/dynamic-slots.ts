import { parseSlotOnDate, todayIsoDate } from '@/lib/hospital/smartq-wait';

export type ConditionTier = 'acute' | 'complex' | 'routine';

export type DynamicSlot = {
  time: string;
  label: string;
  period: 'Morning' | 'Afternoon' | 'Evening';
  intervalMinutes: number;
  durationMinutes: number;
  isPast: boolean;
  isBooked: boolean;
  isSelectable: boolean;
};

export const CLINIC_OPEN_HOUR = 9;
export const CLINIC_CLOSE_HOUR = 19;
/** Minimum lead time before a slot can be booked today. */
export const SLOT_LEAD_MINUTES = 10;

const ACUTE_PATTERN =
  /\b(chest\s*(pain|tight)|heart\s*attack|stroke|emergency|trauma|acute|severe|unconscious|bleeding|breathless|can't breathe|high fever|104|105|stat)\b/i;
const COMPLEX_PATTERN =
  /\b(orthop|surgical|surgery|fracture|chronic|multi.?system|joint|knee|hip|spine|mri|procedure|biopsy|post.?op|follow.?up\s*surgery|replacement)\b/i;

export function classifyConditionTier(reason?: string | null): ConditionTier {
  const text = String(reason ?? '').trim();
  if (!text) return 'routine';
  if (ACUTE_PATTERN.test(text)) return 'acute';
  if (COMPLEX_PATTERN.test(text)) return 'complex';
  return 'routine';
}

export function slotIntervalMinutes(tier: ConditionTier): number {
  if (tier === 'acute') return 15;
  if (tier === 'complex') return 30;
  return 20;
}

export function consultationDurationMinutes(tier: ConditionTier): number {
  if (tier === 'acute') return 15;
  if (tier === 'complex') return 45;
  return 20;
}

export function normalizeSlotTime(raw: string): string {
  const value = String(raw ?? '').trim();
  if (!value) return '';

  const parsed = parseSlotOnDate(todayIsoDate(), value);
  if (!parsed) return value;

  return parsed.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function slotTimesMatch(a: string, b: string): boolean {
  const left = normalizeSlotTime(a).replace(/\s/g, '').toUpperCase();
  const right = normalizeSlotTime(b).replace(/\s/g, '').toUpperCase();
  return Boolean(left && right && left === right);
}

function formatSlotTime(date: Date): string {
  return date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function dayPeriod(hours: number): DynamicSlot['period'] {
  if (hours < 12) return 'Morning';
  if (hours < 16) return 'Afternoon';
  return 'Evening';
}

function buildSlotLabel(time: string, period: DynamicSlot['period'], isBooked: boolean): string {
  return `${time} - ${period}${isBooked ? ' — [Booked]' : ''}`;
}

export function isSlotExpiredForToday(
  appointmentDate: string,
  slotTime: string,
  now = new Date(),
): boolean {
  const today = todayIsoDate(now);
  if (String(appointmentDate).slice(0, 10) !== today) return false;
  const slotAt = parseSlotOnDate(today, slotTime);
  if (!slotAt) return false;
  const leadBoundary = new Date(now.getTime() + SLOT_LEAD_MINUTES * 60_000);
  return slotAt.getTime() <= leadBoundary.getTime();
}

export function generateDynamicSlots(input: {
  appointmentDate: string;
  bookedTimes?: string[];
  clinicalReason?: string;
  now?: Date;
}): DynamicSlot[] {
  const now = input.now ?? new Date();
  const appointmentDate = String(input.appointmentDate).slice(0, 10);
  const tier = classifyConditionTier(input.clinicalReason);
  const intervalMinutes = slotIntervalMinutes(tier);
  const durationMinutes = consultationDurationMinutes(tier);
  const bookedSet = new Set(
    (input.bookedTimes ?? []).map((time) => normalizeSlotTime(time)).filter(Boolean),
  );
  const isToday = appointmentDate === todayIsoDate(now);

  const slots: DynamicSlot[] = [];
  const cursor = new Date(`${appointmentDate}T${String(CLINIC_OPEN_HOUR).padStart(2, '0')}:00:00`);
  const closeAt = new Date(`${appointmentDate}T${String(CLINIC_CLOSE_HOUR).padStart(2, '0')}:00:00`);

  while (cursor.getTime() < closeAt.getTime()) {
    const time = formatSlotTime(cursor);
    const period = dayPeriod(cursor.getHours());
    const isBooked = [...bookedSet].some((booked) => slotTimesMatch(booked, time));
    const isPast = isToday
      ? cursor.getTime() <= now.getTime() + SLOT_LEAD_MINUTES * 60_000
      : false;
    const isSelectable = !isPast && !isBooked;

    slots.push({
      time,
      label: buildSlotLabel(time, period, isBooked),
      period,
      intervalMinutes,
      durationMinutes,
      isPast,
      isBooked,
      isSelectable,
    });

    cursor.setMinutes(cursor.getMinutes() + intervalMinutes);
  }

  return slots;
}

export function pickFirstSelectableSlot(slots: DynamicSlot[]): DynamicSlot | null {
  return slots.find((slot) => slot.isSelectable) ?? null;
}

export function hasSelectableSlots(slots: DynamicSlot[]): boolean {
  return slots.some((slot) => slot.isSelectable);
}
