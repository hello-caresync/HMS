'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { Activity, Check, ChevronRight, Heart, Pill, Stethoscope } from 'lucide-react';
import { toast } from 'sonner';

import PrescriptionBuilder from '@/components/doctor/prescriptions/PrescriptionBuilder';
import { ClinicalPageSkeleton } from '@/components/doctor/ClinicalSkeleton';
import {
  ClinicalPageHeader,
  DigitalSignaturePad,
  ICD10SearchCombobox,
  PatientHeaderBar,
  VitalsGrid,
} from '@/components/doctor/doctor-ui';
import {
  useOpdQueue,
  usePatients,
  useSaveConsultation,
} from '@/lib/doctor/hooks/useClinicalQueries';
import { sageUi } from '@/lib/doctor/ui-tokens';
import { MOCK_ICD10 } from '@/lib/mock-data';

const STEPS = [
  'Queue',
  'Chief Complaint',
  'HPI',
  'Exam',
  'Diagnosis',
  'Plan/e-Rx',
  'Sign',
] as const;

const EXAM_CHECKLIST = [
  'General appearance · alert & oriented',
  'Cardiovascular · S1 S2 normal · no murmurs',
  'Respiratory · clear bilaterally',
  'Abdomen · soft · non-tender',
  'Neurological · GCS 15 · no focal deficit',
  'Musculoskeletal · full ROM · no swelling',
] as const;

const COMPLAINT_SUGGESTIONS = ['Fatigue', 'Chest pain', 'Fever', 'Abdominal pain', 'Dyspnea', 'Headache'];

const PRE_VISIT_MEDS = ['Metformin 500 mg BD', 'Amlodipine 5 mg OD', 'Atorvastatin 10 mg HS'];

function PreEncounterSnapshot({ patientName }: { patientName: string }) {
  return (
    <div className={`${sageUi.cardSolid} flex h-full flex-col gap-4 p-4`}>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#5C5A4E]">Pre-encounter snapshot</p>
        <p className="mt-1 text-sm font-black text-[#2B2A22]">{patientName}</p>
      </div>

      <section>
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-[#A39E75]">
          <Activity className="h-3.5 w-3.5" aria-hidden />
          Vitals trend (3 visits)
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {[
            { label: 'BP', values: '128→132→128', unit: 'mmHg' },
            { label: 'HR', values: '78→88→72', unit: 'bpm' },
          ].map((v) => (
            <div key={v.label} className="rounded-lg border border-[#E6E3C5] bg-[#FAFAF5] p-2">
              <p className="text-[10px] font-bold text-[#5C5A4E]">{v.label}</p>
              <p className="text-xs font-black tabular-nums">{v.values}</p>
              <p className="text-[10px] text-[#5C5A4E]">{v.unit}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-[#A39E75]">
          <Pill className="h-3.5 w-3.5" aria-hidden />
          Active medications
        </p>
        <ul className="mt-2 space-y-1">
          {PRE_VISIT_MEDS.map((m) => (
            <li key={m} className="rounded-md bg-[#E6E3C5]/50 px-2 py-1 text-xs font-semibold">
              {m}
            </li>
          ))}
        </ul>
      </section>

      <section className="min-h-0 flex-1">
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-[#A39E75]">
          <Heart className="h-3.5 w-3.5" aria-hidden />
          Previous visit summaries
        </p>
        <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto text-xs">
          <li className="rounded-lg border border-[#E6E3C5] p-2">
            <p className="font-bold">14 Jul 2026 · OPD</p>
            <p className="text-[#5C5A4E]">HbA1c 7.8% · Metformin uptitrated · lifestyle counsel</p>
          </li>
          <li className="rounded-lg border border-[#E6E3C5] p-2">
            <p className="font-bold">02 Jul 2026 · Telehealth</p>
            <p className="text-[#5C5A4E]">BP controlled · continue amlodipine · repeat labs in 6 wk</p>
          </li>
        </ul>
      </section>
    </div>
  );
}

function ConsultationsFlow() {
  const params = useSearchParams();
  const queueHint = params.get('queue');
  const { data: queueData, isLoading } = useOpdQueue();
  const { data: patientsData } = usePatients();
  const saveConsultation = useSaveConsultation();

  const queue = queueData?.queue ?? [];
  const patients = patientsData?.patients ?? [];
  const [activeId, setActiveId] = useState(queueHint ?? '');
  const active = queue.find((q) => q.id === activeId) ?? queue[0];
  const patient = patients.find((p) => p.id === active?.patientId);

  const [step, setStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [complaint, setComplaint] = useState('');
  const [hpi, setHpi] = useState('');
  const [examNotes, setExamNotes] = useState('');
  const [examChecks, setExamChecks] = useState<Record<string, boolean>>({});
  const [icdQuery, setIcdQuery] = useState('');
  const [diagnosis, setDiagnosis] = useState<{ code: string; label: string } | null>(null);

  const stepLabel = useMemo(() => STEPS[step], [step]);

  const goToStep = (index: number) => {
    setStep(index);
  };

  const advanceStep = () => {
    setCompletedSteps((prev) => new Set(prev).add(step));
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  };

  if (isLoading) return <ClinicalPageSkeleton rows={3} />;

  const completeEncounter = () => {
    if (!active || !patient) return;
    saveConsultation.mutate(
      {
        appointmentId: active.id,
        patientId: patient.id,
        chiefComplaint: complaint || active.chiefComplaint,
        hpi,
        physicalExam: { notes: examNotes, systems: examChecks },
        diagnosisIcd10: diagnosis ? [{ code: diagnosis.code, label: diagnosis.label }] : [],
      },
      {
        onSuccess: () => {
          toast.success('Encounter signed & completed');
          setStep(0);
          setCompletedSteps(new Set());
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  return (
    <div className={sageUi.page}>
      <ClinicalPageHeader
        title="Consultations"
        subtitle="7-step encounter · pre-visit intelligence · ICD-10 · e-Rx · digital sign-off"
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {queue.map((q) => (
          <button
            key={q.id}
            type="button"
            onClick={() => {
              setActiveId(q.id);
              setComplaint(q.chiefComplaint);
            }}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              active?.id === q.id
                ? 'bg-[#A39E75] text-white'
                : 'border border-[#C7C39E] bg-[#F7F6E8] text-[#5C5A4E]'
            }`}
          >
            {q.token} · {q.patientName}
          </button>
        ))}
      </div>

      {active && patient && (
        <PatientHeaderBar
          name={patient.fullName}
          mrn={patient.mrn}
          age={patient.age}
          gender={patient.gender}
          bloodGroup={patient.bloodGroup}
          allergies={patient.allergies}
        />
      )}

      <nav className="my-4 flex flex-wrap gap-1" aria-label="Encounter steps">
        {STEPS.map((s, i) => {
          const done = completedSteps.has(i) || i < step;
          const current = i === step;
          return (
            <button
              key={s}
              type="button"
              onClick={() => goToStep(i)}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-bold sm:text-xs ${
                current
                  ? sageUi.segmentActive
                  : done
                    ? 'border border-[#A39E75]/40 bg-[#E6E3C5]/60 text-[#2B2A22]'
                    : 'border border-[#E6E3C5] bg-white text-[#5C5A4E]'
              }`}
            >
              {done && !current ? <Check className="h-3 w-3 text-[#A39E75]" aria-hidden /> : null}
              {i + 1}. {s}
            </button>
          );
        })}
      </nav>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className={`${sageUi.cardSolid} space-y-4 p-5 xl:col-span-7`}>
          <p className="flex items-center gap-2 text-xs font-bold uppercase text-[#5C5A4E]">
            <Stethoscope className="h-4 w-4 text-[#A39E75]" aria-hidden />
            Step {step + 1} · {stepLabel}
          </p>

          {step === 0 && (
            <div className="rounded-xl border border-[#E6E3C5] bg-[#FAFAF5] p-4 text-sm">
              {active ? (
                <>
                  <p className="font-black">{active.token} · {active.patientName}</p>
                  <p className="mt-1 text-[#5C5A4E]">{active.chiefComplaint}</p>
                  <p className="mt-2 text-xs font-semibold text-[#A39E75]">Queue position · ready for rooming</p>
                </>
              ) : (
                'Select a queue token to begin.'
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <input
                list="complaint-suggestions"
                className={sageUi.input}
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                placeholder="Chief complaint (smart autocomplete)…"
              />
              <datalist id="complaint-suggestions">
                {COMPLAINT_SUGGESTIONS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          )}

          {step === 2 && (
            <textarea
              className={`${sageUi.input} min-h-[120px]`}
              value={hpi}
              onChange={(e) => setHpi(e.target.value)}
              placeholder="History of present illness · onset, duration, modifiers…"
            />
          )}

          {step === 3 && (
            <>
              <VitalsGrid
                items={[
                  { label: 'BP', value: '128/82', unit: 'mmHg' },
                  { label: 'HR', value: '88', unit: 'bpm', critical: true },
                  { label: 'SpO₂', value: '98', unit: '%' },
                  { label: 'Temp', value: '37.0', unit: '°C' },
                ]}
              />
              <p className="text-[10px] font-bold uppercase text-[#5C5A4E]">Physical exam checklist</p>
              <ul className="space-y-2">
                {EXAM_CHECKLIST.map((item) => (
                  <li key={item}>
                    <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-[#E6E3C5] px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={!!examChecks[item]}
                        onChange={(e) => setExamChecks((c) => ({ ...c, [item]: e.target.checked }))}
                        className="mt-0.5 accent-[#A39E75]"
                      />
                      <span>{item}</span>
                    </label>
                  </li>
                ))}
              </ul>
              <textarea
                className={`${sageUi.input} min-h-[80px]`}
                value={examNotes}
                onChange={(e) => setExamNotes(e.target.value)}
                placeholder="Additional exam notes…"
              />
            </>
          )}

          {step === 4 && (
            <ICD10SearchCombobox
              value={icdQuery}
              onChange={setIcdQuery}
              options={MOCK_ICD10}
              onSelect={(code, label) => {
                setDiagnosis({ code, label });
                setIcdQuery(`${code} — ${label}`);
              }}
            />
          )}

          {step === 5 && (
            <p className="text-sm text-[#5C5A4E]">
              e-Prescription engine active in the right pane · protocol kits · allergy guards enabled.
            </p>
          )}

          {step === 6 && <DigitalSignaturePad onApply={() => toast.success('Signature applied')} />}

          <div className="flex gap-2 pt-2">
            {step < STEPS.length - 1 ? (
              <button type="button" className={sageUi.btnPrimary} onClick={advanceStep}>
                Next <ChevronRight className="ml-1 inline h-4 w-4" />
              </button>
            ) : (
              <button type="button" className={sageUi.btnPrimary} onClick={completeEncounter} disabled={!active}>
                Sign &amp; complete
              </button>
            )}
          </div>
        </div>

        <div className="xl:col-span-5">
          {step >= 5 ? (
            <PrescriptionBuilder />
          ) : patient ? (
            <PreEncounterSnapshot patientName={patient.fullName} />
          ) : (
            <div className={`${sageUi.card} p-4 text-sm text-[#5C5A4E]`}>Select a patient from the queue.</div>
          )}
          {diagnosis && step < 5 ? (
            <p className="mt-3 rounded-lg border border-[#A39E75]/30 bg-[#E6E3C5]/40 px-3 py-2 text-xs font-bold">
              Working Dx: {diagnosis.code} — {diagnosis.label}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function ConsultationsWorkspace() {
  return (
    <Suspense fallback={<ClinicalPageSkeleton rows={3} />}>
      <ConsultationsFlow />
    </Suspense>
  );
}
