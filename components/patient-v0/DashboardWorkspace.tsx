'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Bell,
  CalendarDays,
  FileText,
  Pill,
  Stethoscope,
  TestTube,
} from 'lucide-react';

import { v0Ui, statusBadge } from '@/components/patient-v0/ui';
import { PatientStatusBanner } from '@/components/patient/PatientStatusBanner';
import {
  formatDateLabel,
  formatTimeLabel,
  usePatientNotifications,
  usePatientPrescriptions,
  useTodayAppointments,
  useUnreadNotificationCount,
  useUpcomingAppointments,
} from '@/lib/ecosystem/hooks';
import { useMedicalRecords } from '@/lib/ecosystem/hooks';
import { usePatientAuth } from '@/lib/patient/auth/PatientAuthProvider';
import { PATIENT_ROUTES } from '@/lib/patient/navigation';

export function DashboardWorkspace() {
  const { session } = usePatientAuth();
  const patientId = session?.patientId ?? null;
  const upcoming = useUpcomingAppointments(patientId);
  const today = useTodayAppointments(patientId);
  const prescriptions = usePatientPrescriptions(patientId);
  const notifications = usePatientNotifications(patientId).slice(0, 4);
  const unread = useUnreadNotificationCount(patientId);
  const { labs, rad } = useMedicalRecords(patientId);

  const nextAppt = upcoming[0];
  const activeRx = prescriptions.find((p) => p.status === 'active');
  const recentLab = labs.find((l) => l.status === 'ready');
  const recentRad = rad.find((r) => r.status === 'completed');

  return (
    <div className={v0Ui.page}>
      <header>
        <h1 className={v0Ui.pageTitle}>Welcome back, {session?.fullName.split(' ')[0]}</h1>
        <p className={v0Ui.pageSubtitle}>
          Your care journey · {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Upcoming" value={String(upcoming.length)} hint="appointments" />
        <Stat label="Today" value={String(today.length)} hint="scheduled" />
        <Stat label="Active Rx" value={String(prescriptions.filter((p) => p.status === 'active').length)} hint="prescriptions" />
        <Stat label="Alerts" value={String(unread)} hint="unread" accent />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className={`${v0Ui.card} lg:col-span-2`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-black text-patient-plum">
              <CalendarDays className="h-5 w-5 text-patient-primary" />
              Upcoming Appointment
            </h2>
            <Link href={PATIENT_ROUTES.appointments} className="text-xs font-bold text-patient-primary hover:underline">
              View all
            </Link>
          </div>
          {nextAppt ? (
            <div className="rounded-xl border border-patient-lavender/30 bg-patient-lavender/5 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-black text-patient-charcoal">{nextAppt.doctorName}</p>
                  <p className="text-sm text-patient-lavender">{nextAppt.department} · {nextAppt.type}</p>
                  <p className="mt-2 text-sm font-bold text-patient-primary">
                    {formatDateLabel(nextAppt.date)} · {formatTimeLabel(nextAppt.time)}
                  </p>
                  <p className="mt-1 text-xs text-patient-lavender">Token {nextAppt.token} · {nextAppt.location}</p>
                </div>
                <span className={`${v0Ui.badge} ${statusBadge[nextAppt.status]}`}>{nextAppt.status}</span>
              </div>
              <p className="mt-3 text-sm text-patient-charcoal">{nextAppt.reason}</p>
            </div>
          ) : (
            <EmptyBlock message="No upcoming appointments" actionHref={PATIENT_ROUTES.appointments} actionLabel="Book appointment" />
          )}

          {today.length > 0 && (
            <div className="mt-4 rounded-xl border border-patient-primary/20 bg-patient-card p-3">
              <p className="text-xs font-black uppercase text-patient-plum">Today&apos;s visit</p>
              <p className="mt-1 text-sm font-bold">{today[0].doctorName} at {formatTimeLabel(today[0].time)}</p>
            </div>
          )}
        </section>

        <section className={v0Ui.card}>
          <h2 className="mb-4 text-lg font-black text-patient-plum">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-2">
            <QuickAction href={PATIENT_ROUTES.appointments} icon={CalendarDays} label="Book Visit" />
            <QuickAction href={PATIENT_ROUTES.doctors} icon={Stethoscope} label="Find Doctor" />
            <QuickAction href={PATIENT_ROUTES.prescriptions} icon={Pill} label="Prescriptions" />
            <QuickAction href={PATIENT_ROUTES.records} icon={FileText} label="Records" />
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className={v0Ui.card}>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase text-patient-plum">
            <Pill className="h-4 w-4" /> Recent Prescription
          </h2>
          {activeRx ? (
            <div>
              <p className="font-bold text-patient-charcoal">{activeRx.doctorName}</p>
              <ul className="mt-2 space-y-1">
                {activeRx.medicines.slice(0, 3).map((m) => (
                  <li key={m.id} className="text-sm text-patient-charcoal">{m.name} {m.dosage}</li>
                ))}
              </ul>
              <Link href={PATIENT_ROUTES.prescriptions} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-patient-primary hover:underline">
                View prescription <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ) : (
            <p className="text-sm text-patient-lavender">No active prescriptions</p>
          )}
        </section>

        <section className={v0Ui.card}>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase text-patient-plum">
            <TestTube className="h-4 w-4" /> Recent Reports
          </h2>
          {recentLab || recentRad ? (
            <ul className="space-y-2 text-sm">
              {recentLab && (
                <li className="rounded-lg bg-patient-lavender/5 p-2">
                  <p className="font-bold">{recentLab.testName}</p>
                  <p className="text-xs text-patient-lavender">{recentLab.resultSummary?.slice(0, 60)}…</p>
                </li>
              )}
              {recentRad && (
                <li className="rounded-lg bg-patient-lavender/5 p-2">
                  <p className="font-bold">{recentRad.studyName}</p>
                  <p className="text-xs text-patient-lavender">{recentRad.findings?.slice(0, 60)}…</p>
                </li>
              )}
            </ul>
          ) : (
            <p className="text-sm text-patient-lavender">Reports appear after your visits</p>
          )}
          <Link href={PATIENT_ROUTES.records} className="mt-3 inline-flex text-xs font-bold text-patient-primary hover:underline">
            Open medical records
          </Link>
        </section>

        <section className={v0Ui.card}>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase text-patient-plum">
            <Bell className="h-4 w-4" /> Notifications
          </h2>
          {notifications.length === 0 ? (
            <p className="text-sm text-patient-lavender">You&apos;re all caught up</p>
          ) : (
            <ul className="space-y-2">
              {notifications.map((n) => (
                <li key={n.id} className={`rounded-lg p-2 text-sm ${n.read ? 'opacity-70' : 'bg-patient-card'}`}>
                  <p className="font-bold text-patient-charcoal">{n.title}</p>
                  <p className="text-xs text-patient-lavender line-clamp-2">{n.body}</p>
                </li>
              ))}
            </ul>
          )}
          <Link href={PATIENT_ROUTES.notifications} className="mt-3 inline-flex text-xs font-bold text-patient-primary hover:underline">
            View all notifications
          </Link>
        </section>
      </div>

      <PatientStatusBanner
        message="Health summary synced · vitals and visit history update automatically after each consultation."
        variant="info"
      />
    </div>
  );
}

function Stat({ label, value, hint, accent }: { label: string; value: string; hint: string; accent?: boolean }) {
  return (
    <div className={v0Ui.card}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-patient-lavender">{label}</p>
      <p className={`mt-2 text-3xl font-black tabular-nums ${accent ? 'text-patient-primary' : 'text-patient-plum'}`}>{value}</p>
      <p className="text-xs text-patient-lavender">{hint}</p>
    </div>
  );
}

function QuickAction({ href, icon: Icon, label }: { href: string; icon: typeof CalendarDays; label: string }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-2 rounded-xl border border-patient-lavender/30 bg-patient-lavender/5 p-4 text-center transition hover:bg-patient-card">
      <Icon className="h-5 w-5 text-patient-primary" />
      <span className="text-xs font-bold text-patient-plum">{label}</span>
    </Link>
  );
}

function EmptyBlock({ message, actionHref, actionLabel }: { message: string; actionHref: string; actionLabel: string }) {
  return (
    <div className={v0Ui.empty}>
      <p className="text-sm font-medium text-patient-lavender">{message}</p>
      <Link href={actionHref} className={`${v0Ui.btnPrimary} mt-4`}>{actionLabel}</Link>
    </div>
  );
}
