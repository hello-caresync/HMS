'use client';

import { formatCurrency } from '../../master-data/lib/seedData';
import { useProcurement } from '../context/ProcurementProvider';
import { PO_STATUS_STYLES } from '../types';
import ThreeWayMatchView from './ThreeWayMatchView';

export default function PurchaseOrdersTab() {
  const { purchaseOrders, selectedPoId, setSelectedPoId, getPo } = useProcurement();
  const selected = selectedPoId ? getPo(selectedPoId) : undefined;

  return (
    <div className="grid gap-3 lg:grid-cols-[260px_1fr]">
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b-2 border-slate-200 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
            Purchase Orders
          </p>
        </div>
        <ul className="divide-y divide-slate-50">
          {purchaseOrders.map((po) => (
            <li key={po.id}>
              <button
                type="button"
                onClick={() => setSelectedPoId(po.id)}
                className={`w-full px-3 py-2 text-left transition ${
                  selectedPoId === po.id ? 'bg-indigo-50' : 'hover:bg-slate-50'
                }`}
              >
                <p className="font-mono text-[10px] font-semibold text-indigo-700">{po.poNumber}</p>
                <p className="truncate text-[11px] font-medium text-slate-900">{po.itemName}</p>
                <p className="text-[9px] text-slate-800">{po.vendorName}</p>
                <div className="mt-0.5 flex items-center justify-between gap-1">
                  <span
                    className={`inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-bold ring-1 ring-inset ${PO_STATUS_STYLES[po.status]}`}
                  >
                    {po.status}
                  </span>
                  <span className="font-mono text-[9px] tabular-nums text-slate-800">
                    {formatCurrency(po.totalAmount)}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        {selected ? (
          <ThreeWayMatchView po={selected} />
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-12 text-center text-xs text-slate-800">
            Select a PO to run three-way match verification
          </div>
        )}
      </div>
    </div>
  );
}
