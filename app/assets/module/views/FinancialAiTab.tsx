'use client';

import { Bot, DollarSign, Shield, TrendingUp } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { AiAssetInsightStatus } from '../assetNav.types';
import type { AiAssetInsight } from '../lib/assetMockData';
import {
  DEPRECIATION_TREND,
  DISPOSAL_RECORDS,
  FINANCIAL_LEDGER,
  UTILIZATION_METRICS,
  formatInr,
  formatInrCr,
} from '../lib/assetMockData';
import { AssetPanel, SecureCompliancePlaceholder } from '../components/assetUi';

type FinancialAiTabProps = {
  aiInsights: AiAssetInsight[];
  onUpdateAiStatus: (id: string, status: AiAssetInsightStatus) => void;
};

function AiSeverityPill({ severity }: { severity: 'Info' | 'Warning' | 'Critical' }) {
  const styles = {
    Info: 'bg-sky-100 text-sky-800',
    Warning: 'bg-amber-100 text-amber-800',
    Critical: 'bg-red-100 text-red-800 animate-pulse',
  };
  return <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[severity]}`}>{severity}</span>;
}

export default function FinancialAiTab({ aiInsights, onUpdateAiStatus }: FinancialAiTabProps) {
  return (
    <div className="space-y-2">
      <AssetPanel title="Asset Financial Ledger & Compliance Vault" subtitle="TCO · net book value · depreciation · warranty · audit verification" icon={DollarSign} secure>
        <SecureCompliancePlaceholder verified />
        <table className="mt-2 w-full min-w-[720px] text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['Tag', 'Asset', 'Acquisition', 'NBV', 'Method', 'Annual Dep.', 'Warranty', 'Audit'].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FINANCIAL_LEDGER.map((f) => (
              <tr key={f.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                <td className="px-1.5 py-1 font-mono text-[8px] font-bold text-[#2563EB]">{f.assetTag}</td>
                <td className="px-1.5 py-1 text-[9px] font-semibold">{f.assetName}</td>
                <td className="px-1.5 py-1 text-[8px] tabular-nums">{formatInrCr(f.acquisitionCost)}</td>
                <td className="px-1.5 py-1 text-[8px] font-bold tabular-nums text-[#2563EB]">{formatInrCr(f.netBookValue)}</td>
                <td className="px-1.5 py-1 text-[8px]">{f.depreciationMethod}</td>
                <td className="px-1.5 py-1 text-[8px] tabular-nums">{formatInr(f.annualDepreciation)}</td>
                <td className="px-1.5 py-1 text-[8px]">{f.warrantyExpiry}</td>
                <td className="px-1.5 py-1">
                  {f.auditVerified ? (
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[7px] font-bold uppercase text-emerald-800">Verified</span>
                  ) : (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[7px] font-bold uppercase text-amber-800">Pending</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AssetPanel>

      <AssetPanel title="Equipment Disposal Workflow" subtitle="End-of-life · decommissioning · finance approval" icon={Shield}>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['Tag', 'Asset', 'Reason', 'Residual', 'Workflow', 'Submitted'].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DISPOSAL_RECORDS.map((d) => (
              <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                <td className="px-1.5 py-1 font-mono text-[8px]">{d.assetTag}</td>
                <td className="px-1.5 py-1 text-[9px] font-semibold">{d.assetName}</td>
                <td className="max-w-[160px] truncate px-1.5 py-1 text-[8px] text-slate-600">{d.reason}</td>
                <td className="px-1.5 py-1 text-[8px] tabular-nums">{formatInr(d.residualValue)}</td>
                <td className="px-1.5 py-1">
                  <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${
                    d.workflowStatus === 'Approved' || d.workflowStatus === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-violet-100 text-violet-800'
                  }`}>{d.workflowStatus}</span>
                </td>
                <td className="px-1.5 py-1 text-[8px] text-slate-500">{d.submittedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </AssetPanel>

      <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
        <AssetPanel title="Depreciation Trend (₹ Crores)" subtitle="Gross asset value vs net book value — FY22–FY26" icon={TrendingUp}>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DEPRECIATION_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="year" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={{ fontSize: 10 }} />
                <Bar dataKey="gross" fill="#2563EB" name="Gross Value" radius={[2, 2, 0, 0]} />
                <Bar dataKey="nbv" fill="#10B981" name="Net Book Value" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AssetPanel>

        <AssetPanel title="Smart Equipment Utilization Matrix" subtitle="Idle vs capacity — CT · MRI · lab · ECG hours" icon={TrendingUp}>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Asset', 'Used Hrs', 'Capacity', 'Util %', 'Idle Flag'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {UTILIZATION_METRICS.map((u) => (
                <tr key={u.assetTag} className={`border-b border-slate-50 ${u.idleFlag ? 'bg-amber-50/30' : ''}`}>
                  <td className="px-1.5 py-1">
                    <p className="text-[9px] font-semibold">{u.name}</p>
                    <p className="font-mono text-[7px] text-slate-500">{u.assetTag}</p>
                  </td>
                  <td className="px-1.5 py-1 text-[9px] tabular-nums">{u.hoursUsed}</td>
                  <td className="px-1.5 py-1 text-[9px] tabular-nums">{u.capacityHours}</td>
                  <td className={`px-1.5 py-1 text-[9px] font-bold tabular-nums ${u.utilizationPct >= 90 ? 'text-emerald-600' : u.idleFlag ? 'text-amber-600' : 'text-[#2563EB]'}`}>{u.utilizationPct}%</td>
                  <td className="px-1.5 py-1">{u.idleFlag ? <span className="text-[8px] font-bold text-amber-700">IDLE</span> : <span className="text-[8px] text-emerald-600">Active</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </AssetPanel>
      </div>

      <AssetPanel title="AI Asset Intelligence Terminal" subtitle="Predictive maintenance · utilization optimization · capital replacement forecasts" icon={Bot}>
        <div className="space-y-1">
          {aiInsights.map((ins) => (
            <div key={ins.id} className={`flex items-start justify-between gap-2 rounded border px-2 py-1.5 ${ins.severity === 'Critical' ? 'border-red-200 bg-red-50/40' : 'border-slate-100'}`}>
              <div>
                <div className="flex items-center gap-1">
                  <AiSeverityPill severity={ins.severity} />
                  <span className="text-[8px] font-bold uppercase text-slate-500">{ins.category}</span>
                </div>
                <p className="mt-0.5 text-[9px] text-slate-800">{ins.message}</p>
              </div>
              {ins.status === 'Active' && (
                <div className="flex shrink-0 gap-0.5">
                  <button type="button" onClick={() => onUpdateAiStatus(ins.id, 'Acknowledged')} className="rounded bg-emerald-100 px-1.5 py-0.5 text-[7px] font-bold text-emerald-800">Ack</button>
                  <button type="button" onClick={() => onUpdateAiStatus(ins.id, 'Dismissed')} className="rounded bg-slate-100 px-1.5 py-0.5 text-[7px] font-bold text-slate-600">Dismiss</button>
                </div>
              )}
              {ins.status !== 'Active' && <span className="text-[8px] font-bold uppercase text-slate-400">{ins.status}</span>}
            </div>
          ))}
        </div>
      </AssetPanel>
    </div>
  );
}
