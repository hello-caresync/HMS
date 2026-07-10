/** Calendar helpers — 15-minute slot grid for day-at-a-glance scheduling */

import type { Appointment, BlockedSlot, SlotState } from '../types';
import { SLOT_INTERVAL_MINUTES } from '../types';

export const DAY_START_HOUR = 8;
export const DAY_END_HOUR = 18;

export function parseTime(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function formatTimeLabel(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatHourLabel(hour: number): string {
  if (hour === 12) return '12 PM';
  if (hour > 12) return `${hour - 12} PM`;
  return `${hour} AM`;
}

export function generateDaySlots(): string[] {
  const slots: string[] = [];
  const start = DAY_START_HOUR * 60;
  const end = DAY_END_HOUR * 60;
  for (let m = start; m < end; m += SLOT_INTERVAL_MINUTES) {
    slots.push(formatTimeLabel(m));
  }
  return slots;
}

export const DAY_SLOTS = generateDaySlots();

export function getWeekDates(anchor: string): string[] {
  const d = new Date(anchor + 'T12:00:00');
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(monday);
    dt.setDate(monday.getDate() + i);
    return dt.toISOString().slice(0, 10);
  });
}

export function formatDateLabel(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(iso + 'T12:00:00'));
}

export function formatFullDateLabel(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso + 'T12:00:00'));
}

export function isSlotBlocked(
  doctorId: string,
  date: string,
  startTime: string,
  blockedSlots: BlockedSlot[],
): boolean {
  return blockedSlots.some(
    (b) => b.doctorId === doctorId && b.date === date && b.startTime === startTime,
  );
}

export function findAppointmentAtSlot(
  appointments: Appointment[],
  doctorId: string,
  date: string,
  startTime: string,
): Appointment | undefined {
  const slotStart = parseTime(startTime);
  const slotEnd = slotStart + SLOT_INTERVAL_MINUTES;
  return appointments.find((a) => {
    if (a.doctorId !== doctorId || a.date !== date || a.status === 'Cancelled') return false;
    const aptStart = parseTime(a.startTime);
    return aptStart >= slotStart && aptStart < slotEnd;
  });
}

export function resolveSlotState(
  doctorId: string,
  date: string,
  startTime: string,
  appointments: Appointment[],
  blockedSlots: BlockedSlot[],
): SlotState {
  if (isSlotBlocked(doctorId, date, startTime, blockedSlots)) return 'blocked';
  if (findAppointmentAtSlot(appointments, doctorId, date, startTime)) return 'booked';
  return 'available';
}

export function slotRowIndex(startTime: string): number {
  const mins = parseTime(startTime) - DAY_START_HOUR * 60;
  return Math.floor(mins / SLOT_INTERVAL_MINUTES);
}

export function groupSlotsByHour(slots: string[]): { hour: number; slots: string[] }[] {
  const groups = new Map<number, string[]>();
  slots.forEach((slot) => {
    const hour = Math.floor(parseTime(slot) / 60);
    const list = groups.get(hour) ?? [];
    list.push(slot);
    groups.set(hour, list);
  });
  return Array.from(groups.entries()).map(([hour, hourSlots]) => ({
    hour,
    slots: hourSlots,
  }));
}
