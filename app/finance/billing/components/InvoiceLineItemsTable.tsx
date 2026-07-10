'use client';

import { CATEGORY_STYLES, computeLineAmount, type BillingLineItem } from '../../../lib/finance';

type InvoiceLineItemsTableProps = {
  lineItems: BillingLineItem[];
};

export default function InvoiceLineItemsTable({ lineItems }: InvoiceLineItemsTableProps) {
  const subtotal = lineItems.reduce((s, l) => s + computeLineAmount(l), 0);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
      <div className="border-b-2 border-slate-200 bg-slate-50 px-4 py-2.5">
        <h2 className="text-sm font-black text-slate-900">Itemized Patient Expenses</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-800 text-white">
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase">Category</th>
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase">Description</th>
              <th className="px-3 py-2 text-center text-[10px] font-black uppercase">Qty</th>
              <th className="px-3 py-2 text-right text-[10px] font-black uppercase">Rate (₹)</th>
              <th className="px-3 py-2 text-right text-[10px] font-black uppercase">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((line, index) => (
              <tr
                key={line.id}
                className={`border-b-2 border-slate-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}
              >
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ring-1 ${CATEGORY_STYLES[line.category]}`}
                  >
                    {line.category}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-slate-900">{line.description}</td>
                <td className="px-3 py-2 text-center font-mono text-xs tabular-nums">{line.quantity}</td>
                <td className="px-3 py-2 text-right font-mono text-xs tabular-nums">
                  {line.unitRate.toLocaleString('en-IN')}
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs font-bold tabular-nums text-slate-900">
                  {computeLineAmount(line).toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-300 bg-slate-100">
              <td colSpan={4} className="px-3 py-2 text-right text-xs font-bold text-slate-950">
                Line Subtotal
              </td>
              <td className="px-3 py-2 text-right font-mono text-sm font-black tabular-nums">
                ₹ {subtotal.toLocaleString('en-IN')}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
