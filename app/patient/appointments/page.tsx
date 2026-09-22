'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { BookAppointmentModal } from '@/components/patient/BookAppointmentModal';
import { todayIsoDate } from '@/lib/hospital/smartq-wait';
import { readPatientPortalSession } from '@/lib/patient/portal-session';
import { createClient } from '@/lib/supabase/client';
import { CACHE_KEYS, readLocalJson, writeLocalJson } from '@/lib/persistence/local-cache';
import {
  cancelPatientAppointment,
  deduplicateAppointments,
  fetchMyPrivateAppointments,
  filterLocalAppointmentsForSession,
  resolveActivePatientSession,
  resolveAppointmentRecordKey,
  type MyAppointmentRecord,
} from '@/lib/patient/my-appointments';
import {
  Calendar,
  Clock,
  Download,
  FileText,
  Loader2,
  MapPin,
  Plus,
  RotateCw,
  Stethoscope,
  Ticket,
  User,
  XCircle,
} from 'lucide-react';

const cardClass = 'rounded-xl border border-[#EADBCE] bg-white p-5 shadow-xs';

function formatSlotTime(value: string): string {
  const raw = String(value ?? '').trim();
  if (!raw || raw === '—') return '—';
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return raw;
  const hours = Number(match[1]);
  const minutes = match[2];
  const period = hours >= 12 ? 'PM' : 'AM';
  const normalized = hours % 12 || 12;
  return `${normalized}:${minutes} ${period}`;
}

function formatDisplayDate(value: string): string {
  const raw = String(value ?? '').slice(0, 10);
  if (!raw) return '—';
  const date = new Date(`${raw}T12:00:00`);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function normalizeStatus(value?: string): string {
  return String(value ?? 'SCHEDULED').trim().toUpperCase().replace(/_/g, ' ');
}

function statusBadgeClass(status?: string): string {
  const value = normalizeStatus(status);
  if (value.includes('COMPLET') || value.includes('DONE')) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  }
  if (value.includes('CANCEL')) {
    return 'border-rose-200 bg-rose-50 text-rose-800';
  }
  if (value.includes('CONFIRM') || value.includes('SCHEDUL') || value.includes('BOOK')) {
    return 'border-sky-200 bg-sky-50 text-sky-800';
  }
  if (value.includes('WAIT') || value.includes('QUEUE')) {
    return 'border-amber-200 bg-amber-50 text-amber-900';
  }
  if (value.includes('CONSULT') || value.includes('IN PROGRESS')) {
    return 'border-violet-200 bg-violet-50 text-violet-800';
  }
  return 'border-[#EADBCE] bg-[#FAF6F0] text-[#6F4E37]';
}

function patientIndicator(appt: MyAppointmentRecord, accountHolderName: string): string {
  if (appt.is_self || appt.booking_for?.toUpperCase() === 'SELF') {
    return 'Self';
  }
  const relation = appt.beneficiary_relation || appt.booking_for || 'Dependent';
  return `${appt.patient_name} (${relation})`;
}

function tokenProgress(status?: string): number {
  const value = (status || 'WAITING').toUpperCase();
  if (value.includes('COMPLET') || value.includes('DONE')) return 100;
  if (value.includes('CONSULT') || value.includes('IN')) return 75;
  if (value.includes('READY') || value.includes('CALLED')) return 55;
  return 30;
}

function AppointmentCard({
  appt,
  variant,
  accountHolderName,
  onCancel,
  cancelling,
}: {
  appt: MyAppointmentRecord;
  variant: 'upcoming' | 'past';
  accountHolderName: string;
  onCancel: (id: string) => void;
  cancelling: boolean;
}) {
  const progress = tokenProgress(appt.queue_status);
  const tokenLabel =
    typeof appt.token_number === 'string' && appt.token_number.startsWith('T-')
      ? appt.token_number
      : `#${appt.token_number || '—'}`;
  const statusLabel = normalizeStatus(appt.status ?? appt.queue_status);
  const isCancelled = statusLabel.includes('CANCEL');
  const mapsQuery = encodeURIComponent(
    `${appt.hospital_name ?? 'Regal Hospital'} OPD Block Bengaluru`,
  );

  return (
    <article className={`${cardClass} space-y-3`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F3ECE4] pb-3">
        <span className="flex items-center gap-1.5 text-xs font-bold text-[#7C5C48]">
          <Ticket className="h-3.5 w-3.5 text-[#8C5A3C]" />
          Token {tokenLabel}
        </span>
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${statusBadgeClass(appt.status ?? appt.queue_status)}`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="inline-flex items-center gap-1.5 rounded-lg border border-[#EADBCE] bg-[#FAF6F0] px-2.5 py-1 text-[11px] font-semibold text-[#7C5C48]">
        <User className="h-3 w-3 text-[#8C5A3C]" />
        For: {patientIndicator(appt, accountHolderName)}
      </div>

      {variant === 'upcoming' && !isCancelled ? (
        <div>
          <div className="mb-1 flex justify-between text-[10px] font-semibold text-[#7C5C48]">
            <span>Queue progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#FAF6F0]">
            <div
              className="h-full rounded-full bg-[#8C5A3C] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : null}

      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#8C5A3C] text-xs font-bold text-white">
          {appt.doctor_name ? appt.doctor_name.replace(/^Dr\.?\s*/i, '').charAt(0) : 'D'}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-[#2B1810]">{appt.doctor_name}</h3>
          <p className="flex items-center gap-1 text-xs font-medium text-[#8C5A3C]">
            <Stethoscope className="h-3 w-3" />
            {appt.department}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs font-medium text-[#7C5C48]">
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5 text-[#8C5A3C]" />
          {formatDisplayDate(appt.appointment_date)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 text-[#8C5A3C]" />
          {formatSlotTime(appt.slot_time)}
        </span>
        {appt.fee ? (
          <span className="rounded-md bg-[#FAF6F0] px-2 py-0.5 text-[11px] font-bold text-[#2B1810]">
            {appt.fee}
          </span>
        ) : null}
      </div>

      {appt.reason ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
          <span className="font-bold">Reason:</span> {appt.reason}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2 border-t border-[#F3ECE4] pt-3">
        <Link
          href="/patient/prescriptions"
          className="inline-flex items-center gap-1 rounded-lg border border-[#EADBCE] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#7F5539] hover:bg-[#FAF6F0]"
        >
          <FileText className="h-3 w-3" />
          View Rx
        </Link>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-lg border border-[#EADBCE] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#7F5539] hover:bg-[#FAF6F0]"
        >
          <MapPin className="h-3 w-3" />
          Directions
        </a>
        {variant === 'past' ? (
          <Link
            href="/patient/billing"
            className="inline-flex items-center gap-1 rounded-lg border border-[#EADBCE] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#7F5539] hover:bg-[#FAF6F0]"
          >
            <Download className="h-3 w-3" />
            Receipt
          </Link>
        ) : null}
        {variant === 'upcoming' && !isCancelled ? (
          <button
            type="button"
            disabled={cancelling}
            onClick={() => onCancel(appt.id)}
            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
          >
            <XCircle className="h-3 w-3" />
            Cancel
          </button>
        ) : null}
      </div>
    </article>
  );
}

export default function MyAppointmentsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [appointments, setAppointments] = useState<MyAppointmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [authUserId, setAuthUserId] = useState('');
  const [bookingPatientId, setBookingPatientId] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [cancellingId, setCancellingId] = useState('');

  const fetchAppointments = useCallback(async () => {
    const session = resolveActivePatientSession();
    if (!session) {
      setAppointments([]);
      setLoading(false);
      router.replace('/patient/login');
      return;
    }

    setAccountHolderName(session.name);
    setLoading(true);

    try {
      const { appointments: scopedRows, context } = await fetchMyPrivateAppointments(
        supabase,
        session,
      );

      if (context?.authUserId) setAuthUserId(context.authUserId);
      if (context?.resolvedPatientId) {
        setBookingPatientId(context.resolvedPatientId);
      } else {
        setBookingPatientId(session.patientId);
      }

      const linkedPatientIds = context?.linkedPatientIds ?? [session.patientId];
      const familyMemberNames = context?.familyMemberNames ?? [];
      let combinedList = [...scopedRows];

      if (typeof window !== 'undefined') {
        const cached = readLocalJson<MyAppointmentRecord[]>(CACHE_KEYS.patientAppointments);
        let legacyList: unknown[] = [];
        try {
          const legacyCached = localStorage.getItem('curasync_appointments');
          if (legacyCached) {
            const parsed = JSON.parse(legacyCached) as unknown;
            legacyList = Array.isArray(parsed) ? parsed : [];
          }
        } catch {
          legacyList = [];
        }
        const localOnly = filterLocalAppointmentsForSession(
          [...(Array.isArray(cached) ? cached : []), ...legacyList],
          session,
          linkedPatientIds,
          familyMemberNames,
        );

        combinedList = deduplicateAppointments([...combinedList, ...localOnly]);
      } else {
        combinedList = deduplicateAppointments(combinedList);
      }

      setAppointments(combinedList);

      if (typeof window !== 'undefined' && combinedList.length > 0) {
        writeLocalJson(CACHE_KEYS.patientAppointments, combinedList);
        writeLocalJson(CACHE_KEYS.patientAppointmentsAlt, combinedList);
      }
    } catch (err) {
      console.warn('[patient/appointments] fetch error:', err);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [router, supabase]);

  const handleCancel = useCallback(
    async (appointmentId: string) => {
      setCancellingId(appointmentId);
      try {
        const result = await cancelPatientAppointment(supabase, appointmentId);
        if (!result.ok) {
          toast.error(result.error ?? 'Unable to cancel appointment');
          return;
        }
        toast.success('Appointment cancelled');
        await fetchAppointments();
      } catch (err) {
        console.warn('[patient/appointments] cancel error:', err);
        toast.error('Unable to cancel appointment');
      } finally {
        setCancellingId('');
      }
    },
    [fetchAppointments, supabase],
  );

  useEffect(() => {
    const session = resolveActivePatientSession();
    if (!session) {
      router.replace('/patient/login');
      return;
    }
    setSessionChecked(true);
    void fetchAppointments();
  }, [fetchAppointments, router]);

  useEffect(() => {
    if (!sessionChecked) return;

    const session = resolveActivePatientSession();
    if (!session) return;

    const channel = supabase
      .channel(`realtime_patient_appointments_${session.patientId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        () => {
          void fetchAppointments();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAppointments, sessionChecked, supabase]);

  const today = todayIsoDate();
  const { upcoming, past } = useMemo(() => {
    const up: MyAppointmentRecord[] = [];
    const hist: MyAppointmentRecord[] = [];
    for (const appt of appointments) {
      const cancelled = normalizeStatus(appt.status ?? appt.queue_status).includes('CANCEL');
      if (!cancelled && appt.appointment_date >= today) up.push(appt);
      else hist.push(appt);
    }
    return { upcoming: up, past: hist };
  }, [appointments, today]);

  if (!sessionChecked) {
    return (
      <div className="mx-auto flex h-64 max-w-7xl items-center justify-center rounded-xl border border-[#EADBCE] bg-white">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#7C5C48]">
          <Loader2 className="h-5 w-5 animate-spin text-[#8C5A3C]" />
          Verifying your secure session...
        </div>
      </div>
    );
  }

  const portalSession = readPatientPortalSession();

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 py-6 font-sans text-[#2B1810] md:px-8">
      <div className="flex flex-col gap-3 border-b border-[#EADBCE] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#2B1810]">My OPD Consultations</h1>
          <p className="mt-0.5 text-xs text-[#7C5C48]">
            Facility:{' '}
            <span className="font-semibold text-[#8C5A3C]">
              {portalSession?.hospital_name ?? 'HOSP-01 (Bengaluru)'}
            </span>
            {' · '}
            {appointments.length} consultation{appointments.length === 1 ? '' : 's'} on record
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void fetchAppointments()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#EADBCE] bg-white px-3 py-2 text-xs font-semibold text-[#7F5539] hover:bg-[#FAF6F0]"
          >
            <RotateCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setIsBookingModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#8C5A3C] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#6F4E37]"
          >
            <Plus className="h-3.5 w-3.5" />
            Book New OPD
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-[#EADBCE] bg-white">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#7C5C48]">
            <Loader2 className="h-5 w-5 animate-spin text-[#8C5A3C]" />
            Loading your OPD consultations...
          </div>
        </div>
      ) : appointments.length === 0 ? (
        <div className={`${cardClass} flex flex-col items-center py-10 text-center`}>
          <Calendar className="mb-3 h-10 w-10 text-[#EADBCE]" />
          <h3 className="text-sm font-bold text-[#2B1810]">No Booked Consultations Found</h3>
          <p className="mt-1 max-w-sm text-xs text-[#7C5C48]">
            Pick a clinician from the directory to generate a live SmartQ token.
          </p>
          <button
            type="button"
            onClick={() => setIsBookingModalOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#8C5A3C] px-4 py-2 text-xs font-bold text-white hover:bg-[#6F4E37]"
          >
            Book Consultation
          </button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-600">
              Upcoming Confirmed OPD
            </h2>
            {upcoming.length === 0 ? (
              <div className={`${cardClass} text-xs text-[#7C5C48]`}>
                No upcoming visits scheduled. Book an OPD slot to receive your live queue token.
              </div>
            ) : (
              upcoming.map((appt) => (
                <AppointmentCard
                  key={resolveAppointmentRecordKey(appt)}
                  appt={appt}
                  variant="upcoming"
                  accountHolderName={accountHolderName}
                  onCancel={handleCancel}
                  cancelling={cancellingId === appt.id}
                />
              ))
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-600">
              Historical Visits
            </h2>
            {past.length === 0 ? (
              <div className={`${cardClass} text-xs text-[#7C5C48]`}>
                Past consultations will appear here after your visit date passes.
              </div>
            ) : (
              past.map((appt) => (
                <AppointmentCard
                  key={resolveAppointmentRecordKey(appt)}
                  appt={appt}
                  variant="past"
                  accountHolderName={accountHolderName}
                  onCancel={handleCancel}
                  cancelling={cancellingId === appt.id}
                />
              ))
            )}
          </section>
        </div>
      )}

      <BookAppointmentModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        hospitalId={portalSession?.hospital_id}
        patientId={bookingPatientId || portalSession?.patient_id}
        userId={authUserId || portalSession?.patient_id}
        onBookingSuccess={() => void fetchAppointments()}
      />
    </div>
  );
}
