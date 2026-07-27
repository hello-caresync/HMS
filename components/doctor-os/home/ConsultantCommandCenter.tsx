'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
  AlertTriangle,
  FlaskConical,
  Pill,
  ScanLine,
  Stethoscope,
  UserPlus,
} from 'lucide-react';

import { useDoctorAuth } from '@/lib/doctor/auth/DoctorAuthProvider';
import {
  useClinicalOrders,
  useEmergencyCases,
  useIpdAdmissions,
  useOpdQueue,
} from '@/lib/doctor/hooks/useClinicalQueries';
import { useCareCenterInsights } from '@/lib/doctor/hooks/useCareCenter';
import { sageUi } from '@/lib/doctor/ui-tokens';

function StatCard({ label, value, tone }: { label: string; value: number | string; tone?: string }) {
  return (
    <div className="doctor-card">
      <p className="text-[11px] font-bold uppercase tracking-wider text-[#5A584A]">{label}</p>
      <p className="mt-1 text-2xl font-black tabular-nums text-brand-text" style={{ color: tone }}>
        {value}
      </p>
    </div>
  );
}

export default function ConsultantCommandCenter() {
  const { session } = useDoctorAuth();
  const { data: queueData } = useOpdQueue();
  const { data: ipdData } = useIpdAdmissions();
  const { data: erData } = useEmergencyCases();
  const { data: ordersData } = useClinicalOrders();
  const { data: insights } = useCareCenterInsights();

  const queue = queueData?.queue ?? [];
  const ipd = ipdData?.admissions ?? [];
  const criticalEr = (erData?.cases ?? []).filter((e) => e.esiLevel <= 2);
  const pendingResults = (ordersData?.orders ?? []).filter((o) => o.progress < 100).slice(0, 5);

  const stats = useMemo(
    () => ({
      appointments: (insights?.insights?.patientsSeenToday ?? 0) + queue.length,
      queue: queue.length,
      ipd: ipd.length,
      surgeries: 1,
      critical: criticalEr.length,
    }),
    [queue.length, ipd.length, criticalEr.length, insights],
  );

  return (
    <div className="doctor-page space-y-6 p-1">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-widest text-brand-primary">Consultant Command Center</p>
        <h1 className="text-2xl font-black text-brand-text">{session?.fullName ?? 'Doctor'}</h1>
        <p className="text-sm text-[#5A584A]">{session?.specialization}</p>
      </header>

      {/* Top metrics — 5 cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Today's Appointments" value={stats.appointments} />
        <StatCard label="OPD Queue" value={stats.queue} tone="#A39E75" />
        <StatCard label="IPD Admitted" value={stats.ipd} />
        <StatCard label="Surgeries Today" value={stats.surgeries} />
        <StatCard label="Critical Alerts" value={stats.critical} tone={stats.critical ? '#BE123C' : undefined} />
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left 8 cols — live queue + IPD census */}
        <section className="col-span-12 space-y-4 xl:col-span-8">
          <div className="doctor-card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold text-brand-text">OPD Waiting List</h2>
              <Link href="/doctor/opd-consultation" className="text-xs font-semibold text-brand-primary hover:underline">
                Open workspace →
              </Link>
            </div>
            <div className="space-y-2">
              {queue.length === 0 ? (
                <p className="text-sm text-[#5A584A]">No patients in queue.</p>
              ) : (
                queue.map((q) => (
                  <div
                    key={q.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-brand-light bg-brand-surface px-3 py-2.5"
                  >
                    <div>
                      <p className="font-semibold text-brand-text">{q.patientName}</p>
                      <p className="text-xs text-[#5A584A]">
                        {q.token} · {q.chiefComplaint} · {q.waitMinutes}m wait
                      </p>
                    </div>
                    <Link
                      href={`/doctor/opd-consultation?appointment=${q.id}&patient=${q.patientId}`}
                      className={`${sageUi.btnPrimary} inline-flex items-center gap-1 text-xs`}
                    >
                      <Stethoscope className="h-3.5 w-3.5" /> Start Consultation
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="doctor-card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold text-brand-text">IPD Ward Census</h2>
              <Link href="/doctor/ipd-management" className="text-xs font-semibold text-brand-primary hover:underline">
                Ward rounds →
              </Link>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {ipd.length === 0 ? (
                <p className="text-sm text-[#5A584A]">No active admissions.</p>
              ) : (
                ipd.map((a) => (
                  <div key={a.id} className="rounded-lg border border-brand-light bg-white p-3">
                    <p className="font-semibold">{a.patient.fullName}</p>
                    <p className="text-xs text-[#5A584A]">
                      {a.ward} · Bed {a.bed}
                    </p>
                    <Link
                      href="/doctor/ipd-management"
                      className="mt-2 inline-block text-xs font-bold text-brand-primary hover:underline"
                    >
                      Ward Round
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Right 4 cols */}
        <aside className="col-span-12 space-y-4 xl:col-span-4">
          {criticalEr.length > 0 && (
            <div className="esi-critical-callout">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="h-5 w-5" /> ESI 1–2 Active
              </div>
              {criticalEr.map((c) => (
                <p key={c.id} className="mt-2 text-sm">
                  {c.presentation} · {c.bay}
                </p>
              ))}
              <Link href="/doctor/emergency-cases" className="mt-2 inline-block text-xs font-bold underline">
                Open triage feed
              </Link>
            </div>
          )}

          <div className="doctor-card">
            <h2 className="mb-2 font-bold">Pending Lab / Radiology</h2>
            <ul className="space-y-2 text-sm">
              {pendingResults.length === 0 ? (
                <li className="text-[#5A584A]">All caught up.</li>
              ) : (
                pendingResults.map((o) => (
                  <li key={o.id} className="rounded-lg bg-brand-surface px-2 py-1.5">
                    <span className="font-medium">{o.test}</span>
                    <span className="text-[#5A584A]"> · {o.patient}</span>
                    <span className="ml-1 text-xs text-brand-primary">{o.status}</span>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="doctor-card-surface">
            <h2 className="mb-3 font-bold">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/doctor/opd-consultation" className={`${sageUi.btnPrimary} flex items-center justify-center gap-1 text-center text-xs`}>
                <UserPlus className="h-3.5 w-3.5" /> New Consult
              </Link>
              <Link href="/doctor/lab-orders" className={`${sageUi.btnSecondary} flex items-center justify-center gap-1 text-xs`}>
                <FlaskConical className="h-3.5 w-3.5" /> Order Labs
              </Link>
              <Link href="/doctor/radiology-orders" className={`${sageUi.btnSecondary} flex items-center justify-center gap-1 text-xs`}>
                <ScanLine className="h-3.5 w-3.5" /> Order Imaging
              </Link>
              <Link href="/doctor/patients" className={`${sageUi.btnSecondary} flex items-center justify-center gap-1 text-xs`}>
                <Stethoscope className="h-3.5 w-3.5" /> Patient Chart
              </Link>
              <Link href="/doctor/e-prescription" className={`${sageUi.btnSecondary} col-span-2 flex items-center justify-center gap-1 text-xs`}>
                <Pill className="h-3.5 w-3.5" /> e-Prescription
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
