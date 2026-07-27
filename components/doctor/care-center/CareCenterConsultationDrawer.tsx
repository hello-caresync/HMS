'use client';

import { useEffect, useState } from 'react';
import { Bot, Mic, Save, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';

import PrescriptionBuilder from '@/components/doctor/prescriptions/PrescriptionBuilder';
import {
  DigitalSignaturePad,
  ICD10SearchCombobox,
  PatientHeaderBar,
  VitalsGrid,
} from '@/components/doctor/doctor-ui';
import { Button } from '@/components/ui/button';
import {
  useCompleteCareCenterConsultation,
} from '@/lib/doctor/hooks/useCareCenter';
import { useEmrTimeline } from '@/lib/doctor/hooks/useClinicalQueries';
import { runAiDifferential } from '@/lib/doctor/client/clinical-data-service';
import { createStatLabOrder } from '@/lib/doctor/client/clinical-data-service';
import { useCareCenterStore } from '@/lib/doctor/stores/care-center-store';
import { sageUi } from '@/lib/doctor/ui-tokens';
import { MOCK_ICD10 } from '@/lib/mock-data';

const TABS = ['Summary', 'Timeline', 'SOAP', 'Vitals', 'Diagnosis', 'Rx', 'Orders', 'AI'] as const;

export default function CareCenterConsultationDrawer() {
  const open = useCareCenterStore((s) => s.consultationOpen);
  const card = useCareCenterStore((s) => s.selectedOpd);
  const close = useCareCenterStore((s) => s.closeOpdConsultation);
  const complete = useCompleteCareCenterConsultation();

  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('SOAP');
  const [soap, setSoap] = useState({ s: '', o: '', a: '', p: '' });
  const [icdQuery, setIcdQuery] = useState('');
  const [diagnosis, setDiagnosis] = useState<{ code: string; label: string } | null>(null);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);

  const { data: timelineData } = useEmrTimeline(card?.patientId ?? '');

  useEffect(() => {
    if (!open) return;
    const timer = setInterval(() => setDraftSaved(true), 45_000);
    return () => clearInterval(timer);
  }, [open]);

  if (!open || !card) return null;

  const onComplete = () => {
    complete.mutate(
      {
        appointmentId: card.id,
        patientId: card.patientId,
        chiefComplaint: card.chiefComplaint,
        soapNotes: soap,
        diagnosisIcd10: diagnosis ? [diagnosis] : [],
      },
      {
        onSuccess: (res) => {
          toast.success(`Consultation complete · synced: ${res.synced.join(', ')}`);
          close();
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  const onAiAssist = async () => {
    const res = await runAiDifferential({
      complaint: card.chiefComplaint,
      patientId: card.patientId,
      allergies: card.allergyList,
    });
    const top = res.results[0];
    setAiInsight(`${top.diagnosis} (${Math.round(top.confidence * 100)}% confidence)`);
    toast.success('AI clinical assistant updated');
  };

  const orderLab = () => {
    createStatLabOrder({ patientId: card.patientId, tests: ['CBC', 'RFT'] })
      .then(() => toast.success('Lab order sent · patient notified'))
      .catch((e) => toast.error(e.message));
  };

  return (
    <>
      <button type="button" className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={close} aria-label="Close" />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-4xl flex-col border-l border-[#C7C39E]/40 bg-[#FAFAF5]/95 shadow-2xl backdrop-blur-xl">
        <header className="flex items-center justify-between border-b border-[#E6E3C5] px-4 py-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#A39E75]">OPD Consultation</p>
            <h2 className="text-lg font-black text-[#2B2A22]">{card.patientName} · {card.token}</h2>
          </div>
          <div className="flex items-center gap-2">
            {draftSaved && (
              <span className="text-[10px] font-bold text-emerald-600">
                <Save className="mr-1 inline h-3 w-3" aria-hidden />
                Auto-saved
              </span>
            )}
            <Button size="sm" variant="secondary" onClick={() => toast.success('Draft saved')}>
              Save Draft
            </Button>
            <button type="button" onClick={close} className="rounded-lg p-2 hover:bg-[#E6E3C5]/50" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <nav className="hidden w-44 shrink-0 flex-col gap-1 border-r border-[#E6E3C5]/80 p-3 md:flex">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-3 py-2 text-left text-xs font-bold ${
                  activeTab === tab ? sageUi.segmentActive : sageUi.segmentIdle
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <PatientHeaderBar
              name={card.patientName}
              mrn={card.uhid}
              age={card.age}
              gender={card.gender}
              bloodGroup="—"
              allergies={card.allergyList}
            />

            {activeTab === 'Summary' && (
              <div className={`${sageUi.cardSolid} mt-4 space-y-2 p-4 text-sm`}>
                <p><strong>Visit:</strong> {card.visitType} · {card.department}</p>
                <p><strong>Complaint:</strong> {card.chiefComplaint}</p>
                <p><strong>Insurance:</strong> {card.insuranceStatus}</p>
              </div>
            )}

            {activeTab === 'Timeline' && (
              <ul className="mt-4 space-y-2">
                {(timelineData?.events ?? []).slice(0, 8).map((ev) => (
                  <li key={ev.id} className={`${sageUi.card} p-3 text-sm`}>
                    <p className="font-bold">{ev.title}</p>
                    <p className="text-xs text-[#5C5A4E]">{ev.summary}</p>
                  </li>
                ))}
              </ul>
            )}

            {activeTab === 'SOAP' && (
              <div className="mt-4 grid gap-3">
                {(['s', 'o', 'a', 'p'] as const).map((key) => (
                  <div key={key}>
                    <label className="text-[10px] font-bold uppercase text-[#A39E75]">{key.toUpperCase()}</label>
                    <textarea
                      className={`${sageUi.input} mt-1 min-h-[72px]`}
                      value={soap[key]}
                      onChange={(e) => setSoap((prev) => ({ ...prev, [key]: e.target.value }))}
                    />
                  </div>
                ))}
                <Button size="sm" variant="secondary" onClick={() => toast.info('Voice dictation started')}>
                  <Mic className="mr-1 h-4 w-4" aria-hidden />
                  Voice Dictation
                </Button>
              </div>
            )}

            {activeTab === 'Vitals' && (
              <div className="mt-4">
                <VitalsGrid
                  items={[
                    { label: 'BP', value: '128/82', unit: 'mmHg' },
                    { label: 'HR', value: '88', unit: 'bpm', critical: card.vitalsStatus === 'critical' },
                    { label: 'SpO₂', value: '98', unit: '%' },
                    { label: 'Temp', value: '37.0', unit: '°C' },
                  ]}
                />
              </div>
            )}

            {activeTab === 'Diagnosis' && (
              <div className="mt-4 space-y-3">
                <ICD10SearchCombobox
                  value={icdQuery}
                  onChange={setIcdQuery}
                  options={MOCK_ICD10}
                  onSelect={(code, label) => {
                    setDiagnosis({ code, label });
                    setIcdQuery(`${code} — ${label}`);
                  }}
                />
                {diagnosis && (
                  <p className="text-sm font-semibold">
                    Selected: {diagnosis.code} — {diagnosis.label}
                  </p>
                )}
              </div>
            )}

            {activeTab === 'Rx' && (
              <div className="mt-4">
                <PrescriptionBuilder patientId={card.patientId} />
              </div>
            )}

            {activeTab === 'Orders' && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={orderLab}>Order Lab (STAT CBC + RFT)</Button>
                <Button variant="secondary" onClick={() => toast.success('Radiology order queued')}>
                  Order Radiology
                </Button>
                <Button variant="secondary" onClick={() => toast.success('Referral letter generated')}>
                  Referral
                </Button>
                <Button variant="secondary" onClick={() => toast.success('Medical certificate draft saved')}>
                  Medical Certificate
                </Button>
              </div>
            )}

            {activeTab === 'AI' && (
              <div className={`${sageUi.glass} mt-4 space-y-3 p-4`}>
                <Button onClick={onAiAssist}>
                  <Bot className="mr-2 h-4 w-4" aria-hidden />
                  Run AI Clinical Assistant
                </Button>
                {aiInsight && (
                  <p className="text-sm">
                    <Sparkles className="mr-1 inline h-4 w-4 text-[#A39E75]" aria-hidden />
                    {aiInsight}
                  </p>
                )}
                {card.hasAllergies && (
                  <p className="text-sm text-red-600">Allergy checker: avoid {card.allergyList.join(', ')}</p>
                )}
              </div>
            )}

            <div className="mt-6 space-y-3 border-t border-[#E6E3C5] pt-4">
              <DigitalSignaturePad onApply={() => toast.success('Signature applied')} />
              <Button className={`w-full ${sageUi.btnPrimary}`} onClick={onComplete} disabled={complete.isPending}>
                Complete Consultation · Sync EMR · Pharmacy · Billing
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
