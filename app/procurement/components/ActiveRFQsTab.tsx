'use client';

import { useProcurement } from '../context/ProcurementProvider';
import { RFQ_STATUS_STYLES } from '../types';
import VendorComparisonMatrix from './VendorComparisonMatrix';

export default function ActiveRFQsTab() {
  const { rfqs, selectedRfqId, setSelectedRfqId, getRfq } = useProcurement();
  const selected = selectedRfqId ? getRfq(selectedRfqId) : undefined;

  return (
    <div className="grid gap-3 lg:grid-cols-[240px_1fr]">
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b-2 border-slate-200 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
            Active RFQs
          </p>
        </div>
        <ul className="divide-y divide-slate-50">
          {rfqs.map((rfq) => (
            <li key={rfq.id}>
              <button
                type="button"
                onClick={() => setSelectedRfqId(rfq.id)}
                className={`w-full px-3 py-2 text-left transition ${
                  selectedRfqId === rfq.id ? 'bg-indigo-50' : 'hover:bg-slate-50'
                }`}
              >
                <p className="font-mono text-[10px] font-semibold text-indigo-700">
                  {rfq.rfqNumber}
                </p>
                <p className="truncate text-[11px] font-medium text-slate-900">{rfq.itemName}</p>
                <span
                  className={`mt-0.5 inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-bold ring-1 ring-inset ${RFQ_STATUS_STYLES[rfq.status]}`}
                >
                  {rfq.status}
                </span>
                <p className="text-[9px] text-slate-800">{rfq.bids.length} bid(s)</p>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        {selected ? (
          <VendorComparisonMatrix rfq={selected} />
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-12 text-center text-xs text-slate-800">
            Select an RFQ to compare vendor bids
          </div>
        )}
      </div>
    </div>
  );
}
