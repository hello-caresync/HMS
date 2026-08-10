'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  Check,
  Clock3,
  Gauge,
  Loader2,
  Palmtree,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { getDoctorSession } from '@/lib/doctor/session';
import { supabase } from '@/lib/supabaseClient';

const SCHEDULE_KEY = 'curasync_doctor_schedule';
const SETTINGS_KEY = 'curasync_doctor_schedule_settings';
const today = () => new Date().toISOString().slice(0, 10);

type ScheduleSlot = {
  id: string;
  doctor_employee_id: string;
  doctor_name: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: string;
};

type DaySettings = {
  doctor_employee_id: string;
  schedule_date: string;
  daily_patient_limit: number;
  is_on_leave: boolean;
  updated_at: string;
};

function readLocal(): ScheduleSlot[] {
  try {
    return JSON.parse(localStorage.getItem(SCHEDULE_KEY) ?? '[]') as ScheduleSlot[];
  } catch {
    return [];
  }
}

function writeLocal(slots: ScheduleSlot[]) {
  localStorage.setItem(SCHEDULE_KEY, JSON.stringify(slots));
}

function mergeSlots(local: ScheduleSlot[], remote: ScheduleSlot[]) {
  const map = new Map(local.map((slot) => [slot.id, slot]));
  remote.forEach((slot) => map.set(slot.id, slot));
  return [...map.values()].sort((a, b) => a.start_time.localeCompare(b.start_time));
}

function readSettings(): DaySettings[] {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '[]') as DaySettings[];
  } catch {
    return [];
  }
}

function writeSettings(settings: DaySettings[]) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export default function DoctorSchedulePage() {
  const [session] = useState(getDoctorSession);
  const [date, setDate] = useState(today);
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(() => {
    const saved = readSettings().find(
      (item) =>
        item.doctor_employee_id === session.employeeId && item.schedule_date === today(),
    );
    return saved?.daily_patient_limit ?? 20;
  });
  const [isOnLeave, setIsOnLeave] = useState(() => {
    const saved = readSettings().find(
      (item) =>
        item.doctor_employee_id === session.employeeId && item.schedule_date === today(),
    );
    return saved?.is_on_leave ?? false;
  });
  const [settingsSaving, setSettingsSaving] = useState(false);

  const selectDate = (nextDate: string) => {
    const saved = readSettings().find(
      (item) =>
        item.doctor_employee_id === session.employeeId && item.schedule_date === nextDate,
    );
    setDate(nextDate);
    setDailyLimit(saved?.daily_patient_limit ?? 20);
    setIsOnLeave(saved?.is_on_leave ?? false);
  };

  const loadSchedule = useCallback(
    async (quiet = false) => {
      if (!quiet) setLoading(true);
      const localForDay = readLocal().filter(
        (slot) =>
          slot.doctor_employee_id === session.employeeId && slot.schedule_date === date,
      );
      try {
        const { data, error } = await supabase
          .from('doctor_schedules')
          .select('*')
          .eq('doctor_employee_id', session.employeeId)
          .eq('schedule_date', date)
          .order('start_time', { ascending: true });
        if (error) throw error;
        const merged = mergeSlots(localForDay, (data ?? []) as ScheduleSlot[]);
        setSlots(merged);
        const otherDays = readLocal().filter(
          (slot) =>
            slot.doctor_employee_id !== session.employeeId || slot.schedule_date !== date,
        );
        writeLocal([...otherDays, ...merged]);
        setOffline(false);
      } catch (error) {
        setSlots(localForDay.sort((a, b) => a.start_time.localeCompare(b.start_time)));
        setOffline(true);
        if (!quiet) {
          toast.warning('Schedule is in local mode', {
            description:
              error instanceof Error
                ? error.message
                : 'The schedule table or network is unavailable.',
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [date, session.employeeId],
  );

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadSchedule(), 0);
    return () => window.clearTimeout(initialLoad);
  }, [loadSchedule]);

  const persistLocal = useCallback(
    (nextForDay: ScheduleSlot[]) => {
      const other = readLocal().filter(
        (slot) =>
          slot.doctor_employee_id !== session.employeeId || slot.schedule_date !== date,
      );
      writeLocal([...other, ...nextForDay]);
      setSlots(nextForDay.sort((a, b) => a.start_time.localeCompare(b.start_time)));
    },
    [date, session.employeeId],
  );

  const addSlot = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!startTime || !endTime) return;
    if (endTime <= startTime) {
      toast.error('End time must be after start time');
      return;
    }
    const overlaps = slots.some(
      (slot) => startTime < slot.end_time && endTime > slot.start_time,
    );
    if (overlaps) {
      toast.error('This time overlaps an existing slot');
      return;
    }

    setSaving(true);
    const slot: ScheduleSlot = {
      id: crypto.randomUUID(),
      doctor_employee_id: session.employeeId,
      doctor_name: session.fullName,
      schedule_date: date,
      start_time: startTime,
      end_time: endTime,
      is_available: true,
      created_at: new Date().toISOString(),
    };
    persistLocal([...slots, slot]);
    try {
      const { error } = await supabase.from('doctor_schedules').insert(slot);
      if (error) throw error;
      setOffline(false);
      toast.success('Availability slot added');
    } catch (error) {
      setOffline(true);
      toast.warning('Slot saved locally', {
        description:
          error instanceof Error ? error.message : 'It can be synced when the database is available.',
      });
    } finally {
      setSaving(false);
      setStartTime('');
      setEndTime('');
    }
  };

  const toggleSlot = async (slot: ScheduleSlot) => {
    setActionId(slot.id);
    const next = { ...slot, is_available: !slot.is_available };
    persistLocal(slots.map((current) => (current.id === slot.id ? next : current)));
    try {
      const { error } = await supabase
        .from('doctor_schedules')
        .update({ is_available: next.is_available })
        .eq('id', slot.id);
      if (error) throw error;
      setOffline(false);
      toast.success(next.is_available ? 'Slot opened' : 'Slot blocked');
    } catch (error) {
      setOffline(true);
      toast.warning('Change saved locally', {
        description: error instanceof Error ? error.message : 'Database update unavailable.',
      });
    } finally {
      setActionId(null);
    }
  };

  const deleteSlot = async (slot: ScheduleSlot) => {
    setActionId(slot.id);
    persistLocal(slots.filter((current) => current.id !== slot.id));
    try {
      const { error } = await supabase.from('doctor_schedules').delete().eq('id', slot.id);
      if (error) throw error;
      setOffline(false);
      toast.success('Slot removed');
    } catch (error) {
      setOffline(true);
      toast.warning('Removed on this device', {
        description: error instanceof Error ? error.message : 'Database update unavailable.',
      });
    } finally {
      setActionId(null);
    }
  };

  const persistDaySettings = useCallback(
    async (nextLimit: number, nextLeave: boolean, successMessage: string) => {
      const settings: DaySettings = {
        doctor_employee_id: session.employeeId,
        schedule_date: date,
        daily_patient_limit: nextLimit,
        is_on_leave: nextLeave,
        updated_at: new Date().toISOString(),
      };
      const other = readSettings().filter(
        (item) =>
          item.doctor_employee_id !== session.employeeId || item.schedule_date !== date,
      );
      writeSettings([...other, settings]);
      setDailyLimit(nextLimit);
      setIsOnLeave(nextLeave);
      setSettingsSaving(true);

      try {
        const { error: scheduleError } = await supabase
          .from('doctor_schedules')
          .update({
            daily_patient_limit: nextLimit,
            is_on_leave: nextLeave,
          })
          .eq('doctor_employee_id', session.employeeId)
          .eq('schedule_date', date);

        if (scheduleError) {
          const { error: settingsError } = await supabase
            .from('doctor_schedule_settings')
            .upsert(settings, { onConflict: 'doctor_employee_id,schedule_date' });
          if (settingsError) throw settingsError;
        }
        setOffline(false);
        toast.success(successMessage);
      } catch {
        toast.warning(`${successMessage} locally`, {
          description: 'Optional schedule settings could not be synced.',
        });
      } finally {
        setSettingsSaving(false);
      }
    },
    [date, session.employeeId],
  );

  const saveDailyLimit = () => {
    const normalized = Math.max(1, Math.min(200, Math.round(dailyLimit)));
    void persistDaySettings(normalized, isOnLeave, `Daily limit set to ${normalized}`);
  };

  const toggleDayLeave = () => {
    const nextLeave = !isOnLeave;
    void persistDaySettings(
      dailyLimit,
      nextLeave,
      nextLeave ? 'Day marked as leave' : 'Day reopened',
    );
  };

  const availableCount = useMemo(
    () => (isOnLeave ? 0 : slots.filter((slot) => slot.is_available).length),
    [isOnLeave, slots],
  );

  return (
    <section className="relative min-h-full overflow-hidden bg-[#F2F6FA] p-4 text-[#2C243B] sm:p-6 lg:p-8">
      <div className="pointer-events-none absolute -left-28 top-24 h-80 w-80 rounded-full bg-[#BDE2F5]/75 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-[#9887B1]/25 blur-3xl" />
      <div className="relative mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-5 rounded-3xl border border-white/70 bg-white/55 p-5 shadow-[14px_14px_30px_rgba(137,74,102,0.13),-10px_-10px_26px_rgba(255,255,255,0.9)] backdrop-blur-2xl md:flex-row md:items-center md:justify-between sm:p-7">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-gradient-to-br from-[#A9C5E3] to-[#BDE2F5] p-3 text-[#894A66] shadow-[inset_2px_2px_5px_white,inset_-3px_-3px_7px_rgba(137,74,102,0.14)]">
              <CalendarDays className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Availability schedule</h1>
              <p className="mt-1 text-sm text-[#2C243B]/60">
                Publish daily consultation time slots.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-white/80 bg-white/60 px-3 py-2 shadow-[6px_6px_14px_rgba(157,166,205,0.2),-5px_-5px_12px_white]">
            <CalendarDays className="h-4 w-4 text-[#93688E]" />
            <input
              type="date"
              value={date}
              min={today()}
              onChange={(event) => selectDate(event.target.value)}
              className="bg-transparent text-sm font-bold outline-none"
            />
            <button
              type="button"
              onClick={() => void loadSchedule(true)}
              aria-label="Refresh schedule"
              className="ml-1 rounded-lg p-1 text-[#894A66] transition hover:bg-white active:scale-95"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </header>

        {offline && (
          <div className="flex items-center gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Local schedule mode is active. The table may be missing or the network unavailable.
          </div>
        )}

        {isOnLeave && (
          <div className="flex flex-col gap-3 rounded-3xl border border-[#894A66]/30 bg-gradient-to-r from-[#894A66] to-[#93688E] px-5 py-4 text-white shadow-[8px_8px_20px_rgba(137,74,102,0.25),-6px_-6px_18px_white] sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Palmtree className="h-6 w-6" />
              <div><p className="font-black">Whole-day leave</p><p className="text-sm text-white/75">All booking availability is paused for this date.</p></div>
            </div>
            <button type="button" onClick={toggleDayLeave} disabled={settingsSaving}
              className="rounded-2xl bg-white px-4 py-2 text-sm font-black text-[#894A66] transition active:scale-95 disabled:opacity-50">Reopen this day</button>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <div className="space-y-5">
          <form
            onSubmit={addSlot}
            className="h-fit rounded-3xl border border-white/70 bg-white/55 p-5 shadow-[10px_10px_24px_rgba(152,135,177,0.2),-8px_-8px_20px_white] backdrop-blur-2xl"
          >
            <h2 className="flex items-center gap-2 font-black">
              <Plus className="h-5 w-5 text-[#93688E]" /> Add availability
            </h2>
            <p className="mt-1 text-sm text-[#2C243B]/55">
              Create a non-overlapping slot for the selected date.
            </p>
            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-[#2C243B]/65">Start time</span>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                  disabled={isOnLeave}
                  className="w-full rounded-2xl border border-white/80 bg-[#F2F6FA]/75 px-3 py-2.5 text-sm outline-none ring-[#93688E]/30 focus:ring-4 disabled:opacity-45"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-[#2C243B]/65">End time</span>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                  disabled={isOnLeave}
                  className="w-full rounded-2xl border border-white/80 bg-[#F2F6FA]/75 px-3 py-2.5 text-sm outline-none ring-[#93688E]/30 focus:ring-4 disabled:opacity-45"
                />
              </label>
              <button
                type="submit"
                disabled={saving || isOnLeave}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#894A66] to-[#93688E] px-4 py-3 text-sm font-bold text-white shadow-[6px_6px_14px_rgba(137,74,102,0.25),-5px_-5px_12px_white] transition active:scale-95 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add slot
              </button>
            </div>
          </form>

          <div className="rounded-3xl border border-white/70 bg-gradient-to-br from-white/80 to-[#BDE2F5]/35 p-5 shadow-[10px_10px_24px_rgba(157,166,205,0.22),-8px_-8px_20px_white]">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#9DA6CD] to-[#A9C5E3] text-white"><Gauge className="h-5 w-5" /></div>
            <h2 className="mt-4 font-black">Daily capacity</h2>
            <p className="mt-1 text-sm text-[#2C243B]/55">Set the maximum patients for this date.</p>
            <div className="mt-4 flex gap-2">
              <input type="number" min="1" max="200" value={dailyLimit} onChange={(event) => setDailyLimit(Number(event.target.value))}
                className="min-w-0 flex-1 rounded-2xl border border-white/80 bg-white/70 px-4 py-3 font-black outline-none ring-[#93688E]/30 focus:ring-4" />
              <button type="button" onClick={saveDailyLimit} disabled={settingsSaving}
                className="rounded-2xl bg-[#2C243B] px-4 text-sm font-bold text-white transition active:scale-95 disabled:opacity-50">Save</button>
            </div>
            {!isOnLeave && <button type="button" onClick={toggleDayLeave} disabled={settingsSaving}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#894A66]/25 bg-white/55 px-4 py-3 text-sm font-bold text-[#894A66] transition active:scale-95 disabled:opacity-50"><Palmtree className="h-4 w-4" /> Mark whole-day leave</button>}
          </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/50 shadow-[12px_12px_28px_rgba(157,166,205,0.22),-9px_-9px_24px_white] backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-[#9DA6CD]/25 px-5 py-4">
              <div>
                <h2 className="font-black">
                  {new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </h2>
                <p className="text-xs text-[#2C243B]/50">{availableCount} available slots</p>
              </div>
              <span className="rounded-full bg-[#BDE2F5] px-3 py-1 text-xs font-bold text-[#894A66]">
                {isOnLeave ? 'On leave' : `${slots.length} total · limit ${dailyLimit}`}
              </span>
            </div>
            {loading ? (
              <div className="flex min-h-72 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#894A66]" />
              </div>
            ) : slots.length === 0 ? (
              <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
                <Clock3 className="mb-3 h-10 w-10 text-[#9887B1]" />
                <h3 className="font-bold">No availability configured</h3>
                <p className="mt-1 text-sm text-[#2C243B]/55">Add the first consultation slot for this date.</p>
              </div>
            ) : (
              <div className="space-y-3 p-3 sm:p-4">
                {slots.map((slot) => (
                  <article key={slot.id} className="flex flex-col gap-3 rounded-3xl border border-white/80 bg-gradient-to-r from-white/85 to-[#BDE2F5]/25 p-4 shadow-[6px_6px_15px_rgba(157,166,205,0.19),-5px_-5px_13px_white] sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-xl p-2.5 ${slot.is_available ? 'bg-[#BDE2F5] text-[#894A66]' : 'bg-slate-100 text-slate-500'}`}>
                        {slot.is_available ? <Check className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="font-black">{slot.start_time} – {slot.end_time}</p>
                        <p className="text-xs text-[#2C243B]/50">
                          {slot.is_available ? 'Available for booking' : 'Blocked'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={actionId !== null || isOnLeave}
                        onClick={() => void toggleSlot(slot)}
                        className="rounded-xl border border-[#9DA6CD] px-3 py-2 text-xs font-bold text-[#894A66] transition hover:bg-[#F2F6FA] active:scale-95 disabled:opacity-50"
                      >
                        {slot.is_available ? 'Block' : 'Open'}
                      </button>
                      <button
                        type="button"
                        disabled={actionId !== null}
                        onClick={() => void deleteSlot(slot)}
                        aria-label={`Delete ${slot.start_time} slot`}
                        className="rounded-xl border border-[#93688E]/25 p-2 text-[#894A66] transition hover:bg-white active:scale-95 disabled:opacity-50"
                      >
                        {actionId === slot.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
