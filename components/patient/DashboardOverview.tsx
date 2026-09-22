'use client';

import type { ElementType } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  FileText,
  IndianRupee,
  MapPin,
  PlusCircle,
  RotateCw,
  Stethoscope,
  Ticket,
  User,
  Users,
} from 'lucide-react';

import { MissedVisitRescheduleCard } from '@/components/patient/MissedVisitAlertBanner';

import type { ConsultationBill } from '@/lib/hospital/operations/consultation-billing-sync';
import {
  billLineStatusLabel,
  billingStatusBadgeClass,
  type PatientBillingSnapshot,
} from '@/lib/patient/patient-billing-status';
import { ProfileCompletionGate } from '@/components/patient/ProfileCompletionGate';
import { patientClasses } from '@/lib/patient/theme';
import { formatINR } from '@/lib/utils/currency';

export type DashboardVisit = {
  id: string;
  doctor_id?: string;
  doctor_name: string;
  department: string;
  appointment_date: string;
  appointment_time?: string;
  slot_time: string;
  token_number: number | string;
  queue_status: string;
  status?: string;
  booking_for?: string;
  reason?: string;
  symptoms?: string;
  patient_name?: string;
  is_self?: boolean;
  beneficiary_relation?: string;
  hospital_name?: string;
  fee?: string;
};

export type DashboardPrescription = {
  id: string;
  doctor_name: string;
  diagnosis: string;
  created_at: string;
};

export type DashboardOverviewProps = {
  patientName: string;
  loading: boolean;
  billsLoading: boolean;
  activeVisits: DashboardVisit[];
  actionRequiredVisits: DashboardVisit[];
  activeVisitsCount: number;
  prescriptionCount: number;
  recentPrescriptions: DashboardPrescription[];
  doctorsAvailable: number;
  billingSnapshot: PatientBillingSnapshot;
  bills: ConsultationBill[];
  onRefresh: () => void;
  onBookConsultation: () => void;
  onReschedule: (visit: DashboardVisit) => void;
  profileComplete?: boolean;
  profileGateLoading?: boolean;
  profileMissingFields?: string[];
};

const sectionHeaderClass =
  'mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-600';

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: ElementType;
}) {
  return (
    <div className={patientClasses.cardCompact}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{label}</p>
          <p className="my-1 truncate text-xl font-bold tracking-tight text-[#2B1810]">{value}</p>
          {hint ? <p className="truncate text-[11px] text-stone-500">{hint}</p> : null}
        </div>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#FAF7F2] p-1.5 text-[#8C5A3C]">
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </div>
      </div>
    </div>
  );
}

function formatShortDate(value: string): string {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 10);
  return parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function formatVisitTime(value: string): string {
  const text = String(value ?? '').trim();
  if (!text) return 'TBD';
  if (/^\d{1,2}:\d{2}/.test(text)) return text.slice(0, 5);
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }
  return text;
}

function patientIndicator(visit: DashboardVisit): string {
  if (visit.is_self || visit.booking_for?.toUpperCase() === 'SELF') return 'Self';
  const relation = visit.beneficiary_relation || visit.booking_for || 'Dependent';
  return visit.patient_name ? `${visit.patient_name} (${relation})` : relation;
}

function ActiveVisitCard({ visit }: { visit: DashboardVisit }) {
  const displayStatus = (visit.status || visit.queue_status || 'CONFIRMED').replace(/_/g, ' ');
  const displayTime = formatVisitTime(visit.appointment_time || visit.slot_time);
  const displayDate = formatShortDate(visit.appointment_date);
  const tokenLabel =
    typeof visit.token_number === 'string' && visit.token_number.startsWith('T-')
      ? visit.token_number
      : `#${visit.token_number || '—'}`;
  const mapsQuery = encodeURIComponent(
    `${visit.hospital_name ?? 'Regal Hospital'} OPD Block Bengaluru`,
  );

  return (
    <article className="rounded-2xl border border-sky-100 bg-white/90 p-5 shadow-sm backdrop-blur-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-sky-50 pb-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sm font-bold text-sky-800">
            {visit.doctor_name.replace(/^Dr\.?\s*/i, '').charAt(0) || 'D'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900">{visit.doctor_name}</p>
            <p className="flex items-center gap-1 text-xs font-medium text-sky-700">
              <Stethoscope className="h-3 w-3" aria-hidden />
              {visit.department}
            </p>
          </div>
        </div>
        <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] font-bold uppercase text-sky-800">
          {displayStatus}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-xs font-medium text-slate-600">
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5 text-sky-600" aria-hidden />
          {displayDate}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 text-sky-600" aria-hidden />
          {displayTime}
        </span>
        <span className="inline-flex items-center gap-1">
          <Ticket className="h-3.5 w-3.5 text-sky-600" aria-hidden />
          Token {tokenLabel}
        </span>
      </div>

      <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-sky-100 bg-sky-50/80 px-2.5 py-1 text-[11px] font-semibold text-sky-900">
        <User className="h-3 w-3" aria-hidden />
        For: {patientIndicator(visit)}
      </div>

      {visit.reason ? (
        <p className="mt-3 rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-2 text-[11px] text-amber-950">
          <span className="font-bold">Reason:</span> {visit.reason}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/patient/appointments"
          className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-sky-800 transition hover:bg-sky-50"
        >
          View Details
        </Link>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-lg border border-sky-300 bg-sky-600 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-sky-700"
        >
          <MapPin className="h-3 w-3" aria-hidden />
          Check-In / Directions
        </a>
      </div>
    </article>
  );
}

export function DashboardOverview({
  patientName,
  loading,
  billsLoading,
  activeVisits,
  actionRequiredVisits,
  activeVisitsCount,
  prescriptionCount,
  recentPrescriptions,
  doctorsAvailable,
  billingSnapshot,
  bills,
  onRefresh,
  onBookConsultation,
  onReschedule,
  profileComplete = true,
  profileGateLoading = false,
  profileMissingFields = [],
}: DashboardOverviewProps) {
  const bookingBlocked = !profileGateLoading && !profileComplete;
  const firstName = patientName.split(/\s+/)[0] || patientName;
  const primaryVisit = activeVisits[0] ?? null;
  const tokenLabel = primaryVisit?.token_number
    ? `#${primaryVisit.token_number}`
    : 'No Active Token';
  const latestMissed = actionRequiredVisits[0] ?? null;
  const outstandingBill = bills.find((bill) => bill.status !== 'paid');
  const outstandingLabel =
    billingSnapshot.totalOutstanding > 0
      ? formatINR(billingSnapshot.totalOutstanding)
      : '₹0 (Cleared)';

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-6 font-sans text-slate-900 md:px-0">
      {/* Zone A — header + quick stats */}
      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-[#2B1810]">
                Welcome back, {firstName}
              </h1>
              <span className="rounded-full border border-[#DDB892]/60 bg-[#EDE0D4] px-2 py-0.5 text-[10px] font-bold text-[#7F5539]">
                Verified Member
              </span>
            </div>
            <p className="mt-0.5 text-xs text-stone-500">
              Regal Hospital · HOSP-01 · Your care command center
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              className={patientClasses.btnSecondaryOutline}
            >
              <span className="inline-flex items-center gap-1.5">
                <RotateCw className="h-3.5 w-3.5" aria-hidden />
                Refresh
              </span>
            </button>
            <Link href="/patient/profile" className={patientClasses.btnSecondaryOutline}>
              View Vitals
            </Link>
            <button
              type="button"
              onClick={onBookConsultation}
              disabled={profileGateLoading || bookingBlocked}
              className={patientClasses.btnPrimary}
            >
              <span className="inline-flex items-center gap-1.5">
                <PlusCircle className="h-3.5 w-3.5" aria-hidden />
                {bookingBlocked ? 'Complete Profile to Book' : 'Book Consultation'}
              </span>
            </button>
          </div>
        </div>

        {bookingBlocked ? (
          <ProfileCompletionGate missingFields={profileMissingFields} />
        ) : null}

        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Book OPD', href: '/patient/book' },
            { label: 'Appointments', href: '/patient/appointments' },
            { label: 'Doctors', href: '/patient/doctors' },
            { label: 'Prescriptions', href: '/patient/prescriptions' },
          ].map((pill) => (
            <Link
              key={pill.href}
              href={pill.href}
              className="rounded-full border border-[#E6CCB2] bg-white/90 px-3 py-1 text-xs font-medium text-stone-700 transition hover:border-[#8C5A3C] hover:bg-[#FAF7F2]"
            >
              {pill.label}
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            label="Active Visits"
            value={loading ? '…' : String(activeVisitsCount)}
            hint={activeVisitsCount === 1 ? 'Upcoming consultation' : 'Upcoming consultations'}
            icon={Calendar}
          />
          <StatCard
            label="OPD Queue"
            value={loading ? '…' : tokenLabel}
            hint={primaryVisit?.queue_status?.replace(/_/g, ' ') || 'Walk-in ready'}
            icon={Ticket}
          />
          <StatCard
            label="Prescriptions"
            value={loading ? '…' : String(prescriptionCount)}
            hint="On record"
            icon={FileText}
          />
          <StatCard
            label="Outstanding"
            value={billsLoading ? '…' : outstandingLabel}
            hint={billingSnapshot.statusLabel}
            icon={IndianRupee}
          />
        </div>
      </section>

      {/* Zone B — main split */}
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">
          {/* Active consultations */}
          <div className="rounded-2xl border border-sky-100 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
            <h2 className="mb-4 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sky-800">
              <Ticket className="h-4 w-4" aria-hidden />
              Active Consultations
            </h2>

            {loading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-3.5 w-32 rounded bg-sky-100" />
                <div className="h-24 rounded-2xl bg-sky-50" />
              </div>
            ) : activeVisits.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50/50 px-4 py-8 text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 p-2.5 text-sky-700">
                  <Stethoscope className="h-5 w-5" aria-hidden />
                </div>
                <p className="text-sm font-bold text-slate-900">No active OPD bookings</p>
                <p className="mx-auto mt-1 mb-3 max-w-sm text-xs text-slate-600">
                  {doctorsAvailable > 0
                    ? `${doctorsAvailable} consultant${doctorsAvailable === 1 ? '' : 's'} available — book your next visit.`
                    : 'Book an OPD slot to receive your live queue token.'}
                </p>
                <button
                  type="button"
                  onClick={onBookConsultation}
                  disabled={profileGateLoading || bookingBlocked}
                  className={patientClasses.btnPrimary}
                >
                  {bookingBlocked ? 'Complete Profile to Book OPD' : 'Book OPD Slot Now'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {activeVisits.map((visit) => (
                  <ActiveVisitCard key={visit.id} visit={visit} />
                ))}
              </div>
            )}
          </div>

          {/* Recent prescriptions & care */}
          <div className="rounded-xl border border-[#EADBCE] bg-white p-4 shadow-xs">
            <div className="mb-3 flex items-center justify-between">
              <h2 className={`${sectionHeaderClass} mb-0`}>
                <FileText className="h-4 w-4 text-[#8C5A3C]" aria-hidden />
                Recent Clinical Records
              </h2>
              <Link href="/patient/prescriptions" className="text-xs font-semibold text-[#8C5A3C] hover:underline">
                View all
              </Link>
            </div>

            {recentPrescriptions.length === 0 ? (
              <p className="text-xs text-stone-500">
                No prescriptions on file yet. They appear here after your doctor completes a consult.
              </p>
            ) : (
              <ul className="divide-y divide-[#F3ECE4]">
                {recentPrescriptions.slice(0, 3).map((rx) => (
                  <li key={rx.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-[#2B1810]">{rx.doctor_name}</p>
                      <p className="truncate text-[11px] text-stone-500">{rx.diagnosis}</p>
                      <p className="text-[10px] text-stone-400">{formatShortDate(rx.created_at)}</p>
                    </div>
                    <Link
                      href="/patient/prescriptions"
                      className="shrink-0 rounded-md border border-[#EADBCE] bg-[#F3ECE4] px-2 py-1 text-[10px] font-bold text-[#5C3826] hover:bg-[#EADBCE]"
                    >
                      PDF
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right column — reschedule alert + billing */}
        <div className="space-y-4">
          {!loading && latestMissed ? (
            <MissedVisitRescheduleCard visit={latestMissed} onReschedule={onReschedule} />
          ) : null}

          <div className="rounded-xl border border-[#EADBCE] bg-white p-4 shadow-xs">
            <div className="mb-3 flex items-center justify-between">
              <h2 className={`${sectionHeaderClass} mb-0`}>
                <IndianRupee className="h-4 w-4 text-[#8C5A3C]" aria-hidden />
                Billing & Receipts
              </h2>
              <Link href="/patient/billing" className="text-xs font-semibold text-[#8C5A3C] hover:underline">
                Open
              </Link>
            </div>

            {billsLoading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-3.5 w-24 rounded bg-[#F3ECE4]" />
                <div className="h-8 rounded-lg bg-[#F5EFE6]" />
              </div>
            ) : !billingSnapshot.hasBills ? (
              <p className="py-2 text-xs font-medium text-stone-500">{billingSnapshot.summaryLabel}</p>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-[#2B1810]">{billingSnapshot.statusLabel}</p>
                  <span
                    className={
                      outstandingBill
                        ? 'rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-800'
                        : patientClasses.badgeSuccess
                    }
                  >
                    {outstandingBill ? 'PENDING' : 'PAID'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-500">{billingSnapshot.summaryLabel}</p>

                <ul className="mt-2 space-y-1.5">
                  {bills.slice(0, 3).map((bill) => (
                    <li
                      key={bill.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-[#EADBCE] bg-[#FDFBF7] px-2.5 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-bold text-[#2B1810]">{bill.invoice_number}</p>
                        <p className="text-[10px] text-stone-500">{formatINR(bill.total_amount)}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${billingStatusBadgeClass(bill.status)}`}
                      >
                        {billLineStatusLabel(bill.status)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {doctorsAvailable > 0 ? (
            <div className={`${patientClasses.cardCompact} flex items-center gap-2.5`}>
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                <Users className="h-4 w-4" aria-hidden />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase text-stone-500">Doctors Available</p>
                <p className="text-sm font-bold text-[#2B1810]">{doctorsAvailable} OPD consultants</p>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

export default DashboardOverview;
