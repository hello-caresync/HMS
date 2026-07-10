'use client';

import { CheckCircle2, IndianRupee, XCircle } from 'lucide-react';

import { formatCurrency } from '../../master-data/lib/seedData';
import { useVendorHub } from '../context/VendorHubProvider';
import { PAYMENT_STAGE_STYLES } from '../types';

export default function PaymentTrackerLedger() {
  const { vendorOptions, selectedVendorId, setSelectedVendorId, filteredPayments, livePulse } =
    useVendorHub();

  const selectedVendor = vendorOptions.find((v) => v.id === selectedVendorId);
  const pendingTotal = filteredPayments
    .filter((p) => p.paymentStage !== 'Settled')
    .reduce((s, p) => s + p.billAmount, 0);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b-2 border-slate-200 bg-[#0a0e14] px-3 py-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
          B2B Payment Tracker Ledger
        </p>
        <p className="text-xs font-bold text-white">Hospital ↔ Vendor financial state</p>
      </div>

      <div className="flex flex-wrap items-end gap-3 border-b-2 border-slate-200 bg-slate-50/80 px-3 py-2">
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase text-slate-800">
            Select Vendor
          </label>
          <select
            value={selectedVendorId}
            onChange={(e) => setSelectedVendorId(e.target.value)}
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {vendorOptions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
        <div className="ml-auto flex items-center gap-2 text-[10px]">
          <IndianRupee className="h-3.5 w-3.5 text-slate-800" />
          <span className="text-slate-800">Outstanding:</span>
          <span className="font-mono font-bold tabular-nums text-amber-700">
            {formatCurrency(pendingTotal)}
          </span>
        </div>
      </div>

      {selectedVendor && (
        <p className="border-b border-slate-50 px-3 py-1.5 text-[10px] text-slate-800">
          Ledger for <strong className="text-slate-800">{selectedVendor.name}</strong>
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-[11px]">
          <thead>
            <tr className="border-b-2 border-slate-200 text-[10px] uppercase tracking-wider text-slate-800">
              <th className="bg-slate-100/80 px-3 py-2 text-left font-black">Invoice</th>
              <th className="bg-slate-100/80 px-3 py-2 text-left font-black">PO</th>
              <th className="bg-slate-100/80 px-3 py-2 text-right font-black">Bill Amount</th>
              <th className="bg-slate-100/80 px-3 py-2 text-center font-black">3-Way Match</th>
              <th className="bg-slate-100/80 px-3 py-2 text-left font-black">Payment Stage</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-10 text-center text-slate-950">
                  No payment records for this vendor
                </td>
              </tr>
            ) : (
              filteredPayments.map((row) => (
                <tr
                  key={row.id}
                  className={`border-b border-slate-50 hover:bg-slate-50/60 ${
                    livePulse && row.paymentStage === 'Processing Gateway' ? 'animate-fadeIn' : ''
                  }`}
                >
                  <td className="px-3 py-2 font-mono text-[10px] text-slate-900">
                    {row.invoiceNumber}
                  </td>
                  <td className="px-3 py-2 font-mono text-[10px] text-indigo-700">{row.poNumber}</td>
                  <td className="px-3 py-2 text-right font-mono font-bold tabular-nums text-slate-900">
                    {formatCurrency(row.billAmount)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {row.threeWayMatchVerified ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-600">
                        <XCircle className="h-3.5 w-3.5" />
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${PAYMENT_STAGE_STYLES[row.paymentStage]}`}
                    >
                      {row.paymentStage}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
