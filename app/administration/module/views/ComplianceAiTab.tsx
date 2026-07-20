'use client';

import { Bot, Shield } from 'lucide-react';
import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { AiAdminInsightStatus } from '../administrationNav.types';
import type { AiAdminInsight, ComplaintRecord, IncidentRecord } from '../lib/administrationMockData';
import {
  AUDIT_ACTIVITY,
  COMPLIANCE_RENEWALS,
  COMPLAINTS,
  MEETING_LOGS,
  NABH_METRICS,
  PATIENT_LOAD_FORECAST,
  VENDOR_CONTRACT_ALERTS,
  formatTime,
} from '../lib/administrationMockData';
import { GovPanel, GovStatusPill, IncidentPill, SecureAdminPlaceholder } from '../components/administrationUi';

type ComplianceAiTabProps = {
  complaints: ComplaintRecord[];
  incidents: IncidentRecord[];
  aiInsights: AiAdminInsight[];
  onAdvanceIncident: (id: string) => void;
  onUpdateAiStatus: (id: string, status: AiAdminInsightStatus) => void;
};

export default function ComplianceAiTab({ complaints, incidents, aiInsights, onAdvanceIncident, onUpdateAiStatus }: ComplianceAiTabProps) {
  const [aiQuery, setAiQuery] = useState('');

  const handleAsk = () => {
    const match = aiInsights.find((i) => aiQuery.trim() && i.query.toLowerCase().includes(aiQuery.toLowerCase().slice(0, 10)));
    if (match) setAiQuery(match.query);
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
        <GovPanel title="Complaint & Feedback Workflows" subtitle="Patient · staff · TPA escalations" icon={Shield}>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['ID', 'Source', 'Category', 'Summary', 'Status', 'Assigned'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {complaints.map((c) => (
                <tr key={c.id} className={`border-b border-slate-50 ${c.status === 'Open' || c.status === 'Critical' ? 'bg-red-50/20' : ''}`}>
                  <td className="px-1.5 py-1 font-mono text-[8px]">{c.id}</td>
                  <td className="px-1.5 py-1 text-[8px]">{c.source}</td>
                  <td className="px-1.5 py-1 text-[8px]">{c.category}</td>
                  <td className="max-w-[120px] truncate px-1.5 py-1 text-[8px]" title={c.summary}>{c.summary}</td>
                  <td className="px-1.5 py-1"><GovStatusPill status={c.status} /></td>
                  <td className="px-1.5 py-1 text-[8px]">{c.assignedTo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </GovPanel>

        <GovPanel title="Incident Management & Root Cause Tracking" subtitle="Patient falls · equipment · medication near-miss" icon={Shield} critical>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['ID', 'Type', 'Description', 'Root Cause', 'Status', 'Dept'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {incidents.map((inc) => (
                <tr key={inc.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                  <td className="px-1.5 py-1 font-mono text-[8px] font-bold text-red-600">{inc.id}</td>
                  <td className="px-1.5 py-1 text-[8px] font-semibold">{inc.type}</td>
                  <td className="max-w-[100px] truncate px-1.5 py-1 text-[8px]" title={inc.description}>{inc.description}</td>
                  <td className="max-w-[80px] truncate px-1.5 py-1 text-[8px] text-slate-600">{inc.rootCause}</td>
                  <td className="px-1.5 py-1">
                    <button type="button" onClick={() => onAdvanceIncident(inc.id)} disabled={inc.status === 'Resolved'} title="Advance incident">
                      <IncidentPill status={inc.status} />
                    </button>
                  </td>
                  <td className="px-1.5 py-1 text-[8px]">{inc.department}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </GovPanel>
      </div>

      <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
        <GovPanel title="NABH Quality Management Parameters" subtitle="Target vs current performance indicators" icon={Shield}>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Parameter', 'Target', 'Current', 'Status'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {NABH_METRICS.map((n) => (
                <tr key={n.id} className={`border-b border-slate-50 ${n.status === 'Critical' ? 'bg-red-50/30' : ''}`}>
                  <td className="px-1.5 py-1 text-[9px] font-semibold">{n.parameter}</td>
                  <td className="px-1.5 py-1 text-[8px]">{n.target}</td>
                  <td className="px-1.5 py-1 text-[8px] font-bold">{n.current}</td>
                  <td className="px-1.5 py-1"><GovStatusPill status={n.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </GovPanel>

        <GovPanel title="Regulatory Compliance Renewal Deadlines" subtitle="Licenses · registrations · authorizations" icon={Shield} secure>
          <SecureAdminPlaceholder verified />
          <table className="mt-2 w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Credential', 'Body', 'Expiry', 'Status'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPLIANCE_RENEWALS.map((cr) => (
                <tr key={cr.id} className={`border-b border-slate-50 ${cr.status === 'Expired' || cr.status === 'Critical' ? 'bg-red-50/40' : ''}`}>
                  <td className="px-1.5 py-1 text-[9px] font-semibold">{cr.credential}</td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-600">{cr.regulatoryBody}</td>
                  <td className="px-1.5 py-1 text-[8px]">{cr.expiryDate}</td>
                  <td className="px-1.5 py-1"><GovStatusPill status={cr.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </GovPanel>
      </div>

      <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
        <GovPanel title="Meeting Management Logs" subtitle="Governance huddles · quality committee · RCA sessions" icon={Shield}>
          <ul className="space-y-1">
            {MEETING_LOGS.map((m) => (
              <li key={m.id} className="rounded border border-slate-100 px-2 py-1.5">
                <p className="text-[9px] font-semibold">{m.title}</p>
                <p className="text-[8px] text-slate-600">{m.datetime} · {m.attendees}</p>
                <GovStatusPill status={m.status} />
              </li>
            ))}
          </ul>
        </GovPanel>

        <GovPanel title="Vendor Contract Alert Status" subtitle="AMC · SLA · supply agreements" icon={Shield}>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Vendor', 'Contract', 'Expiry', 'Status'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {VENDOR_CONTRACT_ALERTS.map((v) => (
                <tr key={v.id} className={`border-b border-slate-50 ${v.status === 'Critical' ? 'bg-red-50/30' : ''}`}>
                  <td className="px-1.5 py-1 text-[9px] font-semibold">{v.vendor}</td>
                  <td className="px-1.5 py-1 text-[8px]">{v.contractType}</td>
                  <td className="px-1.5 py-1 text-[8px]">{v.expiryDate}</td>
                  <td className="px-1.5 py-1"><GovStatusPill status={v.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </GovPanel>
      </div>

      <GovPanel title="AI Administration Intelligence" subtitle="Operations analysis · resource planning · department attention" icon={Bot}>
        <div className="flex gap-2">
          <input value={aiQuery} onChange={(e) => setAiQuery(e.target.value)} placeholder="Ask: Show today's hospital issues — or Which departments need attention?" className="flex-1 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-1.5 text-[10px] focus:border-[#2563EB] focus:outline-none" />
          <button type="button" onClick={handleAsk} className="rounded-md bg-[#2563EB] px-3 py-1.5 text-[9px] font-bold text-white">Ask AI</button>
        </div>
        <div className="mt-2 space-y-1">
          {aiInsights.map((ins) => (
            <div key={ins.id} className={`rounded border px-2 py-1.5 ${ins.severity === 'Critical' ? 'border-red-200 bg-red-50/40' : 'border-slate-100'}`}>
              <p className="text-[9px] font-bold text-[#2563EB]">{ins.query}</p>
              <p className="text-[9px] text-slate-800">{ins.response}</p>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[8px] uppercase text-slate-500">{ins.category} · {ins.severity}</span>
                {ins.status === 'Active' && (
                  <div className="flex gap-0.5">
                    <button type="button" onClick={() => onUpdateAiStatus(ins.id, 'Acknowledged')} className="rounded bg-emerald-100 px-1.5 py-0.5 text-[7px] font-bold text-emerald-800">Ack</button>
                    <button type="button" onClick={() => onUpdateAiStatus(ins.id, 'Dismissed')} className="rounded bg-slate-100 px-1.5 py-0.5 text-[7px] font-bold text-slate-600">Dismiss</button>
                  </div>
                )}
                {ins.status !== 'Active' && <span className="text-[8px] font-bold uppercase text-slate-400">{ins.status}</span>}
              </div>
            </div>
          ))}
        </div>
      </GovPanel>

      <GovPanel title="Patient Load Forecast — Resource Planning" subtitle="OPD · ER · IPD weekly projection" icon={Bot}>
        <div className="h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={PATIENT_LOAD_FORECAST}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="day" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip contentStyle={{ fontSize: 10 }} />
              <Bar dataKey="opd" fill="#2563EB" name="OPD" radius={[2, 2, 0, 0]} />
              <Bar dataKey="er" fill="#EF4444" name="ER" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GovPanel>

      <GovPanel title="Immutable Audit & Activity Log" subtitle="User actions · access attempts · policy changes" icon={Shield}>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['Time', 'User', 'Action', 'Module', 'Result'].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {AUDIT_ACTIVITY.map((log) => (
              <tr key={log.id} className={`border-b border-slate-50 ${log.result === 'Denied' ? 'bg-red-50/30' : ''}`}>
                <td className="px-1.5 py-1 text-[8px] text-slate-500">{formatTime(log.timestamp)}</td>
                <td className="px-1.5 py-1 text-[9px] font-semibold">{log.user}</td>
                <td className="max-w-[160px] truncate px-1.5 py-1 text-[8px]">{log.action}</td>
                <td className="px-1.5 py-1 text-[8px]">{log.module}</td>
                <td className="px-1.5 py-1">
                  <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${log.result === 'Success' ? 'bg-emerald-100 text-emerald-800' : log.result === 'Denied' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{log.result}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GovPanel>
    </div>
  );
}
