'use client';

import { useCallback, useMemo, useState } from 'react';
import { BedDouble, ClipboardCheck } from 'lucide-react';

import {
  SEED_MAR_LINES,
  SEED_WARD_ASSIGNMENT,
  type IpdWardBed,
  type MarPrescriptionLine,
} from '../../../lib/patientcare';
import MarChartPanel from './MarChartPanel';
import WardMatrixPanel from './WardMatrixPanel';

export default function IpdNursingWorkbench() {
  const [selectedBed, setSelectedBed] = useState<IpdWardBed | null>(
    SEED_WARD_ASSIGNMENT.beds.find((b) => b.occupancy === 'occupied') ?? null,
  );
  const [marLines, setMarLines] = useState<MarPrescriptionLine[]>(SEED_MAR_LINES);

  const bedMarLines = useMemo(
    () => (selectedBed ? marLines.filter((l) => l.bedId === selectedBed.bedId) : []),
    [marLines, selectedBed],
  );

  const handleToggleDose = useCallback(
    (lineId: string, slot: keyof MarPrescriptionLine['logs']) => {
      setMarLines((prev) =>
        prev.map((line) =>
          line.id === lineId
            ? { ...line, logs: { ...line.logs, [slot]: !line.logs[slot] } }
            : line,
        ),
      );
    },
    [],
  );

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <header className="border-b-2 border-slate-200 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <BedDouble className="h-5 w-5 text-sky-700" />
            <div>
              <h1 className="text-lg font-black text-slate-900">IPD Nursing Dashboard &amp; MAR</h1>
              <p className="text-xs text-slate-800">
                Phase 4 · Module 11 · {SEED_WARD_ASSIGNMENT.wardName} ·{' '}
                {SEED_WARD_ASSIGNMENT.floorLabel}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs">
            <ClipboardCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span className="font-bold text-slate-900">Shift: Day · 07:00–19:00</span>
          </div>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[340px_1fr]">
        <WardMatrixPanel
          ward={SEED_WARD_ASSIGNMENT}
          selectedBedId={selectedBed?.bedId ?? null}
          onSelectBed={setSelectedBed}
        />
        <MarChartPanel
          bed={selectedBed}
          lines={bedMarLines}
          onToggleDose={handleToggleDose}
        />
      </div>
    </div>
  );
}
