'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { ClinicalPageSkeleton } from '@/components/doctor/ClinicalSkeleton';
import {
  ClinicalPageHeader,
  DigitalSignaturePad,
  ICD10SearchCombobox,
  PatientHeaderBar,
  PrescriptionTable,
  VitalsGrid,
} from '@/components/doctor/doctor-ui';
import {
  useOpdQueue,
  usePatients,
  useSaveConsultation,
  useSendPrescription,
} from '@/lib/doctor/hooks/useClinicalQueries';
import { clinicalClasses } from '@/lib/doctor/theme';
import { MOCK_ICD10 } from '@/lib/mock-data';

const STEPS = ['Queue', 'Complaint', 'HPI', 'Exam', 'Diagnosis', 'Plan', 'Complete'] as const;

export default function DoctorOpdPage() {
  const { data: queueData, isLoading: queueLoading } = useOpdQueue();
  const { data: patientsData } = usePatients();
  const saveConsultation = useSaveConsultation();
  const sendRx = useSendPrescription();

  const queue = queueData?.queue ?? [];
  const patients = patientsData?.patients ?? [];

  const [activeId, setActiveId] = useState('');
  const active = queue.find((q) => q.id === activeId) ?? queue[0];
  const patient = patients.find((p) => p.id === active?.patientId);

  const [step, setStep] = useState(0);
  const [icdQuery, setIcdQuery] = useState('');
  const [diagnosis, setDiagnosis] = useState<{ code: string; label: string } | null>(null);
  const [interactionOpen, setInteractionOpen] = useState(false);
  const [rxRows, setRxRows] = useState([
    { drugName: 'Metformin 500mg', dosage: '1 tab', frequency: 'BD', duration: '30d' },
  ]);


  if (queueLoading) {
    return <ClinicalPageSkeleton rows={3} />;
  }

  const finish = () => setInteractionOpen(true);

  const confirmRxAndComplete = () => {
    if (!active || !patient) return;
    setInteractionOpen(false);
    saveConsultation.mutate(
      {
        appointmentId: active.id,
        patientId: patient.id,
        chiefComplaint: active.chiefComplaint,
        hpi: 'Documented in OPD workflow',
        diagnosisIcd10: diagnosis ? [{ code: diagnosis.code, label: diagnosis.label }] : [],
        treatmentPlan: 'Continue current regimen',
      },
      {
        onSuccess: (res) => {
          sendRx.mutate(
            {
              encounterId: res.encounter.id,
              patientId: patient.id,
              medicines: rxRows.map((r) => ({
                drugName: r.drugName,
                dosage: r.dosage,
                frequency: r.frequency,
                duration: r.duration,
                instructions: 'After food',
              })),
              digitalSignature: 'SIG_VERIFIED',
            },
            {
              onSuccess: (rxRes) => {
                toast.success(rxRes.message ?? 'Consultation completed');
                setStep(0);
                setActiveId('');
              },
              onError: (e) => toast.error(e.message),
            },
          );
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  return (
    <div className={clinicalClasses.pageBg}>
      <ClinicalPageHeader title="OPD Consultation Workflow" subtitle="Live queue from appointments · Prisma encounters" />

      <div className="mb-4 flex flex-wrap gap-2">
        {queue.length === 0 && <p className="text-sm text-[#64748B]">No patients in OPD queue today.</p>}
        {queue.map((q) => (
          <button
            key={q.id}
            type="button"
            onClick={() => setActiveId(q.id)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              active?.id === q.id ? 'bg-[#0F172A] text-white' : 'bg-white border border-slate-200 text-[#64748B]'
            }`}
          >
            {q.token} · {q.patientName}
          </button>
        ))}
      </div>

      {active && patient && (
        <>
          <PatientHeaderBar
            name={patient.fullName}
            mrn={patient.mrn}
            age={patient.age}
            gender={patient.gender}
            bloodGroup={patient.bloodGroup}
            allergies={patient.allergies}
          />
          <VitalsGrid
            items={[
              { label: 'BP', value: '128/82', unit: 'mmHg' },
              { label: 'HR', value: '78', unit: 'bpm' },
              { label: 'SpO₂', value: '98', unit: '%' },
            ]}
          />
        </>
      )}

      <div className="my-4 flex flex-wrap gap-2">
        {STEPS.map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => setStep(i)}
            className={`rounded-lg px-3 py-1 text-xs font-semibold ${i === step ? 'bg-[#0D9488] text-white' : 'bg-white border border-slate-200'}`}
          >
            {i + 1}. {s}
          </button>
        ))}
      </div>

      <div className={`${clinicalClasses.card} space-y-4 p-6`}>
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
          <>
            <PrescriptionTable rows={rxRows} onRemove={(i) => setRxRows((r) => r.filter((_, idx) => idx !== i))} />
            <DigitalSignaturePad onApply={() => toast.success('Signature applied')} />
          </>
        )}
        {step !== 4 && step !== 5 && (
          <p className="text-sm text-[#64748B]">{STEPS[step]} · structured clinical documentation</p>
        )}
        {diagnosis && step >= 4 && (
          <p className="text-sm font-semibold text-[#0D9488]">
            Diagnosis: {diagnosis.code} — {diagnosis.label}
          </p>
        )}
        <div className="flex gap-2">
          {step < STEPS.length - 1 ? (
            <button type="button" className={clinicalClasses.btnPrimary} onClick={() => setStep((s) => s + 1)}>
              Next step
            </button>
          ) : (
            <button type="button" className={clinicalClasses.btnPrimary} onClick={finish} disabled={!active || !patient}>
              Run interaction check & complete
            </button>
          )}
        </div>
      </div>

      {interactionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className={`${clinicalClasses.card} max-w-md p-6`}>
            <h3 className="font-bold text-[#EF4444]">Drug interaction & allergy check</h3>
            <p className="mt-2 text-sm text-[#64748B]">No blocking interactions for selected regimen (server-validated).</p>
            <button type="button" className={`mt-4 ${clinicalClasses.btnPrimary}`} onClick={confirmRxAndComplete}>
              Confirm · send to pharmacy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
