'use client';

import { useMemo, useState } from 'react';
import {
  Banknote,
  Building2,
  CheckCircle2,
  CreditCard,
  Loader2,
  Shield,
  Smartphone,
  Split,
} from 'lucide-react';

import { formatCurrency } from '../../master-data/lib/seedData';
import { validateSplitTotal } from '../lib/calculations';
import { useBilling } from '../context/BillingProvider';
import { PAYMENT_METHODS, type PaymentMethod } from '../types';

const METHOD_ICONS: Record<PaymentMethod, typeof Banknote> = {
  Cash: Banknote,
  UPI: Smartphone,
  Card: CreditCard,
  Corporate: Building2,
  Insurance: Shield,
};

export default function PaymentTerminal() {
  const { currentInvoice, getTotals, submitPayment } = useBilling();
  const totals = getTotals();
  const grandTotal = totals.grandTotal;

  const [primaryMethod, setPrimaryMethod] = useState<PaymentMethod>('UPI');
  const [splitEnabled, setSplitEnabled] = useState(false);
  const [splitAmounts, setSplitAmounts] = useState<Record<PaymentMethod, number>>({
    Cash: 0,
    UPI: 0,
    Card: 0,
    Corporate: 0,
    Insurance: 0,
  });
  const [tpaPreAuthorized, setTpaPreAuthorized] = useState(false);
  const [tpaReference, setTpaReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const splits = useMemo(
    () =>
      PAYMENT_METHODS.map((method) => ({
        method,
        amount: splitAmounts[method] || 0,
      })).filter((s) => s.amount > 0),
    [splitAmounts],
  );

  const splitValidation = useMemo(
    () => validateSplitTotal(splitEnabled ? splits : [{ amount: grandTotal }], grandTotal),
    [splitEnabled, splits, grandTotal],
  );

  const showTpa =
    currentInvoice?.billingType === 'Insurance' || currentInvoice?.billingType === 'Corporate';

  const handleSplitChange = (method: PaymentMethod, value: string) => {
    const num = parseFloat(value) || 0;
    setSplitAmounts((prev) => ({ ...prev, [method]: num }));
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = () => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const result = submitPayment({
      splitEnabled,
      splits,
      primaryMethod,
      singleAmount: grandTotal,
      tpaPreAuthorized,
      tpaReference: tpaReference || undefined,
    });

    setSubmitting(false);

    if (!result.success) {
      setError(result.error ?? 'Payment failed');
      return;
    }

    setSuccess(
      result.transactionStatus === 'Authorized'
        ? 'TPA pre-auth recorded · Claim Pending settlement'
        : 'Payment captured · Invoice settled',
    );
    setSplitAmounts({ Cash: 0, UPI: 0, Card: 0, Corporate: 0, Insurance: 0 });
    setSplitEnabled(false);
    setTpaPreAuthorized(false);
    setTpaReference('');
  };

  const canSubmit =
    !submitting &&
    grandTotal > 0 &&
    (splitEnabled ? splitValidation.valid : true) &&
    (!showTpa || !tpaPreAuthorized || tpaReference.trim().length > 0);

  return (
    <div className="flex h-full flex-col rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b-2 border-slate-200 bg-[#0a0e14] px-3 py-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
          Payment Terminal
        </p>
        <p className="text-sm font-bold text-white">Checkout Control</p>
      </div>

      <div className="flex-1 space-y-3 p-3">
        <div className="rounded-md border border-indigo-100 bg-indigo-50/60 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase text-indigo-600">Amount Due</p>
          <p className="font-mono text-xl font-bold tabular-nums text-indigo-900">
            {formatCurrency(grandTotal)}
          </p>
        </div>

        {!splitEnabled && (
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-800">
              Payment Method
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {PAYMENT_METHODS.map((method) => {
                const Icon = METHOD_ICONS[method];
                const active = primaryMethod === method;
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPrimaryMethod(method)}
                    className={`flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-[10px] font-bold transition ${
                      active
                        ? 'border-indigo-500 bg-indigo-600 text-white'
                        : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {method}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="rounded-md border border-slate-200 bg-slate-50/80 p-2.5">
          <label className="flex cursor-pointer items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
              <Split className="h-3.5 w-3.5 text-indigo-600" />
              Split Payment
            </span>
            <input
              type="checkbox"
              checked={splitEnabled}
              onChange={(e) => {
                setSplitEnabled(e.target.checked);
                setError(null);
                setSuccess(null);
              }}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
          </label>

          {splitEnabled && (
            <div className="mt-2 space-y-1.5">
              {PAYMENT_METHODS.map((method) => {
                const Icon = METHOD_ICONS[method];
                return (
                  <div key={method} className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 shrink-0 text-slate-800" />
                    <span className="w-16 text-[10px] font-semibold text-slate-800">{method}</span>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      placeholder="0"
                      value={splitAmounts[method] || ''}
                      onChange={(e) => handleSplitChange(method, e.target.value)}
                      className="flex-1 rounded border border-slate-200 px-2 py-1 font-mono text-xs tabular-nums focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                    />
                  </div>
                );
              })}
              <div
                className={`mt-1 flex items-center justify-between rounded px-2 py-1 text-[10px] font-semibold ${
                  splitValidation.valid
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-rose-50 text-rose-700'
                }`}
              >
                <span>Split total</span>
                <span className="font-mono tabular-nums">
                  {formatCurrency(splitValidation.splitSum)} / {formatCurrency(grandTotal)}
                </span>
              </div>
              {!splitValidation.valid && splitValidation.splitSum > 0 && (
                <p className="text-[10px] font-medium text-rose-600">
                  Split must equal Grand Total exactly (Δ ₹
                  {Math.abs(splitValidation.difference).toFixed(2)})
                </p>
              )}
            </div>
          )}
        </div>

        {showTpa && (
          <div className="rounded-md border border-violet-200 bg-violet-50/50 p-2.5">
            <label className="flex cursor-pointer items-start gap-2">
              <input
                type="checkbox"
                checked={tpaPreAuthorized}
                onChange={(e) => setTpaPreAuthorized(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-violet-300 text-violet-600 focus:ring-violet-500"
              />
              <div>
                <p className="text-xs font-bold text-violet-900">TPA Pre-Authorization</p>
                <p className="text-[10px] text-violet-600">
                  Insurance / Corporate claim — defers settlement to TPA ledger
                </p>
              </div>
            </label>
            {tpaPreAuthorized && (
              <input
                type="text"
                placeholder="Pre-auth reference (e.g. TPA-88421)"
                value={tpaReference}
                onChange={(e) => setTpaReference(e.target.value)}
                className="mt-2 w-full rounded border border-violet-200 px-2 py-1 text-xs focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
              />
            )}
          </div>
        )}

        {error && (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1.5 text-[11px] font-medium text-rose-700">
            {error}
          </p>
        )}
        {success && (
          <p className="flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-[11px] font-medium text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {success}
          </p>
        )}
      </div>

      <div className="border-t border-slate-200 p-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          {tpaPreAuthorized ? 'Authorize & Submit Claim' : 'Capture Payment'}
        </button>
      </div>
    </div>
  );
}
