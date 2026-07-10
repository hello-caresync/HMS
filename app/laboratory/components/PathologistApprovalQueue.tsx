'use client';

import { AlertTriangle, CheckCircle2, FileCheck2 } from 'lucide-react';

import { useLab } from '../context/LabProvider';
import { getTestByCode } from '../lib/seedLab';

export default function PathologistApprovalQueue() {
  const { pendingApproval, approveReport } = useLab();

  if (pendingApproval.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
        <FileCheck2 className="mx-auto mb-2 h-8 w-8 text-slate-900" />
        <p className="text-sm text-slate-800">No reports awaiting approval</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {pendingApproval.map((order) => {
        const hasCritical = order.results.some((r) => r.isCritical);
        return (
          <article
            key={order.id}
            className={`rounded-lg border bg-white p-3 ${
              hasCritical ? 'border-rose-300 ring-1 ring-rose-100' : 'border-slate-200'
            }`}
          >
            <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-900">{order.patientName}</p>
                <p className="font-mono text-[10px] text-slate-800">
                  {order.uhid} · {order.barcode}
                </p>
              </div>
              {hasCritical && (
                <span className="inline-flex items-center gap-1 rounded bg-rose-600 px-2 py-0.5 text-[9px] font-bold uppercase text-white">
                  <AlertTriangle className="h-3 w-3" />
                  Critical Values
                </span>
              )}
            </div>

            <div className="overflow-x-auto rounded border-2 border-slate-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-100 text-[10px] uppercase tracking-wider text-slate-800">
                    <th className="px-2 py-1.5 text-left">Analyte</th>
                    <th className="px-2 py-1.5 text-right">Result</th>
                    <th className="px-2 py-1.5 text-right">Reference</th>
                    <th className="px-2 py-1.5 text-center">Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {order.results.map((r) => {
                    const test = getTestByCode(r.testCode);
                    if (!test || r.value === null) return null;
                    const outOfRange = r.value < test.refMin || r.value > test.refMax;
                    return (
                      <tr key={r.testCode} className="border-t border-slate-50">
                        <td className="px-2 py-1.5 font-bold text-slate-950">{test.name}</td>
                        <td
                          className={`px-2 py-1.5 text-right font-bold tabular-nums ${
                            r.alertLevel === 'critical'
                              ? 'text-rose-700'
                              : r.alertLevel === 'warning'
                                ? 'text-amber-700'
                                : 'text-slate-900'
                          }`}
                        >
                          {r.value} {test.unit}
                        </td>
                        <td className="px-2 py-1.5 text-right text-slate-950">
                          {test.refMin}–{test.refMax}
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          {outOfRange ? (
                            <span className="text-[9px] font-bold uppercase text-rose-600">H/L</span>
                          ) : (
                            <span className="text-[9px] text-emerald-600">OK</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={() => approveReport(order.id)}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-emerald-700"
            >
              <CheckCircle2 className="h-4 w-4" />
              Approve & Sign Report
            </button>
          </article>
        );
      })}
    </div>
  );
}
