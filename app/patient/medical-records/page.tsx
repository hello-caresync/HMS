'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { FileText, Loader2, RefreshCw, Stethoscope } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { formatDoctorDisplayName } from '@/lib/doctor/appointment-status';
import {
  fetchPatientMedicalRecords,
  type MedicalRecordRow,
} from '@/lib/patient/medical-records-service';
import { resolvePatientDbId } from '@/lib/patient/constants';

export default function PatientMedicalRecordsPage() {
  const patientId = resolvePatientDbId(
    typeof window !== 'undefined' ? localStorage.getItem('patient_id') : null,
  );

  const [records, setRecords] = useState<MedicalRecordRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchPatientMedicalRecords(patientId);
      setRecords(rows);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadRecords(), 0);

    const channel = supabase
      .channel(`patient-${patientId}-medical-records`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'medical_records',
          filter: `patient_id=eq.${patientId}`,
        },
        () => void loadRecords(),
      )
      .subscribe();

    return () => {
      window.clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [patientId, loadRecords]);

  return (
    <div className="mx-auto max-w-4xl space-y-8 font-sans text-[#0E2924]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#0E2924]">Medical Records</h1>
          <p className="mt-1 text-xs font-bold text-[#4B736B]">
            Consultation summaries and clinical notes — updated in real time after doctor sign-off.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadRecords()}
          className="rounded-full bg-white p-3 text-[#227B6B] shadow-sm transition hover:rotate-180"
          title="Refresh records"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-3xl border border-[#D5E8E3] bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-[#227B6B]" />
        </div>
      ) : records.length === 0 ? (
        <div className="rounded-3xl border border-[#D5E8E3] bg-white p-10 text-center">
          <FileText className="mx-auto h-12 w-12 text-[#227B6B]/40" />
          <h3 className="mt-3 text-base font-black text-[#0E2924]">No medical records yet</h3>
          <p className="mt-1 text-xs font-bold text-[#4B736B]">
            Records appear here instantly when your doctor completes a consultation.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <article
              key={record.id}
              className="rounded-3xl border border-[#D5E8E3] bg-white p-6 shadow-sm"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#EAF5F2] px-3 py-1 text-[10px] font-black uppercase text-[#113831]">
                  {record.record_type.replace(/_/g, ' ')}
                </span>
                {record.created_at && (
                  <span className="text-[10px] font-bold text-[#4B736B]">
                    {new Date(record.created_at).toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              {record.doctor_name && (
                <p className="mb-2 flex items-center gap-1.5 text-sm font-black text-[#113831]">
                  <Stethoscope className="h-4 w-4 text-[#227B6B]" />
                  {formatDoctorDisplayName(record.doctor_name)}
                </p>
              )}
              <pre className="whitespace-pre-wrap font-sans text-xs font-semibold leading-relaxed text-[#0E2924]">
                {record.summary}
              </pre>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
