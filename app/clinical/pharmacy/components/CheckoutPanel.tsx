'use client';

import { useMemo } from 'react';
import { CreditCard, Receipt } from 'lucide-react';

import { DEFAULT_GST_PERCENT, type ActivePrescription } from '../../../lib/clinical';

type CheckoutPanelProps = {
  prescription: ActivePrescription;
  onCheckout: () => void;
};

export default function CheckoutPanel({ prescription, onCheckout }: CheckoutPanelProps) {
  const fulfilledLines = prescription.lines.filter((l) => l.fulfilled);

  const { subtotal, gstAmount, grandTotal } = useMemo(() => {
    const sub = fulfilledLines.reduce(
      (sum, l) => sum + l.unitPrice * l.quantityOrdered,
      0,
    );
    const gst = sub * (DEFAULT_GST_PERCENT / 100);
    return { subtotal: sub, gstAmount: gst, grandTotal: sub + gst };
  }, [fulfilledLines]);

  return (
    <div className="rounded-xl border border-slate-300 bg-white shadow-sm">
      <div className="border-b-2 border-slate-200 bg-slate-800 px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4" />
          <h2 className="text-sm font-black">Immediate Checkout</h2>
        </div>
      </div>

      <div className="max-h-[320px] overflow-y-auto p-4">
        {fulfilledLines.length === 0 ? (
          <p className="text-center text-xs text-slate-800">No fulfilled lines yet.</p>
        ) : (
          <ul className="space-y-2">
            {fulfilledLines.map((line) => (
              <li
                key={line.id}
                className="flex justify-between gap-2 border-b-2 border-slate-200 pb-2 text-xs"
              >
                <span className="font-medium text-slate-800">
                  {line.drugName} × {line.quantityOrdered}
                </span>
                <span className="shrink-0 font-mono font-bold tabular-nums text-slate-900">
                  ₹ {(line.unitPrice * line.quantityOrdered).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <dl className="space-y-1.5 border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs">
        <div className="flex justify-between">
          <dt className="text-slate-800">Subtotal</dt>
          <dd className="font-mono font-bold tabular-nums">₹ {subtotal.toFixed(2)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-800">GST ({DEFAULT_GST_PERCENT}%)</dt>
          <dd className="font-mono font-bold tabular-nums text-slate-900">
            ₹ {gstAmount.toFixed(2)}
          </dd>
        </div>
        <div className="flex justify-between border-t border-slate-200 pt-2">
          <dt className="font-bold text-slate-800">Grand Total</dt>
          <dd className="font-mono text-base font-black tabular-nums text-emerald-700">
            ₹ {grandTotal.toFixed(2)}
          </dd>
        </div>
      </dl>

      <div className="p-4 pt-0">
        <button
          type="button"
          disabled={fulfilledLines.length === 0}
          onClick={onCheckout}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3.5 text-sm font-black uppercase tracking-wide text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CreditCard className="h-5 w-5" />
          Collect Payment &amp; Dispense
        </button>
      </div>
    </div>
  );
}
