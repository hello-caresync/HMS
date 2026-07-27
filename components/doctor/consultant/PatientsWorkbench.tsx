'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';

import { ClinicalPageSkeleton } from '@/components/doctor/ClinicalSkeleton';
import { DoctorModuleShell, PatientHeaderBar } from '@/components/doctor/doctor-ui';
import { useEmrTimeline, usePatients } from '@/lib/doctor/hooks/useClinicalQueries';
import { sageUi } from '@/lib/doctor/ui-tokens';

function Sparkline({ points, color }: { points: number[]; color: string }) {
  const w = 120;
  const h = 36;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const coords = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg width={w} height={h} className="overflow-visible" aria-hidden>
      <polyline fill="none" stroke={color} strokeWidth="2" points={coords} />
    </svg>
  );
}

type PatientFlags = { allergic: boolean; ipd: boolean; criticalVitals: boolean };

function patientFlags(p: { allergies: string[]; id: string }): PatientFlags {
  return {
    allergic: p.allergies.length > 0,
    ipd: p.id === 'pat-3',
    criticalVitals: p.id === 'pat-3',
  };
}

export default function PatientsWorkbench() {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedTimeline, setExpandedTimeline] = useState<Set<string>>(new Set());
  const { data, isLoading } = usePatients({ search: search || undefined });

  const patients = data?.patients ?? [];
  const selected = useMemo(
    () => patients.find((p) => p.id === selectedId) ?? patients[0] ?? null,
    [patients, selectedId],
  );

  const { data: timelineData } = useEmrTimeline(selected?.id);
  const timeline = timelineData?.events ?? [];

  const toggleTimeline = (id: string) => {
    setExpandedTimeline((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (isLoading) return <ClinicalPageSkeleton rows={4} />;

  return (
    <DoctorModuleShell title="Patients" subtitle="Master search · EHR dashboard · vitals sparklines · clinical timeline">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5C5A4E]" aria-hidden />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, MRN, phone…"
              className={`${sageUi.input} pl-9`}
            />
          </div>
          <ul className="max-h-[calc(100vh-12rem)] space-y-2 overflow-y-auto">
            {patients.map((p) => {
              const flags = patientFlags(p);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(p.id)}
                    className={`w-full rounded-xl border p-3 text-left transition-colors ${
                      selected?.id === p.id
                        ? 'border-[#A39E75] bg-[#E6E3C5]/50 ring-1 ring-[#A39E75]/40'
                        : 'border-[#E6E3C5] bg-white hover:bg-[#F7F6E8]'
                    }`}
                  >
                    <p className="font-bold text-[#2B2A22]">{p.fullName}</p>
                    <p className="text-xs text-[#5C5A4E]">{p.mrn}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {flags.allergic ? (
                        <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                          Allergic
                        </span>
                      ) : null}
                      {flags.ipd ? (
                        <span className={`${sageUi.chip} text-[#2B2A22]`}>IPD Admitted</span>
                      ) : null}
                      {flags.criticalVitals ? (
                        <span className="rounded-full bg-[#EF4444]/15 px-2 py-0.5 text-[10px] font-bold text-[#EF4444]">
                          Critical Vitals
                        </span>
                      ) : null}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="space-y-4 lg:col-span-8">
          {selected ? (
            <>
              <PatientHeaderBar
                name={selected.fullName}
                mrn={selected.mrn}
                age={selected.age}
                gender={selected.gender}
                bloodGroup={selected.bloodGroup}
                allergies={selected.allergies}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className={`${sageUi.cardSolid} p-4`}>
                  <p className="text-[10px] font-bold uppercase text-[#5C5A4E]">BP trend · last 3 visits</p>
                  <Sparkline points={[128, 132, 128]} color="#A39E75" />
                  <p className="mt-1 text-xs font-semibold tabular-nums">128/82 mmHg · today</p>
                </div>
                <div className={`${sageUi.cardSolid} p-4`}>
                  <p className="text-[10px] font-bold uppercase text-[#5C5A4E]">HR trend · last 3 visits</p>
                  <Sparkline points={[78, 88, 72]} color="#C7C39E" />
                  <p className="mt-1 text-xs font-semibold tabular-nums">88 bpm · today</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border-2 border-[#A39E75]/30 bg-[#E6E3C5]/40 p-4">
                  <p className="text-[10px] font-bold uppercase text-[#A39E75]">Active medications</p>
                  <ul className="mt-2 space-y-1 text-sm font-semibold">
                    <li>Metformin 500 mg BD</li>
                    <li>Amlodipine 5 mg OD</li>
                  </ul>
                </div>
                <div className="rounded-xl border-2 border-rose-200 bg-rose-50 p-4">
                  <p className="text-[10px] font-bold uppercase text-rose-800">Allergies</p>
                  <p className="mt-2 text-sm font-bold text-rose-900">
                    {selected.allergies.length ? selected.allergies.join(' · ') : 'NKDA documented'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link href={`/doctor/consultations?patient=${selected.id}`} className={sageUi.btnPrimary}>
                  Start consultation
                </Link>
                <Link href={`/doctor/orders?patient=${selected.id}`} className={sageUi.btnSecondary}>
                  Clinical orders
                </Link>
              </div>

              <div className={`${sageUi.cardSolid} p-4`}>
                <h3 className="text-xs font-black uppercase text-[#A39E75]">Clinical timeline</h3>
                <ul className="mt-3 space-y-2">
                  {timeline.map((ev) => {
                    const open = expandedTimeline.has(ev.id);
                    return (
                      <li key={ev.id} className="rounded-xl border border-[#E6E3C5] bg-[#FAFAF5]">
                        <button
                          type="button"
                          onClick={() => toggleTimeline(ev.id)}
                          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
                        >
                          <div>
                            <p className="text-[10px] font-bold text-[#5C5A4E]">
                              {new Date(ev.at).toLocaleString('en-IN')} · {ev.category}
                            </p>
                            <p className="text-sm font-black">{ev.title}</p>
                          </div>
                          {open ? (
                            <ChevronUp className="h-4 w-4 shrink-0 text-[#A39E75]" />
                          ) : (
                            <ChevronDown className="h-4 w-4 shrink-0 text-[#5C5A4E]" />
                          )}
                        </button>
                        {open ? (
                          <p className="border-t border-[#E6E3C5] px-3 py-2 text-sm text-[#5C5A4E]">{ev.summary}</p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </>
          ) : (
            <p className="text-sm text-[#5C5A4E]">Select a patient from the directory.</p>
          )}
        </div>
      </div>
    </DoctorModuleShell>
  );
}
