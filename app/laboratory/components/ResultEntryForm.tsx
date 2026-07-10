'use client';

import { AlertTriangle, FlaskConical, Send } from 'lucide-react';

import { useLab } from '../context/LabProvider';
import { getTestByCode, LAB_TEST_CATALOG } from '../lib/seedLab';
import type { LabOrder } from '../types';

type ResultEntryFormProps = {
  order: LabOrder;
  onSubmitted?: () => void;
};

export default function ResultEntryForm({ order, onSubmitted }: ResultEntryFormProps) {
  const { updateResult, submitForApproval } = useLab();

  const testsToEnter = order.testCodes
    .map((code) => getTestByCode(code))
    .filter(Boolean) as typeof LAB_TEST_CATALOG;

  const hasAnyValue = order.results.some((r) => r.value !== null);
  const hasCritical = order.results.some((r) => r.alertLevel === 'critical');

  const handleSubmit = () => {
    submitForApproval(order.id);
    onSubmitted?.();
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b-2 border-slate-200 px-3 py-1.5">
        <h3 className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-800">
          <FlaskConical className="h-3.5 w-3.5 text-primary" />
          Result Entry · {order.barcode}
        </h3>
        <span className="font-mono text-[10px] text-slate-800">{order.uhid}</span>
      </div>

      <div className="divide-y divide-slate-50 p-2">
        {testsToEnter.map((test) => {
          const result = order.results.find((r) => r.testCode === test.code);
          const value = result?.value ?? '';
          const alertLevel = result?.alertLevel ?? 'normal';

          const inputBg =
            alertLevel === 'critical'
              ? 'bg-rose-50 border-rose-400 ring-rose-200'
              : alertLevel === 'warning'
                ? 'bg-amber-50 border-amber-400 ring-amber-200'
                : 'bg-white border-slate-200';

          return (
            <div key={test.code} className="py-2">
              <div className="mb-1 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-slate-800">{test.name}</p>
                  <p className="text-[10px] text-slate-800">
                    Ref: {test.refMin}–{test.refMax} {test.unit}
                  </p>
                </div>
                {(alertLevel === 'critical' || alertLevel === 'warning') && (
                  <span
                    className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                      alertLevel === 'critical'
                        ? 'bg-rose-600 text-white'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    <AlertTriangle className="h-3 w-3" />
                    Critical Value Alert
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={value}
                  onChange={(e) => {
                    const v = e.target.value === '' ? null : Number(e.target.value);
                    updateResult(order.id, test.code, v);
                  }}
                  className={`w-28 rounded border px-2 py-1.5 text-sm font-semibold tabular-nums focus:outline-none focus:ring-2 ${inputBg}`}
                  placeholder="—"
                />
                <span className="text-[11px] text-slate-800">{test.unit}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-slate-200 p-2">
        {hasCritical && (
          <p className="mb-2 flex items-center gap-1 text-[10px] font-semibold text-rose-700">
            <AlertTriangle className="h-3.5 w-3.5" />
            Critical values detected — pathologist review required
          </p>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!hasAnyValue}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-violet-600 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-violet-700 disabled:opacity-40"
        >
          <Send className="h-3.5 w-3.5" />
          Submit for Approval
        </button>
      </div>
    </div>
  );
}
