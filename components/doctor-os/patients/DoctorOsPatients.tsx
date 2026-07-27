'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Heart, Pill, ScanLine, Stethoscope, Users } from 'lucide-react';

import {
  OsBadge,
  OsBtn,
  OsPage,
  OsSegment,
  OsSkeleton,
  OsTimeline,
  OsWidget,
} from '@/components/doctor-os/ui/OsPrimitives';
import { usePatients, useEmrTimeline } from '@/lib/doctor/hooks/useClinicalQueries';
import { useOsColors } from '@/lib/doctor-os/store';

function PatientWorkspaceInner() {
  const c = useOsColors();
  const params = useSearchParams();
  const selectedId = params.get('patient');
  const [view, setView] = useState('summary');
  const { data, isLoading } = usePatients();
  const patients = data?.patients ?? [];
  const active = patients.find((p) => p.id === selectedId) ?? patients[0];
  const { data: timelineData } = useEmrTimeline(active?.id);

  const timelines = useMemo(
    () => ({
      summary: [{ time: 'Active', title: active?.fullName ?? '—', meta: `${active?.mrn} · ${active?.age}y ${active?.gender}` }],
      health: (timelineData?.events ?? []).map((e) => ({ time: e.at, title: e.title, meta: e.summary })),
      vitals: [{ time: 'Latest', title: 'BP 128/82', meta: 'HR 72 · SpO₂ 98%' }],
      meds: [{ time: 'Active', title: 'Metformin 500mg BD', meta: 'Amlodipine 5mg OD' }],
      labs: [{ time: 'Today', title: 'HbA1c 7.2%', meta: 'Processing: LFT' }],
      rad: [{ time: 'Pending', title: 'CXR portable', meta: 'In review' }],
    }),
    [active, timelineData],
  );

  return (
    <OsPage>
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: c.accent }}>Patient workspace</p>
        <h1 className="text-[24px] font-bold tracking-[-0.03em]">Clinical chart</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Patient list — cards not table */}
        <aside className="space-y-2 lg:col-span-3">
          {isLoading ? (
            <OsSkeleton className="h-20" />
          ) : (
            patients.map((p) => (
              <motion.a
                key={p.id}
                href={`/doctor/patients?patient=${p.id}`}
                whileHover={{ x: 4 }}
                className="block rounded-xl border p-3"
                style={{
                  backgroundColor: active?.id === p.id ? c.accentSoft : c.surface,
                  borderColor: active?.id === p.id ? c.accent : c.border,
                }}
              >
                <p className="font-semibold">{p.fullName}</p>
                <p className="text-[11px]" style={{ color: c.textSecondary }}>{p.mrn}</p>
                {p.allergies?.length > 0 && <OsBadge tone="critical" >{p.allergies[0]}</OsBadge>}
              </motion.a>
            ))
          )}
        </aside>

        {/* Main content */}
        <div className="lg:col-span-9">
          {active && (
            <div
              className="mb-4 overflow-hidden rounded-2xl p-6"
              style={{ background: 'linear-gradient(135deg, #0071E3 0%, #5856D6 100%)' }}
            >
              <div className="flex flex-wrap items-start justify-between gap-4 text-white">
                <div>
                  <h2 className="text-[22px] font-bold">{active.fullName}</h2>
                  <p className="text-[13px] text-white/80">{active.mrn} · {active.age}y · {active.gender} · {active.bloodGroup}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(active.allergies?.length ? active.allergies : ['NKDA']).map((a) => (
                      <span key={a} className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">{a}</span>
                    ))}
                  </div>
                </div>
                <OsBtn href={`/doctor/clinical?patient=${active.id}`} variant="secondary" className="!bg-white !text-[#0071E3]">
                  Start consultation
                </OsBtn>
              </div>
            </div>
          )}

          <OsSegment
            value={view}
            onChange={setView}
            options={[
              { id: 'summary', label: 'Summary' },
              { id: 'health', label: 'Timeline' },
              { id: 'vitals', label: 'Vitals' },
              { id: 'meds', label: 'Medications' },
              { id: 'labs', label: 'Labs' },
              { id: 'rad', label: 'Radiology' },
            ]}
          />

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <OsWidget title={view.charAt(0).toUpperCase() + view.slice(1)} span={2}>
              <OsTimeline items={timelines[view as keyof typeof timelines] ?? timelines.summary} />
            </OsWidget>
            <OsWidget title="AI summary" accent="ai">
              <p className="text-[13px] leading-relaxed" style={{ color: c.textSecondary }}>
                {active?.chronicConditions?.join(', ') || 'No chronic conditions on file.'} Patient stable for outpatient management. Review latest labs before medication changes.
              </p>
              <OsBtn variant="secondary" size="sm" className="mt-3" href="/doctor/clinical">Generate AI brief</OsBtn>
            </OsWidget>
            <OsWidget title="Family & insurance">
              <p className="text-[13px]" style={{ color: c.textSecondary }}>Insurance verification pending · Emergency contact on file</p>
            </OsWidget>
          </div>
        </div>
      </div>
    </OsPage>
  );
}

export default function DoctorOsPatients() {
  return (
    <Suspense fallback={<OsSkeleton className="h-96" />}>
      <PatientWorkspaceInner />
    </Suspense>
  );
}
