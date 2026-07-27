'use client';

import { useState } from 'react';
import { BedDouble, FileText, Stethoscope, X } from 'lucide-react';
import { toast } from 'sonner';

import { DigitalSignaturePad, PatientHeaderBar, VitalsGrid } from '@/components/doctor/doctor-ui';
import { Button } from '@/components/ui/button';
import {
  useSaveCareCenterProgressNote,
  useSubmitCareCenterDischarge,
} from '@/lib/doctor/hooks/useCareCenter';
import { useEmrTimeline } from '@/lib/doctor/hooks/useClinicalQueries';
import { createStatLabOrder } from '@/lib/doctor/client/clinical-data-service';
import { useCareCenterStore } from '@/lib/doctor/stores/care-center-store';
import { sageUi } from '@/lib/doctor/ui-tokens';

export default function CareCenterIpdDrawer() {
  const open = useCareCenterStore((s) => s.ipdDrawerOpen);
  const patient = useCareCenterStore((s) => s.selectedIpd);
  const section = useCareCenterStore((s) => s.ipdSection);
  const close = useCareCenterStore((s) => s.closeIpdPatient);

  const saveNote = useSaveCareCenterProgressNote();
  const discharge = useSubmitCareCenterDischarge();

  const [soap, setSoap] = useState({ s: '', o: '', a: '', p: '' });
  const [dischargeSummary, setDischargeSummary] = useState('');
  const [followUp, setFollowUp] = useState('OPD follow-up in 7 days');

  const { data: timelineData } = useEmrTimeline(patient?.patientId);

  if (!open || !patient) return null;

  const onSaveProgress = () => {
    saveNote.mutate(
      { admissionId: patient.id, note: soap },
      {
        onSuccess: () => {
          toast.success('Progress note saved · nursing updated');
          setSoap({ s: '', o: '', a: '', p: '' });
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  const onDischarge = () => {
    if (!dischargeSummary.trim()) {
      toast.error('Discharge summary required');
      return;
    }
    discharge.mutate(
      {
        admissionId: patient.id,
        patientId: patient.patientId,
        summary: dischargeSummary,
        followUp,
      },
      {
        onSuccess: (res) => {
          toast.success(`Discharge approved · ${res.synced.join(', ')}`);
          close();
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  return (
    <>
      <button type="button" className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={close} aria-label="Close" />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-3xl flex-col border-l border-[#C7C39E]/40 bg-[#FAFAF5]/95 shadow-2xl backdrop-blur-xl">
        <header className="flex items-center justify-between border-b border-[#E6E3C5] px-4 py-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#A39E75]">IPD · {section}</p>
            <h2 className="text-lg font-black">
              {patient.patient.fullName} · {patient.ward} Bed {patient.bed}
            </h2>
          </div>
          <button type="button" onClick={close} className="rounded-lg p-2 hover:bg-[#E6E3C5]/50" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <PatientHeaderBar
            name={patient.patient.fullName}
            mrn={patient.patient.mrn}
            age={patient.patient.age}
            gender={patient.patient.gender}
            bloodGroup={patient.patient.bloodGroup ?? '—'}
            allergies={patient.patient.allergies}
          />

          {(section === 'summary' || section === 'round') && (
            <div className={`${sageUi.cardSolid} mt-4 grid gap-2 p-4 text-sm sm:grid-cols-2`}>
              <p><BedDouble className="mr-1 inline h-4 w-4" aria-hidden />Admission: {new Date(patient.admissionDate).toLocaleString()}</p>
              <p><Stethoscope className="mr-1 inline h-4 w-4" aria-hidden />Diagnosis: {patient.primaryDiagnosis}</p>
              <p>LOS: {patient.losDays} days · Risk: {patient.riskLevel}</p>
              <p>Condition: {patient.currentCondition}</p>
            </div>
          )}

          {section === 'summary' && (
            <ul className="mt-4 space-y-2">
              {(timelineData?.events ?? []).map((ev) => (
                <li key={ev.id} className={`${sageUi.card} p-3 text-sm`}>
                  <p className="font-bold">{ev.title}</p>
                  <p className="text-xs text-[#5C5A4E]">{ev.at} · {ev.summary}</p>
                </li>
              ))}
            </ul>
          )}

          {section === 'round' && (
            <div className="mt-4 space-y-4">
              <VitalsGrid
                items={[
                  { label: 'BP', value: '118/76', unit: 'mmHg' },
                  { label: 'HR', value: '72', unit: 'bpm' },
                  { label: 'SpO₂', value: '97', unit: '%' },
                  { label: 'I/O', value: '+450', unit: 'ml' },
                ]}
              />
              <div className="grid gap-3">
                {(['s', 'o', 'a', 'p'] as const).map((key) => (
                  <div key={key}>
                    <label className="text-[10px] font-bold uppercase text-[#A39E75]">Progress · {key.toUpperCase()}</label>
                    <textarea
                      className={`${sageUi.input} mt-1 min-h-[64px]`}
                      value={soap[key]}
                      onChange={(e) => setSoap((p) => ({ ...p, [key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={onSaveProgress} disabled={saveNote.isPending}>Save Progress Note</Button>
                <Button variant="secondary" onClick={() => createStatLabOrder({ patientId: patient.patientId, tests: ['BMP'] }).then(() => toast.success('Lab ordered'))}>
                  Order Lab
                </Button>
                <Button variant="secondary" onClick={() => toast.success('ICU transfer request sent')}>Request ICU</Button>
                <Button variant="secondary" onClick={() => toast.success('Surgery request queued')}>Request Surgery</Button>
              </div>
            </div>
          )}

          {section === 'discharge' && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-[#A39E75]">
                  <FileText className="mr-1 inline h-3.5 w-3.5" aria-hidden />
                  Discharge Summary
                </label>
                <textarea
                  className={`${sageUi.input} mt-1 min-h-[120px]`}
                  value={dischargeSummary}
                  onChange={(e) => setDischargeSummary(e.target.value)}
                  placeholder="Final diagnosis, hospital course, medications, instructions…"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-[#A39E75]">Follow-up</label>
                <input className={`${sageUi.input} mt-1`} value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
              </div>
              <DigitalSignaturePad onApply={() => toast.success('Signature applied')} />
              <Button className={`w-full ${sageUi.btnPrimary}`} onClick={onDischarge} disabled={discharge.isPending}>
                Approve Discharge · Notify Billing · Pharmacy · Patient App
              </Button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
