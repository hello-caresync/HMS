'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  FileText,
  Pill,
  Download,
  ShieldCheck,
  Loader2,
  FileX,
  RefreshCw,
  CheckCircle2,
  Stethoscope,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  CLINICAL_STORAGE,
  fetchPatientClinicalNotes,
  readJsonLocal,
  resolveActivePatientId,
  writeJsonLocal,
} from '@/lib/clinical/bridge';
import type { ClinicalNote } from '@/lib/clinical/types';

type PrescriptionCard = {
  id: string;
  doctor_name: string;
  department: string;
  diagnosis_disease: string;
  medication_name: string;
  dosage: string;
  instructions: string;
  clinical_advice: string;
  duration: string;
  date_prescribed: string;
};

function noteToCard(note: ClinicalNote): PrescriptionCard {
  const firstLine = (note.prescription || '').split('\n')[0] || 'e-Prescription';
  return {
    id: note.id,
    doctor_name: note.doctor_name || 'Consulting Doctor',
    department: note.department || 'OPD',
    diagnosis_disease: note.diagnosis_disease || 'Clinical review',
    medication_name: firstLine,
    dosage: note.diagnosis_disease || 'As directed',
    instructions: note.prescription || '',
    clinical_advice: note.clinical_advice || '',
    duration: 'As advised',
    date_prescribed: note.created_at
      ? new Date(note.created_at).toLocaleDateString()
      : new Date().toLocaleDateString(),
  };
}

export default function PatientPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientId, setPatientId] = useState(resolveActivePatientId());

  const hydrate = useCallback(async () => {
    setLoading(true);
    const id = resolveActivePatientId();
    setPatientId(id);

    const notes = await fetchPatientClinicalNotes(id);
    let cards = notes.map(noteToCard);

    // Merge legacy issued-prescriptions cache
    const issued = readJsonLocal<Record<string, unknown>[]>(CLINICAL_STORAGE.issuedPrescriptions, []);
    for (const item of issued) {
      if (String(item.patient_id || id) !== id) continue;
      if (cards.some((c) => c.id === item.id)) continue;
      cards.push({
        id: String(item.id || `rx_${Math.random()}`),
        doctor_name: String(item.doctor_name || 'Consulting Doctor'),
        department: String(item.department || 'OPD'),
        diagnosis_disease: String(item.diagnosis_disease || item.dosage || 'Clinical review'),
        medication_name: String(item.medication_name || 'e-Prescription'),
        dosage: String(item.dosage || 'As directed'),
        instructions: String(item.instructions || item.prescription || ''),
        clinical_advice: String(item.clinical_advice || ''),
        duration: String(item.duration || 'As advised'),
        date_prescribed: String(item.date_prescribed || new Date().toLocaleDateString()),
      });
    }

    cards = cards.sort((a, b) => b.date_prescribed.localeCompare(a.date_prescribed));
    setPrescriptions(cards);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void hydrate(), 0);

    const onNote = (event: Event) => {
      const note = (event as CustomEvent<ClinicalNote>).detail;
      if (!note || note.patient_id !== resolveActivePatientId()) return;
      setPrescriptions((prev) => {
        const card = noteToCard(note);
        if (prev.some((p) => p.id === card.id)) return prev;
        toast.success('Prescription synced to your vault');
        return [card, ...prev];
      });
    };

    window.addEventListener('curasync:clinical-note', onNote);

    const channel = supabase
      .channel(`patient_prescriptions_${patientId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'clinical_notes',
          filter: `patient_id=eq.${patientId}`,
        },
        (payload) => {
          const note = payload.new as ClinicalNote;
          const notes = readJsonLocal<ClinicalNote[]>(CLINICAL_STORAGE.clinicalNotes, []);
          writeJsonLocal(CLINICAL_STORAGE.clinicalNotes, [
            note,
            ...notes.filter((n) => n.id !== note.id),
          ]);
          setPrescriptions((prev) => {
            const card = noteToCard(note);
            if (prev.some((p) => p.id === card.id)) return prev;
            toast.success('New e-Prescription received');
            return [card, ...prev];
          });
        },
      )
      .subscribe();

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('curasync:clinical-note', onNote);
      void supabase.removeChannel(channel);
    };
  }, [hydrate, patientId]);

  return (
    <div className="space-y-8 font-sans text-[#0E2924]">
      <div className="flex flex-col gap-4 border-b border-[#D5E8E3] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0E2924]">Digital Prescriptions</h1>
          <p className="text-xs font-bold text-[#227B6B]">
            Live e-prescriptions from your consulting doctor via clinical_notes realtime sync.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void hydrate()}
          className="flex items-center justify-center gap-2 rounded-2xl border border-[#D5E8E3] bg-white px-5 py-3 text-xs font-black text-[#113831] shadow-sm transition hover:bg-[#EAF5F2]"
        >
          <RefreshCw className="h-4 w-4 text-[#227B6B]" /> Refresh Prescriptions
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-3xl border border-[#D5E8E3] bg-white">
          <div className="flex items-center gap-3 text-xs font-black text-[#113831]">
            <Loader2 className="h-5 w-5 animate-spin text-[#227B6B]" />
            Checking medical records for issued prescriptions...
          </div>
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="space-y-4 rounded-3xl border border-[#D5E8E3] bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#EAF5F2] text-[#227B6B]">
            <FileX className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-[#0E2924]">No Prescriptions Available</h3>
            <p className="mx-auto max-w-md text-xs font-bold text-[#227B6B]">
              Your consulting clinician has not issued a digital prescription yet. Once sent from
              the Doctor Workspace, it appears here instantly.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D5E8E3] bg-[#F4F8F7] px-4 py-1.5 text-[11px] font-extrabold text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-[#227B6B]" /> Real-time sync • Patient ID:{' '}
            {patientId.slice(0, 8)}…
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {prescriptions.map((p) => (
            <div
              key={p.id}
              className="space-y-6 rounded-3xl border border-[#D5E8E3] bg-white p-6 shadow-sm transition hover:border-[#113831]"
            >
              <div className="flex items-center justify-between border-b border-[#EAF5F2] pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#113831] font-black text-white">
                    <Pill className="h-5 w-5 text-[#A6E2D8]" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#0E2924]">{p.doctor_name}</h3>
                    <p className="text-xs font-bold text-[#227B6B]">
                      {p.department} • {p.date_prescribed}
                    </p>
                  </div>
                </div>

                <span className="rounded-full border border-[#227B6B]/20 bg-[#EAF5F2] px-3.5 py-1 text-[10px] font-black uppercase text-[#113831]">
                  Active Prescription
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-2xl border border-[#D5E8E3] bg-[#F4F8F7] px-4 py-3 text-xs font-bold text-[#113831]">
                <Stethoscope className="h-4 w-4 text-[#227B6B]" />
                Diagnosis: {p.diagnosis_disease}
              </div>

              <div className="space-y-2 rounded-2xl border border-[#D5E8E3] bg-[#F4F8F7] p-5">
                <div className="flex items-center justify-between">
                  <h4 className="flex items-center gap-2 text-sm font-black text-[#0E2924]">
                    <FileText className="h-4 w-4 text-[#227B6B]" /> Medications & Dosage
                  </h4>
                  <span className="text-xs font-bold text-slate-500">{p.duration}</span>
                </div>
                <p className="whitespace-pre-wrap text-xs font-bold text-[#113831]">
                  {p.instructions}
                </p>
                {p.clinical_advice ? (
                  <p className="mt-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#227B6B]">
                    Advice: {p.clinical_advice}
                  </p>
                ) : null}
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Digitally Verified Prescription
                </span>

                <button
                  type="button"
                  className="flex items-center gap-2 rounded-2xl bg-[#113831] px-5 py-2.5 text-xs font-black text-white shadow-md transition hover:bg-[#227B6B]"
                >
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
