'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Clock,
  Loader2,
  Plus,
  RotateCw,
  Sun,
  Sunset,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react';

import {
  DEFAULT_ACTIVE_DOCTOR_ID,
  getActiveDoctorProfile,
} from '@/lib/doctor/command-center/supabase-service';
import { createClient } from '@/lib/supabase/client';

type ScheduleSlot = {
  id: string;
  doctor_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  is_booked?: boolean | null;
  max_capacity?: number | null;
  booked_count?: number | null;
  status?: string | null;
  created_at?: string;
};

function localDateString(date = new Date()): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().split('T')[0];
}

function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;

  if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) {
    const isPM = timeStr.toLowerCase().includes('pm');
    const cleanTime = timeStr.replace(/(am|pm|\s)/gi, '');
    let [hours, minutes] = cleanTime.split(':').map(Number);
    if (Number.isNaN(hours)) hours = 0;
    if (Number.isNaN(minutes)) minutes = 0;
    if (isPM && hours < 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

function minutesToTime(total: number): string {
  const clamped = Math.max(0, Math.min(total, 23 * 60 + 59));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function addMinutesToTime(timeStr: string, minutesToAdd: number): string {
  return minutesToTime(parseTimeToMinutes(timeStr) + minutesToAdd);
}

function formatTimeDisplay(time: string): string {
  const total = parseTimeToMinutes(time);
  const h = Math.floor(total / 60);
  const m = total % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${period}`;
}

function formatSupabaseError(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const err = error as { message?: string; details?: string; hint?: string; code?: string };
    return err.message || err.details || err.hint || err.code || 'Unknown Supabase error';
  }
  return String(error);
}

function slotsOverlap(startA: number, endA: number, startB: number, endB: number): boolean {
  return startA < endB && startB < endA;
}

function findOverlappingSlot(
  existing: ScheduleSlot[],
  start: string,
  end: string,
): ScheduleSlot | undefined {
  const startMinutes = parseTimeToMinutes(start);
  const endMinutes = parseTimeToMinutes(end);

  return existing.find((slot) =>
    slotsOverlap(
      startMinutes,
      endMinutes,
      parseTimeToMinutes(slot.start_time),
      parseTimeToMinutes(slot.end_time),
    ),
  );
}

function generateHalfHourSlots(
  rangeStart: string,
  rangeEnd: string,
): Array<{ start_time: string; end_time: string }> {
  const start = parseTimeToMinutes(rangeStart);
  const end = parseTimeToMinutes(rangeEnd);
  const slots: Array<{ start_time: string; end_time: string }> = [];

  for (let cursor = start; cursor + 30 <= end; cursor += 30) {
    slots.push({
      start_time: minutesToTime(cursor),
      end_time: minutesToTime(cursor + 30),
    });
  }

  return slots;
}

function resolveSlotStatus(slot: ScheduleSlot): 'AVAILABLE' | 'BOOKED' {
  if (slot.is_booked === true) return 'BOOKED';

  const status = String(slot.status ?? '').toUpperCase();
  if (status === 'BOOKED') return 'BOOKED';

  const max = slot.max_capacity ?? 1;
  const booked = slot.booked_count ?? 0;
  if (booked >= max && max > 0) return 'BOOKED';

  return 'AVAILABLE';
}

export default function DoctorAvailabilityPage() {
  const supabase = createClient();

  const [activeDoctorId, setActiveDoctorId] = useState<string>(DEFAULT_ACTIVE_DOCTOR_ID);
  const [doctorName, setDoctorName] = useState<string>('Doctor');
  const [selectedDate, setSelectedDate] = useState<string>(localDateString());
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [isLiveSync, setIsLiveSync] = useState<boolean>(false);

  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('09:30');
  const [maxCapacity, setMaxCapacity] = useState<number>(1);

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [bulkSaving, setBulkSaving] = useState<'morning' | 'evening' | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedDateStr = useMemo(() => selectedDate, [selectedDate]);

  const slotStats = useMemo(() => {
    const available = slots.filter((s) => resolveSlotStatus(s) === 'AVAILABLE').length;
    const booked = slots.length - available;
    return { available, booked, total: slots.length };
  }, [slots]);

  useEffect(() => {
    async function resolveDoctor() {
      const { data: authData } = await supabase.auth.getUser();
      const profile = await getActiveDoctorProfile();

      const resolvedId =
        authData?.user?.id ||
        (profile?.doctor_id ? String(profile.doctor_id) : null) ||
        DEFAULT_ACTIVE_DOCTOR_ID;

      setActiveDoctorId(resolvedId);
      setDoctorName(String(profile?.full_name ?? 'Dr. CHANDRAKANTH S KESARI'));
    }

    void resolveDoctor();
  }, [supabase]);

  const fetchSchedule = useCallback(async () => {
    const doctorId = activeDoctorId || DEFAULT_ACTIVE_DOCTOR_ID;

    setLoading(true);

    const { data, error } = await supabase
      .from('doctor_schedules')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('shift_date', selectedDateStr)
      .order('start_time', { ascending: true });

    if (error === null) {
      setSlots((data ?? []) as ScheduleSlot[]);
      setIsLiveSync(true);
    } else {
      console.warn('Availability fetch failed:', formatSupabaseError(error));
      setSlots([]);
      setIsLiveSync(false);
      setErrorMessage(formatSupabaseError(error));
    }

    setLoading(false);
  }, [activeDoctorId, selectedDateStr, supabase]);

  useEffect(() => {
    void fetchSchedule();
  }, [fetchSchedule]);

  useEffect(() => {
    const doctorId = activeDoctorId || DEFAULT_ACTIVE_DOCTOR_ID;
    if (!doctorId) return;

    const channel = supabase
      .channel(`doctor-availability-${doctorId}-${selectedDateStr}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'doctor_schedules',
          filter: `doctor_id=eq.${doctorId}`,
        },
        () => {
          void fetchSchedule();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeDoctorId, selectedDateStr, supabase, fetchSchedule]);

  const handleStartTimeChange = (value: string) => {
    setStartTime(value);

    const startMinutes = parseTimeToMinutes(value);
    const endMinutes = parseTimeToMinutes(endTime);

    if (!endTime || endMinutes <= startMinutes) {
      setEndTime(addMinutesToTime(value, 30));
    }
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();

    const resolvedEndTime =
      endTime && parseTimeToMinutes(endTime) > parseTimeToMinutes(startTime)
        ? endTime
        : addMinutesToTime(startTime, 30);

    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(resolvedEndTime);

    if (!startTime || endMinutes <= startMinutes) {
      setErrorMessage('End time must be after start time.');
      return;
    }

    const overlap = findOverlappingSlot(slots, startTime, resolvedEndTime);
    if (overlap) {
      setErrorMessage(
        `This slot overlaps with ${formatTimeDisplay(overlap.start_time)} – ${formatTimeDisplay(overlap.end_time)}.`,
      );
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    const { data, error } = await supabase
      .from('doctor_schedules')
      .insert([
        {
          doctor_id: activeDoctorId || DEFAULT_ACTIVE_DOCTOR_ID,
          shift_date: selectedDateStr,
          start_time: startTime,
          end_time: resolvedEndTime,
          is_booked: false,
          max_capacity: maxCapacity,
        },
      ])
      .select();

    if (error) {
      console.error('Failed to add slot:', formatSupabaseError(error));
      setErrorMessage(formatSupabaseError(error));
      setSaving(false);
      return;
    }

    if (data?.length) {
      setEndTime(resolvedEndTime);
    }

    await fetchSchedule();
    setStartTime('09:00');
    setEndTime('09:30');
    setIsLiveSync(true);
    setSaving(false);
  };

  const handleBulkPreset = async (preset: 'morning' | 'evening') => {
    const range =
      preset === 'morning'
        ? { start: '09:00', end: '13:00', label: 'Morning Shift' }
        : { start: '16:00', end: '20:00', label: 'Evening Shift' };

    const generated = generateHalfHourSlots(range.start, range.end).filter(
      (slot) => !findOverlappingSlot(slots, slot.start_time, slot.end_time),
    );

    if (generated.length === 0) {
      setErrorMessage('All preset slots already exist or overlap with current schedule.');
      return;
    }

    setBulkSaving(preset);
    setErrorMessage(null);

    const payload = generated.map((slot) => ({
      doctor_id: activeDoctorId || DEFAULT_ACTIVE_DOCTOR_ID,
      shift_date: selectedDateStr,
      start_time: slot.start_time,
      end_time: slot.end_time,
      is_booked: false,
      max_capacity: maxCapacity,
    }));

    const { error } = await supabase.from('doctor_schedules').insert(payload);

    if (error) {
      console.error(`Failed to add ${range.label}:`, formatSupabaseError(error));
      setErrorMessage(formatSupabaseError(error));
      setBulkSaving(null);
      return;
    }

    await fetchSchedule();
    setIsLiveSync(true);
    setBulkSaving(null);
  };

  const handleDeleteSlot = async (slotId: string) => {
    setDeletingId(slotId);
    setErrorMessage(null);

    const { error } = await supabase
      .from('doctor_schedules')
      .delete()
      .eq('id', slotId)
      .eq('doctor_id', activeDoctorId || DEFAULT_ACTIVE_DOCTOR_ID);

    if (error) {
      console.error('Failed to delete slot:', formatSupabaseError(error));
      setErrorMessage(formatSupabaseError(error));
      setDeletingId(null);
      return;
    }

    await fetchSchedule();
    setDeletingId(null);
  };

  return (
    <div className="mx-auto min-h-screen max-w-6xl space-y-6 bg-slate-50 p-4 font-sans sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
            Doctor Availability
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Manage Availability</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
            <UserRound className="h-4 w-4" />
            {doctorName}
            {isLiveSync && (
              <span className="ml-2 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                Live Sync
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchSchedule()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
        >
          <RotateCw className="h-4 w-4" /> Refresh
        </button>
      </header>

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {errorMessage}
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Calendar className="h-4 w-4 text-emerald-600" />
          Select Shift Date
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
        />
        <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
            Total: {slotStats.total}
          </span>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">
            Available: {slotStats.available}
          </span>
          <span className="rounded-full bg-red-100 px-3 py-1 text-red-800">
            Booked: {slotStats.booked}
          </span>
        </div>
      </section>

      <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
          <Plus className="h-4 w-4 text-emerald-600" />
          Create Availability Slot
        </h2>

        <form onSubmit={handleAddSlot} className="grid gap-4 lg:grid-cols-[1fr_1fr_160px_auto]">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
              Start Time
            </label>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => handleStartTimeChange(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
              End Time
            </label>
            <input
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase text-slate-500">
              <Users className="h-3.5 w-3.5" /> Max Capacity
            </label>
            <select
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
            >
              {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                <option key={n} value={n}>
                  {n} patient{n > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add Slot
            </button>
          </div>
        </form>

        <div className="border-t border-slate-100 pt-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Quick Presets (30-min slots)
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={bulkSaving !== null}
              onClick={() => void handleBulkPreset('morning')}
              className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-900 hover:bg-amber-100 disabled:opacity-50"
            >
              {bulkSaving === 'morning' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
              + Add Morning Shift 9 AM – 1 PM
            </button>
            <button
              type="button"
              disabled={bulkSaving !== null}
              onClick={() => void handleBulkPreset('evening')}
              className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-xs font-bold text-indigo-900 hover:bg-indigo-100 disabled:opacity-50"
            >
              {bulkSaving === 'evening' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sunset className="h-4 w-4" />
              )}
              + Add Evening Shift 4 PM – 8 PM
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Clock className="h-4 w-4 text-emerald-600" />
            Slot Grid — {selectedDateStr}
          </h2>
          <span className="text-xs font-medium text-slate-500">{slots.length} slot(s)</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-slate-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading availability...
          </div>
        ) : slots.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 py-16 text-center text-sm text-slate-500">
            No slots for this date. Add a single slot or use a quick preset above.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {slots.map((slot) => {
              const status = resolveSlotStatus(slot);
              const isBooked = status === 'BOOKED';

              return (
                <article
                  key={slot.id}
                  className={`group relative rounded-xl border p-4 shadow-sm transition hover:shadow-md ${
                    isBooked
                      ? 'border-red-200 bg-red-50/40'
                      : 'border-emerald-200 bg-emerald-50/30 hover:border-emerald-300'
                  }`}
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {formatTimeDisplay(slot.start_time)} – {formatTimeDisplay(slot.end_time)}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Capacity {slot.booked_count ?? 0}/{slot.max_capacity ?? 1}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                        isBooked ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleDeleteSlot(slot.id)}
                    disabled={deletingId === slot.id}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 opacity-90 transition hover:bg-red-50 group-hover:opacity-100 disabled:opacity-50"
                  >
                    {deletingId === slot.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    Remove Slot
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
