'use client';

import { useState } from 'react';
import { AlertTriangle, RotateCcw, X } from 'lucide-react';

import { formatCurrency } from '../../master-data/lib/seedData';
import { usePayments } from '../context/PaymentsProvider';
import type { LedgerTransaction } from '../types';

type RefundModalProps = {
  transaction: LedgerTransaction | null;
  onClose: () => void;
};

export default function RefundModal({ transaction, onClose }: RefundModalProps) {
  const { initiateRefund } = usePayments();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!transaction) return null;

  const handleClose = () => {
    setReason('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  const handleSubmit = () => {
    const result = initiateRefund(transaction.id, reason);
    if (!result.success) {
      setError(result.error ?? 'Refund failed');
      return;
    }
    setSuccess(true);
    setError(null);
    window.setTimeout(handleClose, 1200);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[1px]"
        onClick={handleClose}
        aria-hidden
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
          role="dialog"
          aria-labelledby="refund-title"
        >
          <div className="flex items-center justify-between border-b-2 border-slate-200 bg-rose-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-rose-600" />
              <h2 id="refund-title" className="text-sm font-bold text-slate-900">
                Initiate Refund
              </h2>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="rounded p-1 text-slate-800 hover:bg-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4">
            <div className="rounded-md border-2 border-slate-200 bg-slate-50 px-3 py-2 text-xs">
              <p className="font-mono text-[10px] text-slate-800">{transaction.id}</p>
              <p className="font-medium text-slate-900">{transaction.patientName}</p>
              <p className="text-slate-800">
                {transaction.mode} ·{' '}
                <span className="font-mono font-bold tabular-nums">
                  {formatCurrency(transaction.amount)}
                </span>
              </p>
            </div>

            <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
              <p className="flex items-start gap-1.5 text-[11px] text-amber-800">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Authorized action — refund will update shift ledger balances and mark transaction
                as Refunded.
              </p>
            </div>

            <label className="mt-3 block text-[10px] font-bold uppercase tracking-wider text-slate-800">
              Refund Reason (required)
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError(null);
              }}
              rows={3}
              placeholder="e.g. Duplicate charge, service cancelled, billing error…"
              className="mt-1 w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />

            {error && (
              <p className="mt-2 text-[11px] font-medium text-rose-600">{error}</p>
            )}
            {success && (
              <p className="mt-2 text-[11px] font-medium text-emerald-600">
                Refund logged · ledger updated
              </p>
            )}

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!reason.trim() || success}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-40"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Confirm Refund
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
