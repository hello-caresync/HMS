'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { BookAppointmentModal } from '@/components/patient/BookAppointmentModal';
import { readPatientPortalSession } from '@/lib/patient/portal-session';
import { getActivePatientId } from '@/lib/patient/active-patient-node';
import { CACHE_KEYS, readLocalJson, writeLocalJson } from '@/lib/persistence/local-cache';
import {
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
  Plus,
  RotateCw,
  Stethoscope,
  Ticket,
  Activity,
} from 'lucide-react';

const cardClass = 'rounded-xl border border-[#EADBCE] bg-white p-5 shadow-xs';

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
}: {
  appt: MyAppointmentRecord;
  variant: 'upcoming' | 'past';
}) {
  const progress = tokenProgress(appt.queue_status);
  const tokenLabel =
    typeof appt.token_number === 'string' && appt.token_number.startsWith('T-')
      ? appt.token_number
      : `#${appt.token_number || '—'}`;

  return (
    <article className={`${cardClass} space-y-3`}>
      <div className="flex items-center justify-between gap-2 border-b border-[#F3ECE4] pb-3">
        <span className="flex items-center gap-1.5 text-xs font-bold text-[#7C5C48]">
          <Ticket className="h-3.5 w-3.5 text-[#8C5A3C]" />
          Token {tokenLabel}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-[#EADBCE] bg-[#FAF6F0] px-2 py-0.5 text-[10px] font-bold uppercase text-[#6F4E37]">
          <Activity className="h-3 w-3" />
          {appt.queue_status || 'WAITING'}
        </span>
      </div>

      {variant === 'upcoming' ? (
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
          <p className="mt-1 text-[10px] text-[#7C5C48]">Consultation Room · OPD Block A</p>
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
            {appt.department} OPD
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs font-medium text-[#7C5C48]">
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5 text-[#8C5A3C]" />
          {appt.appointment_date}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 text-[#8C5A3C]" />
          {appt.slot_time}
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

      {variant === 'past' ? (
        <div className="flex flex-wrap gap-2 border-t border-[#F3ECE4] pt-3">
          <Link
            href="/patient/prescriptions"
            className="inline-flex items-center gap-1 rounded-lg border border-[#EADBCE] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#7F5539] hover:bg-[#FAF6F0]"
          >
            <FileText className="h-3 w-3" />
            View Rx
          </Link>
          <Link
            href="/patient/billing"
            className="inline-flex items-center gap-1 rounded-lg border border-[#EADBCE] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#7F5539] hover:bg-[#FAF6F0]"
          >
            <Download className="h-3 w-3" />
            Download Receipt
          </Link>
        </div>
      ) : null}
    </article>
  );
}

export default function MyAppointmentsPage() {
  const router = useRouter();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [appointments, setAppointments] = useState<MyAppointmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);

  const fetchAppointments = useCallback(async () => {
    const session = resolveActivePatientSession();
    if (!session) {
      setAppointments([]);
      setLoading(false);
      router.replace('/patient/login');
      return;
    }

    setLoading(true);

    try {
      const { appointments: scopedRows } = await fetchMyPrivateAppointments(supabase, session);
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
      console.warn('Private appointments fetch notice:', err);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

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
      .channel(`realtime_private_patient_appointments_${session.patientId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patient_appointments' },
        () => {
          void fetchAppointments();
        },
      )
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
  }, [fetchAppointments, sessionChecked]);

  const today = new Date().toISOString().split('T')[0];
  const { upcoming, past } = useMemo(() => {
    const up: MyAppointmentRecord[] = [];
    const hist: MyAppointmentRecord[] = [];
    for (const appt of appointments) {
      if (appt.appointment_date >= today) up.push(appt);
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
            <span className="font-semibold text-[#8C5A3C]">HOSP-01 (Bengaluru)</span>
            {' · '}
            {appointments.length} private consultation{appointments.length === 1 ? '' : 's'} on record
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
            Loading your private consultations...
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
        patientId={getActivePatientId() || portalSession?.patient_id}
        onBookingSuccess={() => void fetchAppointments()}
      />
    </div>
  );
}
