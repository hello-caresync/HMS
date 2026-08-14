'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  Activity,
  Calendar,
  Clock,
  User,
  Stethoscope,
  Building2,
  Ticket,
  PlusCircle,
  FileText,
  RotateCw,
  AlertCircle,
  CheckCircle2,
  Heart,
  Pill,
} from 'lucide-react';

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

export default function PatientDashboardPage() {
  const router = useRouter();

  const [activeToken, setActiveToken] = useState<ActiveTokenRecord | null>(null);
  const [patientName, setPatientName] = useState<string>('Aishwarya D S');
  const [loading, setLoading] = useState<boolean>(true);

  // Auto-clean stale localStorage values on first mount & load active session
  useEffect(() => {
    // STEP 3: Automated cache hygiene
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem('patient_full_name');
      if (storedName) {
        setPatientName(storedName);
      } else {
        localStorage.setItem('patient_full_name', 'Aishwarya D S');
      }

      // Check if stale mock facility is present and sanitize it
      const cachedAppts = localStorage.getItem('curasync_appointments');
      if (cachedAppts && cachedAppts.includes('CuraSync Multi-Specialty Hospital')) {
        const sanitized = cachedAppts.replaceAll(
          'CuraSync Multi-Specialty Hospital',
          'Regal Hospital'
        );
        localStorage.setItem('curasync_appointments', sanitized);
      }
    }

    fetchActiveToken();

    // Subscribe to Realtime Queue Changes for Live Token Tracking
    const channel = supabase
      .channel('realtime_patient_dashboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patient_appointments' },
        () => {
          fetchActiveToken();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchActiveToken = async () => {
    setLoading(true);
    let latestAppointment: ActiveTokenRecord | null = null;

    // 1. Read from LocalStorage Cache
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('curasync_appointments');
      if (cached) {
        try {
          const parsed: ActiveTokenRecord[] = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            latestAppointment = {
              ...parsed[0],
              hospital_name: 'Regal Hospital', // Strictly enforce Regal Hospital
            };
          }
        } catch (e) {
          console.warn('Local storage parse notice');
        }
      }
    }

    // 2. Fetch from Supabase Database
    try {
      const { data, error } = await supabase
        .from('patient_appointments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        latestAppointment = {
          ...data[0],
          hospital_name: 'Regal Hospital', // Strictly enforce Regal Hospital
        };
      }
    } catch (err) {
      console.warn('Dashboard DB load fallback active');
    } finally {
      setActiveToken(latestAppointment);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 font-sans text-[#0E2924]">
      
      {/* GREETING & HEADER BAR */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#D5E8E3] pb-4">
        <div>
          <span className="flex items-center gap-1.5 text-xs font-black text-[#227B6B] uppercase tracking-wider">
            <CheckCircle2 className="h-4 w-4" /> Verified Patient Session
          </span>
          <h1 className="text-2xl font-black text-[#0E2924] mt-1">
            Welcome, {patientName}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchActiveToken}
            className="flex items-center gap-2 rounded-2xl border border-[#D5E8E3] bg-white px-4 py-3 text-xs font-black text-[#113831] hover:bg-[#EAF5F2] transition shadow-sm"
          >
            <RotateCw className="h-4 w-4 text-[#227B6B]" /> Refresh Status
          </button>

          <button
            onClick={() => router.push('/patient/doctors')}
            className="flex items-center gap-2 rounded-2xl bg-[#113831] px-5 py-3 text-xs font-black text-white hover:bg-[#227B6B] transition shadow-md"
          >
            <PlusCircle className="h-4 w-4 text-[#A6E2D8]" /> Book Consultation
          </button>
        </div>
      </div>

      {/* QUICK METRICS OVERVIEW */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-[#D5E8E3] bg-white p-5 shadow-sm space-y-1">
          <span className="text-[10px] uppercase text-[#227B6B] font-black flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5" /> Assigned Facility
          </span>
          <p className="text-base font-black text-[#0E2924]">Regal Hospital</p>
        </div>

        <div className="rounded-3xl border border-[#D5E8E3] bg-white p-5 shadow-sm space-y-1">
          <span className="text-[10px] uppercase text-[#227B6B] font-black flex items-center gap-1">
            <Heart className="h-3.5 w-3.5" /> OPD Status
          </span>
          <p className="text-base font-black text-[#113831]">
            {activeToken ? (activeToken.queue_status || 'WAITING') : 'No Active Session'}
          </p>
        </div>

        <div className="rounded-3xl border border-[#D5E8E3] bg-white p-5 shadow-sm space-y-1">
          <span className="text-[10px] uppercase text-[#227B6B] font-black flex items-center gap-1">
            <Pill className="h-3.5 w-3.5" /> Digital Records
          </span>
          <p className="text-base font-black text-[#0E2924]">Active & Synced</p>
        </div>
      </div>

      {/* ACTIVE SMARTQ TOKEN CARD */}
      <div className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-wider text-[#227B6B]">
          Live Queue & Token Status
        </h2>

        {loading ? (
          <div className="rounded-3xl border border-[#D5E8E3] bg-white p-12 text-center text-xs font-bold text-[#227B6B]">
            Syncing live token details with Regal Hospital desk...
          </div>
        ) : !activeToken ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#D5E8E3] bg-white p-10 text-center space-y-4">
            <Ticket className="h-10 w-10 text-[#227B6B]/40" />
            <div>
              <h3 className="text-base font-black text-[#0E2924]">No Live Tokens In Queue</h3>
              <p className="text-xs font-bold text-slate-500 max-w-sm mt-1">
                You do not have any pending appointments for today at Regal Hospital.
              </p>
            </div>
            <button
              onClick={() => router.push('/patient/doctors')}
              className="rounded-2xl bg-[#113831] px-6 py-3 text-xs font-black text-white shadow-md hover:bg-[#227B6B] transition"
            >
              Book OPD Slot Now
            </button>
          </div>
        ) : (
          <div className="rounded-3xl border border-[#D5E8E3] bg-white p-8 shadow-sm space-y-6">
            
            {/* TOKEN HEADER & LIVE STATUS */}
            <div className="flex items-center justify-between border-b border-[#EAF5F2] pb-4">
              <div className="flex items-center gap-2 text-[#113831]">
                <Ticket className="h-5 w-5 text-[#227B6B]" />
                <span className="text-sm font-black text-[#0E2924]">
                  SmartQ Token: <span className="text-lg font-black text-[#227B6B]">#{activeToken.token_number || 1}</span>
                </span>
              </div>

              <span className="flex items-center gap-1.5 rounded-full bg-[#EAF5F2] px-4 py-1 text-xs font-black text-[#113831] border border-[#227B6B]/20 uppercase">
                <Activity className="h-3.5 w-3.5 text-[#227B6B]" />
                {activeToken.queue_status || 'WAITING'}
              </span>
            </div>

            {/* DOCTOR INFO */}
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#113831] text-white font-black text-base shrink-0 shadow-sm">
                {activeToken.doctor_name ? activeToken.doctor_name.replace('Dr. ', '').charAt(0) : 'D'}
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-[#0E2924]">{activeToken.doctor_name}</h3>
                <p className="text-xs font-bold text-[#227B6B] flex items-center gap-1.5">
                  <Stethoscope className="h-3.5 w-3.5" /> {activeToken.department} OPD
                </p>
              </div>
            </div>

            {/* PATIENT & FACILITY DETAILS */}
            <div className="grid gap-4 sm:grid-cols-2 bg-[#F4F8F7] p-4 rounded-2xl border border-[#D5E8E3] text-xs font-bold">
              <div>
                <span className="text-[10px] uppercase text-[#227B6B] font-black block mb-0.5">
                  PATIENT NAME
                </span>
                <span className="text-[#0E2924] font-black flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-[#227B6B]" /> {activeToken.patient_name || patientName}
                </span>
              </div>

              {/* STRICTLY LOCKED TO REGAL HOSPITAL */}
              <div>
                <span className="text-[10px] uppercase text-[#227B6B] font-black block mb-0.5">
                  FACILITY
                </span>
                <span className="text-[#0E2924] font-black flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-[#227B6B]" /> Regal Hospital
                </span>
              </div>
            </div>

            {/* REASON FOR VISIT (IF PRESENT) */}
            {activeToken.reason && (
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 text-xs font-bold text-amber-950">
                <span className="text-[10px] uppercase text-amber-800 font-black flex items-center gap-1 mb-1">
                  <FileText className="h-3 w-3" /> Consultation Symptoms / Reason
                </span>
                <p>{activeToken.reason}</p>
              </div>
            )}

            {/* APPOINTMENT SCHEDULE FOOTER */}
            <div className="flex flex-wrap items-center justify-between border-t border-[#EAF5F2] pt-4 text-xs font-bold text-[#0E2924] gap-2">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-[#227B6B]" /> {activeToken.appointment_date}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-[#227B6B]" /> {activeToken.slot_time}
                </span>
              </div>

              {activeToken.fee && (
                <span className="rounded-xl bg-[#113831] px-3.5 py-1 text-xs font-black text-white">
                  Fee: {activeToken.fee}
                </span>
              )}
            </div>

          </div>
        )}
      </div>

    </div>
  );
}