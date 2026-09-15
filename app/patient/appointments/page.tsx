'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  User,
  Stethoscope,
  Building2,
  Ticket,
  Plus,
  RotateCw,
  FileText,
  Loader2,
  Activity,
} from 'lucide-react';

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

  if (!sessionChecked) {
    return (
      <div className="flex h-64 items-center justify-center rounded-3xl bg-white border border-[#D5E8E3]">
        <div className="flex items-center gap-2 text-xs font-black text-[#113831]">
          <Loader2 className="h-5 w-5 animate-spin text-[#227B6B]" />
          Verifying your secure session...
        </div>
      </div>
    );
  }

  const portalSession = readPatientPortalSession();

  return (
    <div className="max-w-6xl mx-auto space-y-8 font-sans text-[#0E2924]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#D5E8E3] pb-4">
        <div>
          <h1 className="text-2xl font-black text-[#0E2924]">My OPD Consultations</h1>
          <p className="text-xs font-bold text-[#227B6B]">
            Showing {appointments.length} private consultation
            {appointments.length === 1 ? '' : 's'} for your verified account only.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => void fetchAppointments()}
            className="flex items-center gap-2 rounded-2xl border border-[#D5E8E3] bg-white px-4 py-3 text-xs font-black text-[#113831] hover:bg-[#EAF5F2] transition shadow-sm"
          >
            <RotateCw className="h-4 w-4 text-[#227B6B]" /> Refresh
          </button>

          <button
            onClick={() => setIsBookingModalOpen(true)}
            className="flex items-center gap-2 rounded-2xl bg-[#113831] px-5 py-3 text-xs font-black text-white hover:bg-[#227B6B] transition shadow-md"
          >
            <Plus className="h-4 w-4 text-[#A6E2D8]" /> Book New OPD
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-3xl bg-white border border-[#D5E8E3]">
          <div className="flex items-center gap-2 text-xs font-black text-[#113831]">
            <Loader2 className="h-5 w-5 animate-spin text-[#227B6B]" />
            Loading your private consultations...
          </div>
        </div>
      ) : appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#D5E8E3] bg-white p-12 text-center space-y-4 shadow-sm">
          <Calendar className="h-12 w-12 text-[#227B6B]/40" />
          <h3 className="text-base font-black text-[#0E2924]">No Booked Consultations Found</h3>
          <p className="text-xs font-bold text-slate-500 max-w-sm">
            You haven&apos;t scheduled any OPD appointments yet. Pick a clinician from the directory to generate a live SmartQ token.
          </p>
          <button
            onClick={() => setIsBookingModalOpen(true)}
            className="flex items-center gap-2 rounded-2xl bg-[#113831] px-6 py-3.5 text-xs font-black text-white shadow-md hover:bg-[#227B6B] transition"
          >
            Book Consultation
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {appointments.map((appt) => (
            <div
              key={resolveAppointmentRecordKey(appt)}
              className="rounded-3xl border border-[#D5E8E3] bg-white p-6 shadow-sm space-y-5 hover:border-[#113831] transition flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#EAF5F2] pb-3">
                  <div className="flex items-center gap-2 text-[#113831]">
                    <Ticket className="h-4 w-4 text-[#227B6B]" />
                    <span className="text-xs font-black">
                      SmartQ Token:{' '}
                      <span className="text-sm font-black text-[#227B6B]">
                        {typeof appt.token_number === 'string' && appt.token_number.startsWith('T-')
                          ? appt.token_number
                          : `#${appt.token_number || '—'}`}
                      </span>
                    </span>
                  </div>

                  <span className="flex items-center gap-1 rounded-full bg-[#EAF5F2] px-3 py-1 text-[10px] font-black text-[#113831] border border-[#227B6B]/20 uppercase">
                    <Activity className="h-3 w-3 text-[#227B6B]" /> {appt.queue_status || 'WAITING'}
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#113831] text-white font-black text-sm shrink-0 shadow-sm">
                    {appt.doctor_name ? appt.doctor_name.replace('Dr. ', '').charAt(0) : 'D'}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#0E2924]">{appt.doctor_name}</h3>
                    <p className="text-xs font-bold text-[#227B6B] flex items-center gap-1">
                      <Stethoscope className="h-3.5 w-3.5" /> {appt.department} OPD
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-semibold bg-[#F4F8F7] p-3.5 rounded-2xl border border-[#D5E8E3]">
                  <div>
                    <span className="text-[10px] uppercase text-[#227B6B] font-black block">PATIENT NAME</span>
                    <span className="font-bold text-[#0E2924] flex items-center gap-1 truncate">
                      <User className="h-3 w-3 text-[#227B6B] shrink-0" /> {appt.patient_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-[#227B6B] font-black block">FACILITY</span>
                    <span className="font-bold text-[#0E2924] flex items-center gap-1 truncate">
                      <Building2 className="h-3 w-3 text-[#227B6B] shrink-0" />{' '}
                      {appt.hospital_name || 'Regal Hospital'}
                    </span>
                  </div>
                </div>

                {appt.reason ? (
                  <div className="text-xs bg-amber-50/70 p-3 rounded-2xl border border-amber-200/70">
                    <span className="text-[10px] uppercase text-amber-800 font-black flex items-center gap-1 mb-0.5">
                      <FileText className="h-3 w-3" /> Reason for Visit
                    </span>
                    <p className="font-bold text-amber-950">{appt.reason}</p>
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-between border-t border-[#EAF5F2] pt-4 text-xs font-bold">
                <div className="flex items-center gap-3 text-[#0E2924]">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-[#227B6B]" /> {appt.appointment_date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-[#227B6B]" /> {appt.slot_time}
                  </span>
                </div>

                {appt.fee ? (
                  <span className="rounded-xl bg-[#113831] px-3 py-1.5 text-xs font-black text-white shadow-sm">
                    {appt.fee}
                  </span>
                ) : null}
              </div>
            </div>
          ))}
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
