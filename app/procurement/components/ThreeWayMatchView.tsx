'use client';

import { AlertTriangle, CheckCircle2 } from 'lucide-react';

import { useProcurement } from '../context/ProcurementProvider';
import type { PurchaseOrder } from '../types';

type ThreeWayMatchViewProps = {
  po: PurchaseOrder;
};

export default function ThreeWayMatchView({ po }: ThreeWayMatchViewProps) {
  const { updateGrnQuantity, updateInvoiceQuantity } = useProcurement();

  const poQty = po.quantity;
  const grnQty = po.grnQuantity;
  const invQty = po.invoiceQuantity;
  const allMatch = po.matchStatus === 'Matched';
  const mismatch = po.matchStatus === 'Mismatch';

  const columns = [
    {
      title: '1 · Purchase Order',
      subtitle: po.poNumber,
      qty: poQty,
      editable: false,
      value: poQty,
    },
    {
      title: '2 · Goods Receipt (GRN)',
      subtitle: 'Receiving dock count',
      qty: grnQty,
      editable: true,
      value: grnQty,
      onChange: (v: number) => updateGrnQuantity(po.id, v),
    },
    {
      title: '3 · Vendor Invoice',
      subtitle: po.vendorName,
      qty: invQty,
      editable: true,
      value: invQty,
      onChange: (v: number) => updateInvoiceQuantity(po.id, v),
    },
  ];

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b-2 border-slate-200 bg-[#0a0e14] px-3 py-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
          Three-Way Match Verification
        </p>
        <p className="text-xs font-bold text-white">{po.itemName}</p>
        <p className="font-mono text-[10px] text-slate-800">
          {po.poNumber} · {po.vendorName}
        </p>
      </div>

      {allMatch && (
        <div className="flex items-center gap-2 border-b border-emerald-200 bg-emerald-50 px-3 py-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <p className="text-xs font-bold text-emerald-800">
            Three-way match confirmed — PO, GRN, and invoice quantities align
          </p>
        </div>
      )}

      {mismatch && (
        <div className="flex items-center gap-2 border-b border-rose-300 bg-rose-50 px-3 py-2">
          <AlertTriangle className="h-4 w-4 text-rose-600" />
          <p className="text-xs font-bold text-rose-800">
            Mismatch detected — verify under-shipment or vendor overbilling before payment release
          </p>
        </div>
      )}

      <div className="grid gap-px bg-slate-200 md:grid-cols-3">
        {columns.map((col) => {
          const matchesPo = col.value === poQty;
          return (
            <div key={col.title} className="bg-white p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
                {col.title}
              </p>
              <p className="text-[9px] text-slate-800">{col.subtitle}</p>

              {col.editable ? (
                <input
                  type="number"
                  min={0}
                  value={col.value || ''}
                  onChange={(e) => col.onChange?.(parseInt(e.target.value, 10) || 0)}
                  className="mt-2 w-full rounded-md border border-slate-200 px-2 py-1.5 font-mono text-lg font-bold tabular-nums focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              ) : (
                <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900">
                  {col.qty}
                </p>
              )}

              <p className="mt-1 text-[10px] text-slate-800">{po.unit}</p>

              <div className="mt-2 flex items-center gap-1">
                {matchesPo && col.title !== '1 · Purchase Order' ? (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800">
                    <CheckCircle2 className="h-3 w-3" />
                    Matches PO
                  </span>
                ) : !matchesPo && col.value > 0 ? (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-100 px-2 py-0.5 text-[9px] font-bold text-rose-800">
                    <AlertTriangle className="h-3 w-3" />
                    Variance {col.value - poQty >= 0 ? '+' : ''}
                    {col.value - poQty}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-slate-200 bg-slate-50/80 px-3 py-2">
        <p className="font-mono text-[10px] text-slate-800">
          PO: {poQty} · GRN: {grnQty} · Invoice: {invQty} · Status:{' '}
          <strong className={allMatch ? 'text-emerald-700' : mismatch ? 'text-rose-700' : 'text-slate-900'}>
            {po.matchStatus}
          </strong>
        </p>
      </div>
    </div>
  );
}
