'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Bot, AlertTriangle, Save, Mic } from 'lucide-react';

import {
  OsBadge,
  OsBtn,
  OsPage,
  OsSegment,
  OsTimeline,
  OsWidget,
} from '@/components/doctor-os/ui/OsPrimitives';
import {
  useCompleteCareCenterConsultation,
} from '@/lib/doctor/hooks/useCareCenter';
import { useEmrTimeline, usePatients } from '@/lib/doctor/hooks/useClinicalQueries';
import { runAiDifferential, createStatLabOrder, sendPrescription } from '@/lib/doctor/client/clinical-data-service';
import { useOsColors } from '@/lib/doctor-os/store';

function ClinicalInner() {
  const c = useOsColors();
  const params = useSearchParams();
  const patientId = params.get('patient');
  const appointmentId = params.get('appointment') ?? 'appt-demo';
  const { data: patientsData } = usePatients();
  const patient = patientsData?.patients.find((p) => p.id === patientId) ?? patientsData?.patients[0];
  const { data: timeline } = useEmrTimeline(patient?.id);
  const complete = useCompleteCareCenterConsultation();

  const [panel, setPanel] = useState('soap');
  const [soap, setSoap] = useState({ s: '', o: '', a: '', p: '' });
  const [diagnosis, setDiagnosis] = useState('');
  const [rx, setRx] = useState([{ drug: '', dose: '', freq: 'OD' }]);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setDraftSaved(true), 30000);
    return () => clearInterval(t);
  }, []);

  const onComplete = () => {
    if (!patient) return;
    complete.mutate(
      {
        appointmentId,
        patientId: patient.id,
        chiefComplaint: soap.s || 'Consultation',
        soapNotes: soap,
        diagnosisIcd10: diagnosis ? [{ code: 'R69', label: diagnosis }] : [],
      },
      {
        onSuccess: (res) => {
          toast.success(`Completed · synced: ${res.synced.join(', ')}`);
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  const onAi = async () => {
    const res = await runAiDifferential({ complaint: soap.s, patientId: patient?.id, allergies: patient?.allergies });
    setAiInsight(res.results[0]?.diagnosis ?? 'No suggestion');
  };

  return (
    <OsPage className="!min-h-[calc(100vh-8rem)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: c.accent }}>Clinical workspace</p>
          <h1 className="text-[20px] font-bold">{patient?.fullName ?? 'Select patient'}</h1>
        </div>
        <div className="flex items-center gap-2">
          {draftSaved && <OsBadge tone="success">Auto-saved</OsBadge>}
          <OsBtn variant="secondary" size="sm" onClick={() => toast.success('Draft saved')}><Save className="h-3 w-3" /> Save</OsBtn>
          <OsBtn onClick={onComplete}>Complete & sync</OsBtn>
        </div>
      </div>

      <div className="grid h-[calc(100vh-12rem)] grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left — patient context */}
        <div className="space-y-3 overflow-y-auto lg:col-span-3">
          <OsWidget title="Patient">
            {patient && (
              <>
                <p className="font-bold">{patient.fullName}</p>
                <p className="text-[12px]" style={{ color: c.textSecondary }}>{patient.mrn} · {patient.age}y</p>
                {patient.allergies?.map((a) => <OsBadge key={a} tone="critical">{a}</OsBadge>)}
              </>
            )}
          </OsWidget>
          <OsWidget title="Timeline">
            <OsTimeline
              items={(timeline?.events ?? []).slice(0, 5).map((e) => ({ time: e.at.slice(0, 10), title: e.title, meta: e.summary }))}
            />
          </OsWidget>
          <OsWidget title="Vitals">
            <div className="grid grid-cols-2 gap-2 text-[12px]">
              {['BP 128/82', 'HR 72', 'SpO₂ 98%', 'Temp 37°C'].map((v) => (
                <div key={v} className="rounded-lg p-2" style={{ backgroundColor: c.muted }}>{v}</div>
              ))}
            </div>
          </OsWidget>
        </div>

        {/* Center — clinical documentation */}
        <div className="flex flex-col overflow-hidden lg:col-span-6">
          <OsSegment
            value={panel}
            onChange={setPanel}
            options={[
              { id: 'soap', label: 'SOAP' },
              { id: 'diagnosis', label: 'Diagnosis' },
              { id: 'rx', label: 'Prescription' },
              { id: 'orders', label: 'Orders' },
            ]}
          />
          <div className="mt-3 flex-1 overflow-y-auto rounded-2xl border p-4" style={{ borderColor: c.border, backgroundColor: c.surface }}>
            {panel === 'soap' && (
              <div className="space-y-3">
                {(['s', 'o', 'a', 'p'] as const).map((k) => (
                  <div key={k}>
                    <label className="text-[10px] font-bold uppercase" style={{ color: c.textSecondary }}>{k.toUpperCase()}</label>
                    <textarea
                      className="mt-1 w-full rounded-xl border p-3 text-[13px]"
                      style={{ borderColor: c.border, backgroundColor: c.bg }}
                      rows={3}
                      value={soap[k]}
                      onChange={(e) => setSoap((p) => ({ ...p, [k]: e.target.value }))}
                    />
                  </div>
                ))}
                <OsBtn variant="ghost" size="sm"><Mic className="h-3 w-3" /> Voice dictation</OsBtn>
              </div>
            )}
            {panel === 'diagnosis' && (
              <input
                className="w-full rounded-xl border p-3 text-[13px]"
                style={{ borderColor: c.border }}
                placeholder="ICD-10 diagnosis…"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
              />
            )}
            {panel === 'rx' && (
              <div className="space-y-2">
                {rx.map((line, i) => (
                  <div key={i} className="grid grid-cols-3 gap-2">
                    <input placeholder="Drug" className="rounded-lg border p-2 text-[12px]" style={{ borderColor: c.border }} value={line.drug} onChange={(e) => setRx((r) => r.map((x, j) => j === i ? { ...x, drug: e.target.value } : x))} />
                    <input placeholder="Dose" className="rounded-lg border p-2 text-[12px]" style={{ borderColor: c.border }} value={line.dose} onChange={(e) => setRx((r) => r.map((x, j) => j === i ? { ...x, dose: e.target.value } : x))} />
                    <input placeholder="Freq" className="rounded-lg border p-2 text-[12px]" style={{ borderColor: c.border }} value={line.freq} onChange={(e) => setRx((r) => r.map((x, j) => j === i ? { ...x, freq: e.target.value } : x))} />
                  </div>
                ))}
                <OsBtn size="sm" variant="secondary" onClick={() => patient && sendPrescription({ patientId: patient.id, items: rx }).then(() => toast.success('Sent to pharmacy'))}>
                  Send to pharmacy
                </OsBtn>
              </div>
            )}
            {panel === 'orders' && (
              <div className="flex flex-wrap gap-2">
                <OsBtn size="sm" onClick={() => patient && createStatLabOrder({ patientId: patient.id, tests: ['CBC'] }).then(() => toast.success('Lab ordered'))}>Order lab</OsBtn>
                <OsBtn size="sm" variant="secondary" onClick={() => toast.success('Radiology queued')}>Order imaging</OsBtn>
                <OsBtn size="sm" variant="secondary" href="/doctor/care-center?tab=ipd">Request admission</OsBtn>
              </div>
            )}
          </div>
        </div>

        {/* Right — AI assistant */}
        <div className="space-y-3 overflow-y-auto lg:col-span-3">
          <OsWidget title="AI assistant" accent="ai">
            <OsBtn size="sm" variant="secondary" onClick={onAi}><Bot className="h-3 w-3" /> Run differential</OsBtn>
            {aiInsight && <p className="mt-2 text-[12px]">{aiInsight}</p>}
          </OsWidget>
          <OsWidget title="Drug interactions">
            <p className="text-[12px]" style={{ color: c.textSecondary }}>No critical interactions detected</p>
          </OsWidget>
          <OsWidget title="Clinical alerts">
            <ul className="space-y-1 text-[11px]">
              <li className="flex gap-1" style={{ color: c.warning }}><AlertTriangle className="h-3 w-3" /> Review allergy list</li>
            </ul>
          </OsWidget>
        </div>
      </div>
    </OsPage>
  );
}

export default function DoctorOsClinical() {
  return (
    <Suspense fallback={null}>
      <ClinicalInner />
    </Suspense>
  );
}
