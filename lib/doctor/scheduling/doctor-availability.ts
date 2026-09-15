import type { SupabaseClient } from '@supabase/supabase-js';

import { REGAL_HOSPITAL_CODE } from '@/lib/regal/constants';
import { resolveHospitalUuid } from '@/lib/hospital/resolve-hospital-context';
import { loadDynamicDoctorSchedule } from '@/lib/scheduling/doctor-slot-service';

export type DoctorTimeSlot = {
  id: string;
  doctor_id: string;
  doctor_name?: string;
  slot_date: string;
  slot_time: string;
  status: 'open' | 'booked' | 'blocked';
  appointment_id?: string;
  consultation_fee?: number;
};

export type DoctorScheduleBlock = {
  id: string;
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  is_active: boolean;
};

function formatSlotDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** @deprecated Prefer loadDynamicDoctorSchedule — kept for legacy callers. */
export async function loadOpenDoctorSlots(
  supabase: SupabaseClient,
  doctorId: string,
  slotDate?: string,
  clinicalReason?: string,
): Promise<DoctorTimeSlot[]> {
  const date = slotDate ?? formatSlotDate(new Date());
  const { slots } = await loadDynamicDoctorSchedule(supabase, doctorId, date, clinicalReason);

  return slots.map((slot, index) => ({
    id: `dynamic-${doctorId}-${date}-${index}-${slot.time.replace(/\s/g, '')}`,
    doctor_id: doctorId,
    slot_date: date,
    slot_time: slot.time,
    status: slot.isBooked ? ('booked' as const) : slot.isSelectable ? ('open' as const) : ('blocked' as const),
  }));
}

export async function upsertDoctorScheduleBlock(
  supabase: SupabaseClient,
  input: Omit<DoctorScheduleBlock, 'id'> & { doctor_name?: string; department?: string },
): Promise<{ ok: boolean; error?: string }> {
  const hospitalId = await resolveHospitalUuid(supabase);
  const payload: Record<string, unknown> = {
    hospital_id: hospitalId,
    hospital_code: REGAL_HOSPITAL_CODE,
    doctor_id: input.doctor_id,
    doctor_name: input.doctor_name ?? null,
    department: input.department ?? null,
    day_of_week: input.day_of_week,
    start_time: input.start_time,
    end_time: input.end_time,
    slot_duration_minutes: input.slot_duration_minutes,
    is_active: input.is_active,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('doctor_schedules').upsert(payload, {
    onConflict: 'doctor_id,day_of_week',
    ignoreDuplicates: false,
  });

  if (error) {
    const insert = await supabase.from('doctor_schedules').insert(payload);
    if (insert.error) return { ok: false, error: insert.error.message };
  }

  return { ok: true };
}

export async function materializeDoctorSlotsForDate(
  supabase: SupabaseClient,
  doctorId: string,
  slotDate: string,
  slotTimes: string[],
  doctorName?: string,
): Promise<{ ok: boolean; error?: string }> {
  const hospitalId = await resolveHospitalUuid(supabase);
  const rows = slotTimes.map((slot_time) => ({
    hospital_id: hospitalId,
    hospital_code: REGAL_HOSPITAL_CODE,
    doctor_id: doctorId,
    doctor_name: doctorName ?? null,
    slot_date: slotDate,
    slot_time,
    status: 'open',
  }));

  const { error } = await supabase.from('doctor_time_slots').upsert(rows, {
    onConflict: 'doctor_id,slot_date,slot_time',
    ignoreDuplicates: true,
  });

  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function bookDoctorTimeSlot(
  supabase: SupabaseClient,
  slotId: string,
  appointmentId: string,
  patientId: string,
  patientName?: string,
): Promise<{ ok: boolean; error?: string }> {
  if (slotId.startsWith('fallback-')) {
    return { ok: true };
  }

  const { data: slot, error: fetchError } = await supabase
    .from('doctor_time_slots')
    .select('id, status')
    .eq('id', slotId)
    .maybeSingle();

  if (fetchError) return { ok: false, error: fetchError.message };
  if (!slot) return { ok: false, error: 'Slot not found' };
  if (String((slot as Record<string, unknown>).status) !== 'open') {
    return { ok: false, error: 'Slot is no longer available' };
  }

  const { error } = await supabase
    .from('doctor_time_slots')
    .update({
      status: 'booked',
      appointment_id: appointmentId,
      patient_id: patientId,
      patient_name: patientName ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', slotId)
    .eq('status', 'open');

  return error ? { ok: false, error: error.message } : { ok: true };
}
