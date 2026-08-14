'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  Stethoscope,
  Calendar,
  Clock,
  User,
  RotateCw,
  Loader2,
  FileText,
  Activity,
  PlayCircle,
  CheckCircle,
  Building2,
} from 'lucide-react';

interface AppointmentRecord {
  id: string;
  patient_id: string;
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
  created_at: string;
}

export default function DoctorDashboardPage() {
  const router = useRouter();
  const [selectedDoctor, setSelectedDoctor] = useState<string>('Dr. Chandrakanth S. Kesari');
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLiveAppointments = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('patient_appointments')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectedDoctor !== 'ALL') {
        // Use partial match so 'Dr. Chandrakanth' or 'Chandrakanth S Kesari' match consistently
        const doctorKey = selectedDoctor.split(' ')[1] || selectedDoctor;
        query = query.ilike('doctor_name', `%${doctorKey}%`);
      }

      const { data, error } = await query;
      if (!error && data) {
        setAppointments(data);
      }
    } catch (err) {
      console.error('Error fetching doctor appointments:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDoctor]);

  useEffect(() => {
    fetchLiveAppointments();

    // Listen to real-time additions and updates from the patient app
    const channel = supabase
      .channel('doctor_app_realtime_stream')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patient_appointments' },
        () => {
          fetchLiveAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLiveAppointments]);

  // Proceed to next steps: Update status and route to consultation
  const handleStartConsultation = async (appt: AppointmentRecord) => {
    try {
      await supabase
        .from('patient_appointments')
        .update({ queue_status: 'IN_CONSULTATION' })
        .eq('id', appt.id);

      router.push(`/doctor/consultation/${appt.id}`);
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleCompleteConsultation = async (apptId: string) => {
    try {
      await supabase
        .from('patient_appointments')
        .update({ queue_status: 'COMPLETED' })
        .eq('id', apptId);

      fetchLiveAppointments();
    } catch (err) {
      console.error('Failed to complete consultation:', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 font-sans text-[#0E2924] p-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#D5E8E3] pb-4">
        <div>
          <span className="flex items-center gap-1.5 text-xs font-black text-[#227B6B] uppercase tracking-wider">
            <Stethoscope className="h-4 w-4" /> Clinician OPD Console
          </span>
          <h1 className="text-2xl font-black text-[#0E2924] mt-1">Live Patient OPD Queue</h1>
          <p className="text-xs font-bold text-[#227B6B]">
            Facility: <span className="text-[#113831] font-black">Regal Hospital</span> • Real-time Sync Active
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Clinician Selector for Multi-Doctor Demo */}
          <select
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            className="rounded-2xl border border-[#D5E8E3] bg-white p-3 text-xs font-black text-[#113831] focus:outline-none shadow-sm cursor-pointer"
          >
            <option value="Dr. Chandrakanth S. Kesari">Dr. Chandrakanth S. Kesari (General Surgery)</option>
            <option value="Dr. Suriraju V">Dr. Suriraju V (Urology)</option>
            <option value="Dr. Vikramaditya Rao">Dr. Vikramaditya Rao (Cardiology)</option>
            <option value="Dr. Rajesh Kumar Hegde">Dr. Rajesh Kumar Hegde (Orthopedics)</option>
            <option value="ALL">Show All Doctors ({appointments.length})</option>
          </select>

          <button
            onClick={fetchLiveAppointments}
            className="flex items-center gap-2 rounded-2xl border border-[#D5E8E3] bg-white px-4 py-3 text-xs font-black text-[#113831] hover:bg-[#EAF5F2] transition shadow-sm"
          >
            <RotateCw className="h-4 w-4 text-[#227B6B]" /> Refresh
          </button>
        </div>
      </div>

      {/* APPOINTMENT QUEUE FEED */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-3xl bg-white border border-[#D5E8E3]">
          <div className="flex items-center gap-2 text-xs font-black text-[#113831]">
            <Loader2 className="h-5 w-5 animate-spin text-[#227B6B]" />
            Fetching live queue updates...
          </div>
        </div>
      ) : appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#D5E8E3] bg-white p-12 text-center space-y-3">
          <Calendar className="h-10 w-10 text-[#227B6B]/40" />
          <h3 className="text-base font-black text-[#0E2924]">No Scheduled Consultations</h3>
          <p className="text-xs font-bold text-slate-500">
            Appointments booked by patients will appear here immediately in real time.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {appointments.map((appt) => (
            <div
              key={appt.id}
              className="rounded-3xl border border-[#D5E8E3] bg-white p-6 shadow-sm space-y-5 flex flex-col justify-between hover:border-[#113831] transition"
            >
              <div className="space-y-4">
                {/* STATUS & TOKEN */}
                <div className="flex items-center justify-between border-b border-[#EAF5F2] pb-3">
                  <span className="text-xs font-black text-[#113831]">
                    SmartQ Token:{' '}
                    <span className="text-base font-black text-[#227B6B]">#{appt.token_number}</span>
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-black uppercase border ${
                      appt.queue_status === 'IN_CONSULTATION'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : appt.queue_status === 'COMPLETED'
                        ? 'bg-slate-100 text-slate-600 border-slate-300'
                        : 'bg-[#EAF5F2] text-[#113831] border-[#227B6B]/20'
                    }`}
                  >
                    <Activity className="h-3 w-3 inline mr-1" />
                    {appt.queue_status}
                  </span>
                </div>

                {/* PATIENT & DOCTOR DETAILS */}
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-[#0E2924] flex items-center gap-2">
                    <User className="h-4 w-4 text-[#227B6B]" /> {appt.patient_name}
                  </h3>
                  <p className="text-xs font-bold text-[#227B6B]">
                    Assigned: <span className="text-[#113831]">{appt.doctor_name}</span> ({appt.department})
                  </p>
                </div>

                {/* SYMPTOMS / REASON */}
                {appt.reason && (
                  <div className="bg-amber-50/80 border border-amber-200 p-3.5 rounded-2xl text-xs font-bold">
                    <span className="text-[10px] font-black uppercase text-amber-800 flex items-center gap-1 mb-0.5">
                      <FileText className="h-3.5 w-3.5" /> Chief Complaint / Symptoms
                    </span>
                    <p className="text-amber-950">{appt.reason}</p>
                  </div>
                )}

                {/* TIME & FACILITY */}
                <div className="flex items-center justify-between text-xs font-bold bg-[#F4F8F7] p-3 rounded-2xl border border-[#D5E8E3]">
                  <span className="flex items-center gap-1.5 text-[#0E2924]">
                    <Clock className="h-3.5 w-3.5 text-[#227B6B]" /> {appt.appointment_date} at {appt.slot_time}
                  </span>
                  <span className="flex items-center gap-1 text-[#0E2924]">
                    <Building2 className="h-3.5 w-3.5 text-[#227B6B]" /> Regal Hospital
                  </span>
                </div>
              </div>

              {/* NEXT STEPS WORKFLOW BUTTONS */}
              <div className="flex items-center gap-3 pt-3 border-t border-[#EAF5F2]">
                <button
                  onClick={() => handleStartConsultation(appt)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl bg-[#113831] py-3 text-xs font-black text-white hover:bg-[#227B6B] transition shadow-sm"
                >
                  <PlayCircle className="h-4 w-4 text-[#A6E2D8]" /> Start Consultation
                </button>

                <button
                  onClick={() => handleCompleteConsultation(appt.id)}
                  className="flex items-center gap-1 rounded-2xl border border-[#D5E8E3] bg-[#F4F8F7] px-4 py-3 text-xs font-black text-[#113831] hover:bg-[#EAF5F2] transition"
                >
                  <CheckCircle className="h-4 w-4 text-emerald-600" /> Done
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}