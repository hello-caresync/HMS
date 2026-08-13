'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  Clock,
  Loader2,
  Mic2,
  PlayCircle,
  Stethoscope,
  UserRound,
  Zap,
} from 'lucide-react';

import {
  DEFAULT_ACTIVE_DOCTOR_ID,
  OPDToken,
  rpcCallNextPatient,
  startEncounter,
} from '@/lib/doctor/command-center/supabase-service';
import type { LiveQueueRow } from '@/lib/doctor/command-center/types';

type SmartQCommandCenterProps = {
  doctorId?: string;
  queueTokens: OPDToken[];
  waitingCount: number;
  completedCount: number;
  loading: boolean;
  onRefresh: () => void;
};

function tokenToQueueRow(token: OPDToken): LiveQueueRow {
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

function predictConsultMinutes(token: LiveQueueRow): number {
  const base = token.estimated_wait_minutes ?? 12;
  return Math.max(8, Math.min(base + 4, 25));
}

export default function SmartQCommandCenter({
  doctorId = DEFAULT_ACTIVE_DOCTOR_ID,
  queueTokens,
  waitingCount,
  completedCount,
  loading,
  onRefresh,
}: SmartQCommandCenterProps) {
  const router = useRouter();
  const [calledPatient, setCalledPatient] = useState<LiveQueueRow | null>(null);
  const [calling, setCalling] = useState(false);
  const [starting, setStarting] = useState(false);
  const [emergencyPulse, setEmergencyPulse] = useState(false);

  const queueRows = useMemo(() => queueTokens.map(tokenToQueueRow), [queueTokens]);

  const avgWaitMinutes = useMemo(() => {
    if (queueRows.length === 0) return 8;
    const total = queueRows.reduce((sum, r) => sum + (r.estimated_wait_minutes ?? 10), 0);
    return Math.round(total / queueRows.length);
  }, [queueRows]);

  const activeSpotlight = calledPatient ?? queueRows.find((r) => r.status === 'CALLED') ?? null;
  const canStartEncounter = Boolean(activeSpotlight && activeSpotlight.status === 'CALLED');

  const handleCallNext = async () => {
    setCalling(true);
    try {
      const next = await rpcCallNextPatient(doctorId);
      if (next) {
        setCalledPatient(next);
      } else if (queueRows.length > 0) {
        setCalledPatient(queueRows[0]);
      }
      onRefresh();
    } finally {
      setCalling(false);
    }
  };

  const handleStartEncounter = async () => {
    if (!activeSpotlight) return;
    setStarting(true);
    try {
      await startEncounter(activeSpotlight, doctorId);
      if (activeSpotlight.appointment_id) {
        router.push(`/doctor/consultations/${activeSpotlight.appointment_id}`);
      }
      onRefresh();
    } finally {
      setStarting(false);
    }
  };

  const handleEmergencyBypass = () => {
    setEmergencyPulse(true);
    window.setTimeout(() => setEmergencyPulse(false), 1200);
  };

  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* LEFT — Live Queue */}
      <div className="rounded-2xl border border-slate-100 bg-white/80 p-6 shadow-sm backdrop-blur-sm transition-all hover:shadow-md">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
              </span>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                SmartQ ML Real-Time Engine Active
              </p>
            </div>
            <h2 className="mt-1 text-lg font-bold text-slate-900">Live OPD Queue</h2>
          </div>
          <Zap className="h-5 w-5 text-indigo-400" />
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            Total Waiting: {loading ? '—' : waitingCount}
          </span>
          <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
            Avg Wait Time: ~{avgWaitMinutes} mins
          </span>
          <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            Completed Today: {loading ? '—' : completedCount}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-slate-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-indigo-500" />
            Syncing live queue...
          </div>
        ) : queueRows.length === 0 ? (
          <div className="rounded-2xl border border-indigo-100/80 bg-indigo-50/40 p-10 text-center backdrop-blur-md">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-100 bg-white/70 shadow-inner">
              <Stethoscope className="h-8 w-8 text-indigo-400" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Queue is Clear</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
              New patient check-ins from the mobile app will automatically stream here in real
              time.
            </p>
          </div>
        ) : (
          <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
            {queueRows.map((row, index) => (
              <article
                key={row.id}
                className={`flex items-center justify-between rounded-xl border p-4 shadow-sm transition-all hover:shadow-md ${
                  row.status === 'CALLED'
                    ? 'border-cyan-200 bg-cyan-50/60'
                    : 'border-slate-100 bg-slate-50/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-xs font-black text-indigo-800">
                    #{index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{row.token_number}</p>
                    <p className="text-xs font-medium text-slate-600">{row.patient_name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                      row.status === 'CALLED'
                        ? 'bg-cyan-600 text-white'
                        : row.status === 'IN_CONSULTATION'
                          ? 'bg-blue-600 text-white'
                          : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {row.status}
                  </span>
                  <p className="mt-1 text-[10px] font-semibold text-slate-500">
                    ~{row.estimated_wait_minutes ?? 10} min
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT — Action Bar & On-Deck Spotlight */}
      <div className="rounded-2xl border border-slate-100 bg-white/80 p-6 shadow-sm backdrop-blur-sm transition-all hover:shadow-md">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Action Bar & On-Deck</h2>

        <div className="mb-6 grid gap-3 sm:grid-cols-1">
          <button
            type="button"
            onClick={() => void handleCallNext()}
            disabled={calling || queueRows.length === 0}
            className="inline-flex transform items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 px-5 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:scale-[1.02] hover:shadow-lg disabled:scale-100 disabled:opacity-50"
          >
            {calling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mic2 className="h-4 w-4" />
            )}
            Call Next Patient
          </button>

          <button
            type="button"
            onClick={() => void handleStartEncounter()}
            disabled={!canStartEncounter || starting}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-indigo-300 bg-white px-5 py-3 text-sm font-bold text-indigo-700 transition-all hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {starting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PlayCircle className="h-4 w-4" />
            )}
            Start Encounter
          </button>

          <button
            type="button"
            onClick={handleEmergencyBypass}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50/80 px-5 py-3 text-sm font-bold text-rose-700 backdrop-blur-sm transition-all hover:bg-rose-100"
          >
            <span className="relative flex h-2 w-2">
              <span
                className={`absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75 ${
                  emergencyPulse ? 'animate-ping' : 'animate-pulse'
                }`}
              />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-600" />
            </span>
            <AlertTriangle className="h-4 w-4" />
            Emergency Queue Bypass
          </button>
        </div>

        {activeSpotlight ? (
          <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-indigo-50/40 p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              On-Deck Patient
            </p>
            <p className="mt-2 text-5xl font-black tracking-tight text-slate-900">
              {activeSpotlight.token_number}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-white/80 p-3">
                <p className="text-[10px] font-bold uppercase text-slate-400">Name</p>
                <p className="text-sm font-semibold text-slate-900">{activeSpotlight.patient_name}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white/80 p-3">
                <p className="text-[10px] font-bold uppercase text-slate-400">Age / Gender</p>
                <p className="text-sm font-semibold text-slate-900">
                  {activeSpotlight.age ?? '—'} · {activeSpotlight.gender ?? '—'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white/80 p-3">
                <p className="text-[10px] font-bold uppercase text-slate-400">Vitals Summary</p>
                <p className="text-sm font-semibold text-slate-900">
                  BG {activeSpotlight.blood_group ?? 'N/A'} · Pending intake
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white/80 p-3">
                <p className="text-[10px] font-bold uppercase text-slate-400">ML Duration</p>
                <p className="flex items-center gap-1 text-sm font-semibold text-indigo-700">
                  <Activity className="h-3.5 w-3.5" />
                  ~{predictConsultMinutes(activeSpotlight)} mins
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white/80 p-3 sm:col-span-2">
                <p className="text-[10px] font-bold uppercase text-slate-400">Chief Complaint</p>
                <p className="text-sm font-semibold text-slate-900">
                  {activeSpotlight.chief_complaint ||
                    activeSpotlight.reason_for_visit ||
                    'General consultation'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void handleStartEncounter()}
              disabled={starting}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-indigo-700 disabled:opacity-50"
            >
              {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Stethoscope className="h-4 w-4" />}
              Start Consultation
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-indigo-50/50 p-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/80 bg-white/60 shadow-inner backdrop-blur-sm">
              <Clock className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Patient On Deck</h3>
            <p className="mx-auto mt-2 max-w-xs text-sm text-slate-500">
              Call the next patient from the queue to populate the spotlight and begin the
              encounter workflow.
            </p>
            <UserRound className="mx-auto mt-4 h-5 w-5 text-indigo-300" />
          </div>
        )}
      </div>
    </section>
  );
}
