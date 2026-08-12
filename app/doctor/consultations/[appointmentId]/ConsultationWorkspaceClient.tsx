'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  fetchConsultationAppointmentContext,
  finalizeConsultationAndPrescription,
  updateAppointmentStatus,
  type ConsultationAppointmentContext,
  type ConsultationMedicationItem,
} from '@/lib/doctor/command-center/supabase-service';

interface MedicationRow extends ConsultationMedicationItem {
  id: string;
}

const DEFAULT_MEDICATION: MedicationRow = {
  id: '1',
  name: 'Paracetamol 650mg',
  dosage: '1 tablet',
  frequency: '1-0-1',
  duration: '5 days',
  instructions: 'Take after food',
};

export default function ConsultationWorkspaceClient({
  appointmentId,
}: {
  appointmentId: string;
}) {
  const router = useRouter();

  const [appointment, setAppointment] = useState<ConsultationAppointmentContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [vitals, setVitals] = useState({
    temperature: '98.6',
    bpSystolic: '120',
    bpDiastolic: '80',
    pulse: '72',
    spo2: '98',
    weight: '68',
  });

  const [clinical, setClinical] = useState({
    chiefComplaint: '',
    clinicalFindings: '',
    diagnosis: '',
    clinicalNotes: '',
    followUpDate: '',
  });

  const [medications, setMedications] = useState<MedicationRow[]>([DEFAULT_MEDICATION]);

  useEffect(() => {
    async function loadContext() {
      try {
        const ctx = await fetchConsultationAppointmentContext(appointmentId);
        if (!ctx) {
          toast.error('Appointment not found');
          return;
        }
        setAppointment(ctx);
        if (ctx.reason) {
          setClinical((prev) => ({ ...prev, chiefComplaint: ctx.reason ?? prev.chiefComplaint }));
        }
        if (ctx.doctor_id && ctx.patient_id) {
          await updateAppointmentStatus(appointmentId, 'IN_CONSULTATION').catch(() => {
            /* may already be in consultation */
          });
        }
      } catch (err) {
        console.error('Failed to load consultation context:', err);
        toast.error('Failed to load appointment context');
      } finally {
        setLoading(false);
      }
    }

    void loadContext();
  }, [appointmentId]);

  const addMedicationRow = () => {
    setMedications((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: '',
        dosage: '1 tablet',
        frequency: '1-0-1',
        duration: '3 days',
        instructions: 'Take after food',
      },
    ]);
  };

  const removeMedicationRow = (id: string) => {
    setMedications((prev) => prev.filter((med) => med.id !== id));
  };

  const updateMedicationRow = (id: string, field: keyof ConsultationMedicationItem, value: string) => {
    setMedications((prev) =>
      prev.map((med) => (med.id === id ? { ...med, [field]: value } : med)),
    );
  };

  const handleFinalizeConsultation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!appointment?.doctor_id || !appointment?.patient_id) {
      toast.error('Missing doctor or patient context for this appointment');
      return;
    }

    setSubmitting(true);

    try {
      await finalizeConsultationAndPrescription({
        appointmentId,
        doctorId: appointment.doctor_id,
        patientId: appointment.patient_id,
        clinical: {
          chief_complaint: clinical.chiefComplaint,
          clinical_findings: clinical.clinicalFindings,
          diagnosis: clinical.diagnosis,
          clinical_notes: clinical.clinicalNotes,
          follow_up_date: clinical.followUpDate || null,
        },
        vitals: {
          temperature_f: parseFloat(vitals.temperature) || null,
          bp_systolic: parseInt(vitals.bpSystolic, 10) || null,
          bp_diastolic: parseInt(vitals.bpDiastolic, 10) || null,
          pulse_bpm: parseInt(vitals.pulse, 10) || null,
          spo2_percent: parseInt(vitals.spo2, 10) || null,
          weight_kg: parseFloat(vitals.weight) || null,
        },
        medications: medications
          .filter((m) => m.name.trim() !== '')
          .map(({ name, dosage, frequency, duration, instructions }) => ({
            name,
            dosage,
            frequency,
            duration,
            instructions,
          })),
        special_instructions: clinical.clinicalNotes,
      });

      toast.success('Prescription sent successfully to patient!');
      router.push('/doctor/dashboard');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to finalize consultation:', error);
      toast.error(`Error saving consultation: ${message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
        <p className="text-slate-500 font-medium">Loading clinical workspace...</p>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
        <p className="text-slate-500 font-medium">Appointment not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 max-w-7xl mx-auto space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm gap-4">
        <div>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 uppercase tracking-wider mb-1 block"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-slate-900">
            Consultation Encounter: {appointment.patient_name || 'Patient'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Gender: {appointment.patient_gender || 'N/A'} • Age: {appointment.patient_age || 'N/A'} yrs •
            Blood Group: {appointment.blood_group || 'N/A'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleFinalizeConsultation}
          disabled={submitting}
          className="px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
        >
          {submitting ? 'Sending to Patient…' : 'Finalize & Send to Patient'}
        </button>
      </div>

      <form onSubmit={handleFinalizeConsultation} className="space-y-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            1. Patient Vitals
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {[
              { key: 'temperature', label: 'Temp (°F)' },
              { key: 'bpSystolic', label: 'BP Systolic' },
              { key: 'bpDiastolic', label: 'BP Diastolic' },
              { key: 'pulse', label: 'Pulse (bpm)' },
              { key: 'spo2', label: 'SpO₂ (%)' },
              { key: 'weight', label: 'Weight (kg)' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  {label}
                </label>
                <input
                  type="number"
                  step={key === 'temperature' || key === 'weight' ? '0.1' : '1'}
                  value={vitals[key as keyof typeof vitals]}
                  onChange={(e) => setVitals({ ...vitals, [key]: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            2. Clinical Assessment & Notes
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Chief Complaint
              </label>
              <input
                type="text"
                required
                value={clinical.chiefComplaint}
                onChange={(e) => setClinical({ ...clinical, chiefComplaint: e.target.value })}
                placeholder="e.g. Fever, abdominal pain, post-op review"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Primary Diagnosis
              </label>
              <input
                type="text"
                required
                value={clinical.diagnosis}
                onChange={(e) => setClinical({ ...clinical, diagnosis: e.target.value })}
                placeholder="e.g. Acute Gastroenteritis"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Clinical Findings
              </label>
              <textarea
                rows={2}
                value={clinical.clinicalFindings}
                onChange={(e) => setClinical({ ...clinical, clinicalFindings: e.target.value })}
                placeholder="Examination findings, observed symptoms..."
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Clinical Notes / Instructions
              </label>
              <textarea
                rows={3}
                value={clinical.clinicalNotes}
                onChange={(e) => setClinical({ ...clinical, clinicalNotes: e.target.value })}
                placeholder="Dietary recommendations, rest advice, red-flag symptoms..."
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Follow-up Date
              </label>
              <input
                type="date"
                value={clinical.followUpDate}
                onChange={(e) => setClinical({ ...clinical, followUpDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900">3. Digital Prescription Builder</h2>
            <button
              type="button"
              onClick={addMedicationRow}
              className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
            >
              + Add Medication
            </button>
          </div>

          <div className="space-y-3">
            {medications.map((med, index) => (
              <div
                key={med.id}
                className="p-3 border border-slate-200 rounded-lg grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-slate-50/50"
              >
                <div className="md:col-span-4">
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">
                    Medicine Name #{index + 1}
                  </label>
                  <input
                    type="text"
                    required
                    value={med.name}
                    onChange={(e) => updateMedicationRow(med.id, 'name', e.target.value)}
                    placeholder="e.g. Paracetamol 650mg"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {(['dosage', 'frequency', 'duration'] as const).map((field) => (
                  <div key={field} className="md:col-span-2">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">
                      {field.charAt(0).toUpperCase() + field.slice(1)}
                    </label>
                    <input
                      type="text"
                      value={med[field]}
                      onChange={(e) => updateMedicationRow(med.id, field, e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                ))}

                <div className="md:col-span-2 flex items-center gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">
                      Instructions
                    </label>
                    <input
                      type="text"
                      value={med.instructions}
                      onChange={(e) => updateMedicationRow(med.id, 'instructions', e.target.value)}
                      placeholder="Take after food"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {medications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMedicationRow(med.id)}
                      className="mt-4 p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Remove Medication"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {submitting ? 'Sending to Patient…' : 'Finalize & Send to Patient'}
          </button>
        </div>
      </form>
    </div>
  );
}
