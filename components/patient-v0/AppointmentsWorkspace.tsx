'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Calendar,
  Clock,
  PlusCircle,
  Stethoscope,
  Ticket,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { resolvePatientDbId } from '@/lib/patient/constants';
import { usePatientAuth } from '@/lib/patient/auth/PatientAuthProvider';
import { PATIENT_ROUTES } from '@/lib/patient/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export type PatientAppointmentRow = {
  id: string;
  patient_id: string;
  doctor_id: string;
  hospital_id?: string | null;
  doctor_name: string;
  department: string;
  hospital_name?: string | null;
  appointment_date: string;
  slot_time: string;
  token_number: number;
  current_serving_token: number;
  avg_consult_minutes: number;
  queue_status: string;
  created_at?: string;
};

type Tab = 'upcoming' | 'history';

const ui = {
  page: 'mx-auto max-w-3xl space-y-6',
  title: 'text-2xl font-black text-[#1A332F]',
  subtitle: 'text-sm font-medium text-[#8E7692]',
  card: 'rounded-2xl border border-[#BDE2F5] bg-white/80 p-5 shadow-sm backdrop-blur-md',
  btnPrimary:
    'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#3B8C7E] px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-[#1A332F]',
  btnSecondary:
    'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#BDE2F5] bg-white px-4 py-2.5 text-sm font-bold text-[#1A332F] transition hover:bg-[#DAF0EB]',
  tabActive: 'rounded-xl bg-[#3B8C7E] px-4 py-2 text-xs font-bold text-white shadow-sm',
  tabIdle: 'rounded-xl border border-[#BDE2F5] bg-white/80 px-4 py-2 text-xs font-bold text-[#1A332F] hover:bg-white',
} as const;

export function AppointmentsWorkspace() {
  const router = useRouter();
  const { session } = usePatientAuth();
  const patientDbId = resolvePatientDbId(session?.patientId);

  const [appointments, setAppointments] = useState<PatientAppointmentRow[]>([]);
  const [tab, setTab] = useState<Tab>('upcoming');
  const [loading, setLoading] = useState(true);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setAppointments([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('patient_appointments')
        .select('*')
        .eq('patient_id', patientDbId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAppointments((data ?? []) as PatientAppointmentRow[]);
    } catch (err) {
      toast.error('Could not load appointments', {
        description: err instanceof Error ? err.message : 'Network error',
      });
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [patientDbId]);

  useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel('patient-appointments-list')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patient_appointments', filter: `patient_id=eq.${patientDbId}` },
        () => {
          void loadAppointments();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [patientDbId, loadAppointments]);

  const upcoming = useMemo(
    () =>
      appointments.filter(
        (a) => !['completed', 'cancelled', 'missed'].includes(a.queue_status?.toLowerCase() ?? ''),
      ),
    [appointments],
  );

  const history = useMemo(
    () =>
      appointments.filter((a) =>
        ['completed', 'cancelled', 'missed'].includes(a.queue_status?.toLowerCase() ?? ''),
      ),
    [appointments],
  );

  const displayed = tab === 'upcoming' ? upcoming : history;

  const handleCancel = async (id: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { error } = await supabase
      .from('patient_appointments')
      .update({ queue_status: 'cancelled' })
      .eq('id', id);
    if (error) {
      toast.error('Cancel failed', { description: error.message });
      return;
    }
    toast.success('Appointment cancelled');
    void loadAppointments();
  };

  return (
    <div className={ui.page}>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={ui.title}>Appointments</h1>
          <p className={ui.subtitle}>Book, reschedule, and manage your visits</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={PATIENT_ROUTES.bookAppointment} className={ui.btnPrimary}>
            <PlusCircle className="h-4 w-4" /> Book New Appointment
          </Link>
          <Link href={PATIENT_ROUTES.queue} className={ui.btnSecondary}>
            <Activity className="h-4 w-4" /> Live Queue
          </Link>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={tab === 'upcoming' ? ui.tabActive : ui.tabIdle} onClick={() => setTab('upcoming')}>
          Upcoming ({upcoming.length})
        </button>
        <button type="button" className={tab === 'history' ? ui.tabActive : ui.tabIdle} onClick={() => setTab('history')}>
          History ({history.length})
        </button>
      </div>

      {loading ? (
        <div className={`${ui.card} space-y-3`}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-[#BDE2F5]/40" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className={`${ui.card} flex flex-col items-center py-12 text-center`}>
          <Calendar className="mb-3 h-10 w-10 text-[#8E7692]/60" />
          <h3 className="text-lg font-bold text-[#1A332F]">No {tab === 'upcoming' ? 'Upcoming' : 'Past'} Appointments</h3>
          <p className="mt-2 max-w-sm text-sm text-[#8E7692]">
            {tab === 'upcoming'
              ? 'Schedule your first visit with a registered hospital doctor.'
              : 'Completed visits will appear here.'}
          </p>
          {tab === 'upcoming' && (
            <Link href={PATIENT_ROUTES.bookAppointment} className={`${ui.btnPrimary} mt-6`}>
              <PlusCircle className="h-4 w-4" /> Book New Appointment
            </Link>
          )}
        </div>
      ) : (
        <ul className="space-y-4">
          {displayed.map((app) => (
            <li key={app.id} className={ui.card}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-black text-[#1A332F]">
                    <Stethoscope className="h-4 w-4 text-[#3B8C7E]" />
                    {app.doctor_name}
                  </h3>
                  <p className="mt-0.5 text-xs font-semibold text-[#3B8C7E]">
                    {app.department}
                    {app.hospital_name ? ` · ${app.hospital_name}` : ''}
                  </p>
                </div>
                <span className="rounded-full border border-[#BDE2F5]/40 bg-[#BDE2F5]/15 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#1A332F]">
                  {app.queue_status}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold text-[#1A332F]">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-[#8E7692]" /> {app.appointment_date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-[#8E7692]" /> {app.slot_time}
                </span>
                <span className="flex items-center gap-1">
                  <Ticket className="h-3.5 w-3.5 text-[#BDE2F5]" /> Token #{app.token_number}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={ui.btnSecondary}
                  onClick={() => router.push(`${PATIENT_ROUTES.queue}?id=${app.id}`)}
                >
                  <Activity className="h-3.5 w-3.5" /> Live Queue
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100"
                  onClick={() => void handleCancel(app.id)}
                >
                  <XCircle className="h-3.5 w-3.5" /> Cancel
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AppointmentsWorkspace;
