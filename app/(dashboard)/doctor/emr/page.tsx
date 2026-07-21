'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import { ClinicalPageSkeleton } from '@/components/doctor/ClinicalSkeleton';
import { DoctorModuleShell, PatientHeaderBar, VitalsGrid } from '@/components/doctor/doctor-ui';
import { usePatients, useEmrTimeline } from '@/lib/doctor/hooks/useClinicalQueries';

type TimelineEvent = {
  id: string;
  at: string;
  category: string;
  title: string;
  summary: string;
};

function DoctorEmrContent() {
  const params = useSearchParams();
  const patientId = params.get('patient');
  const { data, isLoading } = usePatients();
  const patient = data?.patients?.find((p) => p.id === patientId) ?? data?.patients?.[0];
  const { data: timelineData } = useEmrTimeline(patient?.id);
  const timeline = timelineData?.events ?? [];

  if (isLoading || !patient) {
    return <ClinicalPageSkeleton rows={4} />;
  }

  return (
    <DoctorModuleShell title="Electronic Medical Record" subtitle="Encounters loaded from PostgreSQL">
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
          { label: 'Temp', value: '37.1', unit: '°C' },
        ]}
      />
      <section className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-black uppercase text-[#0D9488]">Patient timeline</h3>
        <ul className="mt-3 space-y-3">
          {timeline.map((ev) => (
            <li key={ev.id} className="border-l-4 border-[#0D9488] pl-3">
              <p className="text-xs font-bold text-slate-500">
                {new Date(ev.at).toLocaleString('en-IN')} · {ev.category}
              </p>
              <p className="font-bold text-slate-900">{ev.title}</p>
              <p className="text-sm text-slate-600">{ev.summary}</p>
            </li>
          ))}
        </ul>
      </section>
    </DoctorModuleShell>
  );
}

export default function DoctorEmrPage() {
  return (
    <Suspense fallback={<ClinicalPageSkeleton rows={4} />}>
      <DoctorEmrContent />
    </Suspense>
  );
}
