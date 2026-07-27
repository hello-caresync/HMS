'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { toast } from 'sonner';

import { useCompleteCareCenterConsultation } from '@/lib/doctor/hooks/useCareCenter';
import { useEmrTimeline, useOpdQueue, usePatientLabOrders, usePatients } from '@/lib/doctor/hooks/useClinicalQueries';
import { sageUi } from '@/lib/doctor/ui-tokens';

const STEPS = [
  'Queue',
  'Chief Complaint',
  'HPI',
  'Examination',
  'Diagnosis (ICD-10)',
  'Plan / e-Rx',
  'Sign & Complete',
] as const;

function StepperBar({ step }: { step: number }) {
  return (
    <ol className="mb-6 flex flex-wrap gap-1">
      {STEPS.map((label, i) => (
        <li
          key={label}
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
            i === step
              ? 'bg-brand-primary text-white'
              : i < step
                ? 'bg-brand-light text-brand-text'
                : 'bg-brand-surface text-[#5A584A]'
          }`}
        >
          {i + 1}. {label}
        </li>
      ))}
    </ol>
  );
}

function ConsultationInner() {
  const params = useSearchParams();
  const patientIdParam = params.get('patient');
  const appointmentId = params.get('appointment') ?? '';

  const [step, setStep] = useState(0);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [hpi, setHpi] = useState('');
  const [exam, setExam] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [plan, setPlan] = useState('');

  const { data: queueData } = useOpdQueue();
  const { data: patientsData } = usePatients();
  const queue = queueData?.queue ?? [];
  const patient =
    patientsData?.patients.find((p) => p.id === patientIdParam) ??
    patientsData?.patients.find((p) => p.id === queue[0]?.patientId);
  const { data: labs } = usePatientLabOrders(patient?.id);
  const { data: timeline } = useEmrTimeline(patient?.id);
  const complete = useCompleteCareCenterConsultation();

  const onComplete = () => {
    if (!patient) return;
    complete.mutate(
      {
        appointmentId: appointmentId || queue[0]?.id || 'walk-in',
        patientId: patient.id,
        chiefComplaint: chiefComplaint || hpi.slice(0, 80),
        soapNotes: { s: chiefComplaint, o: exam, a: diagnosis, p: plan },
        diagnosisIcd10: diagnosis ? [{ code: 'R69', label: diagnosis }] : [],
      },
      {
        onSuccess: () => toast.success('Consultation signed & completed'),
        onError: (e) => toast.error(e.message),
      },
    );
  };

  return (
    <div className="doctor-page">
      <header className="mb-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-brand-primary">OPD Consultation</p>
        <h1 className="text-xl font-black text-brand-text">7-Step Clinical Encounter</h1>
      </header>

      <StepperBar step={step} />

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 space-y-4">
          {step === 0 && (
            <div className="doctor-card">
              <h2 className="font-bold">Select from queue</h2>
              <ul className="mt-3 space-y-2">
                {queue.map((q) => (
                  <li key={q.id} className="flex justify-between rounded-lg border border-brand-light px-3 py-2">
                    <span>{q.patientName} · {q.chiefComplaint}</span>
                    <button type="button" className={sageUi.btnPrimary + ' text-xs'} onClick={() => setStep(1)}>
                      Select
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {step === 1 && (
            <div className="doctor-card">
              <label className="text-sm font-bold">Chief Complaint</label>
              <textarea className={`${sageUi.input} mt-2 min-h-[100px]`} value={chiefComplaint} onChange={(e) => setChiefComplaint(e.target.value)} />
            </div>
          )}
          {step === 2 && (
            <div className="doctor-card">
              <label className="text-sm font-bold">History of Present Illness</label>
              <textarea className={`${sageUi.input} mt-2 min-h-[120px]`} value={hpi} onChange={(e) => setHpi(e.target.value)} />
            </div>
          )}
          {step === 3 && (
            <div className="doctor-card">
              <label className="text-sm font-bold">Physical Examination</label>
              <textarea className={`${sageUi.input} mt-2 min-h-[120px]`} value={exam} onChange={(e) => setExam(e.target.value)} />
            </div>
          )}
          {step === 4 && (
            <div className="doctor-card">
              <label className="text-sm font-bold">Diagnosis (ICD-10)</label>
              <input className={`${sageUi.input} mt-2`} placeholder="e.g. I10 Essential hypertension" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
            </div>
          )}
          {step === 5 && (
            <div className="doctor-card">
              <label className="text-sm font-bold">Treatment Plan / e-Rx notes</label>
              <textarea className={`${sageUi.input} mt-2 min-h-[100px]`} value={plan} onChange={(e) => setPlan(e.target.value)} />
              <a href="/doctor/e-prescription" className="mt-2 inline-block text-xs font-bold text-brand-primary hover:underline">
                Open e-Prescription Engine →
              </a>
            </div>
          )}
          {step === 6 && (
            <div className="doctor-card">
              <p className="text-sm">Review and sign to complete encounter for <strong>{patient?.fullName}</strong>.</p>
              <button type="button" className={`${sageUi.btnPrimary} mt-4`} onClick={onComplete}>
                Sign & Complete
              </button>
            </div>
          )}

          <div className="flex gap-2">
            {step > 0 && (
              <button type="button" className={sageUi.btnSecondary} onClick={() => setStep((s) => s - 1)}>
                Back
              </button>
            )}
            {step < 6 && step > 0 && (
              <button type="button" className={sageUi.btnPrimary} onClick={() => setStep((s) => s + 1)}>
                Continue
              </button>
            )}
            {step === 0 && queue.length > 0 && (
              <button type="button" className={sageUi.btnPrimary} onClick={() => setStep(1)}>
                Start with first patient
              </button>
            )}
          </div>
        </div>

        {/* Pre-encounter context panel */}
        <aside className="col-span-12 space-y-4 lg:col-span-4">
          {patient && (
            <div className="doctor-card">
              <p className="font-bold">{patient.fullName}</p>
              <p className="text-xs text-[#5A584A]">{patient.mrn} · {patient.age}y · {patient.gender}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {(patient.allergies ?? []).map((a) => (
                  <span key={a} className={sageUi.allergyBadge}>{a}</span>
                ))}
              </div>
            </div>
          )}
          <div className="doctor-card-surface">
            <h3 className="text-sm font-bold">Recent Vitals</h3>
            <p className="mt-1 text-xs text-[#5A584A]">BP 128/82 · HR 78 · Temp 36.8°C · SpO₂ 98%</p>
          </div>
          <div className="doctor-card-surface">
            <h3 className="text-sm font-bold">Recent Labs</h3>
            <ul className="mt-1 space-y-1 text-xs">
              {((labs?.orders ?? []) as { testCodesJson?: string[]; status?: string }[]).slice(0, 3).map((o, i) => (
                <li key={i}>{Array.isArray(o.testCodesJson) ? o.testCodesJson.join(', ') : 'Lab panel'} · {o.status}</li>
              ))}
              {!labs?.orders?.length && <li className="text-[#5A584A]">No recent labs</li>}
            </ul>
          </div>
          <div className="doctor-card-surface">
            <h3 className="text-sm font-bold">Timeline</h3>
            <ul className="mt-1 space-y-1 text-xs">
              {(timeline?.events ?? []).slice(0, 4).map((e) => (
                <li key={e.id}>{e.title}</li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function ConsultationStepperWorkspace() {
  return (
    <Suspense fallback={<p className="p-6 text-sm">Loading consultation…</p>}>
      <ConsultationInner />
    </Suspense>
  );
}
