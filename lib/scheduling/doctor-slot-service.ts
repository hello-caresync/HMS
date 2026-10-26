import type { SupabaseClient } from '@supabase/supabase-js';

import {
  generateDynamicSlots,
  isSlotExpiredForToday,
  normalizeSlotTime,
  pickFirstSelectableSlot,
  slotTimesMatch,
  type DynamicSlot,
} from '@/lib/scheduling/dynamic-slots';

const CANCELLED_STATUSES = new Set([
  'cancelled',
  'canceled',
  'no_show',
  'no-show',
  'rejected',
  'declined',
]);

const DOCTOR_MATCH_COLUMNS = ['doctor_id', 'doctor_code', 'doctor_employee_id', 'doctor_uuid'] as const;

export type DoctorSlotIdentity = {
  ids?: Array<string | null | undefined>;
  name?: string | null;
};

function quoteOrValue(value: string): string {
  const clean = value.replace(/[",()]/g, '').trim();
  if (!clean) return '';
  return /[\s.:]/.test(clean) ? `"${clean}"` : clean;
}

function uniqueDoctorKeys(doctorId: string, identity?: DoctorSlotIdentity): string[] {
  const keys = new Set<string>();
  for (const value of [doctorId, ...(identity?.ids ?? [])]) {
    const clean = String(value ?? '').trim();
    if (!clean) continue;
    keys.add(clean);
    const upper = clean.toUpperCase();
    if (upper !== clean) keys.add(upper);
  }
  return Array.from(keys);
}

function doctorScopeFilter(keys: string[], columns: readonly string[]): string {
  const clauses: string[] = [];
  for (const key of keys) {
    const value = quoteOrValue(key);
    if (!value) continue;
    for (const column of columns) {
      clauses.push(`${column}.eq.${value}`);
    }
  }
  return clauses.join(',') || 'doctor_id.eq.__invalid__';
}

function missingFilterColumn(message: string): string | null {
  const match = message.match(/column (?:[\w]+\.)?([a-z_]+) does not exist/i)
    ?? message.match(/could not find the '([a-z_]+)' column/i);
  return match?.[1] ?? null;
}

/** Loads active appointment times already reserved for this doctor on the given date. */
function activeBookedTimes(rows: Array<Record<string, unknown>>): string[] {
  return rows
    .filter((row) => {
      const status = String(row.status ?? row.queue_status ?? '').trim().toLowerCase();
      if (!status) return true;
      return !CANCELLED_STATUSES.has(status);
    })
    .map((row) =>
      normalizeSlotTime(String(row.slot_time ?? row.appointment_time ?? row.time_slot ?? '')),
    )
    .filter(Boolean);
}

async function selectAppointmentsForDoctor(
  supabase: SupabaseClient,
  appointmentDate: string,
  keys: string[],
): Promise<Array<Record<string, unknown>>> {
  let columns = [...DOCTOR_MATCH_COLUMNS];
  for (let attempt = 0; attempt < columns.length; attempt += 1) {
    const filter = doctorScopeFilter(keys, columns);
    const { data, error } = await supabase
      .from('appointments')
      .select('appointment_time, slot_time, time_slot, status, queue_status')
      .eq('appointment_date', appointmentDate)
      .or(filter);

    if (!error) return (data ?? []) as Array<Record<string, unknown>>;

    const missing = missingFilterColumn(error.message);
    if (!missing || !columns.includes(missing as (typeof DOCTOR_MATCH_COLUMNS)[number])) {
      console.warn('[fetchDoctorBookedSlotTimes]', error.message);
      return [];
    }
    columns = columns.filter((column) => column !== missing);
  }
  return [];
}

export async function fetchDoctorBookedSlotTimes(
  supabase: SupabaseClient,
  doctorId: string,
  appointmentDate: string,
  identity?: DoctorSlotIdentity,
): Promise<string[]> {
  const keys = uniqueDoctorKeys(doctorId, identity);
  const doctorName = String(identity?.name ?? '').trim();
  if ((!keys.length && !doctorName) || !appointmentDate) return [];

  const byId = keys.length
    ? await selectAppointmentsForDoctor(supabase, appointmentDate, keys)
    : [];

  let byName: Array<Record<string, unknown>> = [];
  if (doctorName) {
    const named = await supabase
      .from('appointments')
      .select('appointment_time, slot_time, time_slot, status, queue_status')
      .eq('appointment_date', appointmentDate)
      .ilike('doctor_name', doctorName);
    if (!named.error) {
      byName = (named.data ?? []) as Array<Record<string, unknown>>;
    }
  }

  return Array.from(new Set([...activeBookedTimes(byId), ...activeBookedTimes(byName)]));
}

export async function loadDynamicDoctorSchedule(
  supabase: SupabaseClient,
  doctorId: string,
  appointmentDate: string,
  clinicalReason?: string,
  identity?: DoctorSlotIdentity,
): Promise<{ slots: DynamicSlot[]; bookedTimes: string[] }> {
  const bookedTimes = await fetchDoctorBookedSlotTimes(
    supabase,
    doctorId,
    appointmentDate,
    identity,
  );
  const slots = generateDynamicSlots({
    appointmentDate,
    bookedTimes,
    clinicalReason,
  });
  return { slots, bookedTimes };
}

export async function assertSlotAvailableForBooking(
  supabase: SupabaseClient,
  input: {
    doctorId: string;
    appointmentDate: string;
    slotTime: string;
    doctorIds?: Array<string | null | undefined>;
    doctorName?: string | null;
  },
): Promise<void> {
  const normalized = normalizeSlotTime(input.slotTime);
  if (!normalized) {
    throw new Error('Please select a valid appointment time.');
  }

  if (isSlotExpiredForToday(input.appointmentDate, normalized)) {
    throw new Error('This time slot has expired. Please choose the next available slot.');
  }

  const bookedTimes = await fetchDoctorBookedSlotTimes(
    supabase,
    input.doctorId,
    input.appointmentDate,
    { ids: input.doctorIds, name: input.doctorName },
  );

  if (bookedTimes.some((booked) => slotTimesMatch(booked, normalized))) {
    throw new Error('This slot was just booked by another patient. Please select a different time.');
  }
}

export function resolveAutoSelectedSlot(
  slots: DynamicSlot[],
  currentSlot?: string | null,
): DynamicSlot | null {
  if (currentSlot) {
    const existing = slots.find(
      (slot) => slot.isSelectable && slotTimesMatch(slot.time, currentSlot),
    );
    if (existing) return existing;
  }
  return pickFirstSelectableSlot(slots);
}
