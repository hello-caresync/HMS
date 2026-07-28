'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  Calendar,
  Clock,
  FlaskConical,
  Play,
  Scan,
  Stethoscope,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import { ui, statusColors } from '@/components/nexora-doctor/ui/primitives';
import { EmptyState, SectionHeader, StatCard } from '@/components/nexora-doctor/ui/shared';
import { formatRelative, formatTime, useTodayAppointments } from '@/lib/nexora-doctor/hooks';
import { useDoctorClinicalStore } from '@/lib/nexora-doctor/store';

export function DashboardWorkspace() {
  const appointments = useTodayAppointments();
  const orders = useDoctorClinicalStore((s) => s.orders);
  const notifications = useDoctorClinicalStore((s) => s.notifications);
  const activities = useDoctorClinicalStore((s) => s.activities);
  const startConsultation = useDoctorClinicalStore((s) => s.startConsultation);

  const current = appointments.find((a) => a.status === 'in-progress');
  const upcoming = appointments.filter((a) => a.status === 'scheduled' || a.status === 'waiting').slice(0, 2);
  const queue = appointments.filter((a) => a.status === 'waiting');
  const pendingLabs = orders.filter((o) => o.type === 'lab' && o.status === 'pending');
  const pendingRad = orders.filter((o) => o.type === 'radiology' && (o.status === 'pending' || o.status === 'in-progress'));
  const emergencies = notifications.filter((n) => n.category === 'emergency' && !n.read);
  const followUps = appointments.filter((a) => a.chiefComplaint.toLowerCase().includes('follow'));

  const handleStart = (apptId: string) => {
    startConsultation(apptId);
    toast.success('Consultation started');
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

      {emergencies.length > 0 && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">Emergency Alerts</p>
              {emergencies.map((e) => (
                <p key={e.id} className="mt-1 text-sm text-red-800">
                  {e.title}: {e.body}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today's Appointments" value={appointments.length} accent="teal" />
        <StatCard label="Waiting Queue" value={queue.length} accent="amber" />
        <StatCard label="Pending Labs" value={pendingLabs.length} accent="slate" />
        <StatCard label="Pending Radiology" value={pendingRad.length} accent="slate" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {current && (
            <section className={ui.card}>
              <SectionHeader title="Current Patient" />
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{current.patientName}</p>
                  <p className="text-sm text-slate-500">{current.mrn} · {current.chiefComplaint}</p>
                  <span className={`${ui.badge} ${statusColors['in-progress']} mt-2`}>In consultation</span>
                </div>
                <Link href="/doctor/consultations" className={ui.btnPrimary}>
                  <Stethoscope className="h-4 w-4" /> Continue
                </Link>
              </div>
            </section>
          )}

          <section className={ui.card}>
            <SectionHeader title="Today's Appointments" action={<Link href="/doctor/schedule" className="text-xs font-medium text-teal-700">View all</Link>} />
            {appointments.length === 0 ? (
              <EmptyState title="No appointments today" description="Your schedule is clear." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {appointments.slice(0, 6).map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">{a.patientName}</p>
                      <p className="text-xs text-slate-500">{formatTime(a.time)} · {a.chiefComplaint}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`${ui.badge} ${statusColors[a.status]}`}>{a.status}</span>
                      {(a.status === 'waiting' || a.status === 'scheduled') && (
                        <button type="button" onClick={() => handleStart(a.id)} className={ui.btnPrimary}>
                          <Play className="h-3.5 w-3.5" /> Start
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={ui.card}>
            <SectionHeader title="Live Queue" />
            {queue.length === 0 ? (
              <EmptyState icon={<Users className="h-8 w-8" />} title="Queue empty" description="No patients waiting." />
            ) : (
              <ul className="space-y-2">
                {queue.map((a, i) => (
                  <li key={a.id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-800">{i + 1}</span>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{a.patientName}</p>
                      <p className="text-xs text-slate-500">Token {a.token}</p>
                    </div>
                    <button type="button" onClick={() => handleStart(a.id)} className={ui.btnSecondary}>Start</button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-6">
          {upcoming.length > 0 && (
            <section className={ui.card}>
              <SectionHeader title="Up Next" />
              {upcoming.map((a) => (
                <div key={a.id} className="mb-3 last:mb-0">
                  <p className="font-medium text-slate-900">{a.patientName}</p>
                  <p className="text-xs text-slate-500">{formatTime(a.time)} · {a.type}</p>
                </div>
              ))}
            </section>
          )}

          <section className={ui.card}>
            <SectionHeader title="Pending Results" />
            <ul className="space-y-3">
              {pendingLabs.map((o) => (
                <li key={o.id} className="flex items-center gap-2 text-sm">
                  <FlaskConical className="h-4 w-4 text-amber-600" />
                  <span>{o.title} — {o.patientName}</span>
                </li>
              ))}
              {pendingRad.map((o) => (
                <li key={o.id} className="flex items-center gap-2 text-sm">
                  <Scan className="h-4 w-4 text-blue-600" />
                  <span>{o.title} — {o.patientName}</span>
                </li>
              ))}
              {pendingLabs.length === 0 && pendingRad.length === 0 && (
                <p className="text-sm text-slate-500">All results reviewed.</p>
              )}
            </ul>
          </section>

          {followUps.length > 0 && (
            <section className={ui.card}>
              <SectionHeader title="Pending Follow-ups" />
              {followUps.map((a) => (
                <p key={a.id} className="text-sm text-slate-700">{a.patientName} — {formatTime(a.time)}</p>
              ))}
            </section>
          )}

          <section className={ui.card}>
            <SectionHeader title="Quick Actions" />
            <div className="grid grid-cols-2 gap-2">
              <Link href="/doctor/consultations" className={ui.btnSecondary}>New Consultation</Link>
              <Link href="/doctor/orders" className={ui.btnSecondary}>Place Order</Link>
              <Link href="/doctor/patients" className={ui.btnSecondary}>Find Patient</Link>
              <Link href="/doctor/schedule" className={ui.btnSecondary}>View Schedule</Link>
            </div>
          </section>

          <section className={ui.card}>
            <SectionHeader title="Recent Activity" />
            <ul className="space-y-3">
              {activities.slice(0, 5).map((a) => (
                <li key={a.id} className="text-sm">
                  <p className="font-medium text-slate-800">{a.action}</p>
                  <p className="text-xs text-slate-500">{a.detail} · {formatRelative(a.at)}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
