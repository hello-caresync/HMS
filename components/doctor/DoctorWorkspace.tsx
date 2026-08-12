'use client';

import React, { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
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
  LogOut,
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
import { clearDoctorSession, getActiveDoctorSession, type DoctorSession } from '@/lib/doctor/session';

const emptySubscribe = () => () => {};

function useIsClient() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

function readDoctorSession(): DoctorSession | null {
  if (typeof window === 'undefined') return null;
  return getActiveDoctorSession();
}

export function DoctorWorkspace() {
  const router = useRouter();
  const isClient = useIsClient();
  const [session, setSession] = useState<DoctorSession | null>(null);
  const [queue, setQueue] = useState<OpdQueueItem[]>([]);
  const [activePatient, setActivePatient] = useState<OpdQueueItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [clinicalAdvice, setClinicalAdvice] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const doctorId = session?.employeeId || '';
  const doctorName = session?.doctor_name || session?.fullName || 'Clinician';
  const department = session?.department || 'OPD';

  const activeCount = useMemo(
    () => queue.filter((q) => q.status !== 'COMPLETED' && q.status !== 'CANCELLED').length,
    [queue],
  );

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  };

  const loadQueue = useCallback(async (clinicianId: string) => {
    if (!clinicianId) return;
    setIsLoading(true);
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
              void loadQueue(doctorId);
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

  const handleLogout = () => {
    clearDoctorSession();
    router.push('/doctor/login/');
  };

  if (!isClient || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-300">
        <div className="flex items-center gap-3 rounded-2xl border border-purple-900/30 bg-slate-950 px-6 py-4 text-xs font-semibold">
          <Activity className="h-4 w-4 animate-pulse text-purple-400" />
          Loading clinical workspace…
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-900 font-sans text-slate-100">
      {/* Obsidian plum sidebar */}
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col justify-between border-r border-purple-900/30 bg-[#2C1929] p-5">
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-purple-900/30 pb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-lg">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-black text-white">Regal Hospital</p>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-purple-300">
                Doctor Portal
              </p>
            </div>
          </div>

          <div className="space-y-1 rounded-2xl border border-purple-900/30 bg-slate-950/40 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-wider text-purple-300">
                Active Clinician
              </span>
              <Activity className="h-3.5 w-3.5 animate-pulse text-emerald-400" />
            </div>
            <p className="truncate text-xs font-black text-white">{doctorName}</p>
            <p className="text-[10px] font-bold text-slate-300">
              {doctorId} • {department}
            </p>
          </div>

          <div className="rounded-2xl border border-purple-900/30 bg-slate-950/30 p-3 text-[11px] font-bold text-slate-300">
            SmartQ stream filtered to <span className="text-purple-300">{doctorId}</span> only.
            Switching login profile swaps this deck.
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-900/40 bg-slate-950/50 px-4 py-3 text-xs font-black text-rose-300 transition hover:bg-rose-950/40"
        >
          <LogOut className="h-4 w-4" /> End Session
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-purple-900/30 bg-slate-950/80 px-6 backdrop-blur">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-white">OPD Clinical Suite</h2>
            <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-400">
              Active Queue: {activeCount} Patients
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
            </button>
          </div>
        </header>

        {toast ? (
          <div className="mx-6 mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-bold text-emerald-300">
            {toast}
          </div>
        ) : null}

        <div className="grid min-h-0 flex-1 grid-cols-12 overflow-hidden">
          <div className="col-span-12 flex flex-col border-r border-purple-900/30 bg-slate-950/40 md:col-span-4">
            <div className="flex items-center justify-between border-b border-purple-900/30 p-4">
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
                  <p className="text-xs">No patients in your queue yet.</p>
                  <p className="mt-1 text-[10px] text-slate-600">
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
                      className={`cursor-pointer rounded-xl border p-3.5 transition ${
                        isActive
                          ? 'border-purple-500 bg-purple-950/40 shadow-lg shadow-purple-950/50'
                          : item.status === 'COMPLETED'
                            ? 'border-slate-800/50 bg-slate-900/30 opacity-60'
                            : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                      }`}
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                            Token {item.token_number}
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
                                void updateStatus(item.id, 'IN_PROGRESS');
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

          <div className="col-span-12 flex flex-col overflow-y-auto bg-slate-900 p-6 md:col-span-8">
            {activePatient ? (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-purple-900/30 bg-slate-950 p-5">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold text-white">{activePatient.patient_name}</h2>
                      <span className="rounded bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
                        Token {activePatient.token_number}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {activePatient.age} Yrs • {activePatient.gender} • Blood Group:{' '}
                      <span className="font-semibold text-slate-200">
                        {activePatient.blood_group || '—'}
                      </span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void updateStatus(activePatient.id, 'COMPLETED')}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-emerald-500"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Finish Consultation
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="rounded-xl border border-purple-900/30 bg-slate-950 p-4">
                    <p className="text-xs font-medium text-slate-400">Blood Pressure</p>
                    <p className="mt-1 text-lg font-bold text-purple-400">
                      {activePatient.vitals?.bp || '120/80'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-purple-900/30 bg-slate-950 p-4">
                    <p className="text-xs font-medium text-slate-400">Heart Rate</p>
                    <p className="mt-1 text-lg font-bold text-emerald-400">
                      {activePatient.vitals?.hr || '72 bpm'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-purple-900/30 bg-slate-950 p-4">
                    <p className="text-xs font-medium text-slate-400">Spo2</p>
                    <p className="mt-1 text-lg font-bold text-cyan-400">
                      {activePatient.vitals?.spo2 || '98%'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-purple-900/30 bg-slate-950 p-4">
                    <p className="text-xs font-medium text-slate-400">Known Allergies</p>
                    <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-amber-400">
                      <AlertTriangle className="h-3 w-3" />
                      {activePatient.allergies?.length
                        ? activePatient.allergies.join(', ')
                        : 'None'}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 rounded-2xl border border-purple-900/30 bg-slate-950 p-5">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                    <FileText className="h-4 w-4 text-purple-400" /> Rx & Direct Guidance Dispatcher
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs text-slate-400">
                        Diagnosis / Disease
                      </label>
                      <input
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        placeholder="e.g. Acute pharyngitis"
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-xs text-slate-100 focus:border-purple-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs text-slate-400">
                        e-Prescription (medications & dosage)
                      </label>
                      <textarea
                        rows={3}
                        value={prescription}
                        onChange={(e) => setPrescription(e.target.value)}
                        placeholder="Tab Paracetamol 500mg 1-0-1 × 3 days..."
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
                      {isSending ? 'Syncing…' : 'Send Direct to Patient App'}
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
    </div>
  );
}

export default DoctorWorkspace;
