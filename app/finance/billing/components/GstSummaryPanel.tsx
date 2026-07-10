'use client';

import { Receipt, Send } from 'lucide-react';

import type { BillingInvoiceSummary } from '../../../lib/finance';

type GstSummaryPanelProps = {
  summary: BillingInvoiceSummary;
  discount: number;
  onDiscountChange: (value: number) => void;
  onDispatch: () => void;
  dispatched: boolean;
};

export default function GstSummaryPanel({
  summary,
  discount,
  onDiscountChange,
  onDispatch,
  dispatched,
}: GstSummaryPanelProps) {
  return (
    <div className="rounded-xl border border-slate-300 bg-white shadow-sm">
      <div className="border-b-2 border-slate-200 bg-slate-800 px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4" />
          <h2 className="text-sm font-black">Summary &amp; GST</h2>
        </div>
      </div>

      <dl className="space-y-2 p-4 text-xs">
        <div className="flex justify-between">
          <dt className="text-slate-800">Subtotal</dt>
          <dd className="font-mono font-bold tabular-nums">₹ {summary.subtotal.toLocaleString('en-IN')}</dd>
        </div>

        <label className="block space-y-1 pt-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
            Authorized Discount (₹)
          </span>
          <input
            type="number"
            min={0}
            step={100}
            value={discount}
            onChange={(e) => onDiscountChange(Number(e.target.value) || 0)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
          />
        </label>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 space-y-1.5">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-800">
            Taxable Base · ₹ {summary.gst.taxableBase.toLocaleString('en-IN')}
          </p>
          <div className="flex justify-between">
            <dt className="text-slate-800">CGST @ {summary.gst.cgstRate}%</dt>
            <dd className="font-mono font-semibold tabular-nums">
              ₹ {summary.gst.cgstAmount.toLocaleString('en-IN')}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-800">SGST @ {summary.gst.sgstRate}%</dt>
            <dd className="font-mono font-semibold tabular-nums">
              ₹ {summary.gst.sgstAmount.toLocaleString('en-IN')}
            </dd>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-1.5">
            <dt className="font-bold text-slate-900">Total GST</dt>
            <dd className="font-mono font-bold tabular-nums">
              ₹ {summary.gst.totalGst.toLocaleString('en-IN')}
            </dd>
          </div>
        </div>

        <div className="flex justify-between border-t border-slate-200 pt-2">
          <dt className="text-sm font-black text-slate-900">Grand Total</dt>
          <dd className="font-mono text-lg font-black tabular-nums text-emerald-700">
            ₹ {summary.grandTotal.toLocaleString('en-IN')}
          </dd>
        </div>
      </dl>

      <div className="border-t border-slate-200 p-4">
        <button
          type="button"
          disabled={dispatched}
          onClick={onDispatch}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 py-3 text-sm font-black text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
          Generate Final Invoice &amp; Dispatch to Cashier
        </button>
      </div>
    </div>
  );
}
