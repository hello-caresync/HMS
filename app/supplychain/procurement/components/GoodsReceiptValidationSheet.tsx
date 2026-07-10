'use client';

import { useState } from 'react';
import { CheckCircle2, ClipboardCheck, Send } from 'lucide-react';

import type { GoodsVerificationStatus, PurchaseOrderBundle } from '../../../lib/supplychain';

type GoodsReceiptValidationSheetProps = {
  purchaseOrder: PurchaseOrderBundle;
  onComplete: () => void;
  completed: boolean;
};

export default function GoodsReceiptValidationSheet({
  purchaseOrder,
  onComplete,
  completed,
}: GoodsReceiptValidationSheetProps) {
  const [poReferenceId, setPoReferenceId] = useState(purchaseOrder.poReferenceId);
  const [itemsReceived, setItemsReceived] = useState(
    purchaseOrder.lineItems.map((l) => l.description).join('; '),
  );
  const [quantityReceived, setQuantityReceived] = useState(
    purchaseOrder.lineItems.reduce((s, l) => s + l.quantityOrdered, 0),
  );
  const [verificationStatus, setVerificationStatus] =
    useState<GoodsVerificationStatus>('Pass');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationStatus !== 'Pass') return;
    if (poReferenceId.trim() !== purchaseOrder.poReferenceId) return;
    onComplete();
  };

  const poMatch = poReferenceId.trim() === purchaseOrder.poReferenceId;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm"
    >
      <div className="mb-3 flex items-center gap-2">
        <ClipboardCheck className="h-4 w-4 text-slate-800" />
        <h2 className="text-sm font-black text-slate-900">Goods Receipt Validation</h2>
      </div>

      <dl className="mb-4 grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs sm:grid-cols-4">
        <div>
          <dt className="text-[9px] font-bold uppercase text-slate-800">Vendor</dt>
          <dd className="font-semibold">{purchaseOrder.vendorName}</dd>
        </div>
        <div>
          <dt className="text-[9px] font-bold uppercase text-slate-800">Tracking Ref</dt>
          <dd className="font-mono text-[10px]">{purchaseOrder.vendorTrackingRef}</dd>
        </div>
        <div>
          <dt className="text-[9px] font-bold uppercase text-slate-800">Fulfillment</dt>
          <dd className="font-bold text-emerald-700">{purchaseOrder.deliveryFulfillmentPercent}%</dd>
        </div>
        <div>
          <dt className="text-[9px] font-bold uppercase text-slate-800">PO Total</dt>
          <dd className="font-mono font-bold">₹ {purchaseOrder.grandTotal.toLocaleString('en-IN')}</dd>
        </div>
      </dl>

      <div className="mb-3 overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-slate-800 text-white">
              <th className="px-2 py-1.5 text-left text-[9px] font-black uppercase">SKU</th>
              <th className="px-2 py-1.5 text-left text-[9px] font-black uppercase">Description</th>
              <th className="px-2 py-1.5 text-right text-[9px] font-black uppercase">Qty</th>
              <th className="px-2 py-1.5 text-right text-[9px] font-black uppercase">Rate</th>
              <th className="px-2 py-1.5 text-right text-[9px] font-black uppercase">GST</th>
            </tr>
          </thead>
          <tbody>
            {purchaseOrder.lineItems.map((line) => (
              <tr key={line.sku} className="border-b-2 border-slate-200">
                <td className="px-2 py-1.5 font-mono text-[10px]">{line.sku}</td>
                <td className="px-2 py-1.5">{line.description}</td>
                <td className="px-2 py-1.5 text-right font-mono">{line.quantityOrdered}</td>
                <td className="px-2 py-1.5 text-right font-mono">₹ {line.unitPrice}</td>
                <td className="px-2 py-1.5 text-right font-mono">{line.gstPercent}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-800">PO Reference ID</span>
          <input
            required
            value={poReferenceId}
            onChange={(e) => setPoReferenceId(e.target.value)}
            className={`w-full rounded-lg border px-3 py-2 font-mono text-sm outline-none focus:ring-2 ${
              poMatch
                ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-100'
                : 'border-rose-300 focus:border-rose-500 focus:ring-rose-100'
            }`}
          />
          {!poMatch && poReferenceId.trim() && (
            <p className="text-[9px] font-bold text-rose-600">PO reference mismatch</p>
          )}
        </label>

        <label className="block space-y-1 sm:col-span-2">
          <span className="text-[10px] font-bold uppercase text-slate-800">Items Received</span>
          <input
            required
            value={itemsReceived}
            onChange={(e) => setItemsReceived(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-800">Qty Received</span>
          <input
            type="number"
            min={1}
            required
            value={quantityReceived}
            onChange={(e) => setQuantityReceived(Number(e.target.value) || 0)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-800">Verification</span>
          <select
            value={verificationStatus}
            onChange={(e) => setVerificationStatus(e.target.value as GoodsVerificationStatus)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
          >
            <option value="Pass">Pass</option>
            <option value="Fail">Fail</option>
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={!poMatch || verificationStatus !== 'Pass'}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-black text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          Complete Invoice Verification &amp; Pass to Finance
        </button>
        {completed && (
          <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            Handed off to finance ledger
          </span>
        )}
      </div>
    </form>
  );
}
