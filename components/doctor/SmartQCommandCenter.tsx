'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Megaphone,
  Play,
  Stethoscope,
  UserCheck,
  Users,
} from 'lucide-react';

import {
  DEFAULT_ACTIVE_DOCTOR_ID,
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
  mlDuration: string;
  vitalsSummary: string;
  status: 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED';
  raw: LiveQueueRow;
}

type SmartQCommandCenterProps = {
  doctorId?: string;
  queueTokens: OPDToken[];
  waitingCount: number;
  completedCount: number;
  loading: boolean;
  onRefresh: () => void;
};

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

function mapStatus(status: LiveQueueRow['status']): QueueItem['status'] {
  if (status === 'IN_CONSULTATION') return 'IN_CONSULTATION';
  if (status === 'COMPLETED') return 'COMPLETED';
  return 'WAITING';
}

function toQueueItem(row: LiveQueueRow): QueueItem {
  const age = row.age ?? calcAge(row.dob);
  const gender = row.gender ?? '—';
  const waitMins = row.estimated_wait_minutes ?? 10;
  const mlMins = Math.max(8, Math.min((row.estimated_wait_minutes ?? 12) + 4, 25));

  return {
    id: row.id,
    appointmentId: row.appointment_id,
    tokenNumber: row.token_number,
    patientName: row.patient_name,
    ageGender: `${age ?? '—'} · ${gender}`,
    chiefComplaint:
      row.chief_complaint || row.reason_for_visit || 'General consultation',
    predictedWait: `~${waitMins} min`,
    mlDuration: `~${mlMins} min`,
    vitalsSummary: `BG ${row.blood_group ?? 'N/A'} · Pending intake`,
    status: mapStatus(row.status),
    raw: row,
  };
}

function liveRowToQueueItem(row: LiveQueueRow): QueueItem {
  return toQueueItem(row);
}

function statusBadgeClass(status: QueueItem['status']) {
  if (status === 'IN_CONSULTATION') return 'bg-blue-100 text-blue-700 border-blue-200/60';
  if (status === 'COMPLETED') return 'bg-emerald-100 text-emerald-700 border-emerald-200/60';
  return 'bg-amber-50 text-amber-700 border-amber-200/60';
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
  const [activePatient, setActivePatient] = useState<QueueItem | null>(null);
  const [calling, setCalling] = useState(false);
  const [starting, setStarting] = useState(false);
  const [emergencyPulse, setEmergencyPulse] = useState(false);

  const queue = useMemo(
    () => queueTokens.map((token) => toQueueItem(tokenToQueueRow(token))),
    [queueTokens],
  );

  const avgWaitMinutes = useMemo(() => {
    if (queue.length === 0) return 8;
    const total = queue.reduce((sum, item) => {
      const mins = parseInt(item.predictedWait.replace(/\D/g, ''), 10);
      return sum + (Number.isNaN(mins) ? 10 : mins);
    }, 0);
    return Math.round(total / queue.length);
  }, [queue]);

  const calledFromQueue = queue.find((q) => q.raw.status === 'CALLED') ?? null;
  const spotlight = activePatient ?? calledFromQueue;
  const canStartEncounter = Boolean(spotlight && spotlight.raw.status === 'CALLED');

  const handleCallNext = async () => {
    setCalling(true);
    try {
      const next = await rpcCallNextPatient(doctorId);
      if (next) {
        setActivePatient(liveRowToQueueItem(next));
      } else {
        const fallback = queue.find((q) => q.status === 'WAITING');
        if (fallback) setActivePatient(fallback);
      }
      onRefresh();
    } finally {
      setCalling(false);
    }
  };

  const handleStartEncounter = async () => {
    if (!spotlight) return;
    setStarting(true);
    try {
      await startEncounter(spotlight.raw, doctorId);
      if (spotlight.appointmentId) {
        router.push(`/doctor/consultations/${spotlight.appointmentId}`);
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
    <div className="grid w-full grid-cols-1 gap-6 p-1 lg:grid-cols-12">
      {/* LEFT PANEL: Live SmartQ Queue */}
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur-md transition-all hover:shadow-md lg:col-span-6">
        <div>
          {/* Header & Live Status */}
          <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="rounded-xl bg-teal-50 p-2 text-teal-600">
                <Megaphone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold leading-tight text-slate-800">
                  Live SmartQ Queue
                </h3>
                <p className="text-xs font-medium text-slate-400">
                  Real-time ML prediction engine
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-emerald-200/60 bg-emerald-50 px-3 py-1">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Live Sync
              </span>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mb-6 grid grid-cols-3 gap-3">
            <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
              <div className="rounded-lg bg-blue-100/60 p-2 text-blue-600">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Waiting
                </span>
                <span className="text-base font-bold text-slate-800">
                  {loading ? '—' : waitingCount}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
              <div className="rounded-lg bg-indigo-100/60 p-2 text-indigo-600">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Avg Wait
                </span>
                <span className="text-base font-bold text-slate-800">~{avgWaitMinutes} min</span>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
              <div className="rounded-lg bg-emerald-100/60 p-2 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Done
                </span>
                <span className="text-base font-bold text-slate-800">
                  {loading ? '—' : completedCount}
                </span>
              </div>
            </div>
          </div>

          {/* Queue Content or Enhanced Empty State */}
          {loading ? (
            <div className="flex items-center justify-center py-16 text-sm text-slate-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-indigo-500" />
              Syncing live queue...
            </div>
          ) : queue.length === 0 ? (
            <div className="my-8 rounded-xl border border-dashed border-slate-200 bg-gradient-to-b from-slate-50/80 to-indigo-50/40 px-4 py-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-100/60 bg-indigo-50/80 backdrop-blur-sm">
                <Stethoscope className="h-7 w-7 text-indigo-400" />
              </div>
              <h4 className="text-sm font-bold text-slate-700">Queue is Clear</h4>
              <p className="mx-auto mt-1.5 max-w-xs text-xs leading-relaxed text-slate-400">
                No tokens assigned yet. New patient check-ins from the mobile app will
                automatically stream here in real time.
              </p>
            </div>
          ) : (
            <div className="max-h-[380px] space-y-2.5 overflow-y-auto pr-1">
              {queue.map((item, index) => (
                <article
                  key={item.id}
                  className={`flex items-center justify-between rounded-xl border p-3.5 transition-all hover:shadow-md ${
                    item.raw.status === 'CALLED'
                      ? 'border-cyan-200/80 bg-cyan-50/50'
                      : 'border-slate-100 bg-white/60'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-slate-600">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-800">
                        {item.tokenNumber}
                      </p>
                      <p className="truncate text-xs font-medium text-slate-500">
                        {item.patientName}
                      </p>
                      <p className="truncate text-[11px] text-slate-400">{item.chiefComplaint}</p>
                    </div>
                  </div>
                  <div className="ml-3 shrink-0 text-right">
                    <span
                      className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${statusBadgeClass(item.status)}`}
                    >
                      {item.status}
                    </span>
                    <p className="mt-1 text-[10px] font-semibold text-slate-400">
                      {item.predictedWait}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Action Bar & On-Deck Spotlight */}
      <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur-md transition-all hover:shadow-md lg:col-span-6">
        <div className="mb-5 flex items-center gap-2.5 border-b border-slate-100 pb-4">
          <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold leading-tight text-slate-800">Action Bar</h3>
            <p className="text-xs font-medium text-slate-400">On-deck spotlight & controls</p>
          </div>
        </div>

        {/* Hero Actions */}
        <div className="mb-6 grid gap-3">
          <button
            type="button"
            onClick={() => void handleCallNext()}
            disabled={calling || queue.length === 0}
            className="inline-flex transform items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 px-5 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:scale-[1.02] hover:shadow-lg disabled:scale-100 disabled:opacity-50"
          >
            {calling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Megaphone className="h-4 w-4" />
            )}
            Call Next Patient
          </button>

          <button
            type="button"
            onClick={() => void handleStartEncounter()}
            disabled={!canStartEncounter || starting}
            className="inline-flex items-center justify-center gap-2.5 rounded-2xl border-2 border-indigo-300 bg-white px-5 py-3 text-sm font-bold text-indigo-700 transition-all hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {starting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Start Encounter
          </button>

          <button
            type="button"
            onClick={handleEmergencyBypass}
            className="inline-flex items-center justify-center gap-2.5 rounded-2xl border border-rose-200/80 bg-rose-50/70 px-5 py-3 text-sm font-bold text-rose-700 backdrop-blur-sm transition-all hover:bg-rose-100/80"
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

        {/* On-Deck Spotlight or Empty State */}
        {spotlight ? (
          <div className="flex-1 rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-indigo-50/40 p-5 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
              On-Deck Patient
            </p>
            <p className="mt-1 text-5xl font-black tracking-tight text-slate-900">
              {spotlight.tokenNumber}
            </p>

            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-white/80 p-3">
                <p className="text-[10px] font-bold uppercase text-slate-400">Name</p>
                <p className="text-sm font-semibold text-slate-800">{spotlight.patientName}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white/80 p-3">
                <p className="text-[10px] font-bold uppercase text-slate-400">Age / Gender</p>
                <p className="text-sm font-semibold text-slate-800">{spotlight.ageGender}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white/80 p-3">
                <p className="text-[10px] font-bold uppercase text-slate-400">Vitals Summary</p>
                <p className="text-sm font-semibold text-slate-800">{spotlight.vitalsSummary}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white/80 p-3">
                <p className="text-[10px] font-bold uppercase text-slate-400">ML Duration</p>
                <p className="text-sm font-semibold text-indigo-700">{spotlight.mlDuration}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white/80 p-3 sm:col-span-2">
                <p className="text-[10px] font-bold uppercase text-slate-400">Chief Complaint</p>
                <p className="text-sm font-semibold text-slate-800">{spotlight.chiefComplaint}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void handleStartEncounter()}
              disabled={starting}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-indigo-700 disabled:opacity-50"
            >
              {starting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Stethoscope className="h-4 w-4" />
              )}
              Start Consultation
            </button>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-indigo-50/50 px-6 py-10 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/80 bg-white/60 shadow-inner backdrop-blur-sm">
              <Clock className="h-7 w-7 text-slate-400" />
            </div>
            <h4 className="text-sm font-bold text-slate-700">No Patient On Deck</h4>
            <p className="mx-auto mt-1.5 max-w-xs text-xs leading-relaxed text-slate-400">
              Call the next patient from the queue to populate the spotlight and begin the
              encounter workflow.
            </p>
            <UserCheck className="mt-4 h-5 w-5 text-indigo-300" />
          </div>
        )}
      </div>
    </div>
  );
}
