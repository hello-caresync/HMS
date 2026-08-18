'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import {
  parsePrescriptionMedications,
  type ConsultationMedicationItem,
  type PatientPrescriptionRecord,
} from '@/lib/doctor/command-center/supabase-service';
import { BULLET, ELLIPSIS, EM_DASH } from '@/lib/utils/typography';

const DEFAULT_PATIENT_ID = 'b0000000-0000-0000-0000-000000000002';

export default function PatientPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<PatientPrescriptionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [patientId, setPatientId] = useState<string>(DEFAULT_PATIENT_ID);

  const fetchPrescriptions = useCallback(async () => {
    try {
      const supabase = createClient();

      const { data: authUser } = await supabase.auth.getUser();
      const activePatientId = authUser?.user?.id || DEFAULT_PATIENT_ID;
      setPatientId(activePatientId);

      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          id,
          created_at,
          patient_id,
          consultation_id,
          special_instructions,
          medications,
          consultations (
            diagnosis,
            chief_complaint,
            clinical_notes,
            follow_up_date,
            doctors (
              full_name,
              department,
              specialization
            ),
            vitals (
              temperature_f,
              bp_systolic,
              bp_diastolic,
              pulse_bpm,
              spo2_percent,
              weight_kg
            )
          )
        `)
        .eq('patient_id', activePatientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching patient prescriptions:', error.message);
      } else if (data) {
        setPrescriptions(data as unknown as PatientPrescriptionRecord[]);
      }
    } catch (err) {
      console.error('Unexpected error loading prescriptions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPrescriptions();

    const supabase = createClient();

    const setupRealtime = async () => {
      const { data: authUser } = await supabase.auth.getUser();
      const activePatientId = authUser?.user?.id || DEFAULT_PATIENT_ID;
      setPatientId(activePatientId);

      const channel = supabase
        .channel(`patient-prescriptions-${activePatientId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'prescriptions',
            filter: `patient_id=eq.${activePatientId}`,
          },
          (payload: RealtimePostgresChangesPayload<{ patient_id?: string }>) => {
            console.log(`New prescription issued ${EM_DASH} updating patient view:`, payload.new);
            void fetchPrescriptions();
          },
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'prescriptions',
            filter: `patient_id=eq.${activePatientId}`,
          },
          () => {
            void fetchPrescriptions();
          },
        )
        .subscribe();

      return channel;
    };

    let channelPromise = setupRealtime();

    return () => {
      void channelPromise.then((channel) => {
        if (channel) supabase.removeChannel(channel);
      });
    };
  }, [fetchPrescriptions]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 max-w-5xl mx-auto space-y-6 font-sans print:p-0 print:bg-white">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm gap-4 print:hidden">
        <div>
          <span className="text-xs font-semibold tracking-wider text-emerald-600 uppercase">
            CuraSync Digital Health Records
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">My Digital Prescriptions</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time Rx delivery {BULLET} Patient ID:{' '}
            <span className="font-semibold text-slate-800">{patientId.slice(0, 8)}{ELLIPSIS}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-100 rounded-lg transition-colors border border-slate-300 shadow-sm flex items-center gap-2"
          >
            🖨️ Print / Save PDF
          </button>
          <button
            type="button"
            onClick={() => fetchPrescriptions()}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center">
          <p className="text-slate-500 font-medium">Loading your medical records...</p>
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-2">
          <p className="text-lg font-semibold text-slate-800">No Digital Prescriptions Yet</p>
          <p className="text-sm text-slate-500">
            Once your doctor finalizes a consultation, your digital prescription and vitals will
            appear here in real time.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {prescriptions.map((rx) => {
            const doc = rx.consultations?.doctors;
            const vitals = rx.consultations?.vitals?.[0];
            const meds: ConsultationMedicationItem[] = parsePrescriptionMedications(rx.medications);
            const rxDate = new Date(rx.created_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

            return (
              <div
                key={rx.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden print:border-none print:shadow-none"
              >
                <div className="p-6 bg-slate-900 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:bg-white print:text-black print:border-b print:border-slate-300">
                  <div>
                    <h2 className="text-xl font-bold">
                      {doc?.full_name || 'Dr. CHANDRAKANTH S KESARI'}
                    </h2>
                    <p className="text-xs text-slate-300 mt-0.5 print:text-slate-600">
                      {doc?.department || 'General Surgery'} {BULLET}{' '}
                      {doc?.specialization || 'General Surgeon'}
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <span className="text-xs px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-md font-medium inline-block print:border-slate-400 print:text-slate-800">
                      Verified Rx
                    </span>
                    <p className="text-xs text-slate-300 mt-1.5 print:text-slate-600">
                      Date:{' '}
                      <span className="font-medium text-white print:text-slate-900">{rxDate}</span>
                    </p>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-emerald-50/50 border border-emerald-100 rounded-lg">
                    <div>
                      <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">
                        Primary Diagnosis
                      </span>
                      <p className="text-base font-bold text-slate-900 mt-0.5">
                        {rx.consultations?.diagnosis || 'General Clinical Review'}
                      </p>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">
                        Chief Complaint
                      </span>
                      <p className="text-sm font-medium text-slate-700 mt-0.5">
                        {rx.consultations?.chief_complaint || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {vitals && (
                    <div>
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Recorded Vitals
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                        {[
                          { label: 'Temp', value: `${vitals.temperature_f ?? '98.6'} °F` },
                          {
                            label: 'Blood Pressure',
                            value: `${vitals.bp_systolic ?? '120'}/${vitals.bp_diastolic ?? '80'}`,
                          },
                          { label: 'Pulse', value: `${vitals.pulse_bpm ?? '72'} bpm` },
                          { label: 'SpO2', value: `${vitals.spo2_percent ?? '98'}%` },
                          { label: 'Weight', value: `${vitals.weight_kg ?? '68'} kg` },
                          {
                            label: 'Follow-up',
                            value: rx.consultations?.follow_up_date || 'As Needed',
                          },
                        ].map(({ label, value }) => (
                          <div
                            key={label}
                            className="p-2.5 bg-slate-50 border border-slate-200 rounded-md text-center"
                          >
                            <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                              {label}
                            </span>
                            <span className="text-sm font-bold text-slate-800">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Prescribed Medications
                    </h3>
                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                            <th className="p-3">#</th>
                            <th className="p-3">Medication Name</th>
                            <th className="p-3">Dosage</th>
                            <th className="p-3">Frequency</th>
                            <th className="p-3">Duration</th>
                            <th className="p-3">Instructions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {meds.length > 0 ? (
                            meds.map((med, idx) => (
                              <tr key={`${rx.id}-${idx}`} className="hover:bg-slate-50/50">
                                <td className="p-3 text-slate-400 font-medium">{idx + 1}</td>
                                <td className="p-3 font-semibold text-slate-900">{med.name}</td>
                                <td className="p-3 text-slate-700">{med.dosage}</td>
                                <td className="p-3 font-mono font-medium text-emerald-700">
                                  {med.frequency}
                                </td>
                                <td className="p-3 text-slate-700">{med.duration}</td>
                                <td className="p-3 text-slate-600 italic">
                                  {med.instructions || 'After meals'}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="p-4 text-center text-slate-500 text-xs">
                                No specific medications recorded for this encounter.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {rx.special_instructions && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">
                        Doctor Instructions
                      </span>
                      <p className="text-sm text-slate-800 leading-relaxed">
                        {rx.special_instructions}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
