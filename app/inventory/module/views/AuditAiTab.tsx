'use client';

import { Brain, ClipboardCheck, Wrench } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import type { AiForecastSuggestion } from '../lib/inventoryMockData';
import {
  CONSUMPTION_TREND,
  MOCK_ADJUSTMENTS,
  MOCK_AUDITS,
  MOCK_BIOMEDICAL_ASSETS,
} from '../lib/inventoryMockData';
import type { AiSuggestionStatus } from '../inventoryNav.types';
import {
  AiStatusPill,
  AuditPill,
  EquipmentPill,
  InvPanel,
  SecureIdentityPlaceholder,
} from '../components/inventoryUi';

type AuditAiTabProps = {
  aiSuggestions: AiForecastSuggestion[];
  onUpdateAiStatus: (id: string, status: AiSuggestionStatus) => void;
};

export default function AuditAiTab({ aiSuggestions, onUpdateAiStatus }: AuditAiTabProps) {
  const pendingAi = aiSuggestions.filter((s) => s.status === 'Pending Review');

  return (
    <div className="space-y-2">
      {pendingAi.length > 0 && (
        <div className="rounded-md border-2 border-indigo-500 bg-indigo-600 px-3 py-2 text-white">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            <span className="text-[11px] font-bold uppercase">
              AI Inventory Intelligence — {pendingAi.length} restocking suggestion{pendingAi.length !== 1 ? 's' : ''} pending review
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
        <InvPanel title="Physical Stock Audit & Adjustment Grid" subtitle="System vs actual · variance · damage · theft · expiry logs" icon={ClipboardCheck}>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Audit ID', 'Store', 'Scheduled', 'Status', 'System', 'Actual', 'Variance', 'Auditor'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_AUDITS.map((a) => (
                <tr key={a.id} className={`border-b border-slate-50 ${a.variance !== 0 ? 'bg-amber-50/40' : ''}`}>
                  <td className="px-1.5 py-1 font-mono text-[8px] font-bold text-[#2563EB]">{a.auditId}</td>
                  <td className="px-1.5 py-1 text-[9px] font-semibold">{a.store}</td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-500">{a.scheduledDate}</td>
                  <td className="px-1.5 py-1"><AuditPill status={a.status} /></td>
                  <td className="px-1.5 py-1 text-[9px] tabular-nums">{a.systemCount}</td>
                  <td className="px-1.5 py-1 text-[9px] tabular-nums">{a.actualCount || '—'}</td>
                  <td className={`px-1.5 py-1 text-[9px] font-bold tabular-nums ${a.variance < 0 ? 'text-red-600' : a.variance > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {a.variance !== 0 ? a.variance : '0'}
                  </td>
                  <td className="px-1.5 py-1 text-[7px] text-slate-500">{a.auditor}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="mb-1 mt-3 text-[8px] font-bold uppercase text-slate-500">Recent Stock Adjustments</p>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Item', 'Batch', 'Reason', 'Qty', 'Logged By', 'Time'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_ADJUSTMENTS.map((adj) => (
                <tr key={adj.id} className={`border-b border-slate-50 ${adj.reason === 'Theft' ? 'bg-red-50/40' : adj.reason === 'Expiry' ? 'bg-amber-50/30' : ''}`}>
                  <td className="max-w-[90px] truncate px-1.5 py-1 text-[8px] font-semibold" title={adj.itemName}>{adj.itemName}</td>
                  <td className="px-1.5 py-1 font-mono text-[7px] text-slate-500">{adj.batchNumber}</td>
                  <td className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-600">{adj.reason}</td>
                  <td className={`px-1.5 py-1 text-[9px] font-bold tabular-nums ${adj.quantity < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{adj.quantity > 0 ? `+${adj.quantity}` : adj.quantity}</td>
                  <td className="px-1.5 py-1 text-[7px] text-slate-500">{adj.loggedBy}</td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-400">{adj.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </InvPanel>

        <InvPanel title="Biomedical Equipment Asset Registry" subtitle="Serial · warranty · AMC · maintenance · calibration" icon={Wrench}>
          <SecureIdentityPlaceholder verified />
          <table className="mt-2 w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Asset', 'Category', 'Serial', 'Location', 'Warranty', 'AMC Exp', 'Calibration', 'Status'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_BIOMEDICAL_ASSETS.map((a) => (
                <tr key={a.id} className={`border-b border-slate-50 ${a.status === 'Calibration Due' ? 'bg-orange-50/40' : a.status === 'Under Maintenance' ? 'bg-amber-50/30' : ''}`}>
                  <td className="max-w-[90px] truncate px-1.5 py-1 text-[9px] font-semibold text-[#0F172A]" title={a.assetName}>{a.assetName}</td>
                  <td className="px-1.5 py-1 text-[7px] text-slate-500">{a.category}</td>
                  <td className="px-1.5 py-1 font-mono text-[7px] text-slate-600">{a.serialNumber}</td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-600">{a.location}</td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-500">{a.warrantyExpiry}</td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-500">{a.amcExpiry}</td>
                  <td className={`px-1.5 py-1 text-[8px] ${a.status === 'Calibration Due' ? 'font-bold text-orange-700' : 'text-slate-500'}`}>{a.nextCalibration}</td>
                  <td className="px-1.5 py-1"><EquipmentPill status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </InvPanel>
      </div>

      <InvPanel title="AI-Based Inventory Intelligence Panel" subtitle="Demand predictions · auto-reorder · overstock & wastage optimization" icon={Brain} secure>
        <table className="w-full min-w-[860px] text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['Insight', 'Item', 'Current', 'Suggested', 'Change', 'Confidence', 'Rationale', 'Status', 'Action'].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {aiSuggestions.map((s) => (
              <tr key={s.id} className={`border-b border-slate-50 ${s.status === 'Pending Review' ? 'bg-indigo-50/30' : ''}`}>
                <td className="px-1.5 py-1 text-[8px] font-bold text-indigo-700">{s.insight}</td>
                <td className="max-w-[100px] truncate px-1.5 py-1 text-[9px] font-semibold" title={s.itemName}>{s.itemName}</td>
                <td className="px-1.5 py-1 text-[9px] tabular-nums">{s.currentStock}</td>
                <td className="px-1.5 py-1 text-[9px] font-bold tabular-nums text-[#2563EB]">{s.suggestedQty}</td>
                <td className={`px-1.5 py-1 text-[9px] font-bold tabular-nums ${s.changePct > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {s.changePct > 0 ? '+' : ''}{s.changePct}%
                </td>
                <td className="px-1.5 py-1 text-[9px] font-bold tabular-nums">{s.confidence}%</td>
                <td className="max-w-[140px] truncate px-1.5 py-1 text-[8px] text-slate-500" title={s.rationale}>{s.rationale}</td>
                <td className="px-1.5 py-1"><AiStatusPill status={s.status} /></td>
                <td className="px-1.5 py-1">
                  {s.status === 'Pending Review' && (
                    <div className="flex gap-0.5">
                      <button type="button" onClick={() => onUpdateAiStatus(s.id, 'Accepted')} className="rounded bg-emerald-600 px-1 py-0.5 text-[7px] font-bold text-white">Accept</button>
                      <button type="button" onClick={() => onUpdateAiStatus(s.id, 'Rejected')} className="rounded border border-slate-300 px-1 py-0.5 text-[7px] font-bold text-slate-600">Reject</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </InvPanel>

      <InvPanel title="Daily Consumption Trend" subtitle="7-day inventory consumption curve (INR)">
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={CONSUMPTION_TREND} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="day" tick={{ fontSize: 8, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 8, fill: '#64748B' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ fontSize: 10, borderRadius: 6, border: '1px solid #E2E8F0' }} formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Consumption']} />
              <Area type="monotone" dataKey="value" stroke="#2563EB" fill="#2563EB" fillOpacity={0.15} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </InvPanel>
    </div>
  );
}
