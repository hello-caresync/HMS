'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  Calendar,
  Activity,
  PlusCircle,
  CheckCircle2,
  RefreshCw,
  Building2,
} from 'lucide-react';

interface PatientAppointment {
  id: string;
  patient_id?: string;
  patient_name: string;
  doctor_name: string;
  department: string;
  hospital_name?: string;
  slot_time: string;
  token_number: number;
  appointment_date: string;
  queue_status?: string;
}

export default function PatientAppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    let list: PatientAppointment[] = [];

    // 1. Check Local Cache First
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('curasync_appointments');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            list = parsed;
          }
        } catch (e) {
          console.warn('Local storage parse notice');
        }
      }
    }

    // 2. Query Supabase (Specify exact existing columns to avoid schema mismatch)
    try {
      const { data, error } = await supabase
        .from('patient_appointments')
        .select('id, patient_id, patient_name, doctor_name, department, hospital_name, slot_time, token_number, appointment_date, queue_status')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase query notice:', error.message);
      } else if (data && data.length > 0) {
        list = data as unknown as PatientAppointment[];
        if (typeof window !== 'undefined') {
          localStorage.setItem('curasync_appointments', JSON.stringify(data));
        }
      }
    } catch (err: any) {
      console.warn('Backend sync fallback active:', err?.message || err);
    } finally {
      setAppointments(list);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();

    const channel = supabase
      .channel('realtime_patient_appointments_page')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patient_appointments' },
        () => {
          fetchAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAppointments]);

  return (
    <div className="space-y-8 font-sans text-[#0E2924]">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#D5E8E3] pb-4">
        <div>
          <h1 className="text-2xl font-black text-[#0E2924]">Your Scheduled Appointments</h1>
          <p className="text-xs font-bold text-[#227B6B]">
            Live status sync with your assigned doctor via Supabase Realtime.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAppointments}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#D5E8E3] bg-white text-[#227B6B] hover:bg-[#EAF5F2] transition shadow-sm"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          <button
            onClick={() => router.push('/patient/appointments/book')}
            className="flex items-center gap-2 rounded-2xl bg-[#113831] px-5 py-3 text-xs font-black text-white shadow-md hover:bg-[#227B6B] transition"
          >
            <PlusCircle className="h-4 w-4 text-[#A6E2D8]" /> Book New Appointment
          </button>
        </div>
      </div>

      {/* APPOINTMENTS LIST GRID */}
      {loading ? (
        <div className="rounded-3xl border border-[#D5E8E3] bg-white p-12 text-center text-xs font-bold text-[#227B6B]">
          Fetching active appointments and tokens...
        </div>
      ) : appointments.length === 0 ? (
        <div className="rounded-3xl border border-[#D5E8E3] bg-white p-12 text-center space-y-4 shadow-sm">
          <Calendar className="mx-auto h-12 w-12 text-[#227B6B]" />
          <h3 className="text-lg font-black text-[#0E2924]">No Booked Appointments Found</h3>
          <p className="text-xs font-bold text-[#227B6B]">
            Book a consultation to generate your live OPD SmartQ token.
          </p>
          <button
            onClick={() => router.push('/patient/appointments/book')}
            className="rounded-2xl bg-[#113831] px-6 py-3 text-xs font-black text-white shadow-md hover:bg-[#227B6B] transition"
          >
            Book Consultation Now
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {appointments.map((apt) => (
            <div
              key={apt.id}
              className="rounded-3xl border border-[#D5E8E3] bg-white p-6 shadow-sm hover:border-[#113831] transition space-y-5"
            >
              <div className="flex items-center justify-between border-b border-[#EAF5F2] pb-3">
                <span className="rounded-full bg-[#EAF5F2] px-3.5 py-1 text-[10px] font-black uppercase text-[#113831]">
                  {apt.department}
                </span>

                <div className="flex items-center gap-1.5 rounded-full bg-[#113831] px-3.5 py-1 text-xs font-black text-white shadow-sm">
                  <Activity className="h-3.5 w-3.5 text-[#A6E2D8]" /> SmartQ #{apt.token_number}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-black text-[#0E2924]">{apt.doctor_name}</h3>
                <p className="text-xs font-bold text-[#227B6B] flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" /> {apt.hospital_name || 'Regal Hospital'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-[#F4F8F7] p-3.5 rounded-2xl border border-[#D5E8E3] text-xs font-bold">
                <div>
                  <span className="text-[10px] uppercase text-[#227B6B] font-black block">Slot Time</span>
                  <span className="text-[#0E2924]">{apt.slot_time}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-[#227B6B] font-black block">Date</span>
                  <span className="text-[#0E2924]">{apt.appointment_date}</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[#EAF5F2] pt-3 text-xs font-bold">
                <span className="text-[#227B6B]">
                  Status: <span className="text-[#0E2924] font-black uppercase">{apt.queue_status || 'SCHEDULED'}</span>
                </span>
                <span className="text-emerald-700 flex items-center gap-1 font-black">
                  <CheckCircle2 className="h-4 w-4" /> Desk Verified
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}