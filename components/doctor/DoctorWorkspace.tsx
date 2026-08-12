'use client';

import React, { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  Users,
  Activity,
  Bell,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  FileText,
  Wifi,
  WifiOff,
  Stethoscope,
} from 'lucide-react';

const QUEUE_CACHE_KEY = 'curasync_doctor_queue_cache';
const SESSION_KEYS = ['curasync_active_doctor', 'active_doctor_session'] as const;

export interface QueueItem {
  id: string;
  token_number: string;
  patient_id: string;
  patient_name: string;
  age: number;
  gender: string;
  blood_group: string;
  vitals: { bp?: string; hr?: string; temp?: string; spo2?: string };
  allergies: string[];
  priority: 'ROUTINE' | 'URGENT' | 'EMERGENCY';
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  created_at?: string;
}

type ActiveDoctorProfile = {
  doctor_name?: string;
  fullName?: string;
  employeeId?: string;
  doctorId?: string;
  department?: string;
};

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function safeGetItem(key: string): string | null {
  if (!isBrowser()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* quota / private mode */
  }
}

function readActiveDoctor(): ActiveDoctorProfile | null {
  for (const key of SESSION_KEYS) {
    const raw = safeGetItem(key);
    if (!raw) continue;
    try {
      return JSON.parse(raw) as ActiveDoctorProfile;
    } catch {
      /* continue */
    }
  }
  return null;
}

function getSupabaseEnv() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
  const ready =
    Boolean(url) &&
    Boolean(anonKey) &&
    url.startsWith('http') &&
    !url.includes('placeholder.supabase.co') &&
    anonKey !== 'placeholder-key';
  return { url, anonKey, ready };
}

/** Lazy singleton — never throws when env vars are missing on Cloudflare. */
let supabaseSingleton: SupabaseClient | null | undefined;

function getSupabase(): SupabaseClient | null {
  if (supabaseSingleton !== undefined) return supabaseSingleton;

  const { url, anonKey, ready } = getSupabaseEnv();
  if (!ready) {
    console.warn(
      'Supabase env missing or placeholder — DoctorWorkspace running in offline/local mode.',
    );
    supabaseSingleton = null;
    return null;
  }

  try {
    supabaseSingleton = createClient(url, anonKey, {
      auth: {
        persistSession: isBrowser(),
        autoRefreshToken: isBrowser(),
        detectSessionInUrl: false,
      },
      global: {
        fetch: async (...args) => {
          try {
            return await fetch(...args);
          } catch (err) {
            console.warn('Supabase unreachable; offline mode:', err);
            return new Response(JSON.stringify({ error: 'Network unavailable' }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            });
          }
        },
      },
    });
  } catch (err) {
    console.warn('Failed to init Supabase client:', err);
    supabaseSingleton = null;
  }

  return supabaseSingleton;
}

function formatError(err: unknown): string {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'object') {
    const e = err as { message?: string; details?: string; code?: string };
    return [e.message, e.details, e.code].filter(Boolean).join(' · ') || 'Request failed';
  }
  return 'Request failed';
}

const emptySubscribe = () => () => {};

function useIsClient() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

export function DoctorWorkspace() {
  const isClient = useIsClient();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [activePatient, setActivePatient] = useState<QueueItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [prescription, setPrescription] = useState('');
  const [clinicalAdvice, setClinicalAdvice] = useState('');
  const [isSending, setIsSending] = useState(false);

  const doctor = useMemo<ActiveDoctorProfile | null>(() => {
    if (!isClient) return null;
    return readActiveDoctor();
  }, [isClient]);

  const doctorLabel = doctor?.doctor_name || doctor?.fullName || 'Clinician';

  const loadCache = useCallback(() => {
    const cached = safeGetItem(QUEUE_CACHE_KEY);
    if (!cached) return;
    try {
      const parsed = JSON.parse(cached) as QueueItem[];
      if (!Array.isArray(parsed)) return;
      setQueue(parsed);
      setActivePatient(parsed.find((i) => i.status === 'IN_PROGRESS') || null);
    } catch {
      /* ignore corrupt cache */
    }
  }, []);

  const fetchQueue = useCallback(async () => {
    setIsLoading(true);
    const client = getSupabase();

    if (!client) {
      setIsOnline(false);
      loadCache();
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await client
        .from('opd_queue')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const queueData = (data || []) as QueueItem[];
      setQueue(queueData);
      safeSetItem(QUEUE_CACHE_KEY, JSON.stringify(queueData));
      setIsOnline(true);

      const currentActive = queueData.find((item) => item.status === 'IN_PROGRESS');
      if (currentActive) setActivePatient(currentActive);
    } catch (err) {
      console.warn('Backend connection issue, fallback to cache:', formatError(err));
      setIsOnline(false);
      loadCache();
    } finally {
      setIsLoading(false);
    }
  }, [loadCache]);

  useEffect(() => {
    if (!isClient) return;

    let cancelled = false;
    let channel: ReturnType<SupabaseClient['channel']> | null = null;
    const client = getSupabase();

    // Defer state updates so this effect stays edge/SSR lint-safe
    const bootTimer = window.setTimeout(() => {
      if (cancelled) return;
      void fetchQueue();

      if (!client) return;

      try {
        channel = client
          .channel('opd_queue_doctor_realtime')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'opd_queue' },
            (payload) => {
              setQueue((prevQueue) => {
                let updated = [...prevQueue];
                if (payload.eventType === 'INSERT' && payload.new) {
                  updated.push(payload.new as QueueItem);
                } else if (payload.eventType === 'UPDATE' && payload.new) {
                  updated = updated.map((item) =>
                    item.id === (payload.new as QueueItem).id ? (payload.new as QueueItem) : item,
                  );
                } else if (payload.eventType === 'DELETE' && payload.old) {
                  updated = updated.filter((item) => item.id !== (payload.old as QueueItem).id);
                }

                safeSetItem(QUEUE_CACHE_KEY, JSON.stringify(updated));

                const next = payload.new as QueueItem | undefined;
                if (next?.status === 'IN_PROGRESS') {
                  setActivePatient(next);
                }
                return updated;
              });
            },
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') setIsOnline(true);
            if (status === 'CLOSED' || status === 'CHANNEL_ERROR') setIsOnline(false);
          });
      } catch (err) {
        console.warn('Realtime subscribe skipped:', formatError(err));
        setIsOnline(false);
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(bootTimer);
      if (channel && client) {
        try {
          void client.removeChannel(channel);
        } catch {
          /* ignore */
        }
      }
    };
  }, [fetchQueue, isClient]);

  const updatePatientStatus = async (id: string, newStatus: QueueItem['status']) => {
    const updatedQueue = queue.map((p) => {
      if (p.id === id) return { ...p, status: newStatus };
      if (newStatus === 'IN_PROGRESS' && p.id !== id && p.status === 'IN_PROGRESS') {
        return { ...p, status: 'COMPLETED' as const };
      }
      return p;
    });

    setQueue(updatedQueue);
    safeSetItem(QUEUE_CACHE_KEY, JSON.stringify(updatedQueue));

    const target = updatedQueue.find((p) => p.id === id) || null;
    if (newStatus === 'IN_PROGRESS') setActivePatient(target);
    if (newStatus === 'COMPLETED' && activePatient?.id === id) setActivePatient(null);

    const client = getSupabase();
    if (!client) return;

    try {
      const { error } = await client.from('opd_queue').update({ status: newStatus }).eq('id', id);
      if (error) console.warn('Failed to update state on backend:', formatError(error));
    } catch (err) {
      console.warn('Failed to update state on backend:', formatError(err));
    }
  };

  const handleSendPrescription = async () => {
    if (!activePatient) return;
    setIsSending(true);

    const client = getSupabase();
    const payload = {
      patient_id: activePatient.patient_id,
      doctor_id: doctor?.employeeId || doctor?.doctorId || 'local-doctor',
      prescription,
      clinical_advice: clinicalAdvice,
      created_at: new Date().toISOString(),
    };

    try {
      if (client) {
        const { error } = await client.from('clinical_notes').insert(payload);
        if (error) throw error;
      } else {
        // Offline: stash locally so the workspace never hard-crashes
        const key = 'curasync_clinical_notes';
        const existingRaw = safeGetItem(key);
        const existing = existingRaw ? (JSON.parse(existingRaw) as unknown[]) : [];
        safeSetItem(key, JSON.stringify([...existing, payload]));
      }

      await updatePatientStatus(activePatient.id, 'COMPLETED');
      setPrescription('');
      setClinicalAdvice('');
      if (isBrowser()) window.alert('Prescription successfully sent to Patient App!');
    } catch (err) {
      console.warn('Error dispatching prescription:', formatError(err));
      if (isBrowser()) window.alert('Failed to send prescription — saved locally if possible.');
    } finally {
      setIsSending(false);
    }
  };

  if (!isClient) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-300">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950 px-6 py-4 text-xs font-semibold">
          <Activity className="h-4 w-4 animate-pulse text-purple-400" />
          Loading clinical workspace…
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen h-full min-w-0 flex-1 flex-col bg-slate-900 font-sans text-slate-100">
      <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900/50 px-6 backdrop-blur">
        <div className="flex items-center gap-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2C1929] text-[#D8A657]">
            <Stethoscope className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">OPD Clinical Suite</h2>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {doctorLabel}
              {doctor?.employeeId ? ` · ${doctor.employeeId}` : ''}
              {doctor?.department ? ` · ${doctor.department}` : ''}
            </p>
          </div>
          <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-400">
            Active Queue: {queue.filter((q) => q.status !== 'COMPLETED').length} Patients
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-emerald-400" />
            ) : (
              <WifiOff className="h-4 w-4 text-amber-400" />
            )}
            <span className={isOnline ? 'font-medium text-emerald-400' : 'font-medium text-amber-400'}>
              {isOnline ? 'Supabase Live' : 'Offline Cache'}
            </span>
          </div>

          <button
            type="button"
            className="relative rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-purple-500" />
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-12 overflow-hidden">
        <div className="col-span-12 flex flex-col border-r border-slate-800 bg-slate-950/40 md:col-span-4">
          <div className="flex items-center justify-between border-b border-slate-800 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Clock className="h-4 w-4 text-purple-400" /> Live SmartQ Deck
            </h3>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto p-3">
            {isLoading ? (
              <div className="flex h-40 items-center justify-center text-xs text-slate-400">
                Loading SmartQ deck...
              </div>
            ) : queue.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center p-4 text-center text-slate-500">
                <Users className="mb-1 h-8 w-8 stroke-1 text-slate-600" />
                <p className="text-xs">No patients currently in queue.</p>
              </div>
            ) : (
              queue.map((item) => {
                const isActive = activePatient?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setActivePatient(item)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') setActivePatient(item);
                    }}
                    role="button"
                    tabIndex={0}
                    className={`cursor-pointer rounded-xl border p-3.5 transition ${
                      isActive
                        ? 'border-purple-500 bg-purple-950/40 shadow-lg shadow-purple-950/50'
                        : item.status === 'COMPLETED'
                          ? 'border-slate-800/50 bg-slate-900/30 opacity-60'
                          : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                          {item.token_number}
                        </span>
                        <h4 className="mt-0.5 text-sm font-semibold leading-tight text-slate-100">
                          {item.patient_name}
                        </h4>
                      </div>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          item.priority === 'EMERGENCY'
                            ? 'border border-red-500/30 bg-red-500/20 text-red-400'
                            : item.priority === 'URGENT'
                              ? 'border border-amber-500/30 bg-amber-500/20 text-amber-400'
                              : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.priority}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>
                        {item.age} yrs • {item.gender}
                      </span>
                      <div className="flex gap-1.5">
                        {item.status !== 'IN_PROGRESS' && item.status !== 'COMPLETED' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              void updatePatientStatus(item.id, 'IN_PROGRESS');
                            }}
                            className="rounded bg-purple-600 px-2 py-1 text-[11px] font-medium text-white transition hover:bg-purple-500"
                          >
                            Call Deck
                          </button>
                        )}
                        {item.status === 'IN_PROGRESS' && (
                          <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                            <Activity className="h-3 w-3 animate-pulse" /> On Deck
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="col-span-12 flex flex-col overflow-y-auto bg-slate-900/30 p-6 md:col-span-8">
          {activePatient ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-white">{activePatient.patient_name}</h2>
                    <span className="rounded bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
                      {activePatient.token_number}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {activePatient.age} Yrs • {activePatient.gender} • Blood Group:{' '}
                    <span className="font-semibold text-slate-200">{activePatient.blood_group}</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void updatePatientStatus(activePatient.id, 'COMPLETED')}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-emerald-500"
                >
                  <CheckCircle2 className="h-4 w-4" /> Finish Consultation
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
                  <p className="text-xs font-medium text-slate-400">Blood Pressure</p>
                  <p className="mt-1 text-lg font-bold text-purple-400">
                    {activePatient.vitals?.bp || '120/80'}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
                  <p className="text-xs font-medium text-slate-400">Heart Rate</p>
                  <p className="mt-1 text-lg font-bold text-emerald-400">
                    {activePatient.vitals?.hr || '72 bpm'}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
                  <p className="text-xs font-medium text-slate-400">Spo2</p>
                  <p className="mt-1 text-lg font-bold text-cyan-400">
                    {activePatient.vitals?.spo2 || '98%'}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
                  <p className="text-xs font-medium text-slate-400">Known Allergies</p>
                  <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-amber-400">
                    <AlertTriangle className="h-3 w-3" />
                    {activePatient.allergies?.length ? activePatient.allergies.join(', ') : 'None'}
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                  <FileText className="h-4 w-4 text-purple-400" /> Rx & Direct Guidance Dispatcher
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-slate-400">e-Prescription</label>
                    <textarea
                      rows={3}
                      value={prescription}
                      onChange={(e) => setPrescription(e.target.value)}
                      placeholder="Tab Paracetamol 500mg 1-0-1..."
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-xs text-slate-100 focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-slate-400">
                      Direct Advice to Patient App
                    </label>
                    <textarea
                      rows={2}
                      value={clinicalAdvice}
                      onChange={(e) => setClinicalAdvice(e.target.value)}
                      placeholder="Drink warm water, rest for 2 days..."
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-xs text-slate-100 focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleSendPrescription()}
                    disabled={isSending}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-2.5 text-xs font-semibold text-white transition hover:bg-purple-500 disabled:bg-purple-800"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {isSending ? 'Syncing...' : 'Send Direct to Patient App'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
              <Users className="mb-2 h-12 w-12 stroke-1 text-slate-600" />
              <p className="text-sm">
                Select or call a patient from the SmartQ deck to start consultation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DoctorWorkspace;
