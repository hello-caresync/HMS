'use client';

import { Barcode, ClipboardList } from 'lucide-react';

import { LAB_STATUS_STYLES, type LabSamplePacket } from '../../../lib/clinical';

type LabOrdersGridProps = {
  orders: LabSamplePacket[];
  onPrintBarcode: (trackingId: string) => void;
  onOpenResults: (order: LabSamplePacket) => void;
};

export default function LabOrdersGrid({
  orders,
  onPrintBarcode,
  onOpenResults,
}: LabOrdersGridProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-100">
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-wider text-slate-950">
                Order ID
              </th>
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-wider text-slate-950">
                Patient
              </th>
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-wider text-slate-950">
                Test Name
              </th>
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-wider text-slate-950">
                Specimen
              </th>
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-wider text-slate-950">
                Status
              </th>
              <th className="px-3 py-2 text-right text-[10px] font-black uppercase tracking-wider text-slate-950">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => (
              <tr
                key={order.trackingId}
                className={`border-b-2 border-slate-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}
              >
                <td className="px-3 py-2">
                  <span className="font-mono text-xs font-black text-slate-950">{order.trackingId}</span>
                </td>
                <td className="px-3 py-2">
                  <span className="font-semibold text-slate-800">{order.patientInitials}</span>
                  <p className="font-mono text-[10px] text-slate-800">{order.patientReferenceId}</p>
                </td>
                <td className="px-3 py-2 text-xs font-bold text-slate-900">{order.testName}</td>
                <td className="px-3 py-2 text-xs text-slate-950">{order.specimenCategory}</td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ring-1 ${LAB_STATUS_STYLES[order.status]}`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      disabled={order.status !== 'Awaiting Collection'}
                      onClick={() => onPrintBarcode(order.trackingId)}
                      className="inline-flex items-center gap-1 rounded border border-sky-300 bg-sky-50 px-2 py-1 text-[10px] font-bold text-sky-800 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Barcode className="h-3 w-3" />
                      Print Barcode
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenResults(order)}
                      className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-[10px] font-bold text-slate-900 hover:bg-slate-50"
                    >
                      <ClipboardList className="h-3 w-3" />
                      Results Entry
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {orders.length === 0 && (
        <p className="px-4 py-8 text-center text-sm text-slate-800">No orders match your search.</p>
      )}
    </div>
  );
}
