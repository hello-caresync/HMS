import type { SupabaseClient } from '@supabase/supabase-js';

export type RealTimeSlot = {
  id: string;
  slotTime: string;
  isBooked: boolean;
  dayOfWeek: number;
};

export function normalizeSlotTime(raw: string): string {
  const parts = raw.trim().split(':');
  const h = parts[0]?.padStart(2, '0') ?? '00';
  const m = (parts[1] ?? '00').padStart(2, '0');
  return `${h}:${m}`;
}

type DoctorTimeSlotRow = {
  id: string;
  doctor_id: string;
  day_of_week: number;
  slot_time: string;
  is_active: boolean;
};

type AppointmentRow = {
  time_slot: string;
  status: string;
};

export type FetchRealTimeSlotsResult = {
  slots: RealTimeSlot[];
  source: 'supabase' | 'local';
};

/** Fetch live slots from Supabase; falls back to local seed slots when tables are empty/unavailable. */
export async function fetchRealTimeSlots(
  supabase: SupabaseClient,
  doctorId: string,
  selectedDate: string,
  fallbackSlotTimes: string[],
  localBookedTimes: string[] = [],
): Promise<FetchRealTimeSlotsResult> {
  const dayOfWeek = new Date(`${selectedDate}T12:00:00`).getDay();

  const { data: slotRows, error: slotsError } = await supabase
    .from('doctor_time_slots')
    .select('id, doctor_id, day_of_week, slot_time, is_active')
    .eq('doctor_id', doctorId)
    .eq('day_of_week', dayOfWeek)
    .eq('is_active', true)
    .order('slot_time', { ascending: true });

  const { data: bookedRows, error: bookedError } = await supabase
    .from('appointments')
    .select('time_slot, status')
    .eq('doctor_id', doctorId)
    .eq('appointment_date', selectedDate)
    .neq('status', 'CANCELLED');

  const supabaseUnavailable = Boolean(slotsError || bookedError);
  const rows = (slotRows ?? []) as DoctorTimeSlotRow[];

  let slotTimes: { id: string; slotTime: string; dayOfWeek: number }[];

  if (rows.length > 0) {
    slotTimes = rows.map((s) => ({
      id: s.id,
      slotTime: normalizeSlotTime(String(s.slot_time)),
      dayOfWeek: s.day_of_week,
    }));
  } else {
    slotTimes = fallbackSlotTimes.map((t, i) => ({
      id: `local-${doctorId}-${dayOfWeek}-${i}`,
      slotTime: normalizeSlotTime(t),
      dayOfWeek,
    }));
  }

  const bookedFromDb = new Set(
    ((bookedRows ?? []) as AppointmentRow[])
      .filter((b) => b.status?.toUpperCase() !== 'CANCELLED')
      .map((b) => normalizeSlotTime(String(b.time_slot))),
  );
  const bookedLocal = new Set(localBookedTimes.map(normalizeSlotTime));
  const bookedTimes = new Set([...bookedFromDb, ...bookedLocal]);

  const slots: RealTimeSlot[] = slotTimes.map((s) => ({
    id: s.id,
    slotTime: s.slotTime,
    dayOfWeek: s.dayOfWeek,
    isBooked: bookedTimes.has(s.slotTime),
  }));

  return {
    slots,
    source: rows.length > 0 && !supabaseUnavailable ? 'supabase' : 'local',
  };
}

export async function persistAppointmentSlot(
  supabase: SupabaseClient,
  input: {
    patientId: string;
    doctorId: string;
    appointmentDate: string;
    timeSlot: string;
    status?: string;
  },
) {
  const { error } = await supabase.from('appointments').insert({
    patient_id: input.patientId,
    doctor_id: input.doctorId,
    appointment_date: input.appointmentDate,
    time_slot: `${normalizeSlotTime(input.timeSlot)}:00`,
    status: input.status ?? 'BOOKED',
  });
  if (error) throw error;
}
