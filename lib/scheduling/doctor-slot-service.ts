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

function doctorScopeFilter(doctorId: string): string {
  const raw = String(doctorId).trim();
  if (!raw) return 'doctor_id.eq.__invalid__';
  const upper = raw.toUpperCase();
  const clauses = new Set([
    `doctor_id.eq.${raw}`,
    `doctor_code.eq.${raw}`,
    `doctor_employee_id.eq.${raw}`,
  ]);
  if (upper !== raw) {
    clauses.add(`doctor_id.eq.${upper}`);
    clauses.add(`doctor_code.eq.${upper}`);
    clauses.add(`doctor_employee_id.eq.${upper}`);
  }
  return Array.from(clauses).join(',');
}

/** Loads active appointment times already reserved for this doctor on the given date. */
export async function fetchDoctorBookedSlotTimes(
  supabase: SupabaseClient,
  doctorId: string,
  appointmentDate: string,
): Promise<string[]> {
  if (!doctorId || !appointmentDate) return [];

  const { data, error } = await supabase
    .from('appointments')
    .select('appointment_time, slot_time, time_slot, status')
    .eq('appointment_date', appointmentDate)
    .or(doctorScopeFilter(doctorId));

  if (error) {
    console.warn('[fetchDoctorBookedSlotTimes]', error.message);
    return [];
  }

  return (data ?? [])
    .filter((row) => {
      const status = String((row as Record<string, unknown>).status ?? '').toLowerCase();
      return status && !CANCELLED_STATUSES.has(status);
    })
    .map((row) => {
      const record = row as Record<string, unknown>;
      return normalizeSlotTime(
        String(record.slot_time ?? record.appointment_time ?? record.time_slot ?? ''),
      );
    })
    .filter(Boolean);
}

export async function loadDynamicDoctorSchedule(
  supabase: SupabaseClient,
  doctorId: string,
  appointmentDate: string,
  clinicalReason?: string,
): Promise<{ slots: DynamicSlot[]; bookedTimes: string[] }> {
  const bookedTimes = await fetchDoctorBookedSlotTimes(supabase, doctorId, appointmentDate);
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
