'use client';

import { AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';

import { useVendorHub } from '../context/VendorHubProvider';
import type { ComplianceDocument } from '../types';
import { COMPLIANCE_STYLES } from '../types';

export default function VendorScorecardView() {
  const { performance, compliance } = useVendorHub();

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b-2 border-slate-200 bg-[#0a0e14] px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
            Vendor Performance Matrix
          </p>
          <p className="text-xs font-bold text-white">Supplier scorecard</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[400px] text-[11px]">
            <thead>
              <tr className="border-b-2 border-slate-200 bg-slate-100/80 text-[10px] uppercase tracking-wider text-slate-800">
                <th className="px-3 py-2 text-left font-black">Vendor</th>
                <th className="px-3 py-2 text-right font-black">Fulfillment %</th>
                <th className="px-3 py-2 text-right font-black">Lead Time</th>
                <th className="px-3 py-2 text-right font-black">Cost Var.</th>
              </tr>
            </thead>
            <tbody>
              {performance.map((row) => (
                <tr key={row.vendorId} className="border-b border-slate-50 hover:bg-slate-100/60">
                  <td className="px-3 py-2 font-bold text-slate-900">{row.vendorName}</td>
                  <td className="px-3 py-2 text-right">
                    <span
                      className={`font-mono font-bold tabular-nums ${
                        row.fulfillmentRatePct >= 95
                          ? 'text-emerald-700'
                          : row.fulfillmentRatePct >= 90
                            ? 'text-amber-700'
                            : 'text-rose-700'
                      }`}
                    >
                      {row.fulfillmentRatePct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-900">
                    {row.avgLeadTimeDays.toFixed(1)}d
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">
                    <span
                      className={
                        row.costVariancePct <= 0 ? 'text-emerald-700' : 'text-rose-600'
                      }
                    >
                      {row.costVariancePct >= 0 ? '+' : ''}
                      {row.costVariancePct.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b-2 border-slate-200 bg-[#0a0e14] px-3 py-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
              Compliance Registry
            </p>
            <p className="text-xs font-bold text-white">Licenses & tax validation</p>
          </div>
        </div>
        <div className="custom-scrollbar max-h-[360px] space-y-2 overflow-y-auto p-3">
          {compliance.map((record) => (
            <div
              key={record.vendorId}
              className="rounded-md border-2 border-slate-200 bg-slate-50/50 p-2.5"
            >
              <p className="text-xs font-bold text-slate-900">{record.vendorName}</p>
              <div className="mt-2 space-y-1.5">
                <ComplianceLine doc={record.medicalLicense} />
                <ComplianceLine doc={record.drugDistributionCert} />
                <ComplianceLine doc={record.taxStatus} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ComplianceLine({ doc }: { doc: ComplianceDocument }) {
  const ok = doc.status === 'Compliant' || doc.status === 'Active';
  const expired = doc.status === 'Expired';

  return (
    <div className="flex items-start justify-between gap-2 text-[10px]">
      <div className="min-w-0">
        <p className="font-semibold text-slate-900">{doc.label}</p>
        <p className="font-mono text-[9px] text-slate-800">{doc.referenceId}</p>
        {doc.expiryDate && (
          <p className="text-[9px] text-slate-800">Exp {doc.expiryDate}</p>
        )}
      </div>
      <span
        className={`inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold ring-1 ring-inset ${COMPLIANCE_STYLES[doc.status]}`}
      >
        {ok && <CheckCircle2 className="h-2.5 w-2.5" />}
        {expired && <AlertTriangle className="h-2.5 w-2.5" />}
        {doc.status}
      </span>
    </div>
  );
}
