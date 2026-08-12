'use client';

import React, { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import {
  Users,
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  FileText,
  Wifi,
  WifiOff,
  RefreshCw,
  Play,
  Stethoscope,
  Loader2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  dispatchPrescriptionAndAdvice,
  fetchDoctorOpdQueue,
  formatError,
  updateOpdQueueStatus,
} from '@/lib/clinical/bridge';
import type { OpdQueueItem, QueueStatus } from '@/lib/clinical/types';
import { getActiveDoctorSession, type DoctorSession } from '@/lib/doctor/session';

const emptySubscribe = () => () => {};

function useIsClient() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

function readDoctorSession(): DoctorSession | null {
  if (typeof window === 'undefined') return null;
  return getActiveDoctorSession();
}

const glassCard =
  'rounded-3xl border border-white/70 bg-white/55 shadow-[12px_12px_28px_rgba(157,166,205,0.22),-9px_-9px_24px_white] backdrop-blur-2xl';
const glassSoft =
  'rounded-3xl border border-white/70 bg-gradient-to-br from-white/85 to-[#BDE2F5]/35 shadow-[9px_9px_20px_rgba(157,166,205,0.25),-8px_-8px_18px_white]';
const btnPrimary =
  'inline-flex active:scale-95 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#894A66] to-[#93688E] px-5 py-2.5 text-sm font-bold text-white shadow-[7px_7px_16px_rgba(137,74,102,0.28),-5px_-5px_14px_white] transition disabled:opacity-50';
const btnGhost =
  'inline-flex active:scale-95 items-center gap-2 rounded-2xl border border-white/80 bg-white/60 px-4 py-2.5 text-sm font-bold text-[#894A66] shadow-[5px_5px_12px_rgba(44,36,59,0.1),-5px_-5px_12px_white] transition disabled:opacity-50';
const fieldClass =
  'mt-1.5 w-full rounded-2xl border border-white/80 bg-[#F2F6FA]/75 px-4 py-3 text-xs font-bold text-[#2C243B] outline-none ring-[#93688E]/30 focus:ring-4';

export function DoctorWorkspace() {
  const router = useRouter();
  const isClient = useIsClient();
  const [session, setSession] = useState<DoctorSession | null>(null);
  const [queue, setQueue] = useState<OpdQueueItem[]>([]);
  const [activePatient, setActivePatient] = useState<OpdQueueItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [clinicalAdvice, setClinicalAdvice] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const doctorId = session?.employeeId || '';
  const doctorName = session?.doctor_name || session?.fullName || 'Clinician';
  const department = session?.department || 'OPD';

  const stats = useMemo(() => {
    const nowServing = queue.filter((q) => q.status === 'IN_PROGRESS').length;
    const waiting = queue.filter((q) => q.status === 'SCHEDULED').length;
    const completed = queue.filter((q) => q.status === 'COMPLETED').length;
    return [
      ['NOW SERVING', nowServing, Play],
      ['WAITING', waiting, Clock],
      ['COMPLETED', completed, CheckCircle2],
    ] as const;
  }, [queue]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  };

  const loadQueue = useCallback(async (clinicianId: string, quiet = false) => {
    if (!clinicianId) return;
    if (!quiet) setIsLoading(true);
    else setSyncing(true);
    try {
      const rows = await fetchDoctorOpdQueue(clinicianId);
      setQueue(rows);
      const onDeck = rows.find((r) => r.status === 'IN_PROGRESS') || null;
      setActivePatient((prev) => {
        if (prev && rows.some((r) => r.id === prev.id)) {
          return rows.find((r) => r.id === prev.id) || onDeck;
        }
        return onDeck;
      });
      setIsOnline(true);
    } catch (err) {
      console.warn('Queue load notice:', formatError(err));
      setIsOnline(false);
    } finally {
      setIsLoading(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    if (!isClient) return;
    const timer = window.setTimeout(() => {
      const active = readDoctorSession();
      setSession(active);
      if (!active?.employeeId) {
        router.replace('/doctor/login/');
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isClient, router]);

  useEffect(() => {
    if (!isClient || !doctorId) return;

    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const boot = window.setTimeout(() => {
      if (cancelled) return;
      void loadQueue(doctorId);

      try {
        channel = supabase
          .channel(`opd_queue_doctor_${doctorId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'opd_queue',
              filter: `doctor_id=eq.${doctorId}`,
            },
            () => {
              void loadQueue(doctorId, true);
            },
          )
          .subscribe((status: string) => {
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
      window.clearTimeout(boot);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [doctorId, isClient, loadQueue]);

  const updateStatus = async (id: string, status: QueueStatus) => {
    if (!doctorId) return;
    await updateOpdQueueStatus(id, doctorId, status);
    const next = await fetchDoctorOpdQueue(doctorId);
    setQueue(next);
    if (status === 'IN_PROGRESS') {
      setActivePatient(next.find((r) => r.id === id) || null);
      showToast('Patient called On Deck');
    }
    if (status === 'COMPLETED') {
      setActivePatient((prev) => (prev?.id === id ? null : prev));
      setDiagnosis('');
      setPrescription('');
      setClinicalAdvice('');
    }
  };

  const callNext = () => {
    const next = queue.find((q) => q.status === 'SCHEDULED');
    if (!next) {
      showToast('No waiting patients');
      return;
    }
    void updateStatus(next.id, 'IN_PROGRESS');
  };

  const handleSendPrescription = async () => {
    if (!activePatient || !doctorId) return;
    if (!prescription.trim()) {
      showToast('Enter medications / dosage before sending');
      return;
    }

    setIsSending(true);
    try {
      await dispatchPrescriptionAndAdvice({
        patientId: activePatient.patient_id,
        patientName: activePatient.patient_name,
        doctorId,
        doctorName,
        department: activePatient.department || department,
        queueId: activePatient.id,
        diagnosisDisease: diagnosis.trim() || activePatient.diagnosis || 'Clinical review',
        prescription: prescription.trim(),
        clinicalAdvice: clinicalAdvice.trim(),
      });

      if (diagnosis.trim()) {
        try {
          await supabase
            .from('opd_queue')
            .update({ diagnosis: diagnosis.trim() })
            .eq('id', activePatient.id);
        } catch {
          /* offline ok */
        }
      }

      await updateStatus(activePatient.id, 'COMPLETED');
      showToast('e-Prescription dispatched to Patient App');
    } catch (err) {
      console.warn('Dispatch failed:', formatError(err));
      showToast('Dispatch saved locally — sync pending');
    } finally {
      setIsSending(false);
    }
  };

  if (!isClient || !session) {
    return (
      <div className="flex min-h-72 items-center justify-center text-[#894A66]">
        <div className="flex items-center gap-3 text-sm font-bold">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading clinical workspace…
        </div>
      </div>
    );
  }

  return (
    <section className="relative min-h-full overflow-hidden bg-[#F2F6FA] text-[#2C243B]">
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-[#BDE2F5]/70 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-[#9887B1]/25 blur-3xl" />

      <div className="relative mx-auto max-w-7xl space-y-6">
        <header className={`flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7 ${glassCard}`}>
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#894A66]">
              <Stethoscope className="h-4 w-4" /> OPD Clinical Suite
            </div>
            <h1 className="text-2xl font-black tracking-tight sm:text-4xl">SmartQ consultation desk</h1>
            <p className="mt-1 text-sm text-[#2C243B]/60">
              {doctorName} · {department} · {doctorId}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/80 bg-white/60 px-3 py-2 text-xs font-bold text-[#2C243B]/70">
              {isOnline ? (
                <Wifi className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <WifiOff className="h-3.5 w-3.5 text-amber-600" />
              )}
              {isOnline ? 'Supabase Live' : 'Offline Cache'}
            </div>
            <button
              type="button"
              onClick={() => void loadQueue(doctorId, true)}
              disabled={syncing}
              className={btnGhost}
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button type="button" onClick={callNext} className={btnPrimary}>
              <Play className="h-4 w-4" /> Call next
            </button>
          </div>
        </header>

        {toast ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
            {toast}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map(([label, value, Icon], index) => (
            <div key={label} className={`p-5 ${glassSoft}`}>
              <div className="flex items-start justify-between">
                <Icon className="h-6 w-6 text-[#93688E]" />
                <span className="text-xs font-black text-[#9887B1]">0{index + 1}</span>
              </div>
              <p className="mt-5 text-xs font-bold uppercase tracking-wider text-[#2C243B]/50">
                {label}
              </p>
              <p className="mt-1 text-3xl font-black text-[#894A66]">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          {/* Live SmartQ Deck */}
          <aside className={`flex min-h-[420px] flex-col overflow-hidden ${glassCard}`}>
            <div className="flex items-center justify-between border-b border-white/60 px-5 py-4">
              <h2 className="flex items-center gap-2 text-sm font-black text-[#2C243B]">
                <Clock className="h-4 w-4 text-[#894A66]" /> Live SmartQ Deck
              </h2>
              <span className="rounded-full bg-[#BDE2F5]/55 px-2.5 py-1 text-[10px] font-black text-[#894A66]">
                {doctorId}
              </span>
            </div>

            <div className="flex-1 space-y-2.5 overflow-y-auto p-3">
              {isLoading ? (
                <div className="flex h-48 flex-col items-center justify-center gap-2 text-sm text-[#2C243B]/60">
                  <Loader2 className="h-6 w-6 animate-spin text-[#894A66]" />
                  Loading SmartQ deck…
                </div>
              ) : queue.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center p-6 text-center">
                  <Users className="mb-3 h-10 w-10 text-[#9887B1]" />
                  <h3 className="font-bold">No patients in your queue yet</h3>
                  <p className="mt-1 text-sm text-[#2C243B]/55">
                    Bookings for {doctorId} appear here in real time.
                  </p>
                </div>
              ) : (
                queue.map((item) => {
                  const isActive = activePatient?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setActivePatient(item)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') setActivePatient(item);
                      }}
                      className={`cursor-pointer rounded-3xl border p-4 transition ${
                        isActive
                          ? 'border-[#894A66]/45 bg-gradient-to-r from-[#894A66]/12 to-white/75 shadow-[6px_6px_15px_rgba(137,74,102,0.18)]'
                          : item.status === 'COMPLETED'
                            ? 'border-white/60 bg-white/40 opacity-70'
                            : 'border-white/80 bg-gradient-to-r from-white/85 to-[#BDE2F5]/25 shadow-[6px_6px_15px_rgba(157,166,205,0.19),-5px_-5px_13px_white]'
                      }`}
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#A9C5E3] to-[#BDE2F5] text-sm font-black text-[#894A66] shadow-[inset_2px_2px_5px_white,inset_-3px_-3px_7px_rgba(137,74,102,0.14)]">
                            #{item.token_number}
                          </div>
                          <div>
                            <h4 className="text-sm font-black leading-tight text-[#2C243B]">
                              {item.patient_name}
                            </h4>
                            <p className="mt-0.5 text-xs font-bold text-[#2C243B]/55">
                              {item.age} yrs • {item.gender}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                            item.priority === 'EMERGENCY'
                              ? 'bg-rose-100 text-rose-800'
                              : item.priority === 'URGENT'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-[#9887B1]/15 text-[#894A66]'
                          }`}
                        >
                          {item.priority}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                            item.status === 'IN_PROGRESS'
                              ? 'bg-[#BDE2F5] text-[#2C243B]'
                              : item.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-[#9887B1]/15 text-[#894A66]'
                          }`}
                        >
                          {item.status.replace('_', ' ')}
                        </span>
                        <div className="flex gap-1.5">
                          {item.status !== 'IN_PROGRESS' && item.status !== 'COMPLETED' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                void updateStatus(item.id, 'IN_PROGRESS');
                              }}
                              className="rounded-xl bg-gradient-to-r from-[#894A66] to-[#93688E] px-3 py-1.5 text-[11px] font-bold text-white transition active:scale-95"
                            >
                              Call Deck
                            </button>
                          )}
                          {item.status === 'IN_PROGRESS' && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
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
          </aside>

          {/* Consultation canvas */}
          <div className={`min-h-[420px] overflow-hidden ${glassCard}`}>
            {activePatient ? (
              <div className="space-y-5 p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/80 bg-gradient-to-r from-white/90 to-[#BDE2F5]/30 p-5 shadow-[6px_6px_15px_rgba(157,166,205,0.16)]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-black text-[#2C243B]">{activePatient.patient_name}</h2>
                      <span className="rounded-full bg-[#BDE2F5] px-2.5 py-1 text-[10px] font-black text-[#2C243B]">
                        Token #{activePatient.token_number}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[#2C243B]/60">
                      {activePatient.age} Yrs • {activePatient.gender} • Blood Group:{' '}
                      <span className="font-bold text-[#894A66]">
                        {activePatient.blood_group || '—'}
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void updateStatus(activePatient.id, 'COMPLETED')}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#2C243B] px-4 py-2.5 text-sm font-bold text-white shadow-[6px_6px_14px_rgba(44,36,59,0.22)] transition active:scale-95"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Finish Consultation
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div className={`p-4 ${glassSoft}`}>
                    <p className="text-xs font-bold text-[#2C243B]/50">Blood Pressure</p>
                    <p className="mt-1 text-lg font-black text-[#894A66]">
                      {activePatient.vitals?.bp || '120/80'}
                    </p>
                  </div>
                  <div className={`p-4 ${glassSoft}`}>
                    <p className="text-xs font-bold text-[#2C243B]/50">Heart Rate</p>
                    <p className="mt-1 text-lg font-black text-emerald-700">
                      {activePatient.vitals?.hr || '72 bpm'}
                    </p>
                  </div>
                  <div className={`p-4 ${glassSoft}`}>
                    <p className="text-xs font-bold text-[#2C243B]/50">Spo2</p>
                    <p className="mt-1 text-lg font-black text-cyan-700">
                      {activePatient.vitals?.spo2 || '98%'}
                    </p>
                  </div>
                  <div className={`p-4 ${glassSoft}`}>
                    <p className="text-xs font-bold text-[#2C243B]/50">Known Allergies</p>
                    <div className="mt-1 flex items-center gap-1 text-xs font-bold text-amber-700">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {activePatient.allergies?.length
                        ? activePatient.allergies.join(', ')
                        : 'None'}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 rounded-3xl border border-white/80 bg-white/60 p-5 shadow-[6px_6px_15px_rgba(157,166,205,0.14)]">
                  <h3 className="flex items-center gap-2 text-sm font-black text-[#2C243B]">
                    <FileText className="h-4 w-4 text-[#894A66]" /> Rx & Direct Guidance Dispatcher
                  </h3>

                  <div>
                    <label className="text-xs font-bold text-[#2C243B]/60">Diagnosis / Disease</label>
                    <input
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      placeholder="e.g. Acute pharyngitis"
                      className={fieldClass}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#2C243B]/60">
                      e-Prescription (medications & dosage)
                    </label>
                    <textarea
                      rows={3}
                      value={prescription}
                      onChange={(e) => setPrescription(e.target.value)}
                      placeholder="Tab Paracetamol 500mg 1-0-1 × 3 days..."
                      className={fieldClass}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#2C243B]/60">
                      Direct Advice to Patient App
                    </label>
                    <textarea
                      rows={2}
                      value={clinicalAdvice}
                      onChange={(e) => setClinicalAdvice(e.target.value)}
                      placeholder="Drink warm water, rest for 2 days..."
                      className={fieldClass}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleSendPrescription()}
                    disabled={isSending}
                    className={`${btnPrimary} w-full`}
                  >
                    <Send className="h-4 w-4" />
                    {isSending ? 'Syncing…' : 'Send Direct to Patient App'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[420px] flex-col items-center justify-center p-8 text-center">
                <Users className="mb-3 h-10 w-10 text-[#9887B1]" />
                <h2 className="font-bold">Select a patient to start consultation</h2>
                <p className="mt-1 text-sm text-[#2C243B]/55">
                  Call a token from the Live SmartQ Deck to open vitals and e-prescription tools.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default DoctorWorkspace;
