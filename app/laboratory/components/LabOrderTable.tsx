'use client';

import { useState } from 'react';
import { CheckCircle2, Microscope, TestTube } from 'lucide-react';

import { useLab } from '../context/LabProvider';
import type { LabOrder, LabUrgency } from '../types';
import { URGENCY_STYLES } from '../types';
import CollectSampleSheet from './CollectSampleSheet';
import ResultEntryForm from './ResultEntryForm';

type LabOrderTableProps = {
  view: 'collection' | 'results';
};

export default function LabOrderTable({ view }: LabOrderTableProps) {
  const { pendingCollection, awaitingResults } = useLab();
  const [collectOrder, setCollectOrder] = useState<LabOrder | null>(null);
  const [resultOrderId, setResultOrderId] = useState<string | null>(
    view === 'results' ? awaitingResults[0]?.id ?? null : null,
  );

  const rows = view === 'collection' ? pendingCollection : awaitingResults;
  const selectedResultOrder = awaitingResults.find((o) => o.id === resultOrderId);

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-100/80">
              <th className="px-3 py-2 font-black uppercase tracking-wider text-slate-950">Patient</th>
              <th className="px-3 py-2 font-black uppercase tracking-wider text-slate-950">UHID</th>
              <th className="px-3 py-2 font-black uppercase tracking-wider text-slate-950">Ordered Tests</th>
              <th className="px-3 py-2 font-black uppercase tracking-wider text-slate-950">Urgency</th>
              <th className="px-3 py-2 text-right font-black uppercase tracking-wider text-slate-950">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-10 text-center text-slate-950">
                  No orders in this queue
                </td>
              </tr>
            ) : (
              rows.map((order) => (
                <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-100/50">
                  <td className="px-3 py-2 font-bold text-slate-900">{order.patientName}</td>
                  <td className="px-3 py-2 font-mono text-[11px] text-slate-950">{order.uhid}</td>
                  <td className="px-3 py-2 text-slate-950">{order.orderedTests.join(', ')}</td>
                  <td className="px-3 py-2">
                    <UrgencyBadge urgency={order.urgency} />
                  </td>
                  <td className="px-3 py-2 text-right">
                    {view === 'collection' ? (
                      <button
                        type="button"
                        onClick={() => setCollectOrder(order)}
                        className="inline-flex items-center gap-1 rounded bg-primary px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-primary-hover"
                      >
                        <TestTube className="h-3 w-3" />
                        Collect Sample
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setResultOrderId(order.id)}
                        className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-[10px] font-semibold ${
                          resultOrderId === order.id
                            ? 'bg-violet-600 text-white'
                            : 'bg-slate-100 text-slate-900 hover:bg-violet-50 hover:text-violet-700'
                        }`}
                      >
                        <Microscope className="h-3 w-3" />
                        Enter Results
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {view === 'results' && selectedResultOrder && (
        <div className="mt-3">
          <ResultEntryForm
            order={selectedResultOrder}
            onSubmitted={() => setResultOrderId(null)}
          />
        </div>
      )}

      <CollectSampleSheet
        order={collectOrder}
        open={collectOrder !== null}
        onClose={() => setCollectOrder(null)}
      />
    </>
  );
}

function UrgencyBadge({ urgency }: { urgency: LabUrgency }) {
  return (
    <span
      className={`inline-flex rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ring-1 ring-inset ${URGENCY_STYLES[urgency]}`}
    >
      {urgency}
    </span>
  );
}

export function ApprovedBanner({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <div className="mb-2 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800">
      <CheckCircle2 className="h-4 w-4" />
      {count} report(s) approved this session
    </div>
  );
}
