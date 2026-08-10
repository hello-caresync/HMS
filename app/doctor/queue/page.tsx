'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Clock3,
  Crown,
  Loader2,
  Megaphone,
  Play,
  RefreshCw,
  Siren,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { toast } from 'sonner';

import {
  fetchDoctorQueue,
  getCurrentServingToken,
  type PatientAppointment,
  type QueueStatus,
} from '@/lib/doctor/appointments.service';
import { getDoctorSession } from '@/lib/doctor/session';
import { DOCTOR_STORAGE_KEYS, readJsonStorage, writeJsonStorage } from '@/lib/doctor/storage-keys';
import { supabase } from '@/lib/supabaseClient';

const today = () => new Date().toISOString().slice(0, 10);
const QUEUE_PREFS_KEY = 'curasync_doctor_queue_preferences';

type QueuePreferences = {
  orderByDay: Record<string, string[]>;
  emergencyIds: string[];
  delayMinutes: number;
};

const defaultPreferences: QueuePreferences = {
  orderByDay: {},
  emergencyIds: [],
  delayMinutes: 0,
};

function readQueuePreferences(): QueuePreferences {
  return readJsonStorage<QueuePreferences>(QUEUE_PREFS_KEY, defaultPreferences);
}

function orderQueue(rows: PatientAppointment[], ids: string[]) {
  const position = new Map(ids.map((id, index) => [id, index]));
  return [...rows].sort((a, b) => {
    const aPosition = position.get(a.id);
    const bPosition = position.get(b.id);
    if (aPosition != null && bPosition != null) return aPosition - bPosition;
    if (aPosition != null) return -1;
    if (bPosition != null) return 1;
    return a.token_number - b.token_number;
  });
}

function statusStyle(status: QueueStatus) {
  if (status === 'IN_PROGRESS') return 'bg-[#BDE2F5] text-[#2C243B]';
  if (status === 'COMPLETED') return 'bg-emerald-100 text-emerald-800';
  if (status === 'CANCELLED') return 'bg-rose-100 text-rose-800';
  return 'bg-[#9887B1]/15 text-[#894A66]';
}

export default function DoctorQueuePage() {
  const [session] = useState(getDoctorSession);
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [preferences, setPreferences] = useState<QueuePreferences>(readQueuePreferences);
  const [delayInput, setDelayInput] = useState(() => String(readQueuePreferences().delayMinutes));

  const loadQueue = useCallback(
    async (quiet = false) => {
      if (!quiet) setLoading(true);
      else setSyncing(true);
      try {
        const rows = await fetchDoctorQueue(session.fullName);
        const forToday = rows.filter((row) => row.appointment_date === today());
        const savedOrder = readQueuePreferences().orderByDay[today()] ?? [];
        setAppointments(orderQueue(forToday, savedOrder));
        setOffline(false);
      } catch (error) {
        const local = readJsonStorage<PatientAppointment[]>(DOCTOR_STORAGE_KEYS.appointments, []);
        const savedOrder = readQueuePreferences().orderByDay[today()] ?? [];
        setAppointments(
          orderQueue(
            local
            .filter(
              (row) =>
                row.doctor_name === session.fullName && row.appointment_date === today(),
            ),
            savedOrder,
          ),
        );
        setOffline(true);
        if (!quiet) {
          toast.error('Queue sync unavailable', {
            description: error instanceof Error ? error.message : 'Showing saved appointments.',
          });
        }
      } finally {
        setLoading(false);
        setSyncing(false);
      }
    },
    [session.fullName],
  );

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadQueue(), 0);
    const channel = supabase
      .channel(`doctor-queue-${session.employeeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'patient_appointments',
          filter: `doctor_name=eq.${session.fullName}`,
        },
        () => void loadQueue(true),
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') setOffline(true);
      });

    return () => {
      window.clearTimeout(initialLoad);
      void supabase.removeChannel(channel);
    };
  }, [loadQueue, session.employeeId, session.fullName]);

  const currentToken = useMemo(() => getCurrentServingToken(appointments), [appointments]);
  const waiting = appointments.filter((row) => row.queue_status === 'SCHEDULED');
  const completed = appointments.filter((row) => row.queue_status === 'COMPLETED').length;
  const stats: Array<[string, string, LucideIcon]> = [
    ['Now serving', currentToken ? `#${currentToken}` : '—', Play],
    ['Waiting', String(waiting.length), Clock3],
    ['Completed', String(completed), CheckCircle2],
  ];

  const persistLocal = useCallback(
    (id: string, queueStatus: QueueStatus, servingToken: number) => {
      const all = readJsonStorage<PatientAppointment[]>(DOCTOR_STORAGE_KEYS.appointments, []);
      writeJsonStorage(
        DOCTOR_STORAGE_KEYS.appointments,
        all.map((row) =>
          row.id === id
            ? { ...row, queue_status: queueStatus, current_serving_token: servingToken }
            : row.doctor_name === session.fullName && row.appointment_date === today()
              ? { ...row, current_serving_token: servingToken }
              : row,
        ),
      );
      setAppointments((current) =>
        current.map((row) =>
          row.id === id
            ? { ...row, queue_status: queueStatus, current_serving_token: servingToken }
            : { ...row, current_serving_token: servingToken },
        ),
      );
    },
    [session.fullName],
  );

  const updateToken = async (appointment: PatientAppointment, status: QueueStatus) => {
    setActionId(appointment.id);
    const servingToken = appointment.token_number;
    persistLocal(appointment.id, status, servingToken);
    try {
      if (status === 'IN_PROGRESS') {
        const previous = appointments.find((row) => row.queue_status === 'IN_PROGRESS');
        if (previous && previous.id !== appointment.id) {
          await supabase
            .from('patient_appointments')
            .update({ queue_status: 'COMPLETED', current_serving_token: servingToken })
            .eq('id', previous.id);
        }
      }

      const { error: statusError } = await supabase
        .from('patient_appointments')
        .update({ queue_status: status, current_serving_token: servingToken })
        .eq('id', appointment.id);
      if (statusError) throw statusError;

      const { error: queueError } = await supabase
        .from('patient_appointments')
        .update({ current_serving_token: servingToken })
        .eq('doctor_name', session.fullName)
        .eq('appointment_date', today());
      if (queueError) throw queueError;

      setOffline(false);
      toast.success(
        status === 'COMPLETED'
          ? `Token #${servingToken} completed`
          : `Calling token #${servingToken}`,
      );
      await loadQueue(true);
    } catch (error) {
      setOffline(true);
      toast.warning('Saved on this device', {
        description:
          error instanceof Error
            ? error.message
            : 'The queue will sync when the database is available.',
      });
    } finally {
      setActionId(null);
    }
  };

  const callNext = () => {
    const next = waiting[0];
    if (!next) {
      toast.info('No waiting patients');
      return;
    }
    void updateToken(next, 'IN_PROGRESS');
  };

  const savePreferences = useCallback((next: QueuePreferences) => {
    setPreferences(next);
    writeJsonStorage(QUEUE_PREFS_KEY, next);
  }, []);

  const moveAppointment = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= appointments.length) return;

    const next = [...appointments];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    const nextWithSlots = next.map((item, itemIndex) => ({
      ...item,
      slot_time: appointments[itemIndex].slot_time,
    }));
    const nextPreferences = {
      ...preferences,
      orderByDay: {
        ...preferences.orderByDay,
        [today()]: nextWithSlots.map((item) => item.id),
      },
    };
    setAppointments(nextWithSlots);
    savePreferences(nextPreferences);

    const all = readJsonStorage<PatientAppointment[]>(DOCTOR_STORAGE_KEYS.appointments, []);
    const slotById = new Map(nextWithSlots.map((item) => [item.id, item.slot_time]));
    writeJsonStorage(
      DOCTOR_STORAGE_KEYS.appointments,
      all.map((item) => {
        const slot = slotById.get(item.id);
        return slot == null ? item : { ...item, slot_time: slot };
      }),
    );

    setActionId(next[targetIndex].id);
    try {
      const updates = nextWithSlots.map((item) =>
        supabase
          .from('patient_appointments')
          .update({ slot_time: item.slot_time })
          .eq('id', item.id),
      );
      const results = await Promise.all(updates);
      const failed = results.find((result) => result.error);
      if (failed?.error) throw failed.error;
      toast.success('Queue order updated');
    } catch {
      toast.info('Queue reordered on this device', {
        description: 'The live slot update was unavailable.',
      });
    } finally {
      setActionId(null);
    }
  };

  const toggleEmergency = async (appointment: PatientAppointment) => {
    const active = preferences.emergencyIds.includes(appointment.id);
    const emergencyIds = active
      ? preferences.emergencyIds.filter((id) => id !== appointment.id)
      : [...preferences.emergencyIds, appointment.id];
    savePreferences({ ...preferences, emergencyIds });
    toast.success(active ? 'Emergency priority removed' : 'Emergency priority enabled');

    try {
      await supabase
        .from('patient_appointments')
        .update({ is_emergency: !active })
        .eq('id', appointment.id);
    } catch {
      // Optional database field; local preference remains authoritative.
    }
  };

  const announceDelay = async () => {
    const minutes = Math.max(0, Math.min(240, Number.parseInt(delayInput, 10) || 0));
    setDelayInput(String(minutes));
    savePreferences({ ...preferences, delayMinutes: minutes });

    const patientIds = [...new Set(
      appointments
        .filter((item) => item.patient_id && item.queue_status !== 'COMPLETED')
        .map((item) => item.patient_id as string),
    )];
    try {
      if (patientIds.length) {
        const { error } = await supabase.from('patient_notifications').insert(
          patientIds.map((patientId) => ({
            patient_id: patientId,
            title: minutes ? `Doctor delayed by ${minutes} minutes` : 'Doctor is back on schedule',
            message: minutes
              ? `${session.fullName}'s queue is currently running approximately ${minutes} minutes late.`
              : `${session.fullName}'s queue is now running on schedule.`,
            type: 'queue_delay',
            source_app: 'doctor_app',
          })),
        );
        if (error) throw error;
      }
      toast.success(minutes ? `Delay of ${minutes} minutes announced` : 'Delay cleared');
    } catch {
      toast.warning('Delay saved locally', {
        description: 'Patient notification delivery is currently unavailable.',
      });
    }
  };

  return (
    <section className="relative min-h-full overflow-hidden bg-[#F2F6FA] p-4 text-[#2C243B] sm:p-6 lg:p-8">
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-[#BDE2F5]/70 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-[#9887B1]/25 blur-3xl" />
      <div className="relative mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-5 rounded-3xl border border-white/70 bg-white/55 p-5 shadow-[14px_14px_30px_rgba(137,74,102,0.13),-10px_-10px_26px_rgba(255,255,255,0.9)] backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#894A66]">
              <Users className="h-4 w-4" /> Live consultation flow
            </div>
            <h1 className="text-2xl font-black tracking-tight sm:text-4xl">Patient queue</h1>
            <p className="mt-1 text-sm text-[#2C243B]/60">{session.fullName} · {session.department}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void loadQueue(true)} disabled={syncing}
              className="inline-flex active:scale-95 items-center gap-2 rounded-2xl border border-white/80 bg-white/60 px-4 py-2.5 text-sm font-bold text-[#894A66] shadow-[5px_5px_12px_rgba(44,36,59,0.1),-5px_-5px_12px_white] transition disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button type="button" onClick={callNext} disabled={!waiting.length || actionId !== null}
              className="inline-flex active:scale-95 items-center gap-2 rounded-2xl bg-gradient-to-br from-[#894A66] to-[#93688E] px-5 py-2.5 text-sm font-bold text-white shadow-[7px_7px_16px_rgba(137,74,102,0.28),-5px_-5px_14px_white] transition disabled:opacity-50">
              <Megaphone className="h-4 w-4" /> Call next
            </button>
          </div>
        </header>

        {offline && <div className="rounded-2xl border border-[#93688E]/25 bg-white/55 px-4 py-3 text-sm text-[#894A66] backdrop-blur-xl">Database sync is unavailable. Queue changes are being retained locally.</div>}

        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map(([label, value, Icon], index) => (
            <div key={label} className="rounded-3xl border border-white/70 bg-gradient-to-br from-white/85 to-[#BDE2F5]/35 p-5 shadow-[9px_9px_20px_rgba(157,166,205,0.25),-8px_-8px_18px_white]">
              <div className="flex items-start justify-between">
                <Icon className="h-6 w-6 text-[#93688E]" />
                <span className="text-xs font-black text-[#9887B1]">0{index + 1}</span>
              </div>
              <p className="mt-5 text-xs font-bold uppercase tracking-wider text-[#2C243B]/50">{label}</p>
              <p className="mt-1 text-3xl font-black text-[#894A66]">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <aside className="h-fit rounded-3xl border border-white/70 bg-white/55 p-5 shadow-[10px_10px_24px_rgba(152,135,177,0.2),-8px_-8px_20px_white] backdrop-blur-2xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#A9C5E3] to-[#BDE2F5] text-[#894A66] shadow-[inset_2px_2px_5px_white,inset_-3px_-3px_7px_rgba(137,74,102,0.12)]">
              <Megaphone className="h-5 w-5" />
            </div>
            <h2 className="mt-4 font-black">Delay announcement</h2>
            <p className="mt-1 text-sm text-[#2C243B]/55">Notify all waiting patients immediately.</p>
            <label className="mt-5 block text-xs font-bold text-[#2C243B]/60">Estimated delay (minutes)</label>
            <input type="number" min="0" max="240" value={delayInput} onChange={(event) => setDelayInput(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/80 bg-[#F2F6FA]/75 px-4 py-3 font-black outline-none ring-[#93688E]/30 focus:ring-4" />
            <button type="button" onClick={() => void announceDelay()}
              className="mt-3 inline-flex active:scale-95 w-full items-center justify-center gap-2 rounded-2xl bg-[#2C243B] px-4 py-3 text-sm font-bold text-white shadow-[6px_6px_14px_rgba(44,36,59,0.22),-5px_-5px_12px_white] transition">
              <Megaphone className="h-4 w-4" /> Announce update
            </button>
            {preferences.delayMinutes > 0 && <p className="mt-3 rounded-xl bg-[#BDE2F5]/55 px-3 py-2 text-xs font-bold text-[#894A66]">Active delay: {preferences.delayMinutes} min</p>}
          </aside>

          <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/50 shadow-[12px_12px_28px_rgba(157,166,205,0.22),-9px_-9px_24px_white] backdrop-blur-2xl">
            {loading ? (
              <div className="flex min-h-72 flex-col items-center justify-center gap-3"><Loader2 className="h-8 w-8 animate-spin text-[#894A66]" /><p className="text-sm text-[#2C243B]/60">Loading live queue…</p></div>
            ) : appointments.length === 0 ? (
              <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center"><Users className="mb-3 h-10 w-10 text-[#9887B1]" /><h2 className="font-bold">No appointments in today&apos;s queue</h2><p className="mt-1 text-sm text-[#2C243B]/55">New checked-in appointments will appear automatically.</p></div>
            ) : (
              <div className="space-y-3 p-3 sm:p-4">
                {appointments.map((appointment, index) => {
                  const isEmergency = preferences.emergencyIds.includes(appointment.id);
                  return (
                    <article key={appointment.id} className={`flex flex-col gap-4 rounded-3xl border p-4 transition sm:flex-row sm:items-center sm:justify-between ${isEmergency ? 'border-[#894A66]/45 bg-gradient-to-r from-[#894A66]/12 to-white/75' : 'border-white/80 bg-gradient-to-r from-white/85 to-[#BDE2F5]/25'} shadow-[6px_6px_15px_rgba(157,166,205,0.19),-5px_-5px_13px_white]`}>
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex flex-col gap-1">
                          <button type="button" aria-label={`Move ${appointment.patient_name} up`} disabled={index === 0 || actionId !== null} onClick={() => void moveAppointment(index, -1)}
                            className="rounded-lg bg-white/70 p-1 text-[#93688E] transition active:scale-95 disabled:opacity-20"><ArrowUp className="h-3.5 w-3.5" /></button>
                          <button type="button" aria-label={`Move ${appointment.patient_name} down`} disabled={index === appointments.length - 1 || actionId !== null} onClick={() => void moveAppointment(index, 1)}
                            className="rounded-lg bg-white/70 p-1 text-[#93688E] transition active:scale-95 disabled:opacity-20"><ArrowDown className="h-3.5 w-3.5" /></button>
                        </div>
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#A9C5E3] to-[#BDE2F5] text-lg font-black text-[#894A66] shadow-[inset_2px_2px_5px_white,inset_-3px_-3px_7px_rgba(137,74,102,0.14)]">#{appointment.token_number}</div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="truncate font-black">{appointment.patient_name}</h2>
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${statusStyle(appointment.queue_status)}`}>{appointment.queue_status.replace('_', ' ')}</span>
                            {isEmergency && <span className="inline-flex items-center gap-1 rounded-full bg-[#894A66] px-2.5 py-1 text-[10px] font-black text-white"><Siren className="h-3 w-3" /> PRIORITY</span>}
                          </div>
                          <p className="mt-1 flex items-center gap-1.5 text-sm text-[#2C243B]/55"><Clock3 className="h-3.5 w-3.5" /> {appointment.slot_time}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        <button type="button" onClick={() => void toggleEmergency(appointment)}
                          className={`inline-flex active:scale-95 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition ${isEmergency ? 'border-[#894A66] bg-[#894A66] text-white' : 'border-[#93688E]/30 bg-white/50 text-[#894A66]'}`}>
                          <Crown className="h-3.5 w-3.5" /> {isEmergency ? 'Priority on' : 'Prioritize'}
                        </button>
                        {appointment.queue_status === 'SCHEDULED' && <button type="button" onClick={() => void updateToken(appointment, 'IN_PROGRESS')} disabled={actionId !== null} className="active:scale-95 rounded-xl bg-gradient-to-r from-[#894A66] to-[#93688E] px-4 py-2 text-sm font-bold text-white transition disabled:opacity-50">Call token</button>}
                        {appointment.queue_status === 'IN_PROGRESS' && <button type="button" onClick={() => void updateToken(appointment, 'COMPLETED')} disabled={actionId !== null} className="inline-flex active:scale-95 items-center gap-2 rounded-xl bg-[#2C243B] px-4 py-2 text-sm font-bold text-white transition disabled:opacity-50">{actionId === appointment.id && <Loader2 className="h-4 w-4 animate-spin" />}Complete</button>}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
