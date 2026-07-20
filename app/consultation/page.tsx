'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, Stethoscope, User } from 'lucide-react';

type LifestyleKey = 'smoking' | 'alcohol' | 'diet' | 'exercise';

type LifestyleState = Record<LifestyleKey, boolean>;

type VitalsState = {
  temperature: string;
  bloodPressure: string;
  pulse: string;
  respiratoryRate: string;
  spo2: string;
  heightCm: string;
  weightKg: string;
};

const SESSION_STATUS =
  'Standalone encounter recording · sandbox patient initials only · vitals auto-BMI · 13 Jul 2026';

const PATIENT_PROFILE = {
  initials: 'P.N.',
  uhid: 'NX-2026-301882',
  age: 35,
  gender: 'Female',
  bloodGroup: 'B+',
  allergies: ['Penicillin', 'Sulfa drugs'],
  chronicDiseases: ['Type 2 Diabetes', 'Hypertension'],
};

const LIFESTYLE_OPTIONS: { key: LifestyleKey; label: string }[] = [
  { key: 'smoking', label: 'Smoking' },
  { key: 'alcohol', label: 'Alcohol' },
  { key: 'diet', label: 'Balanced Diet' },
  { key: 'exercise', label: 'Regular Exercise' },
];

const INPUT_CLASS =
  'w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-950 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200';

const TEXTAREA_CLASS = `${INPUT_CLASS} min-h-[88px] resize-y`;

const VITAL_INPUT_CLASS =
  'w-full rounded-lg border-2 border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black tabular-nums text-slate-950 placeholder:text-slate-500 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200';

function parsePositiveNumber(value: string): number | null {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function computeBmi(heightCm: string, weightKg: string): string | null {
  const height = parsePositiveNumber(heightCm);
  const weight = parsePositiveNumber(weightKg);
  if (height === null || weight === null) return null;
  const heightM = height / 100;
  const bmi = weight / (heightM * heightM);
  return bmi.toFixed(1);
}

export default function StandaloneConsultationPage() {
  const [chiefComplaint, setChiefComplaint] = useState('Fever, Headache, Vomiting');
  const [historyOfPresentIllness, setHistoryOfPresentIllness] = useState(
    'Patient reports 3-day history of intermittent fever (up to 101°F), frontal headache, and two episodes of non-bloody vomiting. No recent travel. Sandbox narrative only.',
  );
  const [pastMedicalHistory, setPastMedicalHistory] = useState(
    'Type 2 Diabetes · Hypertension · no prior surgeries in last 12 months',
  );
  const [familyHistory, setFamilyHistory] = useState(
    'Father — CAD · Mother — Type 2 Diabetes',
  );
  const [surgicalHistory, setSurgicalHistory] = useState('None reported in sandbox profile');
  const [physicalExamination, setPhysicalExamination] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [differentialDiagnosis, setDifferentialDiagnosis] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [followUpAdvice, setFollowUpAdvice] = useState('');
  const [lifestyle, setLifestyle] = useState<LifestyleState>({
    smoking: false,
    alcohol: false,
    diet: true,
    exercise: true,
  });
  const [vitals, setVitals] = useState<VitalsState>({
    temperature: '100.4',
    bloodPressure: '128/82',
    pulse: '88',
    respiratoryRate: '18',
    spo2: '98',
    heightCm: '162',
    weightKg: '68',
  });
  const [finalizeNote, setFinalizeNote] = useState<string | null>(null);

  const bmi = useMemo(
    () => computeBmi(vitals.heightCm, vitals.weightKg),
    [vitals.heightCm, vitals.weightKg],
  );

  const updateVital = (field: keyof VitalsState, value: string) => {
    setVitals((prev) => ({ ...prev, [field]: value }));
  };

  const toggleLifestyle = (key: LifestyleKey) => {
    setLifestyle((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFinalize = () => {
    setFinalizeNote(
      `Encounter signed · ${PATIENT_PROFILE.uhid} · ${PATIENT_PROFILE.initials} · sandbox simulation only`,
    );
    window.setTimeout(() => setFinalizeNote(null), 5000);
  };

  return (
    <div className="min-h-screen w-full font-sans text-slate-950 selection:bg-slate-200">
      <div className="w-full space-y-5 p-4 sm:p-6 lg:p-8">
        {/* Clinical workspace header */}
        <header className="flex w-full flex-col gap-4 border-b-2 border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Active Patient Consultation Room
            </h1>
            <p className="mt-1 max-w-3xl text-sm font-medium leading-relaxed text-slate-800">
              {SESSION_STATUS}
            </p>
          </div>
          <div className="inline-flex shrink-0 items-center gap-2 rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-950 shadow-sm">
            <Stethoscope className="h-4 w-4 text-emerald-700" aria-hidden />
            <span>CLINICAL_ENCOUNTER_ACTIVE</span>
          </div>
        </header>

        {/* Patient summary banner */}
        <section
          aria-label="Patient summary profile"
          className="w-full rounded-xl border border-slate-200/80 bg-white shadow-[0_4px_16px_-4px_rgba(0,117,140,0.03)] p-4 shadow-sm sm:p-5"
        >
          <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 flex-1 items-start gap-4">
              <div
                className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border-2 border-slate-200 bg-slate-100 text-slate-800"
                aria-hidden
              >
                <User className="h-10 w-10" />
              </div>
              <div className="min-w-0 space-y-1">
                <p className="text-lg font-black text-slate-950">{PATIENT_PROFILE.initials}</p>
                <p className="font-mono text-sm font-black text-slate-950">
                  UHID · {PATIENT_PROFILE.uhid}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-bold text-slate-950">
                  <span>Age · {PATIENT_PROFILE.age} yrs</span>
                  <span>Gender · {PATIENT_PROFILE.gender}</span>
                  <span>Blood Group · {PATIENT_PROFILE.bloodGroup}</span>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:flex-col xl:flex-row">
              <div className="min-w-[200px] rounded-lg border-2 border-amber-400 bg-amber-50 p-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-amber-950">
                  Allergies
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {PATIENT_PROFILE.allergies.map((item) => (
                    <span
                      key={item}
                      className="inline-flex rounded-md border border-red-400 bg-red-50 px-2 py-0.5 text-xs font-black text-red-950"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div className="min-w-[200px] rounded-lg border-2 border-rose-300 bg-rose-50 p-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-rose-950">
                  Chronic Diseases
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {PATIENT_PROFILE.chronicDiseases.map((item) => (
                    <span
                      key={item}
                      className="inline-flex rounded-md border border-amber-400 bg-amber-100 px-2 py-0.5 text-xs font-black text-amber-950"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {finalizeNote && (
          <p
            role="status"
            className="w-full rounded-lg border-2 border-emerald-400 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-950"
          >
            {finalizeNote}
          </p>
        )}

        {/* Three-column workspace */}
        <div className="grid w-full grid-cols-1 gap-5 xl:grid-cols-3">
          {/* Column 1 — intake & history */}
          <section
            aria-label="Patient intake and history"
            className="w-full space-y-4 rounded-xl border border-slate-200/80 bg-white shadow-[0_4px_16px_-4px_rgba(0,117,140,0.03)] p-4 shadow-sm sm:p-5"
          >
            <h2 className="text-base font-black text-slate-950">Patient Intake &amp; History</h2>

            <label className="block space-y-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                Chief Complaint
              </span>
              <input
                type="text"
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                className={INPUT_CLASS}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                History of Present Illness
              </span>
              <textarea
                value={historyOfPresentIllness}
                onChange={(e) => setHistoryOfPresentIllness(e.target.value)}
                className={TEXTAREA_CLASS}
                rows={4}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                Past Medical History
              </span>
              <textarea
                value={pastMedicalHistory}
                onChange={(e) => setPastMedicalHistory(e.target.value)}
                className={TEXTAREA_CLASS}
                rows={3}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                Family History
              </span>
              <textarea
                value={familyHistory}
                onChange={(e) => setFamilyHistory(e.target.value)}
                className={TEXTAREA_CLASS}
                rows={2}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                Surgical History
              </span>
              <textarea
                value={surgicalHistory}
                onChange={(e) => setSurgicalHistory(e.target.value)}
                className={TEXTAREA_CLASS}
                rows={2}
              />
            </label>

            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-wider text-slate-800">
                Lifestyle History
              </p>
              <div className="flex flex-wrap gap-2">
                {LIFESTYLE_OPTIONS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleLifestyle(key)}
                    className={`rounded-lg border-2 px-3 py-1.5 text-xs font-black transition-colors ${
                      lifestyle[key]
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-950'
                        : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Column 2 — examination & vitals */}
          <section
            aria-label="Clinical examination and vitals"
            className="w-full space-y-4 rounded-xl border border-slate-200/80 bg-white shadow-[0_4px_16px_-4px_rgba(0,117,140,0.03)] p-4 shadow-sm sm:p-5"
          >
            <h2 className="text-base font-black text-slate-950">
              Clinical Examination &amp; Vitals
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-800">
                  Temperature (°F)
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={vitals.temperature}
                  onChange={(e) => updateVital('temperature', e.target.value)}
                  className={VITAL_INPUT_CLASS}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-800">
                  Blood Pressure (mmHg)
                </span>
                <input
                  type="text"
                  value={vitals.bloodPressure}
                  onChange={(e) => updateVital('bloodPressure', e.target.value)}
                  className={VITAL_INPUT_CLASS}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-800">Pulse (bpm)</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={vitals.pulse}
                  onChange={(e) => updateVital('pulse', e.target.value)}
                  className={VITAL_INPUT_CLASS}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-800">
                  Respiratory Rate (bpm)
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={vitals.respiratoryRate}
                  onChange={(e) => updateVital('respiratoryRate', e.target.value)}
                  className={VITAL_INPUT_CLASS}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-800">
                  Oxygen Saturation (%)
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={vitals.spo2}
                  onChange={(e) => updateVital('spo2', e.target.value)}
                  className={VITAL_INPUT_CLASS}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-800">Height (cm)</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={vitals.heightCm}
                  onChange={(e) => updateVital('heightCm', e.target.value)}
                  className={VITAL_INPUT_CLASS}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-800">Weight (kg)</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={vitals.weightKg}
                  onChange={(e) => updateVital('weightKg', e.target.value)}
                  className={VITAL_INPUT_CLASS}
                />
              </label>
              <div className="flex flex-col justify-end rounded-lg border-2 border-slate-200 bg-slate-100 px-3 py-2">
                <span className="text-[10px] font-black uppercase text-slate-800">BMI (calc)</span>
                <span className="mt-1 text-xl font-black tabular-nums text-slate-950">
                  {bmi ?? '—'}
                </span>
              </div>
            </div>

            <label className="block space-y-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                Physical Examination
              </span>
              <textarea
                value={physicalExamination}
                onChange={(e) => setPhysicalExamination(e.target.value)}
                placeholder="Document general appearance, HEENT, chest, abdomen, neuro findings…"
                className={`${TEXTAREA_CLASS} min-h-[160px]`}
                rows={6}
              />
            </label>
          </section>

          {/* Column 3 — evaluation & Rx */}
          <section
            aria-label="Clinical evaluation and prescription outcome"
            className="w-full space-y-4 rounded-xl border border-slate-200/80 bg-white shadow-[0_4px_16px_-4px_rgba(0,117,140,0.03)] p-4 shadow-sm sm:p-5"
          >
            <h2 className="text-base font-black text-slate-950">
              Clinical Evaluation &amp; Rx Outcome
            </h2>

            <label className="block space-y-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                Clinical Notes
              </span>
              <textarea
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                className={TEXTAREA_CLASS}
                rows={3}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                Diagnosis
              </span>
              <textarea
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className={TEXTAREA_CLASS}
                rows={2}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                Differential Diagnosis
              </span>
              <textarea
                value={differentialDiagnosis}
                onChange={(e) => setDifferentialDiagnosis(e.target.value)}
                className={TEXTAREA_CLASS}
                rows={2}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                Treatment Plan
              </span>
              <textarea
                value={treatmentPlan}
                onChange={(e) => setTreatmentPlan(e.target.value)}
                className={TEXTAREA_CLASS}
                rows={3}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                Follow-up Advice
              </span>
              <textarea
                value={followUpAdvice}
                onChange={(e) => setFollowUpAdvice(e.target.value)}
                placeholder="Return in 7 days · repeat CBC · hydration advice…"
                className={TEXTAREA_CLASS}
                rows={3}
              />
            </label>

            <button
              type="button"
              onClick={handleFinalize}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-emerald-500 bg-emerald-600 px-4 py-3 text-sm font-black uppercase tracking-wide text-white shadow-sm transition-colors hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <CheckCircle2 className="h-5 w-5" aria-hidden />
              Sign &amp; Finalize Encounter
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
