'use client';

import { useCallback, useState } from 'react';
import {
  ClipboardList,
  FileText,
  FlaskConical,
  IndianRupee,
  ShieldCheck,
} from 'lucide-react';

import {
  DEFAULT_CHECKOUT_SUMMARY,
  FINANCE_STATUS_STYLES,
  SEED_SANDBOX_TRANSACTIONS,
  formatInr,
  type FinanceCheckoutSummary,
  type SandboxFinanceTransaction,
} from '../../../lib/testing';

type CheckoutAction = 'consultation' | 'lab' | 'preauth';

const ACTION_LABELS: Record<CheckoutAction, string> = {
  consultation: 'Consultation Invoicing',
  lab: 'Lab Processing',
  preauth: 'Pre-Authorization Tracking',
};

export default function FinanceLedgerDesk() {
  const [transactions] = useState<SandboxFinanceTransaction[]>(SEED_SANDBOX_TRANSACTIONS);
  const [summary, setSummary] = useState<FinanceCheckoutSummary>(DEFAULT_CHECKOUT_SUMMARY);
  const [activeAction, setActiveAction] = useState<CheckoutAction | null>(null);
  const [actionNote, setActionNote] = useState<string | null>(null);

  const handleAction = useCallback((action: CheckoutAction) => {
    setActiveAction(action);
    const bump = action === 'consultation' ? 850 : action === 'lab' ? 1280 : 0;
    if (bump > 0) {
      setSummary((prev) => {
        const subtotal = prev.subtotalInr + bump;
        const cgst = Math.round(subtotal * 0.09 * 100) / 100;
        const sgst = cgst;
        return {
          subtotalInr: subtotal,
          cgstInr: cgst,
          sgstInr: sgst,
          grandTotalInr: Math.round((subtotal + cgst + sgst) * 100) / 100,
        };
      });
    }
    setActionNote(
      `${ACTION_LABELS[action]} simulated · sandbox only · no patient identifiers stored`,
    );
    window.setTimeout(() => setActionNote(null), 5000);
  }, []);

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <header className="border-b-2 border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <IndianRupee className="h-5 w-5 text-slate-900" />
          <div>
            <h1 className="text-lg font-black text-slate-900">Unified Finance &amp; GST Ledger</h1>
            <p className="text-sm font-medium text-slate-800">
              Billing simulation desk · initials only · multi-tester safe
            </p>
          </div>
        </div>
      </header>

      {actionNote && (
        <p className="rounded-lg border-2 border-sky-300 bg-sky-50 px-4 py-2 text-sm font-bold text-sky-900">
          {actionNote}
        </p>
      )}

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        {/* Transaction table */}
        <div className="overflow-hidden rounded-xl border-2 border-slate-200 bg-white shadow-sm">
          <div className="border-b-2 border-slate-200 bg-slate-100 px-4 py-2.5">
            <h2 className="text-sm font-black text-slate-900">Transaction Ledger · Sandbox</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 bg-slate-100">
                  <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">
                    Transaction ID
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">
                    Patient
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">
                    Category
                  </th>
                  <th className="px-3 py-2 text-right text-[10px] font-black uppercase text-slate-950">
                    Amount
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">
                    Method
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn, index) => (
                  <tr
                    key={txn.transactionId}
                    className={`border-b-2 border-slate-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
                  >
                    <td className="px-3 py-2 font-mono text-xs font-black text-slate-950">
                      {txn.transactionId}
                    </td>
                    <td className="px-3 py-2 text-sm font-black text-slate-900">
                      {txn.patientInitials}
                    </td>
                    <td className="px-3 py-2 text-xs font-bold text-slate-950">
                      {txn.category}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-sm font-black text-slate-950">
                      {formatInr(txn.amountInr)}
                    </td>
                    <td className="px-3 py-2 text-xs font-bold text-slate-950">
                      {txn.paymentMethod}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded px-2 py-0.5 text-[10px] font-black uppercase ${FINANCE_STATUS_STYLES[txn.status]}`}
                      >
                        {txn.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Checkout card */}
        <div className="rounded-xl border-2 border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-black text-slate-900">Split Checkout Actions</h2>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleAction('consultation')}
              className={`flex w-full items-center gap-2 rounded-lg border-2 px-3 py-3 text-left text-sm font-black transition ${
                activeAction === 'consultation'
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-900 hover:border-slate-400'
              }`}
            >
              <FileText className="h-4 w-4 shrink-0" />
              Consultation Invoicing
            </button>
            <button
              type="button"
              onClick={() => handleAction('lab')}
              className={`flex w-full items-center gap-2 rounded-lg border-2 px-3 py-3 text-left text-sm font-black transition ${
                activeAction === 'lab'
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-900 hover:border-slate-400'
              }`}
            >
              <FlaskConical className="h-4 w-4 shrink-0" />
              Lab Processing
            </button>
            <button
              type="button"
              onClick={() => handleAction('preauth')}
              className={`flex w-full items-center gap-2 rounded-lg border-2 px-3 py-3 text-left text-sm font-black transition ${
                activeAction === 'preauth'
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-900 hover:border-slate-400'
              }`}
            >
              <ShieldCheck className="h-4 w-4 shrink-0" />
              Pre-Authorization Tracking
            </button>
          </div>

          <dl className="mt-4 space-y-2 border-t-2 border-slate-200 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="font-bold text-slate-800">Subtotal</dt>
              <dd className="font-mono text-base font-black text-slate-900">
                {formatInr(summary.subtotalInr)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-bold text-slate-800">CGST 9%</dt>
              <dd className="font-mono font-black text-slate-900">{formatInr(summary.cgstInr)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-bold text-slate-800">SGST 9%</dt>
              <dd className="font-mono font-black text-slate-900">{formatInr(summary.sgstInr)}</dd>
            </div>
            <div className="flex justify-between border-t-2 border-slate-200 pt-2">
              <dt className="text-base font-black text-slate-900">Grand Total</dt>
              <dd className="font-mono text-xl font-black text-emerald-800">
                {formatInr(summary.grandTotalInr)}
              </dd>
            </div>
          </dl>

          <p className="mt-3 flex items-center gap-1 text-[10px] font-bold text-slate-800">
            <ClipboardList className="h-3 w-3" />
            GST split · 9% CGST + 9% SGST · sandbox totals only
          </p>
        </div>
      </div>
    </div>
  );
}
