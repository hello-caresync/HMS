'use client';

import { ArrowRightCircle } from 'lucide-react';

import { useProcurement } from '../context/ProcurementProvider';
import { PRIORITY_STYLES } from '../types';

export default function PurchaseRequestsTab() {
  const { purchaseRequests, approveAndConvertToRfq } = useProcurement();

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b-2 border-slate-200 bg-slate-50/80 px-3 py-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
          Internal Stock Requisitions
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-[11px]">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-[#0a0e14] text-[10px] uppercase tracking-wider text-slate-800">
              <th className="px-3 py-2 font-black">Item Name</th>
              <th className="px-3 py-2 font-black">Department</th>
              <th className="px-3 py-2 text-right font-black">Qty</th>
              <th className="px-3 py-2 font-black">Priority</th>
              <th className="px-3 py-2 font-black">Status</th>
              <th className="px-3 py-2 text-right font-black">Action</th>
            </tr>
          </thead>
          <tbody>
            {purchaseRequests.map((pr) => (
              <tr key={pr.id} className="border-b border-slate-50 hover:bg-slate-100/60">
                <td className="px-3 py-2 font-bold text-slate-900">{pr.itemName}</td>
                <td className="px-3 py-2 text-slate-950">{pr.requestingDepartment}</td>
                <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-950">
                  {pr.quantity} {pr.unit}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${PRIORITY_STYLES[pr.priority]}`}
                  >
                    {pr.priority}
                  </span>
                </td>
                <td className="px-3 py-2 text-[10px] font-bold capitalize text-slate-950">
                  {pr.status}
                </td>
                <td className="px-3 py-2 text-right">
                  {pr.status === 'Pending' && (
                    <button
                      type="button"
                      onClick={() => approveAndConvertToRfq(pr.id)}
                      className="inline-flex items-center gap-1 rounded bg-indigo-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-indigo-700"
                    >
                      <ArrowRightCircle className="h-3 w-3" />
                      Approve & Convert to RFQ
                    </button>
                  )}
                  {pr.status === 'Converted' && (
                    <span className="text-[10px] font-semibold text-emerald-600">RFQ created</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
