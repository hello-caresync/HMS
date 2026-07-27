'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, Radio } from 'lucide-react';
import { toast } from 'sonner';

import { ClinicalPageSkeleton } from '@/components/doctor/ClinicalSkeleton';
import {
  TraumaAssessmentFields,
  emptyTraumaForm,
  traumaFormHasContent,
} from '@/components/doctor/emergency/TraumaAssessmentFields';
import { ClinicalDrawer } from '@/components/doctor/modules/ClinicalDrawer';
import { ClinicalPageHeader, CriticalAlertBanner, VitalsGrid } from '@/components/doctor/doctor-ui';
import {
  useEmergencyAction,
  useEmergencyCases,
  type EmergencyCaseDto,
} from '@/lib/doctor/hooks/useClinicalQueries';
import { clinicalClasses } from '@/lib/doctor/theme';

function PulseAlertBanner({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#EF4444]/40 bg-red-50 p-4">
      <span className="relative flex h-4 w-4">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#EF4444] opacity-75" />
        <span className="relative inline-flex h-4 w-4 rounded-full bg-[#EF4444]" />
      </span>
      <p className="text-sm font-semibold text-[#0F172A]">ESI 1–2 · pulse alert active</p>
      <Radio className="ml-auto h-5 w-5 animate-pulse text-[#EF4444]" />
    </div>
  );
}

export default function EmergencySuite() {
  const { data, isLoading, isError, error } = useEmergencyCases();
  const emergencyAction = useEmergencyAction();
  const [pulse, setPulse] = useState(true);
  const [assessCase, setAssessCase] = useState<EmergencyCaseDto | null>(null);
  const [traumaForm, setTraumaForm] = useState(emptyTraumaForm);
  const [bannerMessages, setBannerMessages] = useState<string[]>([]);

  const cases = data?.cases ?? [];
  const highPriority = useMemo(() => cases.filter((c) => c.esiLevel <= 2), [cases]);

  useEffect(() => {
    if (assessCase) setTraumaForm(emptyTraumaForm());
  }, [assessCase?.id]);

  const runStat = (c: EmergencyCaseDto, type: 'lab' | 'rad' | 'assess' | 'icu') => {
    const notesPayload =
      type === 'assess' || (type === 'icu' && traumaFormHasContent(traumaForm))
        ? JSON.stringify(traumaForm)
        : undefined;

    emergencyAction.mutate(
      {
        patientId: c.patientId ?? undefined,
        esiLevel: c.esiLevel,
        title: c.patientName,
        body: c.presentation,
        bay: c.bay,
        vitalsSnapshot: type === 'icu' ? c.vitals : undefined,
        icuAdmission: type === 'icu' ? true : undefined,
        statLabTests: type === 'lab' ? ['Troponin', 'CBC', 'ABG'] : undefined,
        statRadiology: type === 'rad' ? { modality: 'CT', bodyPart: 'Chest' } : undefined,
        traumaNotes: type === 'assess' || type === 'icu' ? notesPayload : undefined,
      },
      {
        onSuccess: () => {
          const msg =
            type === 'lab'
              ? 'STAT Lab requested'
              : type === 'rad'
                ? 'STAT radiology ordered'
                : type === 'icu'
                  ? 'ICU admission triggered (vitals + ESI)'
                  : 'Assessment saved';
          toast.success(msg);
          setBannerMessages((m) => [`${c.bay} · action recorded`, ...m].slice(0, 4));
          if (type === 'icu' || type === 'assess') setAssessCase(null);
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  if (isLoading) return <ClinicalPageSkeleton />;
  if (isError) {
    return <p className="text-sm text-[#EF4444]">{(error as Error).message}</p>;
  }

  return (
    <div className={clinicalClasses.pageBg}>
      <ClinicalPageHeader
        title="Emergency Cases & Triage"
        subtitle="Prisma + Supabase Realtime"
        actions={
          <button type="button" className={clinicalClasses.btnSecondary} onClick={() => setPulse((p) => !p)}>
            {pulse ? 'Silence pulse' : 'Enable pulse'}
          </button>
        }
      />
      <PulseAlertBanner active={pulse && highPriority.length > 0} />
      <CriticalAlertBanner messages={bannerMessages} />

      <ul className="space-y-3">
        {cases.map((c) => (
          <li key={c.id} className={`${clinicalClasses.card} p-4 ${c.esiLevel <= 2 ? 'border-l-4 border-l-[#EF4444]' : ''}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className={`text-xs font-bold ${c.esiLevel <= 2 ? 'text-[#EF4444]' : 'text-[#F59E0B]'}`}>ESI {c.esiLevel}</p>
                <p className="font-bold">{c.patientName}</p>
                <p className="text-sm text-[#64748B]">{c.presentation} · {c.bay}</p>
              </div>
              {c.esiLevel <= 2 && <Activity className="h-6 w-6 animate-pulse text-[#EF4444]" />}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className={clinicalClasses.btnCritical} onClick={() => runStat(c, 'lab')}>
                STAT lab
              </button>
              <button type="button" className={clinicalClasses.btnSecondary} onClick={() => runStat(c, 'rad')}>
                STAT radiology
              </button>
              <button type="button" className={clinicalClasses.btnPrimary} onClick={() => setAssessCase(c)}>
                Trauma assessment
              </button>
            </div>
          </li>
        ))}
      </ul>

      <ClinicalDrawer open={!!assessCase} title={`Trauma · ${assessCase?.patientName ?? ''}`} wide onClose={() => setAssessCase(null)}>
        {assessCase && (
          <>
            <p className="mb-2 text-sm font-semibold text-[#0F172A]">
              ESI {assessCase.esiLevel} · {assessCase.bay}
            </p>
            <VitalsGrid
              items={[
                { label: 'BP', value: assessCase.vitals.bp },
                { label: 'HR', value: assessCase.vitals.hr },
                { label: 'GCS', value: assessCase.vitals.gcs },
              ]}
            />
            <TraumaAssessmentFields
              form={traumaForm}
              onChange={(field, value) => setTraumaForm((f) => ({ ...f, [field]: value }))}
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                className={clinicalClasses.btnCritical}
                disabled={emergencyAction.isPending}
                onClick={() => runStat(assessCase, 'icu')}
              >
                Trigger ICU admission
              </button>
              <button
                type="button"
                className={clinicalClasses.btnSecondary}
                disabled={emergencyAction.isPending}
                onClick={() => runStat(assessCase, 'assess')}
              >
                Save trauma notes only
              </button>
            </div>
          </>
        )}
      </ClinicalDrawer>
    </div>
  );
}
