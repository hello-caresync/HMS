'use client';

import { PRE_AUTH_STATUS_STYLES, type PreAuthorizationRequest } from '../../../lib/finance';

type PreAuthGridProps = {
  requests: PreAuthorizationRequest[];
};

export default function PreAuthGrid({ requests }: PreAuthGridProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
      <div className="border-b-2 border-slate-200 bg-slate-50 px-4 py-2.5">
        <h2 className="text-sm font-black text-slate-900">Pre-Authorization Requests</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-800 text-white">
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase">Request ID</th>
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase">Patient</th>
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase">Policy</th>
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase">TPA</th>
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase">Procedure</th>
              <th className="px-3 py-2 text-right text-[10px] font-black uppercase">Est. (₹)</th>
              <th className="px-3 py-2 text-right text-[10px] font-black uppercase">Co-Pay</th>
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req, index) => (
              <tr
                key={req.requestId}
                className={`border-b-2 border-slate-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}
              >
                <td className="px-3 py-2 font-mono text-xs font-black">{req.requestId}</td>
                <td className="px-3 py-2">
                  <p className="text-xs font-semibold text-slate-900">{req.patientName}</p>
                  <p className="font-mono text-[10px] text-slate-800">{req.patientUhid}</p>
                </td>
                <td className="px-3 py-2 font-mono text-[10px] text-slate-950">{req.policyNumber}</td>
                <td className="px-3 py-2 text-xs text-slate-900">{req.tpaCompany}</td>
                <td className="px-3 py-2 text-xs text-slate-950">{req.procedureSummary}</td>
                <td className="px-3 py-2 text-right font-mono text-xs tabular-nums">
                  {req.estimatedAmount > 0
                    ? req.estimatedAmount.toLocaleString('en-IN')
                    : '—'}
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs tabular-nums">
                  ₹ {req.coPayAmount.toLocaleString('en-IN')}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[8px] font-bold uppercase ring-1 ${PRE_AUTH_STATUS_STYLES[req.status]}`}
                  >
                    {req.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
