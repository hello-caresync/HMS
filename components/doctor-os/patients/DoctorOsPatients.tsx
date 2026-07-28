'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { Activity, Heart, Pill } from 'lucide-react';

import { usePatients, useEmrTimeline } from '@/lib/doctor/hooks/useClinicalQueries';
import { sageUi } from '@/lib/doctor/ui-tokens';

const VITALS_SPARKLINE = [118, 122, 128, 125, 128, 130, 128];

function VitalsSparkline({ values }: { values: number[] }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = 100 - ((v - min) / range) * 80 - 10;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg viewBox="0 0 100 40" className="h-10 w-full" aria-hidden>
      <polyline fill="none" stroke="#A39E75" strokeWidth="2" points={points} />
    </svg>
  );
}

function PatientWorkspaceInner() {
  const params = useSearchParams();
  const selectedId = params.get('patient');
  const [drawer, setDrawer] = useState<'timeline' | 'meds' | 'vitals'>('timeline');
  const { data, isLoading } = usePatients();
  const patients = data?.patients ?? [];
  const active = patients.find((p) => p.id === selectedId) ?? patients[0];
  const { data: timelineData } = useEmrTimeline(active?.id);

  const timeline = useMemo(
    () => (timelineData?.events ?? []).map((e) => ({ time: e.at, title: e.title, meta: e.summary })),
    [timelineData],
  );

  return (
    <div className="doctor-page">
      <header className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-widest text-brand-primary">Patient workspace</p>
        <h1 className="text-xl font-black text-brand-text">Clinical chart & EMR</h1>
      </header>

      <div className="grid grid-cols-12 gap-6">
        <aside className="col-span-12 space-y-2 lg:col-span-3">
          {isLoading ? (
            <div className="doctor-card h-20 animate-pulse bg-brand-surface" />
          ) : (
            patients.map((p) => (
              <a
                key={p.id}
                href={`/doctor/patients?patient=${p.id}`}
                className={`block rounded-xl border p-3 transition-all ${
                  active?.id === p.id
                    ? 'border-brand-primary bg-brand-light shadow-sage'
                    : 'border-brand-light bg-white hover:border-brand-primary/40'
                }`}
              >
                <p className="font-semibold text-brand-text">{p.fullName}</p>
                <p className="text-[11px] text-[#5A584A]">{p.mrn}</p>
                {p.allergies?.length > 0 && (
                  <span className="allergy-badge mt-1">{p.allergies[0]}</span>
                )}
              </a>
            ))
          )}
        </aside>

        <div className="col-span-12 lg:col-span-5">
          {active && (
            <div className="doctor-card mb-4 border-2 border-brand-light bg-gradient-to-br from-brand-surface to-white">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-brand-text">{active.fullName}</h2>
                  <p className="text-sm text-[#5A584A]">
                    {active.mrn} · {active.age}y · {active.gender} · {active.bloodGroup}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(active.allergies?.length ? active.allergies : ['NKDA']).map((a) => (
                      <span key={a} className={sageUi.allergyBadge}>{a}</span>
                    ))}
                  </div>
                </div>
                <a href={`/doctor/opd-consultation?patient=${active.id}`} className={sageUi.btnPrimary + ' text-xs'}>
                  Start consultation
                </a>
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="doctor-card">
              <div className="mb-2 flex items-center gap-2 text-sm font-bold">
                <Heart className="h-4 w-4 text-brand-primary" aria-hidden />
                Vitals trend (BP systolic)
              </div>
              <VitalsSparkline values={VITALS_SPARKLINE} />
              <p className="mt-1 text-xs text-[#5A584A]">Latest: BP 128/82 · HR 72 · SpO₂ 98%</p>
            </div>
            <div className="doctor-card">
              <div className="mb-2 flex items-center gap-2 text-sm font-bold">
                <Pill className="h-4 w-4 text-brand-primary" aria-hidden />
                Active medications
              </div>
              <ul className="space-y-1 text-sm">
                <li>Metformin 500mg BD</li>
                <li>Amlodipine 5mg OD</li>
              </ul>
            </div>
          </div>

          <div className="doctor-card mt-4">
            <div className="mb-3 flex gap-2">
              {(['timeline', 'meds', 'vitals'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDrawer(d)}
                  className={`rounded-full px-3 py-1 text-[11px] font-bold capitalize ${
                    drawer === d ? sageUi.segmentActive : sageUi.segmentIdle
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            {drawer === 'timeline' && (
              <ul className="space-y-2 text-sm">
                {timeline.length ? timeline.map((t, i) => (
                  <li key={i} className="rounded-lg border border-brand-light px-3 py-2">
                    <p className="font-semibold">{t.title}</p>
                    <p className="text-xs text-[#5A584A]">{t.time} · {t.meta}</p>
                  </li>
                )) : (
                  <li className="text-[#5A584A]">No timeline events yet.</li>
                )}
              </ul>
            )}
            {drawer === 'meds' && (
              <ul className="space-y-1 text-sm">
                <li>Metformin 500mg — Active since Jan 2026</li>
                <li>Amlodipine 5mg — Active since Mar 2025</li>
              </ul>
            )}
            {drawer === 'vitals' && (
              <ul className="space-y-1 text-sm">
                <li>Today 09:15 — BP 128/82, HR 72</li>
                <li>Yesterday — BP 125/80, HR 74</li>
              </ul>
            )}
          </div>
        </div>

        <aside className="col-span-12 space-y-4 lg:col-span-4">
          <div className="doctor-card-surface">
            <div className="mb-2 flex items-center gap-2 font-bold">
              <Activity className="h-4 w-4 text-brand-primary" aria-hidden />
              Clinical summary
            </div>
            <p className="text-sm text-[#5A584A]">
              {active?.chronicConditions?.join(', ') || 'No chronic conditions on file.'} Stable for outpatient management.
            </p>
          </div>
          <div className="doctor-card-surface">
            <h3 className="font-bold">Recent labs</h3>
            <ul className="mt-2 space-y-1 text-xs">
              <li>HbA1c 7.2% · <span className="font-bold text-amber-700">Flagged</span></li>
              <li>LFT panel · Processing</li>
            </ul>
          </div>
          <a href={`/doctor/emr?patient=${active?.id ?? ''}`} className={`${sageUi.btnSecondary} block text-center text-sm`}>
            Open full EMR vault →
          </a>
        </aside>
      </div>
    </div>
  );
}

export default function DoctorOsPatients() {
  return (
    <Suspense fallback={<div className="doctor-page p-6 text-sm">Loading patients…</div>}>
      <PatientWorkspaceInner />
    </Suspense>
  );
}
