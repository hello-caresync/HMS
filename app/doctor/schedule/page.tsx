'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Clock,
  Loader2,
  Plus,
  RotateCw,
  Trash2,
  UserRound,
} from 'lucide-react';

import {
  DEFAULT_ACTIVE_DOCTOR_ID,
  getActiveDoctorProfile,
} from '@/lib/doctor/command-center/supabase-service';
import { createClient } from '@/lib/supabase/client';

type ScheduleSlot = {
  id: string;
  doctor_id: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  created_at?: string;
};

function localDateString(date = new Date()): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().split('T')[0];
}

function localStorageKey(doctorId: string, date: string): string {
  return `curasync_doctor_schedule_${doctorId}_${date}`;
}

export default function DoctorSchedulePage() {
  const supabase = createClient();

  const [activeDoctorId, setActiveDoctorId] = useState<string>(DEFAULT_ACTIVE_DOCTOR_ID);
  const [doctorName, setDoctorName] = useState<string>('Doctor');
  const [selectedDate, setSelectedDate] = useState<string>(localDateString());
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [isLocalMode, setIsLocalMode] = useState<boolean>(false);

  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('09:30');

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const selectedDateStr = useMemo(() => selectedDate, [selectedDate]);

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

  const loadLocalSlots = useCallback(() => {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(localStorageKey(activeDoctorId, selectedDateStr));
    if (!raw) return [];
    try {
      return JSON.parse(raw) as ScheduleSlot[];
    } catch {
      return [];
    }
  }, [activeDoctorId, selectedDateStr]);

  const saveLocalSlots = useCallback(
    (next: ScheduleSlot[]) => {
      if (typeof window === 'undefined') return;
      localStorage.setItem(
        localStorageKey(activeDoctorId, selectedDateStr),
        JSON.stringify(next),
      );
    },
    [activeDoctorId, selectedDateStr],
  );

  const fetchSchedule = useCallback(async () => {
    if (!activeDoctorId) return;

    setLoading(true);
    setStatusMessage(null);

    try {
      const { data, error } = await supabase
        .from('doctor_schedules')
        .select('*')
        .eq('doctor_id', activeDoctorId)
        .eq('schedule_date', selectedDateStr)
        .order('start_time', { ascending: true });

      if (!error) {
        setSlots((data ?? []) as ScheduleSlot[]);
        setIsLocalMode(false);
        if (data?.length) {
          saveLocalSlots(data as ScheduleSlot[]);
        }
      } else {
        console.warn('Schedule fetch fallback:', error.message ?? error);
        setSlots(loadLocalSlots());
        setIsLocalMode(true);
        setStatusMessage('Showing locally cached schedule — database sync unavailable.');
      }
    } catch (err) {
      console.warn('Schedule fetch error:', err);
      setSlots(loadLocalSlots());
      setIsLocalMode(true);
      setStatusMessage('Showing locally cached schedule — database sync unavailable.');
    } finally {
      setLoading(false);
    }
  }, [activeDoctorId, selectedDateStr, supabase, loadLocalSlots, saveLocalSlots]);

  useEffect(() => {
    void fetchSchedule();
  }, [fetchSchedule]);

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startTime || !endTime || startTime >= endTime) {
      setStatusMessage('End time must be after start time.');
      return;
    }

    setSaving(true);
    setStatusMessage(null);

    if (isLocalMode) {
      const localSlot: ScheduleSlot = {
        id: `local_${Date.now()}`,
        doctor_id: activeDoctorId,
        schedule_date: selectedDateStr,
        start_time: startTime,
        end_time: endTime,
      };
      const next = [...slots, localSlot].sort((a, b) => a.start_time.localeCompare(b.start_time));
      setSlots(next);
      saveLocalSlots(next);
      setStartTime('09:00');
      setEndTime('09:30');
      setSaving(false);
      return;
    }

    try {
      const { data: newSlot, error } = await supabase
        .from('doctor_schedules')
        .insert([
          {
            doctor_id: activeDoctorId,
            schedule_date: selectedDateStr,
            start_time: startTime,
            end_time: endTime,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      if (newSlot) {
        const next = [...slots, newSlot as ScheduleSlot].sort((a, b) =>
          a.start_time.localeCompare(b.start_time),
        );
        setSlots(next);
        saveLocalSlots(next);
      }

      setStartTime('09:00');
      setEndTime('09:30');
      setStatusMessage('Availability slot added successfully.');
    } catch (err) {
      console.error('Failed to add slot:', err);
      setStatusMessage('Could not save slot to database. Switched to local mode.');
      setIsLocalMode(true);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    setDeletingId(slotId);
    setStatusMessage(null);

    if (isLocalMode || slotId.startsWith('local_')) {
      const next = slots.filter((s) => s.id !== slotId);
      setSlots(next);
      saveLocalSlots(next);
      setDeletingId(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('doctor_schedules')
        .delete()
        .eq('id', slotId)
        .eq('doctor_id', activeDoctorId);

      if (error) throw error;

      const next = slots.filter((s) => s.id !== slotId);
      setSlots(next);
      saveLocalSlots(next);
      setStatusMessage('Slot removed from your schedule.');
    } catch (err) {
      console.error('Failed to delete slot:', err);
      setStatusMessage('Could not delete slot from database.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-4xl space-y-6 bg-slate-50 p-4 font-sans sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
            Availability Management
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Doctor Schedule</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
            <UserRound className="h-4 w-4" />
            {doctorName} · ID scoped to your profile only
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

      {isLocalMode && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Local schedule mode — changes are stored on this device until database sync is available.
        </div>
      )}

      {statusMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {statusMessage}
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Calendar className="h-4 w-4 text-emerald-600" />
          Select Date
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
        />
        <p className="mt-2 text-xs text-slate-500">
          Managing schedule for{' '}
          <span className="font-semibold">{selectedDateStr}</span> · Doctor ID{' '}
          <span className="font-mono text-[11px]">{activeDoctorId}</span>
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
          <Plus className="h-4 w-4 text-emerald-600" />
          Add Availability Slot
        </h2>
        <form onSubmit={handleAddSlot} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
              Start Time
            </label>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
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
          <div className="flex items-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 sm:w-auto"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add Slot
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Clock className="h-4 w-4 text-emerald-600" />
            Your Slots for {selectedDateStr}
          </h2>
          <span className="text-xs font-medium text-slate-500">{slots.length} slot(s)</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-sm text-slate-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading schedule...
          </div>
        ) : slots.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 py-12 text-center text-sm text-slate-500">
            No availability slots for this date. Add your first slot above.
          </div>
        ) : (
          <ul className="space-y-3">
            {slots.map((slot) => (
              <li
                key={slot.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {slot.start_time} – {slot.end_time}
                  </p>
                  <p className="text-xs text-slate-500">
                    Doctor: {slot.doctor_id.slice(0, 8)}… · Date: {slot.schedule_date}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDeleteSlot(slot.id)}
                  disabled={deletingId === slot.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                >
                  {deletingId === slot.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
