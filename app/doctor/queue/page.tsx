'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  Megaphone,
  Play,
  Stethoscope,
  UserCheck,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import { createClient } from '@/lib/supabase/client';
import {
  DEFAULT_ACTIVE_DOCTOR_ID,
  getDoctorDashboardData,
  OPDToken,
  rpcCallNextPatient,
  startEncounter,
} from '@/lib/doctor/command-center/supabase-service';
import type { LiveQueueRow } from '@/lib/doctor/command-center/types';

interface QueueItem {
  id: string;
  appointmentId: string | null;
  tokenNumber: string;
  patientName: string;
  ageGender: string;
  chiefComplaint: string;
  predictedWait: string;
  status: 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED';
  raw: LiveQueueRow;
}

function calcAge(dob?: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDelta = today.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

function tokenToLiveRow(token: OPDToken): LiveQueueRow {
  const p = token.patient_profiles;
  return {
    id: token.id,
    appointment_id: token.appointment_id || null,
    doctor_id: token.doctor_id,
    patient_id: token.patient_id,
    token_number: token.token_number,
    sequence_number: token.sequence_number,
    status:
      token.status === 'CALLED' || token.status === 'called'
        ? 'CALLED'
        : token.status === 'IN_CONSULTATION' || token.status === 'in_progress'
          ? 'IN_CONSULTATION'
          : token.status === 'COMPLETED' || token.status === 'completed'
            ? 'COMPLETED'
            : 'ISSUED',
    estimated_wait_minutes: token.estimated_wait_minutes,
    patient_name: p?.full_name || 'Patient',
    gender: p?.gender,
    blood_group: p?.blood_group,
    dob: p?.dob,
    phone: p?.phone,
  };
}

function toQueueItem(row: LiveQueueRow): QueueItem {
  const age = row.age ?? calcAge(row.dob);
  const waitMins = row.estimated_wait_minutes ?? 10;
  const status: QueueItem['status'] =
    row.status === 'IN_CONSULTATION'
      ? 'IN_CONSULTATION'
      : row.status === 'COMPLETED'
        ? 'COMPLETED'
        : 'WAITING';

  return {
    id: row.id,
    appointmentId: row.appointment_id,
    tokenNumber: row.token_number,
    patientName: row.patient_name,
    ageGender: `${age ?? '—'} · ${row.gender ?? '—'}`,
    chiefComplaint:
      row.chief_complaint || row.reason_for_visit || 'General consultation',
    predictedWait: `${waitMins} min`,
    status,
    raw: row,
  };
}

export default function DoctorQueuePage() {
  const router = useRouter();
  const [queueTokens, setQueueTokens] = useState<OPDToken[]>([]);
  const [waitingCount, setWaitingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [doctorId, setDoctorId] = useState(DEFAULT_ACTIVE_DOCTOR_ID);
  const [loading, setLoading] = useState(true);
  const [activePatient, setActivePatient] = useState<QueueItem | null>(null);
  const [calling, setCalling] = useState(false);
  const [starting, setStarting] = useState(false);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDoctorDashboardData();
      setQueueTokens(data.liveQueueTokens);
      setWaitingCount(data.waitingQueue);
      setCompletedCount(data.completed);
      if (data.doctorId) setDoctorId(data.doctorId);
    } catch (error) {
      console.error('Failed to load SmartQ queue:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('doctor-queue-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'opd_tokens' }, () => {
        void loadQueue();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        void loadQueue();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadQueue]);

  const queue = useMemo(
    () => queueTokens.map((token) => toQueueItem(tokenToLiveRow(token))),
    [queueTokens],
  );

  const avgWaitMinutes = useMemo(() => {
    if (queue.length === 0) return 8;
    const total = queue.reduce((sum, item) => {
      const mins = parseInt(item.predictedWait, 10);
      return sum + (Number.isNaN(mins) ? 10 : mins);
    }, 0);
    return Math.round(total / queue.length);
  }, [queue]);

  const calledFromQueue = queue.find((q) => q.raw.status === 'CALLED') ?? null;
  const onDeck = activePatient ?? calledFromQueue;

  const hasWaitingPatients = queue.some((q) => q.status === 'WAITING');
  const canCallNext = hasWaitingPatients && !calling;
  const canStartEncounter = Boolean(onDeck && onDeck.raw.status === 'CALLED' && !starting);

  const handleCallNext = async () => {
    if (!hasWaitingPatients) {
      toast.info('No patients currently waiting in queue');
      return;
    }

    setCalling(true);
    try {
      const next = await rpcCallNextPatient(doctorId);
      if (next) {
        setActivePatient(toQueueItem(next));
      } else {
        const fallback = queue.find((q) => q.status === 'WAITING');
        if (fallback) setActivePatient(fallback);
      }
      await loadQueue();
    } finally {
      setCalling(false);
    }
  };

  const handleStartEncounter = async () => {
    if (!onDeck) return;
    setStarting(true);
    try {
      await startEncounter(onDeck.raw, doctorId);
      if (onDeck.appointmentId) {
        router.push(`/doctor/consultations/${onDeck.appointmentId}`);
      }
      await loadQueue();
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="h-auto w-full space-y-4 bg-slate-50/50 p-5">
      {/* Top Banner / Header Context */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              SmartQ OPD Command Center
            </h1>
            <span className="rounded-full border border-teal-200/80 bg-teal-50 px-2.5 py-0.5 text-[11px] font-bold text-teal-700">
              LIVE ML ENGINE
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Real-time patient wait time forecasting and queue orchestration
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200/70 bg-emerald-50 px-3.5 py-1.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
              Queue Sync Active
            </span>
          </div>
          <button
            type="button"
            onClick={() => void loadQueue()}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-100"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid h-auto grid-cols-1 gap-5 lg:grid-cols-12">
        {/* LEFT PANEL: Live SmartQ Queue */}
        <div className="flex h-auto flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm lg:col-span-6">
          <div>
            {/* Panel Header */}
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-teal-100 bg-teal-50 p-2.5 text-teal-600">
                  <Megaphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold leading-tight text-slate-800">
                    Live SmartQ Queue
                  </h3>
                  <p className="text-xs text-slate-400">Incoming patient check-ins</p>
                </div>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="mb-4 grid grid-cols-3 gap-3">
              <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="rounded-lg bg-blue-100/70 p-2 text-blue-600">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Waiting
                  </span>
                  <span className="text-base font-bold text-slate-800">
                    {loading ? '—' : waitingCount}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="rounded-lg bg-indigo-100/70 p-2 text-indigo-600">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Avg Wait
                  </span>
                  <span className="text-base font-bold text-slate-800">~{avgWaitMinutes} min</span>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="rounded-lg bg-emerald-100/70 p-2 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Done
                  </span>
                  <span className="text-base font-bold text-slate-800">
                    {loading ? '—' : completedCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Queue List or Styled Empty State */}
            {loading ? (
              <div className="flex items-center justify-center py-16 text-sm text-slate-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin text-teal-600" />
                Syncing live queue...
              </div>
            ) : queue.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-gradient-to-b from-slate-50/60 to-teal-50/20 px-4 py-8 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-white text-teal-600 shadow-sm">
                  <Activity className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">No Patients in Queue</h4>
                <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-400">
                  Tokens issued via the patient mobile app will stream into this list automatically
                  in real time.
                </p>
              </div>
            ) : (
              <div className="max-h-[260px] space-y-2.5 overflow-y-auto pr-1">
                {queue.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between rounded-xl border p-3.5 transition-all hover:bg-slate-100/80 ${
                      item.raw.status === 'CALLED'
                        ? 'border-teal-200/80 bg-teal-50/40'
                        : 'border-slate-200/60 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="rounded-lg bg-teal-600 px-2.5 py-1 text-xs font-black text-white shadow-sm">
                        {item.tokenNumber}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{item.patientName}</p>
                        <p className="text-xs text-slate-400">{item.chiefComplaint}</p>
                      </div>
                    </div>
                    <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                      Est. {item.predictedWait}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Action Bar & On Deck */}
        <div className="flex h-auto flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm lg:col-span-6">
          <div>
            <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-2.5 text-indigo-600">
                <Stethoscope className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold leading-tight text-slate-800">Action Bar</h3>
                <p className="text-xs text-slate-400">Clinical encounter actions</p>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => void handleCallNext()}
                disabled={calling}
                className={`flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                  canCallNext
                    ? 'bg-teal-600 text-white shadow-sm hover:bg-teal-700'
                    : 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 opacity-60 shadow-none'
                }`}
              >
                {calling ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserCheck className="h-4 w-4" />
                )}
                Call Next Patient
              </button>

              <button
                type="button"
                onClick={() => void handleStartEncounter()}
                disabled={!canStartEncounter}
                className={`flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                  canStartEncounter
                    ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700'
                    : 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 opacity-60 shadow-none'
                }`}
              >
                {starting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Start Consultation
              </button>
            </div>

            <div className="mb-4">
              <button
                type="button"
                disabled={!hasWaitingPatients}
                className={`flex w-full items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                  hasWaitingPatients
                    ? 'border-rose-200/80 bg-rose-50 text-rose-700 hover:bg-rose-100'
                    : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 opacity-60'
                }`}
              >
                <AlertTriangle className="h-4 w-4" />
                Emergency Bypass
              </button>
            </div>

            {/* On-Deck Active Patient or Styled Empty State */}
            {onDeck ? (
              <div className="rounded-xl border border-teal-200/80 bg-gradient-to-br from-teal-50/60 via-slate-50 to-indigo-50/40 p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-lg bg-teal-700 px-3 py-1 text-xs font-black text-white">
                    {onDeck.tokenNumber}
                  </span>
                  <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-teal-800">
                    On Deck
                  </span>
                </div>
                <h4 className="text-lg font-bold text-slate-900">{onDeck.patientName}</h4>
                <p className="mt-1 text-xs text-slate-500">
                  {onDeck.ageGender} • Chief Complaint: {onDeck.chiefComplaint}
                </p>
                <div className="mt-3 flex justify-end border-t border-teal-100/80 pt-3">
                  <button
                    type="button"
                    onClick={() => void handleStartEncounter()}
                    disabled={!canStartEncounter}
                    className={`flex items-center gap-1 text-xs font-bold ${
                      canStartEncounter
                        ? 'text-teal-700 hover:text-teal-800'
                        : 'cursor-not-allowed text-slate-400 opacity-60'
                    }`}
                  >
                    Open Clinical File <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-gradient-to-b from-slate-50/60 to-indigo-50/20 px-4 py-8 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-white text-indigo-600 shadow-sm">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  {queue.length === 0
                    ? 'No Patient On Deck — Queue is clear for today'
                    : 'No Active Patient On Deck'}
                </h4>
                <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-400">
                  {queue.length === 0
                    ? 'New check-ins from the patient app will appear in the live queue automatically.'
                    : 'Click "Call Next Patient" above to load a patient into the clinical workstation.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
