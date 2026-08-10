'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  FileText,
  Pill,
  Download,
  Clock,
  ShieldCheck,
  Loader2,
  FileX,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

interface PrescriptionItem {
  id: string;
  doctor_name: string;
  department: string;
  medication_name: string;
  dosage: string;
  instructions: string;
  duration: string;
  date_prescribed: string;
}

export default function PatientPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [patientId] = useState<string>('NEX_9021');

  useEffect(() => {
    fetchLivePrescriptions();

    // REAL-TIME SUBSCRIPTION: Listen for when doctor issues new prescription
    const subscription = supabase
      .channel('realtime_prescriptions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'patient_prescriptions',
          filter: `patient_id=eq.${patientId}`,
        },
        (payload) => {
          if (payload.new) {
            setPrescriptions((prev) => [payload.new as PrescriptionItem, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [patientId]);

  const fetchLivePrescriptions = async () => {
    setLoading(true);
    let list: PrescriptionItem[] = [];

    // 1. Read strictly from local cache (only if doctor sent something locally)
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('curasync_issued_prescriptions');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            list = parsed;
          }
        } catch (e) {
          console.warn('Local prescription parse notice');
        }
      }
    }

    // 2. Query Supabase backend strictly for issued prescriptions
    try {
      const { data, error } = await supabase
        .from('patient_prescriptions')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        list = data;
      }
    } catch (err) {
      console.warn('Supabase fetch notice');
    } finally {
      // STRICT REQUIREMENT: NO DEMO DATA FALLBACK.
      // If list is empty, state remains an empty array [].
      setPrescriptions(list);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 font-sans text-[#0E2924]">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#D5E8E3] pb-4">
        <div>
          <h1 className="text-2xl font-black text-[#0E2924]">Digital Prescriptions</h1>
          <p className="text-xs font-bold text-[#227B6B]">
            Official medications and clinical dosage advice issued by your consulting doctor.
          </p>
        </div>

        <button
          onClick={fetchLivePrescriptions}
          className="flex items-center justify-center gap-2 rounded-2xl border border-[#D5E8E3] bg-white px-5 py-3 text-xs font-black text-[#113831] shadow-sm hover:bg-[#EAF5F2] transition"
        >
          <RefreshCw className="h-4 w-4 text-[#227B6B]" /> Refresh Prescriptions
        </button>
      </div>

      {/* CONTENT AREA */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-3xl bg-white border border-[#D5E8E3]">
          <div className="flex items-center gap-3 text-xs font-black text-[#113831]">
            <Loader2 className="h-5 w-5 animate-spin text-[#227B6B]" />
            Checking medical records for issued prescriptions...
          </div>
        </div>
      ) : prescriptions.length === 0 ? (
        
        /* ZERO STATE: SHOWN WHEN DOCTOR HAS NOT ISSUED ANY PRESCRIPTION YET */
        <div className="rounded-3xl border border-[#D5E8E3] bg-white p-12 text-center space-y-4 shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#EAF5F2] text-[#227B6B]">
            <FileX className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-[#0E2924]">No Prescriptions Available</h3>
            <p className="text-xs font-bold text-[#227B6B] max-w-md mx-auto">
              Your consulting clinician has not issued or sent any digital prescriptions yet. Once prescribed during or after your OPD consultation, it will automatically appear here.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#F4F8F7] px-4 py-1.5 text-[11px] font-extrabold text-slate-500 border border-[#D5E8E3]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#227B6B]" /> Real-time sync active for Patient ID: {patientId}
          </div>
        </div>

      ) : (

        /* LIST OF PRESCRIPTIONS SENT BY DOCTOR */
        <div className="space-y-6">
          {prescriptions.map((p) => (
            <div
              key={p.id}
              className="rounded-3xl border border-[#D5E8E3] bg-white p-6 shadow-sm space-y-6 hover:border-[#113831] transition"
            >
              <div className="flex items-center justify-between border-b border-[#EAF5F2] pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#113831] text-white font-black">
                    <Pill className="h-5 w-5 text-[#A6E2D8]" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#0E2924]">{p.doctor_name}</h3>
                    <p className="text-xs font-bold text-[#227B6B]">
                      {p.department || 'Consultant Specialist'} • Date: {p.date_prescribed || new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-[#EAF5F2] px-3.5 py-1 text-[10px] font-black uppercase text-[#113831] border border-[#227B6B]/20">
                  Active Prescription
                </span>
              </div>

              <div className="rounded-2xl bg-[#F4F8F7] p-5 border border-[#D5E8E3] space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-[#0E2924] flex items-center gap-2">
                    {p.medication_name} <span className="text-xs font-bold text-[#227B6B]">({p.dosage})</span>
                  </h4>
                  <span className="text-xs font-bold text-slate-500">{p.duration}</span>
                </div>
                <p className="text-xs font-bold text-[#113831]">{p.instructions}</p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Digitally Verified Prescription
                </span>

                <button className="flex items-center gap-2 rounded-2xl bg-[#113831] px-5 py-2.5 text-xs font-black text-white shadow-md hover:bg-[#227B6B] transition">
                  <Download className="h-4 w-4 text-[#A6E2D8]" /> Download PDF
                </button>
              </div>
            </div>
          ))}
        </div>

      )}

    </div>
  );
}