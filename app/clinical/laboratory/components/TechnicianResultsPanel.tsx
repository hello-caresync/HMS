'use client';

import { useEffect, useState } from 'react';
import { Save, X } from 'lucide-react';

import type { LabResultFieldEntry, LabSamplePacket } from '../../../lib/clinical';

type TechnicianResultsPanelProps = {
  open: boolean;
  order: LabSamplePacket | null;
  onClose: () => void;
  onSave: (trackingId: string, matrix: LabResultFieldEntry[]) => void;
};

function isOutOfRange(value: string, min: number, max: number): boolean {
  const n = parseFloat(value);
  if (Number.isNaN(n)) return false;
  if (min === 0 && max === 0) return false;
  return n < min || n > max;
}

export default function TechnicianResultsPanel({
  open,
  order,
  onClose,
  onSave,
}: TechnicianResultsPanelProps) {
  const [matrix, setMatrix] = useState<LabResultFieldEntry[]>([]);

  useEffect(() => {
    if (order) {
      setMatrix(order.resultMatrix.map((f) => ({ ...f })));
    }
  }, [order]);

  if (!open || !order) return null;

  const handleFieldChange = (key: string, value: string) => {
    setMatrix((prev) =>
      prev.map((f) => (f.parameterKey === key ? { ...f, value } : f)),
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-900/30" onClick={onClose} aria-hidden />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-300 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b-2 border-slate-200 bg-slate-800 px-4 py-3 text-white">
          <div>
            <p className="text-sm font-black">Technician Results Entry</p>
            <p className="font-mono text-[10px] text-slate-900">{order.trackingId}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <dl className="mb-4 grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
            <div>
              <dt className="text-[9px] font-bold uppercase text-slate-800">Patient</dt>
              <dd className="font-semibold">{order.patientInitials}</dd>
            </div>
            <div>
              <dt className="text-[9px] font-bold uppercase text-slate-800">Test</dt>
              <dd className="font-semibold">{order.testName}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-[9px] font-bold uppercase text-slate-800">Specimen</dt>
              <dd>{order.specimenCategory}</dd>
            </div>
          </dl>

          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-800">
            Reference Range Matrix
          </p>

          <div className="space-y-2">
            {matrix.map((field) => {
              const flagged = isOutOfRange(field.value, field.referenceMin, field.referenceMax);
              const refLabel =
                field.referenceMin === 0 && field.referenceMax === 0
                  ? 'Qualitative'
                  : `${field.referenceMin} – ${field.referenceMax} ${field.unit}`.trim();

              return (
                <label
                  key={field.parameterKey}
                  className={`block rounded-lg border p-2.5 ${
                    flagged ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800">{field.label}</span>
                    <span className="font-mono text-[9px] text-slate-800">Ref: {refLabel}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      value={field.value}
                      onChange={(e) => handleFieldChange(field.parameterKey, e.target.value)}
                      placeholder="Enter value"
                      className="w-full rounded border border-slate-300 px-2 py-1.5 font-mono text-sm outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-100"
                    />
                    {field.unit && (
                      <span className="shrink-0 text-[10px] font-medium text-slate-800">
                        {field.unit}
                      </span>
                    )}
                  </div>
                  {flagged && (
                    <p className="mt-1 text-[9px] font-bold uppercase text-rose-700">
                      Outside reference range
                    </p>
                  )}
                </label>
              );
            })}
          </div>
        </div>

        <div className="border-t border-slate-200 p-4">
          <button
            type="button"
            onClick={() => onSave(order.trackingId, matrix)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 py-2.5 text-sm font-bold text-white hover:bg-slate-900"
          >
            <Save className="h-4 w-4" />
            Submit for Verification
          </button>
        </div>
      </aside>
    </>
  );
}
