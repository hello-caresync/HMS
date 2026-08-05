'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Play,
  ScrollText,
  Stethoscope,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import { ui, statusColors } from '@/components/nexora-doctor/ui/primitives';
import { EmptyState, SectionHeader, StatCard } from '@/components/nexora-doctor/ui/shared';
import { formatRelative, formatTime, useTodayAppointments } from '@/lib/nexora-doctor/hooks';
import { useDoctorClinicalStore } from '@/lib/nexora-doctor/store';
import { startDoctorConsultation } from '@/lib/nexora-doctor/workflow-actions';

export function DashboardWorkspace() {
  const router = useRouter();
  const appointments = useTodayAppointments();
  const prescriptions = useDoctorClinicalStore((s) => s.prescriptions);
  const notifications = useDoctorClinicalStore((s) => s.notifications);
  const activities = useDoctorClinicalStore((s) => s.activities);

  const [startingId, setStartingId] = useState<string | null>(null);

  const current = appointments.find((a) => a.status === 'in-progress');
  const queue = appointments.filter((a) => a.status === 'waiting');
  const completed = appointments.filter((a) => a.status === 'completed');
  const pendingRx = prescriptions.filter((p) => p.status === 'draft');
  const unread = notifications.filter((n) => !n.read);

  const handleStart = async (apptId: string) => {
    setStartingId(apptId);
    const result = await startDoctorConsultation(apptId);
    setStartingId(null);
    if (result.ok) {
      toast.success('Consultation started · synced to Supabase');
      router.push('/doctor/consultation');
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className={ui.page}>
      <div className="mb-8">
        <h1 className={ui.pageTitle}>Good morning, Doctor</h1>
        <p className={ui.pageSubtitle}>
          {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} ·{' '}
          {appointments.length} appointments today
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Today's Appointments" value={appointments.length} accent="sage" />
        <StatCard label="Waiting Queue" value={queue.length} accent="pending" />
        <StatCard label="Completed Today" value={completed.length} accent="neutral" />
        <StatCard label="Pending Prescriptions" value={pendingRx.length} accent="neutral" />
        <StatCard label="Unread Alerts" value={unread.length} accent="pending" />
        <StatCard
          label="Current Consultation"
          value={current ? 1 : 0}
          accent={current ? 'sage' : 'neutral'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {current && (
            <section className={ui.card}>
              <SectionHeader title="Current Consultation" />
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-[#2C3531]">{current.patientName}</p>
                  <p className="text-sm text-[#2C3531]/60">
                    {current.mrn} · {current.chiefComplaint}
                  </p>
                  <span className={`${ui.badge} ${statusColors['in-progress']} mt-2`}>
                    In consultation
                  </span>
                </div>
                <Link href="/doctor/consultation" className={ui.btnPrimary}>
                  <Stethoscope className="h-4 w-4" /> Continue
                </Link>
              </div>
            </section>
          )}

          <section className={ui.card}>
            <SectionHeader
              title="Recent Activity"
              action={<Link href="/doctor/notifications" className={ui.link}>All alerts</Link>}
            />
            {activities.length === 0 ? (
              <EmptyState title="No activity yet" description="Live events will appear here." />
            ) : (
              <ul className={`space-y-3 ${ui.scrollList}`}>
                {activities.slice(0, 8).map((a) => (
                  <li key={a.id} className="flex gap-3 border-b border-[#E2E8E0]/60 pb-3 last:border-0">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#7A9A8B]" />
                    <div className="text-sm">
                      <p className="font-medium text-[#2C3531]">
                        {new Date(a.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {a.action}
                      </p>
                      <p className="text-xs text-[#2C3531]/60">
                        {a.detail} · {formatRelative(a.at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={ui.card}>
            <SectionHeader title="Live Queue" />
            {queue.length === 0 ? (
              <EmptyState icon={<Users className="h-8 w-8" />} title="Queue empty" />
            ) : (
              <ul className="space-y-2">
                {queue.map((a, i) => (
                  <li
                    key={a.id}
                    className="flex items-center gap-3 rounded-xl border border-[#7A9A8B]/30 bg-[#EEF5F1] px-4 py-3"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FAFCF8] text-sm font-bold text-[#7A9A8B]">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium">{a.patientName}</p>
                      <p className="text-xs text-[#2C3531]/60">
                        Token {a.token} · {formatTime(a.time)} · Waiting
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleStart(a.id)}
                      disabled={startingId === a.id}
                      className={`${ui.btnPrimary} disabled:opacity-60`}
                    >
                      <Play className="h-3.5 w-3.5" /> {startingId === a.id ? 'Starting…' : 'Start'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className={ui.card}>
            <SectionHeader title="Quick Actions" />
            <div className="grid gap-2">
              <button
                type="button"
                disabled={!!startingId}
                onClick={() => {
                  const next = queue[0] ?? appointments.find((a) => a.status === 'scheduled');
                  if (next) void handleStart(next.id);
                  else toast.info('No patients waiting');
                }}
                className={`${ui.btnPrimary} disabled:opacity-60`}
              >
                <Stethoscope className="h-4 w-4" /> Start Consultation
              </button>
              <Link href="/doctor/schedule" className={ui.btnSecondary}>
                <Calendar className="h-4 w-4" /> View Schedule
              </Link>
              <Link href="/doctor/notifications" className={ui.btnSecondary}>
                <Bell className="h-4 w-4" /> View Notifications
              </Link>
              <Link href="/doctor/prescriptions" className={ui.btnSecondary}>
                <ScrollText className="h-4 w-4" /> Prescriptions
              </Link>
            </div>
          </section>

          <section className={ui.card}>
            <SectionHeader title="Today's Snapshot" />
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#4A856A]" />
                {completed.length} consultations completed
              </li>
              <li className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#9A8938]" />
                {queue.length} patients waiting
              </li>
              <li className="flex items-center gap-2">
                <ScrollText className="h-4 w-4 text-[#7A9A8B]" />
                {prescriptions.length} prescriptions issued
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
