'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
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
  CheckCircle2,
} from 'lucide-react';

interface AppointmentRecord {
  id: string;
  patient_name: string;
  doctor_name: string;
  department: string;
  hospital_name: string;
  appointment_date: string;
  slot_time: string;
  fee?: string;
  reason?: string;
  token_number: number;
  queue_status: string;
  created_at?: string;
}

export default function MyAppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    let list: AppointmentRecord[] = [];

    // 1. Read from Local Storage (Primary Instant Source)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('curasync_appointments');
      if (saved) {
        try {
          list = JSON.parse(saved);
        } catch (e) {}
      }
    }

    // 2. Fetch from Supabase Database
    try {
      const { data, error } = await supabase
        .from('patient_appointments')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        list = data;
        if (typeof window !== 'undefined') {
          localStorage.setItem('curasync_appointments', JSON.stringify(data));
        }
      }
    } catch (err) {
      console.warn('DB load notice, using local cache');
    } finally {
      setAppointments(list);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 font-sans text-[#0E2924]">
      {/* HEADER BAR */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#D5E8E3] pb-4">
        <div>
          <h1 className="text-2xl font-black text-[#0E2924]">My OPD Consultations</h1>
          <p className="text-xs font-bold text-[#227B6B]">
            Showing {appointments.length} active OPD booking details and live SmartQ tokens.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAppointments}
            className="flex items-center gap-2 rounded-2xl border border-[#D5E8E3] bg-white px-4 py-3 text-xs font-black text-[#113831] hover:bg-[#EAF5F2] transition shadow-sm"
          >
            <RotateCw className="h-4 w-4 text-[#227B6B]" /> Refresh
          </button>

          <button
            onClick={() => router.push('/patient/doctors')}
            className="flex items-center gap-2 rounded-2xl bg-[#113831] px-5 py-3 text-xs font-black text-white hover:bg-[#227B6B] transition shadow-md"
          >
            <Plus className="h-4 w-4 text-[#A6E2D8]" /> Book New OPD
          </button>
        </div>
      </div>

      {/* APPOINTMENTS CARDS GRID */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-3xl bg-white border border-[#D5E8E3]">
          <div className="flex items-center gap-2 text-xs font-black text-[#113831]">
            <Loader2 className="h-5 w-5 animate-spin text-[#227B6B]" />
            Loading your appointment history...
          </div>
        </div>
      ) : appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#D5E8E3] bg-white p-12 text-center space-y-4">
          <Calendar className="h-12 w-12 text-[#227B6B]/40" />
          <h3 className="text-base font-black text-[#0E2924]">No Booked Consultations Found</h3>
          <p className="text-xs font-bold text-slate-500 max-w-sm">
            You haven't scheduled any OPD consultations yet. Pick a consultant from the doctor directory to book a token.
          </p>
          <button
            onClick={() => router.push('/patient/doctors')}
            className="flex items-center gap-2 rounded-2xl bg-[#113831] px-6 py-3.5 text-xs font-black text-white shadow-md hover:bg-[#227B6B] transition"
          >
            Browse Doctor Directory
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {appointments.map((appt) => (
            <div
              key={appt.id || appt.created_at}
              className="rounded-3xl border border-[#D5E8E3] bg-white p-6 shadow-sm space-y-5 hover:border-[#113831] transition"
            >
              {/* TOP TOKEN & STATUS BADGE */}
              <div className="flex items-center justify-between border-b border-[#EAF5F2] pb-3">
                <div className="flex items-center gap-2 text-[#113831]">
                  <Ticket className="h-4 w-4 text-[#227B6B]" />
                  <span className="text-xs font-black">
                    SmartQ Token: <span className="text-sm font-black text-[#227B6B]">#{appt.token_number || 1}</span>
                  </span>
                </div>

                <span className="flex items-center gap-1 rounded-full bg-[#EAF5F2] px-3 py-1 text-[10px] font-black text-[#113831] border border-[#227B6B]/20 uppercase">
                  <CheckCircle2 className="h-3 w-3 text-[#227B6B]" /> {appt.queue_status || 'SCHEDULED'}
                </span>
              </div>

              {/* CLINICIAN & PATIENT DETAILS */}
              <div className="space-y-3">
                {/* DOCTOR NAME */}
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#113831] text-white font-black text-sm shrink-0">
                    {appt.doctor_name ? appt.doctor_name.replace('Dr. ', '').charAt(0) : 'D'}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#0E2924]">
                      {appt.doctor_name || 'Dr. Suriraju V'}
                    </h3>
                    <p className="text-xs font-bold text-[#227B6B] flex items-center gap-1">
                      <Stethoscope className="h-3.5 w-3.5" /> {appt.department || 'General Medicine'}
                    </p>
                  </div>
                </div>

                {/* PATIENT NAME & FACILITY */}
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold bg-[#F4F8F7] p-3 rounded-2xl border border-[#D5E8E3]">
                  <div>
                    <span className="text-[10px] uppercase text-[#227B6B] font-black block">Patient Name</span>
                    <span className="font-bold text-[#0E2924] flex items-center gap-1">
                      <User className="h-3 w-3 text-[#227B6B]" /> {appt.patient_name || 'Aishwarya D S'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-[#227B6B] font-black block">Facility</span>
                    <span className="font-bold text-[#0E2924] flex items-center gap-1">
                      <Building2 className="h-3 w-3 text-[#227B6B]" /> {appt.hospital_name || 'Regal Hospital'}
                    </span>
                  </div>
                </div>

                {/* REASON FOR VISIT (IF PROVIDED) */}
                {appt.reason && (
                  <div className="text-xs bg-amber-50/60 p-3 rounded-2xl border border-amber-200/60">
                    <span className="text-[10px] uppercase text-amber-800 font-black flex items-center gap-1 mb-0.5">
                      <FileText className="h-3 w-3" /> Reason for Visit
                    </span>
                    <p className="font-bold text-amber-950">{appt.reason}</p>
                  </div>
                )}
              </div>

              {/* DATE, TIME & FEE FOOTER */}
              <div className="flex items-center justify-between border-t border-[#EAF5F2] pt-4 text-xs font-bold">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-[#0E2924]">
                    <Calendar className="h-3.5 w-3.5 text-[#227B6B]" /> {appt.appointment_date}
                  </span>
                  <span className="flex items-center gap-1 text-[#0E2924]">
                    <Clock className="h-3.5 w-3.5 text-[#227B6B]" /> {appt.slot_time}
                  </span>
                </div>

                {appt.fee && (
                  <span className="rounded-xl bg-[#113831] px-3 py-1.5 text-xs font-black text-white">
                    {appt.fee}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}