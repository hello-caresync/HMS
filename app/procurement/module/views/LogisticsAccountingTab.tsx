'use client';

import { Brain, Receipt, RotateCcw } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import type { AiProcurementInsight } from '../lib/procurementMockData';
import {
  MOCK_PURCHASE_RETURNS,
  MOCK_THREE_WAY_MATCH,
  SPENDING_TREND,
  formatInr,
} from '../lib/procurementMockData';
import type { AiProcurementStatus } from '../procurementNav.types';
import { AiStatusPill, MatchPill, ProcPanel } from '../components/procurementUi';

type LogisticsAccountingTabProps = {
  aiInsights: AiProcurementInsight[];
  onUpdateAiStatus: (id: string, status: AiProcurementStatus) => void;
};

export default function LogisticsAccountingTab({ aiInsights, onUpdateAiStatus }: LogisticsAccountingTabProps) {
  const pendingAi = aiInsights.filter((i) => i.status === 'Pending Review');
  const varianceRecords = MOCK_THREE_WAY_MATCH.filter((m) => m.variance !== 0);

  return (
    <div className="space-y-2">
      {pendingAi.length > 0 && (
        <div className="rounded-md border-2 border-indigo-500 bg-indigo-600 px-3 py-2 text-white">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            <span className="text-[11px] font-bold uppercase">AI Procurement Intelligence — {pendingAi.length} insight{pendingAi.length !== 1 ? 's' : ''} pending review</span>
          </div>
        </div>
      )}

      <ProcPanel title="Three-Way Invoice Matching Control" subtitle="PO + GRN + Vendor Invoice = Payment Approval" icon={Receipt} critical={varianceRecords.length > 0}>
        <table className="w-full min-w-[900px] text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['PO #', 'GRN #', 'Invoice #', 'Vendor', 'PO Amt', 'GRN Amt', 'Inv Amt', 'Variance', 'Match Status'].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_THREE_WAY_MATCH.map((m) => (
              <tr key={m.id} className={`border-b border-slate-50 ${m.variance !== 0 ? 'bg-red-50/40' : m.matchStatus === 'Approved for Payment' ? 'bg-emerald-50/30' : ''}`}>
                <td className="px-1.5 py-1 font-mono text-[8px] font-bold text-[#2563EB]">{m.poNumber}</td>
                <td className="px-1.5 py-1 font-mono text-[7px] text-slate-500">{m.grnNumber}</td>
                <td className="px-1.5 py-1 font-mono text-[7px] text-slate-600">{m.invoiceNumber}</td>
                <td className="max-w-[90px] truncate px-1.5 py-1 text-[8px] text-slate-600" title={m.vendor}>{m.vendor}</td>
                <td className="px-1.5 py-1 text-[9px] tabular-nums">{formatInr(m.poAmount)}</td>
                <td className="px-1.5 py-1 text-[9px] tabular-nums">{m.grnAmount ? formatInr(m.grnAmount) : '—'}</td>
                <td className="px-1.5 py-1 text-[9px] tabular-nums">{formatInr(m.invoiceAmount)}</td>
                <td className={`px-1.5 py-1 text-[9px] font-bold tabular-nums ${m.variance !== 0 ? 'text-red-600 animate-pulse' : 'text-emerald-600'}`}>
                  {m.variance === 0 ? '₹0' : formatInr(m.variance)}
                </td>
                <td className="px-1.5 py-1"><MatchPill status={m.matchStatus} /></td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-2 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-2">
          <p className="text-[8px] font-bold uppercase text-slate-500">Match Formula</p>
          <p className="mt-0.5 font-mono text-[9px] text-[#0F172A]">[PO Amount] + [GRN Qty Verified] + [Invoice Amount] → Variance ≤ tolerance → Approve Payment</p>
        </div>
      </ProcPanel>

      <ProcPanel title="Purchase Return Notes (PRN)" subtitle="Damaged goods · credit note tracking" icon={RotateCcw}>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['PRN #', 'PO Ref', 'Vendor', 'Reason', 'Credit Value', 'Status'].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_PURCHASE_RETURNS.map((p) => (
              <tr key={p.id} className="border-b border-slate-50">
                <td className="px-1.5 py-1 font-mono text-[8px] font-bold text-[#2563EB]">{p.prnNumber}</td>
                <td className="px-1.5 py-1 font-mono text-[7px] text-slate-500">{p.poReference}</td>
                <td className="px-1.5 py-1 text-[8px] text-slate-600">{p.vendor}</td>
                <td className="max-w-[160px] truncate px-1.5 py-1 text-[8px] text-slate-600" title={p.reason}>{p.reason}</td>
                <td className="px-1.5 py-1 text-[9px] font-bold tabular-nums text-red-600">{formatInr(p.creditNoteValue)}</td>
                <td className="px-1.5 py-1">
                  <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${p.status === 'Credit Issued' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{p.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ProcPanel>

      <ProcPanel title="AI-Based Procurement Intelligence Panel" subtitle="Demand predictions · vendor recommendations · stock optimization" icon={Brain} secure>
        <table className="w-full min-w-[860px] text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['Type', 'Insight', 'Detail', 'Suggested Action', 'Impact', 'Conf.', 'Status', 'Action'].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {aiInsights.map((i) => (
              <tr key={i.id} className={`border-b border-slate-50 ${i.status === 'Pending Review' ? 'bg-indigo-50/30' : ''}`}>
                <td className="px-1.5 py-1 text-[8px] font-bold text-indigo-700">{i.insightType}</td>
                <td className="px-1.5 py-1 text-[9px] font-semibold text-[#0F172A]">{i.title}</td>
                <td className="max-w-[120px] truncate px-1.5 py-1 text-[8px] text-slate-500" title={i.detail}>{i.detail}</td>
                <td className="max-w-[130px] truncate px-1.5 py-1 text-[8px] text-[#2563EB]" title={i.suggestedAction}>{i.suggestedAction}</td>
                <td className="max-w-[100px] truncate px-1.5 py-1 text-[8px] text-emerald-700" title={i.estimatedImpact}>{i.estimatedImpact}</td>
                <td className="px-1.5 py-1 text-[9px] font-bold tabular-nums">{i.confidence}%</td>
                <td className="px-1.5 py-1"><AiStatusPill status={i.status} /></td>
                <td className="px-1.5 py-1">
                  {i.status === 'Pending Review' && (
                    <div className="flex gap-0.5">
                      <button type="button" onClick={() => onUpdateAiStatus(i.id, 'Accepted')} className="rounded bg-emerald-600 px-1 py-0.5 text-[7px] font-bold text-white">Accept</button>
                      <button type="button" onClick={() => onUpdateAiStatus(i.id, 'Rejected')} className="rounded border border-slate-300 px-1 py-0.5 text-[7px] font-bold text-slate-600">Reject</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ProcPanel>

      <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
        <ProcPanel title="Weekly Spend vs Budget" subtitle="Budget monitoring curve">
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={SPENDING_TREND} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="week" tick={{ fontSize: 8, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 8, fill: '#64748B' }} tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`} />
                <Tooltip contentStyle={{ fontSize: 10, borderRadius: 6, border: '1px solid #E2E8F0' }} formatter={(v: number) => formatInr(v)} />
                <Legend wrapperStyle={{ fontSize: 9 }} />
                <Line type="monotone" dataKey="spend" stroke="#2563EB" strokeWidth={2} dot={{ r: 3 }} name="Actual Spend" />
                <Line type="monotone" dataKey="budget" stroke="#94A3B8" strokeDasharray="4 4" strokeWidth={1.5} name="Weekly Budget Cap" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ProcPanel>

        <ProcPanel title="Department Spend Distribution" subtitle="Current month procurement by department">
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { dept: 'ICU', spend: 1420000 },
                  { dept: 'OT', spend: 980000 },
                  { dept: 'Pharmacy', spend: 2100000 },
                  { dept: 'ER', spend: 860000 },
                  { dept: 'Lab', spend: 620000 },
                ]}
                margin={{ top: 4, right: 4, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="dept" tick={{ fontSize: 8, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 8, fill: '#64748B' }} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                <Tooltip contentStyle={{ fontSize: 10, borderRadius: 6, border: '1px solid #E2E8F0' }} formatter={(v: number) => formatInr(v)} />
                <Bar dataKey="spend" fill="#2563EB" name="Spend" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ProcPanel>
      </div>
    </div>
  );
}
