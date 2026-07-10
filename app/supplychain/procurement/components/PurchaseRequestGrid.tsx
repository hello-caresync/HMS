'use client';

import { ArrowRight, ChevronRight } from 'lucide-react';

import {
  PIPELINE_STAGE_STYLES,
  PIPELINE_STAGES,
  type PurchaseRequestRow,
} from '../../../lib/supplychain';

type PurchaseRequestGridProps = {
  requests: PurchaseRequestRow[];
  onAdvanceStage: (requestId: string) => void;
};

export default function PurchaseRequestGrid({
  requests,
  onAdvanceStage,
}: PurchaseRequestGridProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
      <div className="border-b-2 border-slate-200 bg-slate-50 px-4 py-2.5">
        <h2 className="text-sm font-black text-slate-900">Pending Purchase Requests</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-800 text-white">
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase">Request ID</th>
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase">Title</th>
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase">Vendor Ref</th>
              <th className="px-3 py-2 text-right text-[10px] font-black uppercase">Est. (₹)</th>
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase">Pipeline</th>
              <th className="px-3 py-2 text-right text-[10px] font-black uppercase">Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req, index) => {
              const stageIdx = PIPELINE_STAGES.indexOf(req.stage);
              const canAdvance = req.stage !== 'PO Dispatched';

              return (
                <tr
                  key={req.requestId}
                  className={`border-b-2 border-slate-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}
                >
                  <td className="px-3 py-2 font-mono text-xs font-black">{req.requestId}</td>
                  <td className="px-3 py-2 text-xs font-bold text-slate-950">{req.title}</td>
                  <td className="px-3 py-2 font-mono text-[10px] text-slate-950">{req.vendorRef}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs tabular-nums">
                    {req.estimatedValue.toLocaleString('en-IN')}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap items-center gap-1">
                      {PIPELINE_STAGES.map((stage, i) => (
                        <span key={stage} className="flex items-center gap-0.5">
                          <span
                            className={`rounded px-1 py-0.5 text-[7px] font-bold uppercase ring-1 ${
                              i <= stageIdx
                                ? PIPELINE_STAGE_STYLES[stage]
                                : 'bg-slate-50 text-slate-800 ring-slate-200'
                            }`}
                          >
                            {stage.split(' ')[0]}
                          </span>
                          {i < PIPELINE_STAGES.length - 1 && (
                            <ChevronRight className="h-2.5 w-2.5 text-slate-900" />
                          )}
                        </span>
                      ))}
                    </div>
                    <span
                      className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[8px] font-bold uppercase ring-1 ${PIPELINE_STAGE_STYLES[req.stage]}`}
                    >
                      {req.stage}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      disabled={!canAdvance}
                      onClick={() => onAdvanceStage(req.requestId)}
                      className="inline-flex items-center gap-1 rounded border border-sky-300 bg-sky-50 px-2 py-1 text-[10px] font-bold text-sky-800 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Advance
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
