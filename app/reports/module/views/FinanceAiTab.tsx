'use client';

import { Bot, DollarSign, Package, Users } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { AiReportInsightStatus } from '../reportsNav.types';
import type { AiReportInsight } from '../lib/reportsMockData';
import {
  CLAIM_ANALYSIS,
  HR_PRODUCTIVITY,
  INVENTORY_WASTAGE,
  PROCUREMENT_VARIANCE,
  REVENUE_FORECAST,
  formatInr,
} from '../lib/reportsMockData';
import { CHART_COLORS, HbiPanel, SecurePatientPlaceholder, TrendPill } from '../components/reportsUi';

type FinanceAiTabProps = {
  aiInsights: AiReportInsight[];
  onUpdateAiStatus: (id: string, status: AiReportInsightStatus) => void;
};

function AiSeverityPill({ severity }: { severity: 'Info' | 'Warning' | 'Critical' }) {
  const styles = {
    Info: 'bg-sky-100 text-sky-800',
    Warning: 'bg-amber-100 text-amber-800',
    Critical: 'bg-red-100 text-red-800 animate-pulse',
  };
  return <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[severity]}`}>{severity}</span>;
}

export default function FinanceAiTab({ aiInsights, onUpdateAiStatus }: FinanceAiTabProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
        <HbiPanel title="Procurement & Vendor Pricing Variance" subtitle="Quoted vs invoiced · supply chain intelligence" icon={Package}>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Vendor', 'Category', 'Quoted', 'Invoiced', 'Variance'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PROCUREMENT_VARIANCE.map((p) => (
                <tr key={p.vendor} className={`border-b border-slate-50 ${p.variancePct > 5 ? 'bg-amber-50/30' : ''}`}>
                  <td className="max-w-[100px] truncate px-1.5 py-1 text-[8px] font-semibold">{p.vendor}</td>
                  <td className="px-1.5 py-1 text-[8px]">{p.category}</td>
                  <td className="px-1.5 py-1 text-[8px] tabular-nums">{formatInr(p.quotedPrice)}</td>
                  <td className="px-1.5 py-1 text-[8px] tabular-nums">{formatInr(p.invoicedPrice)}</td>
                  <td className={`px-1.5 py-1 text-[8px] font-bold tabular-nums ${p.variancePct > 5 ? 'text-red-600' : 'text-emerald-600'}`}>{p.variancePct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </HbiPanel>

        <HbiPanel title="Inventory Consumption vs Wastage Index" subtitle="Pharmacy · blood bank · contrast · consumables" icon={Package}>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Item', 'Consumed', 'Wasted', 'Wastage %', 'Trend'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {INVENTORY_WASTAGE.map((w) => (
                <tr key={w.item} className={`border-b border-slate-50 ${w.wastagePct > 6 ? 'bg-red-50/30' : ''}`}>
                  <td className="px-1.5 py-1 text-[9px] font-semibold">{w.item}</td>
                  <td className="px-1.5 py-1 text-[8px] tabular-nums">{w.consumed}</td>
                  <td className="px-1.5 py-1 text-[8px] tabular-nums">{w.wasted}</td>
                  <td className={`px-1.5 py-1 text-[8px] font-bold tabular-nums ${w.wastagePct > 6 ? 'text-red-600' : 'text-amber-600'}`}>{w.wastagePct}%</td>
                  <td className="px-1.5 py-1"><TrendPill trend={w.trend} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </HbiPanel>
      </div>

      <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
        <HbiPanel title="Insurance / TPA Claim Analysis" subtitle="Approval vs rejection rates by payer" icon={DollarSign}>
          <SecurePatientPlaceholder hipaa />
          <table className="mt-2 w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['TPA', 'Submitted', 'Approved', 'Rejected', 'Rejection %'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CLAIM_ANALYSIS.map((c) => (
                <tr key={c.tpa} className={`border-b border-slate-50 ${c.rejectionRatePct > 12 ? 'bg-red-50/30' : ''}`}>
                  <td className="px-1.5 py-1 text-[9px] font-semibold">{c.tpa}</td>
                  <td className="px-1.5 py-1 text-[8px] tabular-nums">{c.submitted}</td>
                  <td className="px-1.5 py-1 text-[8px] tabular-nums text-emerald-600">{c.approved}</td>
                  <td className="px-1.5 py-1 text-[8px] tabular-nums text-red-600">{c.rejected}</td>
                  <td className={`px-1.5 py-1 text-[8px] font-bold tabular-nums ${c.rejectionRatePct > 12 ? 'text-red-600' : 'text-emerald-600'}`}>{c.rejectionRatePct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </HbiPanel>

        <HbiPanel title="HR Staff Overtime & Productivity Analytics" subtitle="Department-level workforce intelligence" icon={Users}>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Department', 'Staff', 'OT Hrs', 'Productivity', 'Trend'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HR_PRODUCTIVITY.map((h) => (
                <tr key={h.department} className={`border-b border-slate-50 ${h.productivityIndex < 85 ? 'bg-amber-50/30' : ''}`}>
                  <td className="px-1.5 py-1 text-[9px] font-semibold">{h.department}</td>
                  <td className="px-1.5 py-1 text-[8px] tabular-nums">{h.staffCount}</td>
                  <td className={`px-1.5 py-1 text-[8px] font-bold tabular-nums ${h.overtimeHrs > 400 ? 'text-amber-700' : ''}`}>{h.overtimeHrs}</td>
                  <td className={`px-1.5 py-1 text-[8px] font-bold tabular-nums ${h.productivityIndex >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>{h.productivityIndex}</td>
                  <td className="px-1.5 py-1"><TrendPill trend={h.trend} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </HbiPanel>
      </div>

      <HbiPanel title="Revenue Forecasting Trend (₹ Lakhs)" subtitle="Actual vs AI-projected monthly revenue" icon={DollarSign}>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={REVENUE_FORECAST}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip contentStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="actual" stroke={CHART_COLORS.teal} strokeWidth={2} name="Actual" connectNulls={false} />
              <Line type="monotone" dataKey="forecast" stroke={CHART_COLORS.cobalt} strokeDasharray="4 4" strokeWidth={2} name="AI Forecast" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </HbiPanel>

      <HbiPanel title="AI Hospital Intelligence Hub" subtitle="Predictive capacity · demand surge · revenue · resource optimization" icon={Bot}>
        <div className="space-y-1">
          {aiInsights.map((ins) => (
            <div key={ins.id} className={`flex items-start justify-between gap-2 rounded border px-2 py-1.5 ${ins.severity === 'Critical' ? 'border-red-200 bg-red-50/40' : 'border-slate-100'}`}>
              <div>
                <div className="flex items-center gap-1">
                  <AiSeverityPill severity={ins.severity} />
                  <span className="text-[8px] font-bold uppercase text-slate-500">{ins.category}</span>
                  <span className="text-[8px] text-teal-600">{ins.confidencePct}% confidence</span>
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
      </HbiPanel>

      <HbiPanel title="Strategic Resource Optimization Matrix" subtitle="Idle capacity vs demand hotspots" icon={Bot}>
        <div className="h-[140px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[
              { area: 'ICU Beds', utilization: 87, target: 85 },
              { area: 'CT Scanner', utilization: 94, target: 80 },
              { area: 'ECG OPD-3', utilization: 11, target: 60 },
              { area: 'Pharmacy IV', utilization: 78, target: 75 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="area" tick={{ fontSize: 8 }} />
              <YAxis tick={{ fontSize: 9 }} domain={[0, 100]} />
              <Tooltip contentStyle={{ fontSize: 10 }} />
              <Bar dataKey="utilization" fill={CHART_COLORS.cobalt} name="Utilization %" radius={[2, 2, 0, 0]} />
              <Bar dataKey="target" fill={CHART_COLORS.steel} name="Target %" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </HbiPanel>
    </div>
  );
}
