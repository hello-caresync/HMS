'use client';

import { Search, UserRound } from 'lucide-react';

import { formatCurrency } from '../../master-data/lib/seedData';
import { computeLineItem } from '../lib/calculations';
import { useBilling } from '../context/BillingProvider';
import { BILLING_TYPES } from '../types';

export default function InvoiceCanvas() {
  const {
    patientLookup,
    currentInvoice,
    selectPatient,
    setBillingType,
    setDiscount,
    getTotals,
  } = useBilling();

  if (!currentInvoice) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-800">
        Select a patient to generate an invoice.
      </div>
    );
  }

  const totals = getTotals();
  const computedLines = currentInvoice.lineItems.map(computeLineItem);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      {/* Header strip */}
      <div className="border-b-2 border-slate-200 bg-slate-50/80 px-3 py-2">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
              Patient Invoice
            </p>
            <p className="font-mono text-xs font-semibold text-indigo-700">
              {currentInvoice.invoiceNumber}
            </p>
          </div>
          <p className="text-[10px] text-slate-800">
            {new Date(currentInvoice.createdAt).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Patient lookup + billing type */}
      <div className="grid gap-3 border-b-2 border-slate-200 p-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-800">
            <Search className="h-3 w-3" />
            Patient Lookup
          </label>
          <select
            value={currentInvoice.patientId}
            onChange={(e) => selectPatient(e.target.value)}
            className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {patientLookup.map((p) => (
              <option key={p.patientId} value={p.patientId}>
                {p.name} · {p.uhid}
              </option>
            ))}
          </select>
          <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-800">
            <UserRound className="h-3 w-3" />
            {currentInvoice.patientName} · UHID{' '}
            <span className="font-mono font-semibold">{currentInvoice.uhid}</span>
          </p>
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-800">
            Billing Type
          </label>
          <div className="flex flex-wrap gap-1">
            {BILLING_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setBillingType(type)}
                className={`rounded-md px-2.5 py-1.5 text-[11px] font-bold transition ${
                  currentInvoice.billingType === type
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Itemized grid */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-[11px]">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-[#0a0e14] text-[10px] uppercase tracking-wider text-slate-800">
              <th className="px-3 py-2 font-black">Item Description</th>
              <th className="px-3 py-2 font-black">Department</th>
              <th className="px-3 py-2 text-right font-black">Base Price</th>
              <th className="px-3 py-2 text-right font-black">GST %</th>
              <th className="px-3 py-2 text-right font-black">Tax Amount</th>
              <th className="px-3 py-2 text-right font-black">Net Total</th>
            </tr>
          </thead>
          <tbody>
            {computedLines.map((line) => (
              <tr key={line.id} className="border-b border-slate-50 hover:bg-slate-100/50">
                <td className="px-3 py-2 font-bold text-slate-900">{line.description}</td>
                <td className="px-3 py-2 text-slate-950">{line.department}</td>
                <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-900">
                  {formatCurrency(line.basePrice * line.quantity)}
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-950">
                  {line.gstPercent}%
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-950">
                  {formatCurrency(line.taxAmount)}
                </td>
                <td className="px-3 py-2 text-right font-mono font-bold tabular-nums text-slate-900">
                  {formatCurrency(line.netTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals summary */}
      <div className="flex justify-end border-t border-slate-200 bg-slate-50/60 p-3">
        <div className="w-full max-w-xs space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-800">
            <span>Subtotal</span>
            <span className="font-mono tabular-nums">{formatCurrency(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-800">
            <span>Total Tax</span>
            <span className="font-mono tabular-nums">{formatCurrency(totals.totalTax)}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="discount" className="text-slate-800">
              Discount (₹)
            </label>
            <input
              id="discount"
              type="number"
              min={0}
              step={1}
              value={currentInvoice.discount || ''}
              onChange={(e) => setDiscount(Number(e.target.value) || 0)}
              className="w-24 rounded border border-slate-200 px-2 py-0.5 text-right font-mono text-xs tabular-nums focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
            />
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-900">
            <span>Grand Total</span>
            <span className="font-mono tabular-nums text-indigo-700">
              {formatCurrency(totals.grandTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
