'use client';

import { useMemo, useState } from 'react';
import { ArrowRightLeft, BedDouble, History, LayoutGrid } from 'lucide-react';

import type { WardCategory } from '../admissionsNav.types';
import {
  MOCK_BED_GRID,
  MOCK_ROOM_HISTORY,
  MOCK_TRANSFERS,
  formatDateTime,
} from '../lib/admissionsMockData';
import { AdmPanel, BedStatusBadge, StatusPill } from '../components/admissionsUi';

const WARD_SEGMENTS: WardCategory[] = ['General Ward', 'Semi-Private', 'Private Room', 'ICU'];

const WARD_COLORS: Record<WardCategory, string> = {
  'General Ward': 'border-slate-200',
  'Semi-Private': 'border-sky-200',
  'Private Room': 'border-violet-200',
  ICU: 'border-red-200',
};

const BED_CELL_STYLES: Record<string, string> = {
  Occupied: 'bg-indigo-50 border-indigo-200 text-indigo-900',
  Available: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  Reserved: 'bg-amber-50 border-amber-200 text-amber-900',
  Cleaning: 'bg-slate-100 border-slate-200 text-slate-600',
};

export default function SpatialCapacityTab() {
  const [selectedWard, setSelectedWard] = useState<WardCategory | 'All'>('All');

  const bedsByWard = useMemo(() => {
    const grouped: Record<WardCategory, typeof MOCK_BED_GRID> = {
      'General Ward': [],
      'Semi-Private': [],
      'Private Room': [],
      ICU: [],
    };
    MOCK_BED_GRID.forEach((b) => grouped[b.ward].push(b));
    return grouped;
  }, []);

  const visibleWards = selectedWard === 'All' ? WARD_SEGMENTS : [selectedWard];

  const stats = useMemo(() => {
    const total = MOCK_BED_GRID.length;
    const occupied = MOCK_BED_GRID.filter((b) => b.status === 'Occupied').length;
    const available = MOCK_BED_GRID.filter((b) => b.status === 'Available').length;
    return { total, occupied, available, occupancy: Math.round((occupied / total) * 100) };
  }, []);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: 'Total Beds Tracked', value: stats.total },
          { label: 'Occupied', value: stats.occupied, accent: 'indigo' },
          { label: 'Available', value: stats.available, accent: 'emerald' },
          { label: 'Matrix Occupancy', value: `${stats.occupancy}%`, accent: 'blue' },
        ].map((k) => (
          <div key={k.label} className="rounded-md border border-[#E2E8F0] bg-white p-2.5">
            <p
              className={`text-lg font-bold tabular-nums ${
                k.accent === 'indigo'
                  ? 'text-indigo-600'
                  : k.accent === 'emerald'
                    ? 'text-emerald-600'
                    : k.accent === 'blue'
                      ? 'text-[#2563EB]'
                      : 'text-[#0F172A]'
              }`}
            >
              {k.value}
            </p>
            <p className="mt-1 text-[8px] font-bold uppercase tracking-wide text-slate-500">{k.label}</p>
          </div>
        ))}
      </div>

      <AdmPanel
        title="Dynamic Bed Availability Map"
        subtitle="Real-time physical capacity layout — General · Semi-Private · Private · ICU"
        icon={LayoutGrid}
        headerRight={
          <div className="flex flex-wrap gap-1">
            {(['All', ...WARD_SEGMENTS] as const).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setSelectedWard(w)}
                className={`rounded px-2 py-0.5 text-[8px] font-bold uppercase ${
                  selectedWard === w ? 'bg-[#0F172A] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {w === 'All' ? 'All Wards' : w.replace(' Ward', '').replace(' Room', '')}
              </button>
            ))}
          </div>
        }
      >
        <div className="mb-3 flex flex-wrap gap-2 text-[9px]">
          {(['Occupied', 'Available', 'Reserved', 'Cleaning'] as const).map((s) => (
            <span key={s} className="inline-flex items-center gap-1">
              <BedStatusBadge status={s} />
            </span>
          ))}
        </div>

        <div className="space-y-4">
          {visibleWards.map((ward) => (
            <div key={ward}>
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-[10px] font-bold uppercase tracking-wide text-[#0F172A]">{ward}</h4>
                <span className="text-[9px] text-slate-500">{bedsByWard[ward].length} beds</span>
              </div>
              <div className={`grid grid-cols-3 gap-1.5 rounded-lg border p-2 sm:grid-cols-4 md:grid-cols-6 ${WARD_COLORS[ward]}`}>
                {bedsByWard[ward].map((bed) => (
                  <div
                    key={bed.id}
                    className={`rounded border px-1.5 py-2 text-center ${BED_CELL_STYLES[bed.status]}`}
                    title={bed.patientName ? `${bed.patientName} · ${bed.uhid}` : bed.status}
                  >
                    <p className="text-[10px] font-bold">{bed.label}</p>
                    <p className="text-[8px] opacity-80">{bed.floor}</p>
                    <BedStatusBadge status={bed.status} />
                    {bed.patientName && (
                      <p className="mt-0.5 truncate text-[7px] font-medium">{bed.patientName.split(' ')[0]}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </AdmPanel>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <AdmPanel
          title="Patient Transfer Panel"
          subtitle="Bed · Room · Ward · ICU · Department routing & approval"
          icon={ArrowRightLeft}
          className="xl:col-span-7"
        >
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Transfer ID', 'Patient', 'From → To', 'Reason', 'Requested', 'Status'].map((h) => (
                  <th key={h} className="px-2 py-1.5 text-[9px] font-bold uppercase text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_TRANSFERS.map((t) => (
                <tr key={t.id} className="border-b border-slate-50">
                  <td className="px-2 py-1.5 font-mono text-[9px] font-bold text-[#2563EB]">{t.id}</td>
                  <td className="px-2 py-1.5">
                    <p className="text-[10px] font-semibold text-[#0F172A]">{t.patientName}</p>
                    <p className="font-mono text-[8px] text-slate-500">{t.uhid}</p>
                  </td>
                  <td className="px-2 py-1.5 text-[9px] text-slate-600">
                    {t.fromLocation}
                    <span className="mx-1 text-[#2563EB]">→</span>
                    {t.toLocation}
                  </td>
                  <td className="max-w-[140px] truncate px-2 py-1.5 text-[9px] text-slate-500" title={t.reason}>
                    {t.reason}
                  </td>
                  <td className="px-2 py-1.5 text-[9px] text-slate-500">{formatDateTime(t.requestedAt)}</td>
                  <td className="px-2 py-1.5">
                    <StatusPill status={t.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdmPanel>

        <AdmPanel
          title="Room Change History"
          subtitle="Chronological bed & ward movement log"
          icon={History}
          className="xl:col-span-5"
        >
          <ul className="space-y-1.5">
            {MOCK_ROOM_HISTORY.map((h) => (
              <li key={h.id} className="rounded border border-[#E2E8F0] border-l-4 border-l-[#2563EB] px-2 py-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold text-[#0F172A]">{h.patientName}</span>
                  <span className="font-mono text-[8px] text-slate-400">{h.timestamp}</span>
                </div>
                <p className="mt-0.5 text-[9px] text-slate-600">{h.change}</p>
              </li>
            ))}
          </ul>
        </AdmPanel>
      </div>
    </div>
  );
}
