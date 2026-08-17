'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Save, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getDoctorSession } from '@/lib/doctor/session';
import {
  useCompleteEncounter,
  useDoctorContext,
  useDoctorQueue,
} from '@/lib/doctor/command-center/hooks';
import { getConsultationIdForAppointment } from '@/lib/doctor/command-center/supabase-service';
import type { PrescriptionItem } from '@/lib/doctor/command-center/types';
import { ccClasses } from '@/lib/doctor/command-center/theme';

const ICD10_SUGGESTIONS = [
  { code: 'J06.9', label: 'Acute upper respiratory infection' },
  { code: 'I10', label: 'Essential hypertension' },
  { code: 'E11.9', label: 'Type 2 diabetes mellitus' },
  { code: 'J45.909', label: 'Unspecified asthma' },
  { code: 'K21.9', label: 'Gastro-esophageal reflux disease' },
];

const LAB_TESTS = ['CBC', 'LFT', 'RFT', 'HbA1c', 'Lipid Profile', 'TSH'];
const RAD_TESTS = ['Chest X-Ray', 'ECG', 'USG Abdomen', 'MRI Brain', 'CT Chest'];

const emptyItem = (): PrescriptionItem => ({
  medicine_name: '',
  dosage: '',
  frequency: '1-0-1',
  duration: '5 days',
  instructions: 'After food',
});

export function ConsultationWorkspace({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  const session = getDoctorSession();
  const { data: ctx } = useDoctorContext(session.employeeId);
  const doctorUuid = ctx?.doctorUuid ?? '';

  const { data: tokens = [] } = useDoctorQueue({
    employeeId: session.employeeId,
    doctorName: session.fullName || session.doctor_name,
    doctorUuid,
  });
  const token =
    tokens.find((t) => t.appointment_id === appointmentId) ||
    tokens.find((t) => t.id === appointmentId);

  const completeMutation = useCompleteEncounter(doctorUuid);

  const [consultationId, setConsultationId] = useState<string | null>(null);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [symptomInput, setSymptomInput] = useState('');
  const [clinicalExam, setClinicalExam] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [icd10, setIcd10] = useState(ICD10_SUGGESTIONS[0].code);
  const [diagnosis, setDiagnosis] = useState(ICD10_SUGGESTIONS[0].label);
  const [severity, setSeverity] = useState<'Mild' | 'Moderate' | 'Severe' | 'Critical'>('Moderate');
  const [items, setItems] = useState<PrescriptionItem[]>([emptyItem()]);
  const [labs, setLabs] = useState<string[]>([]);
  const [radiology, setRadiology] = useState<string[]>([]);
  const [followUpDate, setFollowUpDate] = useState('');
  const [vitals, setVitals] = useState({
    temperature: '',
    blood_pressure: '',
    pulse: '',
    spo2: '',
    weight: '',
  });

  useEffect(() => {
    if (token?.chief_complaint) setChiefComplaint(token.chief_complaint);
  }, [token?.chief_complaint]);

  useEffect(() => {
    void getConsultationIdForAppointment(appointmentId).then(setConsultationId);
  }, [appointmentId]);

  const toggle = (list: string[], setList: (v: string[]) => void, value: string) => {
    setList(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  };

  const addSymptom = () => {
    const s = symptomInput.trim();
    if (s && !symptoms.includes(s)) setSymptoms([...symptoms, s]);
    setSymptomInput('');
  };

  const handleSign = async () => {
    if (!token) {
      toast.error('No active token linked to this consultation');
      return;
    }
    if (!items.some((i) => i.medicine_name.trim())) {
      toast.error('Add at least one medicine');
      return;
    }

    const cid = consultationId || appointmentId;

    await completeMutation.mutateAsync({
      consultationId: cid,
      patientId: token.patient_id,
      doctorId: doctorUuid,
      doctorName: session.fullName || session.doctor_name,
      chiefComplaint,
      symptoms,
      clinicalExamination: clinicalExam,
      doctorNotes,
      primaryDiagnosis: diagnosis,
      icd10Code: icd10,
      diagnosisSeverity: severity,
      prescriptions: items.filter((i) => i.medicine_name.trim()),
      followUpDate: followUpDate || undefined,
      labTests: [...labs, ...radiology],
      vitals,
      appointmentId: token.appointment_id ?? appointmentId,
    });

    toast.success('Prescription signed · Post-consultation bill dispatched to Patient & Cashier');
    router.push('/doctor/queue/');
  };

  if (!token) {
    return (
      <div className={`p-8 text-center ${ccClasses.card}`}>
        <p className="font-black text-[#173F5F]">Consultation context not found</p>
        <p className="mt-1 text-sm font-semibold text-[#5A7A94]">Return to SmartQ and start a consultation first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className={`p-6 ${ccClasses.card}`}>
        <p className="text-xs font-bold uppercase tracking-wider text-[#2A9D8F]">EMR & Digital Prescription</p>
        <h1 className="mt-1 text-2xl font-black text-[#173F5F]">
          {token.patient_name} · Token #{token.token_number}
        </h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={`space-y-4 p-5 ${ccClasses.card}`}>
          <h2 className="font-black text-[#173F5F]">Vitals</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#5A7A94]">Temperature (°F)</label>
              <input
                value={vitals.temperature}
                onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                placeholder="98.6"
                className={ccClasses.input}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#5A7A94]">Blood Pressure</label>
              <input
                value={vitals.blood_pressure}
                onChange={(e) => setVitals({ ...vitals, blood_pressure: e.target.value })}
                placeholder="120/80"
                className={ccClasses.input}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#5A7A94]">Pulse (bpm)</label>
              <input
                value={vitals.pulse}
                onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })}
                placeholder="72"
                className={ccClasses.input}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#5A7A94]">SpO₂ (%)</label>
              <input
                value={vitals.spo2}
                onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                placeholder="98"
                className={ccClasses.input}
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold text-[#5A7A94]">Weight (kg)</label>
              <input
                value={vitals.weight}
                onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                placeholder="68"
                className={ccClasses.input}
              />
            </div>
          </div>
        </div>

        <div className={`space-y-4 p-5 ${ccClasses.card}`}>
          <div>
            <label className="text-xs font-bold text-[#5A7A94]">Chief Complaint</label>
            <textarea
              rows={2}
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              className={ccClasses.input}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-[#5A7A94]">Symptoms</label>
            <div className="flex gap-2">
              <input
                value={symptomInput}
                onChange={(e) => setSymptomInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSymptom())}
                placeholder="Type symptom and press Enter"
                className={ccClasses.input}
              />
              <button type="button" onClick={addSymptom} className={ccClasses.btnGhost}>
                Add
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {symptoms.map((s) => (
                <span key={s} className="rounded-full bg-[#E8F1F8] px-2 py-0.5 text-xs font-bold text-[#173F5F]">
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-[#5A7A94]">Clinical Examination</label>
            <textarea
              rows={3}
              value={clinicalExam}
              onChange={(e) => setClinicalExam(e.target.value)}
              className={ccClasses.input}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-[#5A7A94]">Doctor Notes</label>
            <textarea
              rows={2}
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              className={ccClasses.input}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-[#5A7A94]">ICD-10 Diagnosis</label>
            <select
              value={icd10}
              onChange={(e) => {
                setIcd10(e.target.value);
                const match = ICD10_SUGGESTIONS.find((s) => s.code === e.target.value);
                if (match) setDiagnosis(match.label);
              }}
              className={ccClasses.input}
            >
              {ICD10_SUGGESTIONS.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.code} — {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-[#5A7A94]">Severity</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as typeof severity)}
              className={ccClasses.input}
            >
              {(['Mild', 'Moderate', 'Severe', 'Critical'] as const).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-[#5A7A94]">Follow-up Date</label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className={ccClasses.input}
            />
          </div>
        </div>

        <div className={`space-y-4 p-5 ${ccClasses.card}`}>
          <div className="flex items-center justify-between">
            <h2 className="font-black text-[#173F5F]">Prescription Builder</h2>
            <button type="button" onClick={() => setItems([...items, emptyItem()])} className={ccClasses.btnGhost}>
              <Plus className="h-4 w-4" /> Add medicine
            </button>
          </div>
          {items.map((item, idx) => (
            <div key={idx} className="space-y-2 rounded-xl border border-[#E8F1F8] p-3">
              <input
                placeholder="Medicine name"
                value={item.medicine_name}
                onChange={(e) => {
                  const next = [...items];
                  next[idx] = { ...item, medicine_name: e.target.value };
                  setItems(next);
                }}
                className={ccClasses.input}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  placeholder="Dosage"
                  value={item.dosage}
                  onChange={(e) => {
                    const next = [...items];
                    next[idx] = { ...item, dosage: e.target.value };
                    setItems(next);
                  }}
                  className={ccClasses.input}
                />
                <input
                  placeholder="Frequency"
                  value={item.frequency}
                  onChange={(e) => {
                    const next = [...items];
                    next[idx] = { ...item, frequency: e.target.value };
                    setItems(next);
                  }}
                  className={ccClasses.input}
                />
              </div>
              <button
                type="button"
                onClick={() => setItems(items.filter((_, i) => i !== idx))}
                className="text-xs font-bold text-[#D9534F]"
              >
                <Trash2 className="mr-1 inline h-3 w-3" /> Remove
              </button>
            </div>
          ))}

          <div className="rounded-xl border border-dashed border-[#2A9D8F]/40 bg-[#F6F9FB] p-4">
            <p className="text-xs font-black uppercase text-[#2A9D8F]">Live Rx Preview</p>
            {items.filter((i) => i.medicine_name).map((i, n) => (
              <p key={n} className="mt-2 text-sm font-semibold text-[#173F5F]">
                {n + 1}. {i.medicine_name} {i.dosage} — {i.frequency} × {i.duration}. {i.instructions}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={`p-5 ${ccClasses.card}`}>
          <h3 className="font-black text-[#173F5F]">Lab Orders</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {LAB_TESTS.map((t) => (
              <label key={t} className="flex cursor-pointer items-center gap-2 text-xs font-bold">
                <input type="checkbox" checked={labs.includes(t)} onChange={() => toggle(labs, setLabs, t)} />
                {t}
              </label>
            ))}
          </div>
        </div>
        <div className={`p-5 ${ccClasses.card}`}>
          <h3 className="font-black text-[#173F5F]">Radiology Orders</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {RAD_TESTS.map((t) => (
              <label key={t} className="flex cursor-pointer items-center gap-2 text-xs font-bold">
                <input
                  type="checkbox"
                  checked={radiology.includes(t)}
                  onChange={() => toggle(radiology, setRadiology, t)}
                />
                {t}
              </label>
            ))}
          </div>
        </div>
      </div>

      <footer className={`flex flex-wrap gap-3 p-5 ${ccClasses.card}`}>
        <button type="button" onClick={() => toast.info('Draft saved locally')} className={ccClasses.btnGhost}>
          <Save className="h-4 w-4" /> Save Draft
        </button>
        <button
          type="button"
          disabled={completeMutation.isPending}
          onClick={() => void handleSign()}
          className={ccClasses.btnAccent}
        >
          {completeMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Sign & Issue Prescription
        </button>
      </footer>
    </div>
  );
}

export default ConsultationWorkspace;
