'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  subscribeConsultationBilling,
  type ConsultationBill,
} from '@/lib/hospital/operations/consultation-billing-sync';
import {
  billLineStatusLabel,
  billingStatusBadgeClass,
  buildBillingSnapshotFromBills,
  loadPatientBillingSnapshot,
  type PatientBillingSnapshot,
} from '@/lib/patient/patient-billing-status';
import {
  buildPatientScopeOrFilter,
  readPatientAuthSession,
  rowMatchesPatientSession,
  type PatientAuthSession,
} from '@/lib/auth/patientAuth';
import { portalSurfaces } from '@/lib/shared/portal-surfaces';
import {
  Activity,
  Calendar,
  Clock,
  Stethoscope,
  Building2,
  Ticket,
  PlusCircle,
  FileText,
  RotateCw,
  CheckCircle2,
  IndianRupee,
  Receipt,
  FlaskConical,
  ScanLine,
} from 'lucide-react';
import {
  loadPatientLabOrders,
  subscribeLabOrders,
  type LabOrderRow,
} from '@/lib/clinical/lab-orders-service';
import {
  loadPatientRadiologyOrders,
  subscribeRadiologyOrders,
  type RadiologyOrderRow,
} from '@/lib/clinical/radiology-orders-service';

interface ActiveTokenRecord {
  id: string;
  patient_id?: string;
  patient_name: string;
  doctor_name: string;
  department: string;
  hospital_name: string;
  appointment_date: string;
  slot_time: string;
  token_number: number;
  queue_status: string;
  fee?: string;
  reason?: string;
  created_at?: string;
}

import { formatINR } from '@/lib/utils/currency';
import { readPatientPortalSession } from '@/lib/patient/portal-session';
import { CACHE_KEYS, readLocalJson, writeLocalJson } from '@/lib/persistence/local-cache';
import { isDemoMode } from '@/lib/shared/demo-mode';
import { BookAppointmentModal } from '@/components/patient/BookAppointmentModal';

function billStatusClass(status: ConsultationBill['status']): string {
  return billingStatusBadgeClass(status);
}

function readCachedPatientAppointments(session: PatientAuthSession | null): ActiveTokenRecord[] {
  if (!session || !isDemoMode()) return [];
  const primary = readLocalJson<ActiveTokenRecord[]>(CACHE_KEYS.patientAppointments);
  const alt = readLocalJson<ActiveTokenRecord[]>(CACHE_KEYS.patientAppointmentsAlt);
  const rows = Array.isArray(primary) && primary.length > 0 ? primary : Array.isArray(alt) ? alt : [];
  return rows.filter((row) =>
    rowMatchesPatientSession(row as unknown as Record<string, unknown>, session),
  );
}

function mapAppointmentRow(row: Record<string, unknown>): ActiveTokenRecord {
  return {
    id: String(row.id ?? ''),
    patient_id: String(row.patient_id ?? row.uhid ?? ''),
    patient_name: String(row.patient_name ?? 'Patient'),
    doctor_name: String(row.doctor_name ?? 'Doctor'),
    department: String(row.department ?? 'OPD'),
    hospital_name: String(row.hospital_name ?? 'Regal Hospital'),
    appointment_date: String(row.appointment_date ?? row.created_at ?? ''),
    slot_time: String(row.slot_time ?? row.appointment_time ?? row.time_slot ?? row.created_at ?? ''),
    token_number: Number(row.token_number ?? 0),
    queue_status: String(row.queue_status ?? row.status ?? 'checked_in'),
    fee: row.fee != null ? String(row.fee) : undefined,
    reason: row.chief_complaint ? String(row.chief_complaint) : row.reason ? String(row.reason) : undefined,
    created_at: row.created_at ? String(row.created_at) : undefined,
  };
}

function isTodayVisit(row: ActiveTokenRecord): boolean {
  const today = new Date().toISOString().split('T')[0];
  const dateValue = String(row.appointment_date ?? row.created_at ?? '').slice(0, 10);
  return dateValue === today;
}

export default function PatientDashboard() {
  const router = useRouter();

  const [currentPatient, setCurrentPatient] = useState<PatientAuthSession | null>(() =>
    typeof window === 'undefined' ? null : readPatientAuthSession(),
  );
  const [activeToken, setActiveToken] = useState<ActiveTokenRecord | null>(null);
  const [patientName, setPatientName] = useState<string>(() => readPatientAuthSession()?.name ?? '');
  const [patientId, setPatientId] = useState<string>(() => readPatientAuthSession()?.patientId ?? '');
  const [loading, setLoading] = useState<boolean>(true);
  const [billingSnapshot, setBillingSnapshot] = useState<PatientBillingSnapshot>(() =>
    buildBillingSnapshotFromBills([]),
  );
  const [billsLoading, setBillsLoading] = useState(true);
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      title: string;
      message: string;
      created_at: string;
      type?: string;
      entity_id?: string | null;
    }>
  >([]);
  const [latestPrescription, setLatestPrescription] = useState<{
    id: string;
    doctor_name: string;
    diagnosis: string;
    created_at: string;
  } | null>(null);
  const [labOrders, setLabOrders] = useState<LabOrderRow[]>([]);
  const [radiologyOrders, setRadiologyOrders] = useState<RadiologyOrderRow[]>([]);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const fetchLatestPrescription = useCallback(async (session: PatientAuthSession) => {
    const scopeFilter = buildPatientScopeOrFilter(session);
    if (!scopeFilter) {
      setLatestPrescription(null);
      return;
    }

    const { data } = await supabase
      .from('prescriptions')
      .select('id, doctor_name, diagnosis, created_at, patient_id, patient_name')
      .or(scopeFilter)
      .order('created_at', { ascending: false })
      .limit(5);
    const row = (data ?? []).find((entry: Record<string, unknown>) =>
      rowMatchesPatientSession(entry, session),
    ) as Record<string, unknown> | undefined;
    if (!row) {
      setLatestPrescription(null);
      return;
    }
    setLatestPrescription({
      id: String(row.id ?? ''),
      doctor_name: String(row.doctor_name ?? 'Your doctor'),
      diagnosis: String(row.diagnosis ?? 'Digital prescription issued'),
      created_at: String(row.created_at ?? ''),
    });
  }, []);

  const fetchNotifications = useCallback(async (pid: string, uhid?: string) => {
    const filters = [`recipient_type.eq.patient`];
    if (pid) filters.push(`recipient_id.eq.${pid}`);
    if (uhid) filters.push(`recipient_id.eq.${uhid}`);
    const { data } = await supabase
      .from('system_notifications')
      .select('id, title, message, created_at, type, entity_id')
      .or(filters.join(','))
      .order('created_at', { ascending: false })
      .limit(8);
    setNotifications(
      (data ?? [])
        .map((row: Record<string, unknown>) => ({
          id: String(row.id ?? ''),
          title: String(row.title ?? 'Notification'),
          message: String(row.message ?? ''),
          created_at: String(row.created_at ?? ''),
          type: String(row.type ?? ''),
          entity_id: row.entity_id ? String(row.entity_id) : null,
        }))
        .filter((row: { type?: string }) => row.type !== 'prescription'),
    );
  }, []);

  const fetchDiagnostics = useCallback(async (pid: string) => {
    const [labs, radiology] = await Promise.all([
      loadPatientLabOrders(supabase, pid),
      loadPatientRadiologyOrders(supabase, pid),
    ]);
    setLabOrders(labs);
    setRadiologyOrders(radiology);
  }, []);

  const fetchBillingSnapshot = useCallback(async (pid: string, uhid?: string) => {
    setBillsLoading(true);
    try {
      const snapshot = await loadPatientBillingSnapshot(supabase, pid, uhid);
      setBillingSnapshot(snapshot);
    } finally {
      setBillsLoading(false);
    }
  }, []);

  const fetchActiveToken = useCallback(async () => {
    setLoading(true);
    let latestAppointment: ActiveTokenRecord | null = null;

    const session = readPatientAuthSession();
    if (!session) {
      router.replace('/patient/login');
      setLoading(false);
      return;
    }

    setCurrentPatient(session);
    setPatientName(session.name);
    setPatientId(session.patientId);

    const scopeFilter = buildPatientScopeOrFilter(session);
    if (!scopeFilter) {
      setActiveToken(null);
      setLoading(false);
      return;
    }

    const cachedMatches = readCachedPatientAppointments(session);
    if (cachedMatches.length > 0) {
      latestAppointment = cachedMatches.find(isTodayVisit) ?? cachedMatches[0] ?? null;
    }

    try {
      const { data, error } = await supabase
        .from('patient_appointments')
        .select('*')
        .or(scopeFilter)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data && data.length > 0) {
        const appointmentRows = data as Record<string, unknown>[];
        const scopedRows = appointmentRows
          .filter((row) => rowMatchesPatientSession(row, session))
          .map((row) => ({
            ...mapAppointmentRow(row),
            hospital_name: 'Regal Hospital',
          }));
        latestAppointment = scopedRows.find(isTodayVisit) ?? scopedRows[0] ?? null;
        if (scopedRows.length > 0) {
          writeLocalJson(CACHE_KEYS.patientAppointments, scopedRows);
          writeLocalJson(CACHE_KEYS.patientAppointmentsAlt, scopedRows);
        }
      }

      if (!latestAppointment) {
        const { data: apptRows } = await supabase
          .from('appointments')
          .select('*')
          .or(scopeFilter)
          .order('created_at', { ascending: false })
          .limit(10);

        if (apptRows && apptRows.length > 0) {
          const appointmentRows = apptRows as Record<string, unknown>[];
          const scopedRows = appointmentRows
            .filter((row) => rowMatchesPatientSession(row, session))
            .map((row) => mapAppointmentRow(row));
          latestAppointment = scopedRows.find(isTodayVisit) ?? scopedRows[0] ?? null;
        }
      }
    } catch {
      console.warn('Dashboard DB load fallback active');
    } finally {
      setActiveToken(latestAppointment);
      if (latestAppointment) {
        writeLocalJson(CACHE_KEYS.patientAppointments, [latestAppointment]);
        writeLocalJson(CACHE_KEYS.patientAppointmentsAlt, [latestAppointment]);
      }
      const resolvedPatientId = session.patientId;
      void fetchBillingSnapshot(resolvedPatientId, session.uhid);
      void fetchDiagnostics(resolvedPatientId);
      void fetchLatestPrescription(session);
      void fetchNotifications(resolvedPatientId, session.uhid);
      setLoading(false);
    }
  }, [fetchBillingSnapshot, fetchDiagnostics, fetchLatestPrescription, fetchNotifications, router]);

  useEffect(() => {
    const session = readPatientAuthSession();
    if (!session) {
      router.replace('/patient/login');
      return;
    }
    setCurrentPatient(session);
    setPatientName(session.name);
    setPatientId(session.patientId);

    void fetchActiveToken();

    const queueChannel = supabase
      .channel('realtime_patient_dashboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patient_appointments' },
        () => {
          void fetchActiveToken();
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        () => {
          void fetchActiveToken();
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'prescriptions' },
        () => {
          const liveSession = readPatientAuthSession();
          if (liveSession) void fetchLatestPrescription(liveSession);
        },
      )
      .subscribe();

    const unsubscribeBilling = subscribeConsultationBilling(supabase, () => {
      void fetchBillingSnapshot(patientId);
    });
    const unsubscribeLabs = subscribeLabOrders(supabase, patientId, () => {
      void fetchDiagnostics(patientId);
    });
    const unsubscribeRadiology = subscribeRadiologyOrders(supabase, patientId, () => {
      void fetchDiagnostics(patientId);
    });

    const notifyChannel = supabase
      .channel('patient-system-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'system_notifications' },
        () => {
          void fetchNotifications(patientId);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(queueChannel);
      supabase.removeChannel(notifyChannel);
      unsubscribeBilling();
      unsubscribeLabs();
      unsubscribeRadiology();
    };
  }, [fetchActiveToken, fetchBillingSnapshot, fetchDiagnostics, fetchNotifications, patientId, router]);

  const bills = billingSnapshot.bills;
  const outstandingBill = bills.find((bill) => bill.status !== 'paid');
  const { summaryLabel, statusLabel, hasBills, totalOutstanding } = billingSnapshot;
  const patientSurface = portalSurfaces.patient;
  const billingIsNeutral = !hasBills && !outstandingBill;
  const queueStatusTone =
    activeToken?.queue_status?.toUpperCase().includes('IN') ||
    activeToken?.queue_status?.toUpperCase().includes('CONSULT')
      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
      : activeToken?.queue_status?.toUpperCase().includes('WAIT')
        ? 'bg-amber-50 text-amber-950 border-amber-200'
        : 'bg-[#EAF5F2] text-[#113831] border-[#D5E8E3]';

  return (
    <div className={`max-w-5xl mx-auto space-y-6 font-sans text-[#0E2924] ${patientSurface.page} p-1 rounded-3xl`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#D5E8E3] pb-5">
        <div>
          <span className="flex items-center gap-1.5 text-[11px] font-black text-[#227B6B] uppercase tracking-wider">
            <CheckCircle2 className="h-3.5 w-3.5" /> Verified Patient Session
          </span>
          <h1 className="text-3xl font-black text-[#0E2924] mt-1 tracking-tight">
            Welcome, {currentPatient?.name || patientName}
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-600 flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-[#227B6B]" /> Regal Hospital · Patient Portal
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => void fetchActiveToken()}
            className="flex items-center gap-2 rounded-2xl border border-[#D5E8E3] bg-white px-4 py-3 text-xs font-black text-[#113831] hover:bg-[#EAF5F2] hover:border-[#227B6B]/30 transition shadow-sm"
          >
            <RotateCw className="h-4 w-4 text-[#227B6B]" /> Refresh Status
          </button>

          <button
            onClick={() => setIsBookingModalOpen(true)}
            className="flex items-center gap-2 rounded-2xl bg-[#113831] px-5 py-3 text-xs font-black text-white hover:bg-[#227B6B] hover:shadow-lg transition shadow-md"
          >
            <PlusCircle className="h-4 w-4 text-[#A6E2D8]" /> Book Consultation
          </button>
        </div>
      </div>

      {/* Primary focus: today's visit / queue status */}
      <section className="space-y-3">
        <h2 className="text-[11px] font-black uppercase tracking-wider text-[#227B6B] flex items-center gap-2">
          <Ticket className="h-4 w-4" /> 1. Today&apos;s Visit
        </h2>

        {loading ? (
          <div className="rounded-3xl border border-[#D5E8E3] bg-white p-8 shadow-sm animate-pulse space-y-4">
            <div className="h-5 w-40 rounded-lg bg-[#EAF5F2]" />
            <div className="h-8 w-64 rounded-lg bg-[#EAF5F2]" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="h-16 rounded-2xl bg-[#F4F8F7]" />
              <div className="h-16 rounded-2xl bg-[#F4F8F7]" />
            </div>
          </div>
        ) : !activeToken ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#D5E8E3] bg-white p-10 text-center space-y-4 shadow-sm">
            <Ticket className="h-10 w-10 text-[#227B6B]/40" />
            <div>
              <h3 className="text-lg font-black text-[#0E2924]">No active visits scheduled today</h3>
              <p className="text-sm font-semibold text-slate-500 max-w-sm mt-1">
                No active visits scheduled today. Click &apos;Book Consultation&apos; to get started.
              </p>
            </div>
            <button
              onClick={() => setIsBookingModalOpen(true)}
              className="rounded-2xl bg-[#113831] px-6 py-3 text-xs font-black text-white shadow-md hover:bg-[#227B6B] hover:shadow-lg transition"
            >
              Book OPD Slot Now
            </button>
          </div>
        ) : (
          <div className="rounded-3xl border-2 border-[#227B6B]/25 bg-white p-6 sm:p-8 shadow-md space-y-5 hover:border-[#227B6B]/40 transition">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAF5F2] pb-4">
              <div className="flex items-center gap-2 text-[#113831]">
                <Ticket className="h-5 w-5 text-[#227B6B]" />
                <span className="text-sm font-black text-[#0E2924]">
                  SmartQ Token{' '}
                  <span className="text-2xl font-black text-[#227B6B]">
                    #{activeToken.token_number || 1}
                  </span>
                </span>
              </div>
              <span
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[11px] font-black uppercase border ${queueStatusTone}`}
              >
                <Activity className="h-3.5 w-3.5" />
                {activeToken.queue_status || 'WAITING'}
              </span>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#113831] text-white font-black text-lg shrink-0 shadow-sm">
                {activeToken.doctor_name ? activeToken.doctor_name.replace('Dr. ', '').charAt(0) : 'D'}
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-[#0E2924]">{activeToken.doctor_name}</h3>
                <p className="text-sm font-bold text-[#227B6B] flex items-center gap-1.5">
                  <Stethoscope className="h-4 w-4" /> {activeToken.department} OPD
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-1 text-sm font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-[#227B6B]" /> {activeToken.appointment_date}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-[#227B6B]" /> {activeToken.slot_time}
                  </span>
                </div>
              </div>
            </div>

            {activeToken.reason && (
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 text-sm font-semibold text-amber-950">
                <span className="text-[10px] uppercase text-amber-800 font-black flex items-center gap-1 mb-1">
                  <FileText className="h-3 w-3" /> Consultation reason
                </span>
                <p>{activeToken.reason}</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Secondary strip: billing at a glance — de-emphasized when neutral */}
      <section
        className={`rounded-2xl border p-4 sm:p-5 shadow-sm transition ${
          billingIsNeutral
            ? 'border-slate-200 bg-slate-50/80'
            : outstandingBill
              ? 'border-rose-200 bg-rose-50/60'
              : `${patientSurface.card}`
        }`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <span
              className={`text-[10px] uppercase font-black flex items-center gap-1 ${
                billingIsNeutral ? 'text-slate-500' : 'text-[#227B6B]'
              }`}
            >
              <IndianRupee className="h-3.5 w-3.5" /> 2. Billing at a glance
            </span>
            <p
              className={`text-base font-black ${
                billingIsNeutral ? 'text-slate-600' : outstandingBill ? 'text-rose-900' : 'text-[#113831]'
              }`}
            >
              {statusLabel}
            </p>
            <p className={`text-xs font-semibold ${billingIsNeutral ? 'text-slate-500' : 'text-slate-700'}`}>
              {summaryLabel}
              {totalOutstanding > 0 ? ` · ${formatINR(totalOutstanding)} outstanding` : ''}
            </p>
          </div>
          {!billingIsNeutral && (
            <span
              className={`self-start rounded-full border px-3 py-1 text-[10px] font-black uppercase ${
                outstandingBill
                  ? 'bg-rose-100 text-rose-900 border-rose-300'
                  : 'bg-emerald-100 text-emerald-900 border-emerald-300'
              }`}
            >
              {outstandingBill ? 'Payment due' : 'Up to date'}
            </span>
          )}
        </div>
      </section>

      {notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.slice(0, 3).map((note) => (
            <div
              key={note.id}
              className="rounded-2xl border border-cyan-200 bg-cyan-50/80 p-4 text-left shadow-sm"
            >
              <p className="text-xs font-black uppercase tracking-wide text-cyan-800">{note.title}</p>
              <p className="mt-1 text-sm font-semibold text-[#0E2924]">{note.message}</p>
            </div>
          ))}
        </div>
      )}

      {latestPrescription && (
        <button
          type="button"
          onClick={() => router.push('/patient/prescriptions')}
          className="w-full rounded-3xl border border-emerald-200 bg-emerald-50/80 p-5 text-left shadow-sm"
        >
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
            New digital prescription
          </span>
          <p className="mt-1 text-sm font-black text-[#0E2924]">
            {latestPrescription.doctor_name} issued your prescription
          </p>
          <p className="mt-0.5 text-xs font-bold text-[#227B6B]">{latestPrescription.diagnosis}</p>
        </button>
      )}

      <div className="space-y-3">
        <h2 className="text-[11px] font-black uppercase tracking-wider text-[#227B6B] flex items-center gap-2">
          <Receipt className="h-4 w-4" /> 3. Post-Consultation Bills · Live
        </h2>

        {billsLoading ? (
          <div className="rounded-3xl border border-[#D5E8E3] bg-white p-8 shadow-sm animate-pulse space-y-3">
            <div className="h-4 w-48 rounded bg-[#EAF5F2]" />
            <div className="h-20 rounded-2xl bg-[#F4F8F7]" />
            <div className="h-20 rounded-2xl bg-[#F4F8F7]" />
          </div>
        ) : !hasBills ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center space-y-2">
            <IndianRupee className="h-7 w-7 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-600">No bills yet</p>
            <p className="text-xs font-semibold text-slate-500 max-w-md mx-auto">
              Invoices appear here after your consultation is completed — nothing you need to do right now.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {outstandingBill && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs font-bold text-rose-900">
                <span className="font-black uppercase tracking-wide text-[10px] block mb-1">
                  Action required
                </span>
                Proceed to the Regal Hospital cashier with invoice{' '}
                <strong>{outstandingBill.invoice_number}</strong> · Balance{' '}
                {formatINR(Math.max(outstandingBill.total_amount - outstandingBill.paid_amount, 0))}
              </div>
            )}

            {bills.map((bill) => {
              const balance = Math.max(bill.total_amount - bill.paid_amount, 0);
              return (
                <div
                  key={bill.id}
                  className="rounded-3xl border border-[#D5E8E3] bg-white p-5 shadow-sm space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-[#0E2924]">{bill.invoice_number}</p>
                      <p className="text-xs font-bold text-[#227B6B]">
                        {bill.doctor_name ? `Dr. ${bill.doctor_name.replace(/^Dr\.\s*/i, '')}` : 'OPD Visit'}
                      </p>
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${billStatusClass(bill.status)}`}
                    >
                      {billLineStatusLabel(bill.status)}
                    </span>
                  </div>

                  <ul className="space-y-1 border-t border-[#EAF5F2] pt-3">
                    {bill.lines.map((line, index) => (
                      <li
                        key={`${bill.id}-line-${index}`}
                        className="flex items-center justify-between text-xs font-bold text-slate-600"
                      >
                        <span>{line.item}</span>
                        <span className="tabular-nums text-[#0E2924]">{formatINR(line.amount)}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#EAF5F2] pt-3 text-xs font-black">
                    <span className="text-[#0E2924]">Total {formatINR(bill.total_amount)}</span>
                    <span className="text-emerald-700">Paid {formatINR(bill.paid_amount)}</span>
                    {balance > 0 && <span className="text-rose-700">Due {formatINR(balance)}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {(labOrders.length > 0 || radiologyOrders.length > 0) && (
        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-[#227B6B] flex items-center gap-2">
            <FlaskConical className="h-4 w-4" /> Lab & Radiology · Live
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {labOrders.slice(0, 4).map((order) => (
              <div
                key={order.id}
                className={`rounded-2xl border p-4 shadow-sm ${patientSurface.card}`}
              >
                <p className="text-[10px] font-black uppercase text-cyan-800 flex items-center gap-1">
                  <FlaskConical className="h-3.5 w-3.5" /> Lab
                </p>
                <p className="mt-1 text-sm font-black text-[#0E2924]">{order.test_name}</p>
                <p className="mt-1 text-xs font-bold text-slate-600">{order.status}</p>
                {order.result_summary ? (
                  <p className="mt-2 text-xs font-semibold text-emerald-800">{order.result_summary}</p>
                ) : null}
              </div>
            ))}
            {radiologyOrders.slice(0, 4).map((order) => (
              <div
                key={order.id}
                className={`rounded-2xl border p-4 shadow-sm ${patientSurface.card}`}
              >
                <p className="text-[10px] font-black uppercase text-indigo-800 flex items-center gap-1">
                  <ScanLine className="h-3.5 w-3.5" /> Radiology
                </p>
                <p className="mt-1 text-sm font-black text-[#0E2924]">{order.study_name}</p>
                <p className="mt-1 text-xs font-bold text-slate-600">{order.status}</p>
                {order.report_summary ? (
                  <p className="mt-2 text-xs font-semibold text-emerald-800">{order.report_summary}</p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}

      <BookAppointmentModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        hospitalId={readPatientPortalSession()?.hospital_id}
        patientId={patientId}
        onBookingSuccess={() => void fetchActiveToken()}
      />
    </div>
  );
}
