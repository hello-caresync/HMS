'use client';

import { useState } from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import type { ConsultationMedicationItem } from '@/lib/doctor/command-center/supabase-service';

export type ConsultationFormState = {
  temperature: string;
  bpSystolic: string;
  bpDiastolic: string;
  pulse: string;
  spo2: string;
  chiefComplaint: string;
  diagnosis: string;
  clinicalNotes: string;
  medications: Array<ConsultationMedicationItem & { id: string }>;
};

const emptyMed = (): ConsultationFormState['medications'][number] => ({
  id: crypto.randomUUID(),
  name: '',
  dosage: '1 tablet',
  frequency: '1-0-1',
  duration: '5 days',
  instructions: 'After food',
});

type WriteConsultationModalProps = {
  open: boolean;
  patientName: string;
  saving: boolean;
  onClose: () => void;
  onSave: (form: ConsultationFormState) => void;
};

export default function WriteConsultationModal({
  open,
  patientName,
  saving,
  onClose,
  onSave,
}: WriteConsultationModalProps) {
  const [form, setForm] = useState<ConsultationFormState>({
    temperature: '98.6',
    bpSystolic: '120',
    bpDiastolic: '80',
    pulse: '72',
    spo2: '98',
    chiefComplaint: '',
    diagnosis: '',
    clinicalNotes: '',
    medications: [emptyMed()],
  });

  if (!open) return null;

  const updateMed = (id: string, field: keyof ConsultationMedicationItem, value: string) => {
    setForm((prev) => ({
      ...prev,
      medications: prev.medications.map((m) => (m.id === id ? { ...m, [field]: value } : m)),
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/80 bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">Write New Consultation / Prescription</h2>
            <p className="text-xs font-semibold text-slate-500">Patient: {patientName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          className="space-y-6 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            onSave(form);
          }}
        >
          <section>
            <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-[#894A66]">Vitals</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {[
                { key: 'temperature', label: 'Temp (°F)' },
                { key: 'bpSystolic', label: 'BP Sys' },
                { key: 'bpDiastolic', label: 'BP Dia' },
                { key: 'pulse', label: 'Pulse' },
                { key: 'spo2', label: 'SpO₂ (%)' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
                    {label}
                  </label>
                  <input
                    type="number"
                    value={form[key as keyof ConsultationFormState] as string}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#894A66]"
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
                Chief Complaint
              </label>
              <input
                required
                value={form.chiefComplaint}
                onChange={(e) => setForm({ ...form, chiefComplaint: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#894A66]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
                Diagnosis
              </label>
              <input
                required
                value={form.diagnosis}
                onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#894A66]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
                Clinical Notes
              </label>
              <textarea
                rows={2}
                value={form.clinicalNotes}
                onChange={(e) => setForm({ ...form, clinicalNotes: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#894A66]"
              />
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wide text-[#894A66]">
                Medications
              </h3>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, medications: [...prev.medications, emptyMed()] }))}
                className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800"
              >
                <Plus className="h-3 w-3" /> Add
              </button>
            </div>
            <div className="space-y-3">
              {form.medications.map((med) => (
                <div key={med.id} className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-5">
                  <input
                    placeholder="Medicine name"
                    required
                    value={med.name}
                    onChange={(e) => updateMed(med.id, 'name', e.target.value)}
                    className="sm:col-span-2 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                  />
                  <input
                    placeholder="Dosage"
                    value={med.dosage}
                    onChange={(e) => updateMed(med.id, 'dosage', e.target.value)}
                    className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                  />
                  <input
                    placeholder="Frequency"
                    value={med.frequency}
                    onChange={(e) => updateMed(med.id, 'frequency', e.target.value)}
                    className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                  />
                  <input
                    placeholder="Duration"
                    value={med.duration}
                    onChange={(e) => updateMed(med.id, 'duration', e.target.value)}
                    className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                  />
                </div>
              ))}
            </div>
          </section>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#894A66] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save & Dispatch to Patient App
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
