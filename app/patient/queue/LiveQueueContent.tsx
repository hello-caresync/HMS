'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  PlusCircle,
  Sparkles,
  Stethoscope,
  User,
} from 'lucide-react';

import { resolvePatientDbId } from '@/lib/patient/constants';
import { usePatientAuth } from '@/lib/patient/auth/PatientAuthProvider';
import { PATIENT_ROUTES } from '@/lib/patient/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

type QueueData = {
  id: string;
  doctor_name: string;
  department: string;
  token_number: number;
  current_serving_token: number;
  avg_consult_minutes: number;
  queue_status: string;
  appointment_date: string;
  patient_id: string;
  room_number?: string | null;
};

export default function LiveQueueContent() {
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get('id') ?? undefined;
  const { session } = usePatientAuth();
  const patientDbId = resolvePatientDbId(session?.patientId);

  const [queue, setQueue] = useState<QueueData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchQueue = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    let query = supabase.from('patient_appointments').select('*');

    if (appointmentId) {
      query = query.eq('id', appointmentId);
    } else {
      query = query
        .eq('patient_id', patientDbId)
        .in('queue_status', ['waiting', 'in_consultation'])
        .order('created_at', { ascending: false })
        .limit(1);
    }

    const { data } = await query;
    setQueue(data && data.length > 0 ? (data[0] as QueueData) : null);
    setLoading(false);
  }, [appointmentId, patientDbId]);

  useEffect(() => {
    void fetchQueue();
  }, [fetchQueue]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel('live_queue_tracker')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patient_appointments' },
        (payload) => {
          const updated = (payload.new ?? payload.old) as QueueData | undefined;
          if (!updated) return;
          if (updated.patient_id !== patientDbId && !appointmentId) return;
          if (appointmentId && updated.id !== appointmentId) return;
          if (payload.eventType === 'DELETE') {
            setQueue(null);
            return;
          }
          setQueue(updated);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [patientDbId, appointmentId]);

  const peopleAhead = queue ? Math.max(0, queue.token_number - queue.current_serving_token) : 0;
  const estimatedWaitMinutes = queue ? peopleAhead * queue.avg_consult_minutes : 0;
  const now = new Date();
  const estimatedTime = new Date(now.getTime() + estimatedWaitMinutes * 60000);
  const formattedEstimatedTime = estimatedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const isCurrentTurn = queue ? queue.token_number === queue.current_serving_token : false;
  const isPastTurn = queue ? queue.token_number < queue.current_serving_token : false;
  const roomLabel = queue?.room_number ?? '102';

  return (
    <div className="mx-auto max-w-xl space-y-6 pb-8">
      <header>
        <h1 className="text-2xl font-black text-[#1A332F]">Live OPD Queue</h1>
        <p className="mt-1 text-sm font-medium text-[#8E7692]">
          Real-time token tracking synced with Hospital & Doctor apps
        </p>
      </header>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-3xl border border-[#BDE2F5] bg-white/80 p-8 backdrop-blur-md">
          <p className="animate-pulse text-sm font-bold text-[#8E7692]">Connecting to live hospital queue…</p>
        </div>
      ) : !queue ? (
        <div className="rounded-3xl border border-dashed border-[#CEB2C0] bg-white/80 p-10 text-center backdrop-blur-md">
          <AlertCircle className="mx-auto h-10 w-10 text-[#BDE2F5]" />
          <h3 className="mt-3 text-lg font-bold text-[#1A332F]">No Active Queue</h3>
          <p className="mt-2 text-sm text-[#8E7692]">You don&apos;t have an active OPD check-in right now.</p>
          <Link
            href={PATIENT_ROUTES.bookAppointment}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#3B8C7E] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#1A332F]"
          >
            <PlusCircle className="h-4 w-4" /> Book Appointment
          </Link>
        </div>
      ) : (
        <div className="rounded-3xl border border-[#BDE2F5] bg-white/90 p-6 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-[#BDE2F5]/60 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#3B8C7E]/10 text-[#3B8C7E]">
                <Stethoscope className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#1A332F]">{queue.doctor_name}</h3>
                <p className="text-xs font-semibold text-[#8E7692]">{queue.department}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700">
              <span className="h-2 w-2 animate-ping rounded-full bg-emerald-500" />
              Live
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-[#BDE2F5]/60 bg-[#DAF0EB] p-4 text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E7692]">Your Token</span>
              <div className="mt-1 text-4xl font-black text-[#3B8C7E]">#{queue.token_number}</div>
            </div>
            <div className="rounded-2xl bg-[#3B8C7E] p-4 text-center text-white shadow-md">
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">Now Serving</span>
              <div className="mt-1 text-4xl font-black text-[#BDE2F5]">#{queue.current_serving_token}</div>
            </div>
          </div>

          <div className="mt-6">
            {isCurrentTurn ? (
              <div className="flex animate-pulse items-center gap-3 rounded-2xl border border-amber-500/30 bg-[#DAF0EB]/400/10 p-4 text-[#1A332F]">
                <Sparkles className="h-6 w-6 shrink-0 text-amber-600" />
                <div>
                  <h4 className="text-sm font-black">It&apos;s Your Turn Now!</h4>
                  <p className="text-xs font-semibold text-[#3B8C7E]">
                    Please enter Doctor Consultation Room {roomLabel}.
                  </p>
                </div>
              </div>
            ) : isPastTurn ? (
              <div className="flex items-center gap-3 rounded-2xl bg-slate-100 p-4 text-slate-700">
                <CheckCircle2 className="h-6 w-6 shrink-0 text-slate-500" />
                <div>
                  <h4 className="text-sm font-bold">Consultation Completed / Missed</h4>
                  <p className="text-xs">Your token was called. Please check with the OPD reception desk.</p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-gradient-to-r from-[#2D232A] to-[#1A332F] p-5 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-[#BDE2F5]" />
                    <span className="text-xs font-bold text-slate-200">
                      {peopleAhead} {peopleAhead === 1 ? 'person' : 'people'} ahead of you
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-300">~{queue.avg_consult_minutes} mins/patient</span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
                  <span className="text-xs text-slate-300">Estimated Consultation Time</span>
                  <span className="flex items-center gap-1.5 text-lg font-black text-[#BDE2F5]">
                    <Clock className="h-4 w-4" />
                    {formattedEstimatedTime}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
