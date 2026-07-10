'use client';

import { useState } from 'react';
import { CheckCircle2, Lock, Wallet } from 'lucide-react';

import { formatCurrency } from '../../master-data/lib/seedData';
import { useHr } from '../context/HrProvider';

export default function PayrollLedger() {
  const { payrollLines, payrollLocked, disbursementPayload, approveAndRunPayroll } = useHr();
  const [showPayload, setShowPayload] = useState(false);

  const totalNet = payrollLines.reduce((s, l) => s + l.netPayable, 0);

  const handleRun = () => {
    approveAndRunPayroll();
    setShowPayload(true);
  };

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-slate-200 bg-[#0a0e14] px-3 py-2">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-emerald-400" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
                Payroll Run
              </p>
              <p className="text-xs font-bold text-white">July 2026 · Monthly disbursement</p>
            </div>
          </div>
          {payrollLocked && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-900/50 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
              <Lock className="h-3 w-3" />
              Period locked
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-[11px]">
            <thead>
              <tr className="border-b-2 border-slate-200 bg-slate-100/80 text-[10px] uppercase tracking-wider text-slate-800">
                <th className="px-3 py-2 text-left font-black">Employee</th>
                <th className="px-3 py-2 text-right font-black">Base Salary</th>
                <th className="px-3 py-2 text-right font-black">Shifts</th>
                <th className="px-3 py-2 text-right font-black">LOP Days</th>
                <th className="px-3 py-2 text-right font-black">Bonus %</th>
                <th className="px-3 py-2 text-right font-black">Tax/Ded.</th>
                <th className="px-3 py-2 text-right font-black">Net Payable</th>
              </tr>
            </thead>
            <tbody>
              {payrollLines.map((line) => (
                <tr key={line.employeeId} className="border-b border-slate-50 hover:bg-slate-100/60">
                  <td className="px-3 py-2 font-bold text-slate-900">{line.employeeName}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-900">
                    {formatCurrency(line.baseSalary)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">{line.shiftsCompleted}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-rose-600">
                    {line.lopDays}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-emerald-700">
                    +{line.bonusModifierPct}%
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-950">
                    {formatCurrency(line.taxDeductions)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-bold tabular-nums text-indigo-700">
                    {formatCurrency(line.netPayable)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50/80">
                <td colSpan={6} className="px-3 py-2 text-right text-xs font-bold text-slate-950">
                  Total Net Disbursement
                </td>
                <td className="px-3 py-2 text-right font-mono text-sm font-bold tabular-nums text-indigo-800">
                  {formatCurrency(totalNet)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="border-t border-slate-200 p-3">
          <button
            type="button"
            onClick={handleRun}
            disabled={payrollLocked}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            {payrollLocked ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Wallet className="h-4 w-4" />
            )}
            {payrollLocked ? 'Payroll Approved & Locked' : 'Approve & Run Monthly Payroll'}
          </button>
        </div>
      </div>

      {showPayload && disbursementPayload && (
        <div className="overflow-hidden rounded-lg border border-indigo-200 bg-indigo-50/30 shadow-sm">
          <div className="border-b border-indigo-100 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
              Financial Disbursement Payload (JSON)
            </p>
            <p className="font-mono text-[10px] text-indigo-800">{disbursementPayload.runId}</p>
          </div>
          <pre className="custom-scrollbar max-h-64 overflow-auto p-3 font-mono text-[10px] leading-relaxed text-slate-800">
            {JSON.stringify(disbursementPayload, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
