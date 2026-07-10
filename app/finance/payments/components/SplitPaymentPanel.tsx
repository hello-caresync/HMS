'use client';

import { CheckCircle2 } from 'lucide-react';

import type { SplitPaymentAllocation } from '../../../lib/finance';

type SplitPaymentPanelProps = {
  split: SplitPaymentAllocation;
  grandTotal: number;
  splitTotal: number;
  balanceDue: number;
  isBalanced: boolean;
  onChange: (split: SplitPaymentAllocation) => void;
  onCollect: () => void;
};

const METHODS: { key: keyof SplitPaymentAllocation; label: string }[] = [
  { key: 'cash', label: 'Cash' },
  { key: 'card', label: 'Card' },
  { key: 'upi', label: 'UPI' },
  { key: 'insuranceCover', label: 'Insurance Cover' },
];

export default function SplitPaymentPanel({
  split,
  grandTotal,
  splitTotal,
  balanceDue,
  isBalanced,
  onChange,
  onCollect,
}: SplitPaymentPanelProps) {
  const update = (key: keyof SplitPaymentAllocation, value: number) => {
    onChange({ ...split, [key]: Math.max(0, value) });
  };

  return (
    <div className="rounded-xl border border-slate-300 bg-white shadow-sm">
      <div className="border-b-2 border-slate-200 bg-slate-50 px-4 py-2.5">
        <h2 className="text-sm font-black text-slate-900">Split-Payment Configuration</h2>
        <p className="text-[10px] text-slate-800">
          Distribute ₹ {grandTotal.toLocaleString('en-IN')} across active methods
        </p>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2">
        {METHODS.map(({ key, label }) => (
          <label key={key} className="block space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
              {label} (₹)
            </span>
            <input
              type="number"
              min={0}
              step={100}
              value={split[key] || ''}
              onChange={(e) => update(key, Number(e.target.value) || 0)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </label>
        ))}
      </div>

      <dl className="space-y-1 border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs">
        <div className="flex justify-between">
          <dt className="text-slate-800">Allocated</dt>
          <dd className="font-mono font-bold tabular-nums">₹ {splitTotal.toLocaleString('en-IN')}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="font-bold text-slate-900">Balance Due</dt>
          <dd
            className={`font-mono font-black tabular-nums ${
              isBalanced ? 'text-emerald-700' : 'text-rose-600'
            }`}
          >
            ₹ {balanceDue.toLocaleString('en-IN')}
          </dd>
        </div>
      </dl>

      <div className="p-4 pt-0">
        <button
          type="button"
          disabled={!isBalanced}
          onClick={onCollect}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3 text-sm font-black text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CheckCircle2 className="h-5 w-5" />
          Confirm Collection
        </button>
      </div>
    </div>
  );
}
