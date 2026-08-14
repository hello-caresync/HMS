'use client';

import { useCallback, useEffect, useState } from 'react';
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

import {
  bypassToNextWaiting,
  callNextPatientInQueue,
  fetchLiveAppointments,
  isInConsultationStatus,
  isWaitingStatus,
  resolveActivePatient,
  subscribeAppointmentsRealtime,
  type LiveAppointmentRecord,
} from '@/lib/doctor/appointments-realtime';

export default function DoctorQueuePage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<LiveAppointmentRecord[]>([]);
  const [activePatient, setActivePatient] = useState<LiveAppointmentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(false);
  const [bypassing, setBypassing] = useState(false);

  const loadQueue = useCallback(async () => {
    try {
      const records = await fetchLiveAppointments();
      setAppointments(records);
      setActivePatient(resolveActivePatient(records));
    } catch (error) {
      console.error('Failed to load SmartQ queue:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQueue();
    const unsubscribe = subscribeAppointmentsRealtime(() => {
      void loadQueue();
    });
    return unsubscribe;
  }, [loadQueue]);

  const waitingQueue = appointments.filter((a) => isWaitingStatus(a.status));
  const inConsultationQueue = appointments.filter((a) => isInConsultationStatus(a.status));
  const completedQueue = appointments.filter((a) => a.status === 'COMPLETED');

  const avgWaitMinutes =
    waitingQueue.length === 0
      ? 8
      : Math.round(
          waitingQueue.reduce((sum, item) => sum + (item.predicted_wait_min ?? 10), 0) /
            waitingQueue.length,
        );

  const canCallNext = waitingQueue.length > 0 && !calling;
  const canStartEncounter = Boolean(activePatient);

  const handleCallNext = async () => {
    if (waitingQueue.length === 0) {
      toast.info('No patients waiting in queue. Patient bookings from the app will appear automatically.');
      return;
    }

    setCalling(true);
    try {
      const next = await callNextPatientInQueue(appointments, activePatient);
      if (next) {
        await loadQueue();
        toast.success(`Called ${next.patient_name} into consultation`);
      }
    } catch (err) {
      console.error('[Call Next]:', err);
      toast.error('Failed to call next patient');
    } finally {
      setCalling(false);
    }
  };

  const handleBypass = async () => {
    if (waitingQueue.length === 0) {
      toast.info('No patients waiting in queue');
      return;
    }

    setBypassing(true);
    try {
      const next = await bypassToNextWaiting(appointments);
      if (next) {
        await loadQueue();
        toast.success(`Emergency bypass: ${next.patient_name} moved to consultation`);
      }
    } catch (err) {
      toast.error('Emergency bypass failed');
    } finally {
      setBypassing(false);
    }
  };

  const handleStartEncounter = () => {
    if (!activePatient) return;
    router.push(`/doctor/consultations?appointmentId=${activePatient.id}`);
  };

  return (
    <div className="h-auto w-full space-y-4 bg-slate-50/50 p-5">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              SmartQ OPD Command Center
            </h1>
            <span className="rounded-full border border-teal-200/80 bg-teal-50 px-2.5 py-0.5 text-[11px] font-bold text-teal-700">
              LIVE REALTIME
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Synchronized with patient app bookings via Supabase Realtime
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

      <div className="grid h-auto grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="flex h-auto flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm lg:col-span-6">
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
                  {loading ? '—' : waitingQueue.length}
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
                  {loading ? '—' : completedQueue.length}
                </span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-sm text-slate-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-teal-600" />
              Syncing live queue...
            </div>
          ) : waitingQueue.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-gradient-to-b from-slate-50/60 to-teal-50/20 px-4 py-8 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-white text-teal-600 shadow-sm">
                <Activity className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">No patients waiting in queue.</h4>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-400">
                Patient bookings from the app will appear automatically.
              </p>
            </div>
          ) : (
            <div className="max-h-[260px] space-y-2.5 overflow-y-auto pr-1">
              {waitingQueue.map((item, idx) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between rounded-xl border p-3.5 transition-all hover:bg-slate-100/80 ${
                    activePatient?.id === item.id
                      ? 'border-teal-200/80 bg-teal-50/40'
                      : 'border-slate-200/60 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded-lg bg-teal-600 px-2.5 py-1 text-xs font-black text-white shadow-sm">
                      {item.token_number || `#${idx + 1}`}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{item.patient_name}</p>
                      <p className="text-xs text-slate-400">{item.chief_complaint}</p>
                    </div>
                  </div>
                  <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                    Est. {item.predicted_wait_min ?? 10} min
                  </span>
                </div>
              ))}
            </div>
          )}

          {inConsultationQueue.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-blue-500">
                In Consultation ({inConsultationQueue.length})
              </p>
              {inConsultationQueue.map((item) => (
                <div
                  key={item.id}
                  className="mb-2 rounded-xl border border-blue-200/70 bg-blue-50/50 p-3 text-xs"
                >
                  <span className="font-bold text-slate-800">{item.patient_name}</span>
                  <span className="ml-2 text-blue-600">{item.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex h-auto flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm lg:col-span-6">
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
              disabled={!canCallNext}
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
              onClick={handleStartEncounter}
              disabled={!canStartEncounter}
              className={`flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                canStartEncounter
                  ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700'
                  : 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 opacity-60 shadow-none'
              }`}
            >
              <Play className="h-4 w-4" />
              Start Consultation
            </button>
          </div>

          <div className="mb-4">
            <button
              type="button"
              onClick={() => void handleBypass()}
              disabled={waitingQueue.length === 0 || bypassing}
              className={`flex w-full items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                waitingQueue.length > 0 && !bypassing
                  ? 'border-rose-200/80 bg-rose-50 text-rose-700 hover:bg-rose-100'
                  : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 opacity-60'
              }`}
            >
              {bypassing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              Emergency Bypass
            </button>
          </div>

          {activePatient ? (
            <div className="rounded-xl border border-teal-200/80 bg-gradient-to-br from-teal-50/60 via-slate-50 to-indigo-50/40 p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded-lg bg-teal-700 px-3 py-1 text-xs font-black text-white">
                  {activePatient.token_number || activePatient.id.slice(0, 8)}
                </span>
                <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-teal-800">
                  {activePatient.status}
                </span>
              </div>
              <h4 className="text-lg font-bold text-slate-900">{activePatient.patient_name}</h4>
              <p className="mt-1 text-xs text-slate-500">
                {activePatient.age ?? '—'} Yrs · {activePatient.gender ?? '—'} · Chief Complaint:{' '}
                {activePatient.chief_complaint}
              </p>
              <div className="mt-3 flex justify-end border-t border-teal-100/80 pt-3">
                <button
                  type="button"
                  onClick={handleStartEncounter}
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
                No Patient On Deck — Queue is clear for today
              </h4>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-400">
                Patient bookings from the app will appear automatically. Click &quot;Call Next
                Patient&quot; to begin a consultation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
