'use client';

import { Bot, ClipboardCheck, Shield, TrendingUp } from 'lucide-react';
import { useState } from 'react';
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

import type { AiInsightStatus } from '../hpWorkspaceNav.types';
import type { AiHospitalInsight, ApprovalRequest } from '../lib/hpWorkspaceMockData';
import {
  AI_SAMPLE_RESPONSES,
  AUDIT_LOGS,
  OCCUPANCY_TREND,
  PERFORMANCE_KPIS,
  SHIFT_COMPLIANCE,
  formatInr,
  formatTime,
} from '../lib/hpWorkspaceMockData';
import {
  AiSeverityPill,
  ApprovalStatusPill,
  ApprovalTypePill,
  AuditResultPill,
  HpPanel,
} from '../components/hpWorkspaceUi';

type EnterpriseComplianceTabProps = {
  approvals: ApprovalRequest[];
  aiInsights: AiHospitalInsight[];
  onAdvanceApproval: (id: string) => void;
  onUpdateAiStatus: (id: string, status: AiInsightStatus) => void;
};

export default function EnterpriseComplianceTab({
  approvals,
  aiInsights,
  onAdvanceApproval,
  onUpdateAiStatus,
}: EnterpriseComplianceTabProps) {
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  const handleAskAi = () => {
    const q = aiQuery.trim().toLowerCase();
    const match = AI_SAMPLE_RESPONSES.find((s) => q.includes('medicine') || q.includes('low'))
      ? AI_SAMPLE_RESPONSES[0]
      : AI_SAMPLE_RESPONSES.find((s) => q.includes('icu') || q.includes('capacity'))
        ? AI_SAMPLE_RESPONSES[1]
        : AI_SAMPLE_RESPONSES[0];
    setAiResponse(match.response);
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
        <HpPanel title="Approval Center" subtitle="Purchase · Leave · Discount · Insurance pre-auth lifecycles" icon={ClipboardCheck}>
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['ID', 'Type', 'Requester', 'Summary', 'Amount', 'Status', 'Action'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {approvals.map((a) => (
                <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                  <td className="px-1.5 py-1 font-mono text-[8px] font-bold text-[#2563EB]">{a.id}</td>
                  <td className="px-1.5 py-1"><ApprovalTypePill type={a.type} /></td>
                  <td className="px-1.5 py-1 text-[8px]">{a.requester}</td>
                  <td className="max-w-[140px] truncate px-1.5 py-1 text-[8px] text-slate-600" title={a.summary}>{a.summary}</td>
                  <td className="px-1.5 py-1 text-[8px] tabular-nums">{a.amount ? formatInr(a.amount) : '—'}</td>
                  <td className="px-1.5 py-1">
                    <button type="button" onClick={() => onAdvanceApproval(a.id)} disabled={a.status === 'Approved' || a.status === 'Rejected'} title="Advance approval">
                      <ApprovalStatusPill status={a.status} />
                    </button>
                  </td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-500">{formatTime(a.submittedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </HpPanel>

        <HpPanel title="Shift Compliance & Duty Rosters" subtitle="Scheduled vs actual hours · overtime · understaffing" icon={Shield}>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Staff', 'Department', 'Scheduled', 'Actual', 'Compliance'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SHIFT_COMPLIANCE.map((s) => (
                <tr key={s.id} className={`border-b border-slate-50 ${s.compliance !== 'Compliant' ? 'bg-amber-50/30' : ''}`}>
                  <td className="px-1.5 py-1 text-[9px] font-semibold">{s.staffName}</td>
                  <td className="px-1.5 py-1 text-[8px]">{s.department}</td>
                  <td className="px-1.5 py-1 text-[8px] tabular-nums">{s.scheduledHours}h</td>
                  <td className="px-1.5 py-1 text-[8px] tabular-nums">{s.actualHours}h</td>
                  <td className="px-1.5 py-1">
                    <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${
                      s.compliance === 'Compliant' ? 'bg-emerald-100 text-emerald-800' : s.compliance === 'Overtime' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                    }`}>{s.compliance}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </HpPanel>
      </div>

      <HpPanel title="AI Hospital Assistant & Predictive Insights" subtitle="Natural language queries · capacity forecasting · inventory alerts" icon={Bot} accent="purple">
        <div className="flex gap-2">
          <input
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            placeholder='Ask: "Which medicines are running low?" or "ICU capacity forecast?"'
            className="flex-1 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-1.5 text-[10px] focus:border-[#2563EB] focus:outline-none"
          />
          <button type="button" onClick={handleAskAi} className="rounded-md bg-[#2563EB] px-3 py-1.5 text-[9px] font-bold text-white">Ask AI</button>
        </div>
        {aiResponse && (
          <div className="mt-2 rounded-md border border-violet-200 bg-violet-50/50 p-2">
            <p className="text-[8px] font-bold uppercase text-violet-700">AI Response</p>
            <p className="text-[10px] text-slate-800">{aiResponse}</p>
          </div>
        )}
        <div className="mt-2 space-y-1">
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
              {ins.status !== 'Active' && (
                <span className="text-[8px] font-bold uppercase text-slate-400">{ins.status}</span>
              )}
            </div>
          ))}
        </div>
      </HpPanel>

      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {PERFORMANCE_KPIS.map((k) => (
          <div key={k.label} className="rounded-md border border-[#E2E8F0] bg-white p-2">
            <p className="text-sm font-bold tabular-nums text-[#2563EB]">{k.value}{k.unit === '%' ? '%' : ` ${k.unit}`}</p>
            <p className="text-[7px] font-bold uppercase text-slate-500">{k.label}</p>
            <p className={`text-[8px] font-semibold ${k.trend === 'down' ? 'text-emerald-600' : k.trend === 'up' ? 'text-amber-600' : 'text-slate-500'}`}>
              Target: {k.target}{k.unit === '%' ? '%' : ` ${k.unit}`} · {k.trend}
            </p>
          </div>
        ))}
      </div>

      <HpPanel title="Operational Performance Trends" subtitle="Weekly census — OPD · IPD · ICU · ER" icon={TrendingUp}>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={OCCUPANCY_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="day" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip contentStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="opd" stroke="#2563EB" strokeWidth={2} dot={false} name="OPD" />
              <Line type="monotone" dataKey="ipd" stroke="#10B981" strokeWidth={2} dot={false} name="IPD" />
              <Line type="monotone" dataKey="icu" stroke="#EF4444" strokeWidth={2} dot={false} name="ICU" />
              <Line type="monotone" dataKey="er" stroke="#F59E0B" strokeWidth={2} dot={false} name="ER" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 h-[140px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={OCCUPANCY_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="day" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip contentStyle={{ fontSize: 10 }} />
              <Bar dataKey="icu" fill="#EF4444" name="ICU" radius={[2, 2, 0, 0]} />
              <Bar dataKey="er" fill="#F59E0B" name="ER" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </HpPanel>

      <HpPanel title="User Access Logs & Audit Trails" subtitle="Immutable security audit — read-only" icon={Shield}>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['Time', 'User', 'Action', 'Module', 'Network', 'Result'].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {AUDIT_LOGS.map((log) => (
              <tr key={log.id} className={`border-b border-slate-50 ${log.result === 'Denied' ? 'bg-red-50/30' : log.result === 'Flagged' ? 'bg-amber-50/30' : ''}`}>
                <td className="px-1.5 py-1 text-[8px] text-slate-500">{formatTime(log.timestamp)}</td>
                <td className="px-1.5 py-1 text-[9px] font-semibold">{log.user}</td>
                <td className="max-w-[160px] truncate px-1.5 py-1 text-[8px] text-slate-600">{log.action}</td>
                <td className="px-1.5 py-1 text-[8px]">{log.module}</td>
                <td className="px-1.5 py-1 text-[8px] italic text-slate-400">{log.ipMasked}</td>
                <td className="px-1.5 py-1"><AuditResultPill result={log.result} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </HpPanel>
    </div>
  );
}
