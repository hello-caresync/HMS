'use client';

import { useRouter } from 'next/navigation';
import { Activity, AlertOctagon, CheckCircle2, Loader2, Megaphone, Play, Stethoscope } from 'lucide-react';
import { toast } from 'sonner';
import { getDoctorSession } from '@/lib/doctor/session';
import {
  useCallNextPatient,
  useCallPatient,
  useCompleteConsultation,
  useDoctorContext,
  useDoctorQueue,
  useEmergencyQueueBypass,
  useStartConsultation,
} from '@/lib/doctor/command-center/hooks';
import type { LiveQueueRow } from '@/lib/doctor/command-center/types';
import { ccClasses } from '@/lib/doctor/command-center/theme';

function statusStyle(status: LiveQueueRow['status']) {
  if (status === 'IN_CONSULTATION') return 'bg-[#2A9D8F]/15 text-[#2A9D8F]';
  if (status === 'CALLED') return 'bg-[#20639B]/15 text-[#20639B]';
  if (status === 'COMPLETED') return 'bg-[#2E8B70]/15 text-[#2E8B70]';
  if (status === 'ISSUED') return 'bg-[#E8F1F8] text-[#173F5F]';
  return 'bg-[#E9A23B]/15 text-[#E9A23B]';
}

export function SmartQEngine() {
  const router = useRouter();
  const session = getDoctorSession();
  const { data: ctx } = useDoctorContext(session.employeeId);
  const doctorUuid = ctx?.doctorUuid ?? '';

  const { data: tokens = [], isLoading } = useDoctorQueue({
    employeeId: session.employeeId,
    doctorName: session.fullName || session.doctor_name,
    doctorUuid,
  });
  const callNextMutation = useCallNextPatient(doctorUuid);
  const callMutation = useCallPatient(doctorUuid);
  const startMutation = useStartConsultation(doctorUuid);
  const completeMutation = useCompleteConsultation(doctorUuid);
  const bypassMutation = useEmergencyQueueBypass(doctorUuid);

  const active =
    tokens.find((t) => t.status === 'IN_CONSULTATION') || tokens.find((t) => t.status === 'CALLED');
  const waiting = tokens.filter((t) => t.status === 'ISSUED');

  const handleCallNext = async () => {
    const next = await callNextMutation.mutateAsync();
    if (next) toast.success(`Token #${next.token_number} called via SmartQ`);
    else toast.info('No patients waiting in queue');
  };

  const handleCall = async (token: LiveQueueRow) => {
    await callMutation.mutateAsync(token.id);
    toast.success(`Token #${token.token_number} called`);
  };

  const handleStart = async (token: LiveQueueRow) => {
    const consultationId = await startMutation.mutateAsync(token);
    toast.success('Encounter started — patient notified');
    const routeId = token.appointment_id || consultationId;
    router.push(`/doctor/consultations/${routeId}/`);
  };

  const handleComplete = async (token: LiveQueueRow) => {
    await completeMutation.mutateAsync(token.id);
    toast.success('Consultation completed');
  };

  const handleBypass = async () => {
    const first = waiting[0];
    if (!first) {
      toast.info('No waiting patients to bypass');
      return;
    }
    const next = await bypassMutation.mutateAsync(first.id);
    toast.warning(`Emergency bypass — skipped #${first.token_number}`);
    if (next) toast.success(`Now calling #${next.token_number}`);
  };

  return (
    <div className="grid min-h-[70vh] gap-6 lg:grid-cols-2">
      <section className={`flex flex-col ${ccClasses.card}`}>
        <div className="border-b border-[#E8F1F8] px-5 py-4">
          <h2 className="flex items-center gap-2 font-black text-[#173F5F]">
            <Megaphone className="h-4 w-4 text-[#20639B]" /> Live SmartQ Queue
          </h2>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center gap-2 text-sm font-semibold text-[#5A7A94]">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading queue…
            </div>
          ) : tokens.length === 0 ? (
            <p className="py-12 text-center text-sm font-semibold text-[#5A7A94]">
              No tokens assigned yet.
            </p>
          ) : (
            tokens.map((token) => (
              <article key={token.id} className={`p-4 ${ccClasses.cardSoft}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-black text-[#20639B]">
                      #{token.token_number} · Seq {token.sequence_number}
                    </span>
                    <h3 className="font-black text-[#173F5F]">{token.patient_name}</h3>
                    <p className="text-xs font-semibold text-[#5A7A94]">
                      {token.chief_complaint || 'General consultation'}
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${statusStyle(token.status)}`}>
                    {token.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {token.status === 'ISSUED' && (
                    <button type="button" onClick={() => void handleCall(token)} className={ccClasses.btnPrimary}>
                      Call Patient
                    </button>
                  )}
                  {token.status === 'CALLED' && (
                    <button type="button" onClick={() => void handleStart(token)} className={ccClasses.btnAccent}>
                      <Play className="h-4 w-4" /> Start Encounter
                    </button>
                  )}
                  {token.status === 'IN_CONSULTATION' && (
                    <button type="button" onClick={() => void handleComplete(token)} className={ccClasses.btnGhost}>
                      <CheckCircle2 className="h-4 w-4" /> Complete
                    </button>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className={`flex flex-col ${ccClasses.card}`}>
        <div className="border-b border-[#E8F1F8] px-5 py-4">
          <h2 className="flex items-center gap-2 font-black text-[#173F5F]">
            <Stethoscope className="h-4 w-4 text-[#2A9D8F]" /> Action Bar
          </h2>
        </div>
        <div className="flex flex-1 flex-col p-6">
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleCallNext()}
              disabled={callNextMutation.isPending}
              className={ccClasses.btnPrimary}
            >
              {callNextMutation.isPending ? 'Calling…' : 'Call Next Patient'}
            </button>
            <button
              type="button"
              onClick={() => active && void handleStart(active)}
              disabled={!active || active.status === 'IN_CONSULTATION'}
              className={ccClasses.btnAccent}
            >
              Start Encounter
            </button>
            <button
              type="button"
              onClick={() => void handleBypass()}
              disabled={bypassMutation.isPending || !waiting.length}
              className="rounded-xl bg-[#D9534F]/10 px-4 py-2 text-xs font-black text-[#D9534F]"
            >
              <AlertOctagon className="mr-1 inline h-4 w-4" /> Emergency Queue Bypass
            </button>
          </div>

          {active ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="rounded-xl bg-[#E8F1F8] px-3 py-1 text-sm font-black">#{active.token_number}</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#2A9D8F]">
                  <Activity className="h-3 w-3 animate-pulse" /> {active.status.replace('_', ' ')}
                </span>
              </div>
              <h3 className="text-2xl font-black text-[#173F5F]">{active.patient_name}</h3>
              <p className="text-sm font-semibold text-[#5A7A94]">
                {active.age ?? '—'} yrs · {active.gender ?? '—'} · BG {active.blood_group || '—'}
              </p>
              <p className="rounded-xl bg-[#F6F9FB] p-3 text-sm font-semibold text-[#173F5F]">
                Chief complaint: {active.chief_complaint || 'Not recorded'}
              </p>
              <div className="mt-auto flex flex-wrap gap-2 pt-4">
                <button
                  type="button"
                  onClick={() =>
                    router.push(`/doctor/consultations/${active.appointment_id || active.id}/`)
                  }
                  className={ccClasses.btnAccent}
                >
                  Open EMR Workspace
                </button>
                <button type="button" onClick={() => void handleComplete(active)} className={ccClasses.btnPrimary}>
                  Complete Encounter
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <p className="font-black text-[#173F5F]">No active patient on deck</p>
              <p className="mt-1 text-sm font-semibold text-[#5A7A94]">
                {waiting.length
                  ? `${waiting.length} patient(s) in ISSUED state — use Call Next.`
                  : 'Queue is clear.'}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default SmartQEngine;
