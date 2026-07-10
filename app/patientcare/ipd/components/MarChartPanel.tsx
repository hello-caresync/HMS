'use client';

import { CheckSquare, Pill } from 'lucide-react';

import type { IpdWardBed, MarPrescriptionLine } from '../../../lib/patientcare';

type MarChartPanelProps = {
  bed: IpdWardBed | null;
  lines: MarPrescriptionLine[];
  onToggleDose: (lineId: string, slot: keyof MarPrescriptionLine['logs']) => void;
};

const SLOTS: { key: keyof MarPrescriptionLine['logs']; label: string }[] = [
  { key: 'morning', label: 'Morning' },
  { key: 'afternoon', label: 'Afternoon' },
  { key: 'night', label: 'Night' },
];

export default function MarChartPanel({ bed, lines, onToggleDose }: MarChartPanelProps) {
  if (!bed || bed.occupancy === 'vacant') {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8">
        <p className="text-sm text-slate-800">Select an occupied bed to view MAR charting.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-300 bg-white shadow-sm">
      <div className="border-b-2 border-slate-200 bg-slate-800 px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <Pill className="h-4 w-4" />
          <div>
            <h2 className="text-sm font-black">Medication Administration Record</h2>
            <p className="text-[10px] text-slate-900">
              {bed.patientName} · {bed.label} · Prescriptions read-only
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-100">
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-wider text-slate-950">
                Drug / Dose
              </th>
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-wider text-slate-950">
                Route
              </th>
              {SLOTS.map((s) => (
                <th
                  key={s.key}
                  className="px-3 py-2 text-center text-[10px] font-black uppercase tracking-wider text-slate-950"
                >
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-xs text-slate-950">
                  No active prescriptions for this bed.
                </td>
              </tr>
            ) : (
              lines.map((line, index) => (
                <tr
                  key={line.id}
                  className={`border-b-2 border-slate-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}
                >
                  <td className="px-3 py-2">
                    <p className="text-xs font-bold text-slate-900">{line.drugName}</p>
                    <p className="text-[10px] text-slate-800">{line.dosage}</p>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs font-bold text-slate-900">
                    {line.route}
                  </td>
                  {SLOTS.map((s) => {
                    const checked = line.logs[s.key];
                    return (
                      <td key={s.key} className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => onToggleDose(line.id, s.key)}
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border-2 transition ${
                            checked
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                              : 'border-slate-300 bg-white text-slate-800 hover:border-sky-400 hover:text-sky-600'
                          }`}
                          aria-label={`${s.label} dose ${line.drugName}`}
                        >
                          {checked ? (
                            <CheckSquare className="h-4 w-4" />
                          ) : (
                            <span className="text-[10px] font-bold">—</span>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="border-t border-slate-200 px-3 py-2 text-[10px] text-slate-800">
        Click checkbox to sign off administered dose · Audit trail placeholder
      </p>
    </div>
  );
}
