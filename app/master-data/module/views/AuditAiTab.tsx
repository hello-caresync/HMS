'use client';

import { Bot, Shield } from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { AiAnomalyAlert, AiDuplicateAlert, PendingServiceConfig } from '../lib/masterDataMockData';
import {
  AUDIT_LOG,
  DATA_QUALITY_TREND,
  WORKFLOW_RULES,
  formatInr,
  formatTime,
} from '../lib/masterDataMockData';
import { ApprovalStatusPill, MdmPanel, RecordStatusPill, SecureLicensePlaceholder } from '../components/masterDataUi';

type AuditAiTabProps = {
  pendingServices: PendingServiceConfig[];
  duplicateAlerts: AiDuplicateAlert[];
  anomalyAlerts: AiAnomalyAlert[];
  onAdvanceApproval: (id: string) => void;
  onMergeDuplicate: (id: string) => void;
  onDismissDuplicate: (id: string) => void;
  onResolveAnomaly: (id: string) => void;
  onOpenMerger: () => void;
};

export default function AuditAiTab({
  pendingServices,
  duplicateAlerts,
  anomalyAlerts,
  onAdvanceApproval,
  onMergeDuplicate,
  onDismissDuplicate,
  onResolveAnomaly,
  onOpenMerger,
}: AuditAiTabProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
        <MdmPanel title="Workflow & Approval Systems" subtitle="PR rules · discount tier locks · charge master mutations" icon={Shield}>
          <table className="mb-2 w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Rule', 'Domain', 'Approver Chain', 'Status'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {WORKFLOW_RULES.map((w) => (
                <tr key={w.id} className="border-b border-slate-50">
                  <td className="px-1.5 py-1 text-[9px] font-semibold">{w.ruleName}</td>
                  <td className="px-1.5 py-1 text-[8px]">{w.domain}</td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-600">{w.approverLevel}</td>
                  <td className="px-1.5 py-1"><RecordStatusPill status={w.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mb-1 text-[9px] font-bold uppercase text-slate-500">Pending Service Config Mutations</p>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Code', 'Description', 'Base', 'Status', 'Action'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pendingServices.map((p) => (
                <tr key={p.id} className={`border-b border-slate-50 ${p.status === 'Pending' ? 'bg-amber-50/20' : ''}`}>
                  <td className="px-1.5 py-1 font-mono text-[8px] font-bold text-[#2563EB]">{p.serviceCode}</td>
                  <td className="max-w-[120px] truncate px-1.5 py-1 text-[8px]" title={p.description}>{p.description}</td>
                  <td className="px-1.5 py-1 text-[8px] tabular-nums">{formatInr(p.basePrice)}</td>
                  <td className="px-1.5 py-1">
                    <button type="button" onClick={() => onAdvanceApproval(p.id)} disabled={p.status === 'Approved'} title="Advance approval">
                      <ApprovalStatusPill status={p.status} />
                    </button>
                  </td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-500">{p.submittedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </MdmPanel>

        <MdmPanel title="Data Quality Trend" subtitle="Weekly quality score vs duplicate count" icon={Shield}>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={DATA_QUALITY_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="week" tick={{ fontSize: 9 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 9 }} domain={[88, 96]} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={{ fontSize: 10 }} />
                <Line yAxisId="left" type="monotone" dataKey="score" stroke="#2563EB" strokeWidth={2} name="Quality Score" />
                <Line yAxisId="right" type="monotone" dataKey="duplicates" stroke="#F59E0B" strokeWidth={2} name="Duplicates" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </MdmPanel>
      </div>

      <MdmPanel title="Master Data Audit Log" subtitle="Immutable previous vs updated value differentials" icon={Shield} secure>
        <SecureLicensePlaceholder verified />
        <table className="mt-2 w-full min-w-[720px] text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['Time', 'Entity', 'Field', 'Previous', 'Updated', 'Changed By'].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {AUDIT_LOG.map((log) => (
              <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                <td className="px-1.5 py-1 text-[8px] text-slate-500">{formatTime(log.timestamp)}</td>
                <td className="px-1.5 py-1 text-[9px] font-semibold">{log.masterEntity}</td>
                <td className="px-1.5 py-1 text-[8px]">{log.field}</td>
                <td className="px-1.5 py-1 text-[8px] text-red-600 line-through">{log.previousValue}</td>
                <td className="px-1.5 py-1 text-[8px] font-semibold text-emerald-700">{log.updatedValue}</td>
                <td className="px-1.5 py-1 text-[8px]">{log.changedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </MdmPanel>

      <MdmPanel title="AI Master Data Intelligence" subtitle="Smart duplicate detection · auto-merger · anomaly alerts" icon={Bot}>
        <p className="mb-2 text-[9px] font-bold uppercase text-amber-700">Smart Duplicate Detection</p>
        <div className="mb-3 space-y-1">
          {duplicateAlerts.map((d) => (
            <div key={d.id} className={`flex items-start justify-between gap-2 rounded border px-2 py-1.5 ${d.status === 'Active' ? 'border-amber-200 bg-amber-50/40' : 'border-slate-100 opacity-60'}`}>
              <div>
                <p className="text-[9px] font-bold text-[#0F172A]">{d.entityType} · {d.matchScore}% match</p>
                <p className="text-[8px] text-slate-600">{d.recordA} ↔ {d.recordB}</p>
                <p className="text-[8px] text-violet-700">{d.suggestion}</p>
              </div>
              {d.status === 'Active' && (
                <div className="flex shrink-0 flex-col gap-0.5">
                  <button type="button" onClick={onOpenMerger} className="rounded bg-emerald-100 px-1.5 py-0.5 text-[7px] font-bold text-emerald-800">Auto-Merge</button>
                  <button type="button" onClick={() => onMergeDuplicate(d.id)} className="rounded bg-violet-100 px-1.5 py-0.5 text-[7px] font-bold text-violet-800">Merge</button>
                  <button type="button" onClick={() => onDismissDuplicate(d.id)} className="rounded bg-slate-100 px-1.5 py-0.5 text-[7px] font-bold text-slate-600">Dismiss</button>
                </div>
              )}
              {d.status !== 'Active' && <span className="text-[8px] font-bold uppercase text-slate-400">{d.status}</span>}
            </div>
          ))}
        </div>

        <p className="mb-1 text-[9px] font-bold uppercase text-red-700">Anomaly & Missing Config Alerts</p>
        <div className="space-y-1">
          {anomalyAlerts.map((a) => (
            <div key={a.id} className={`flex items-start justify-between gap-2 rounded border px-2 py-1.5 ${a.severity === 'Critical' ? 'border-red-200 bg-red-50/40' : 'border-slate-100'}`}>
              <div>
                <span className={`rounded px-1 text-[7px] font-bold uppercase ${a.severity === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{a.category}</span>
                <p className="mt-0.5 text-[9px] text-slate-800">{a.message}</p>
              </div>
              {a.status === 'Active' && (
                <button type="button" onClick={() => onResolveAnomaly(a.id)} className="shrink-0 rounded bg-[#2563EB] px-1.5 py-0.5 text-[7px] font-bold text-white">Resolve</button>
              )}
              {a.status !== 'Active' && <span className="text-[8px] font-bold uppercase text-emerald-600">{a.status}</span>}
            </div>
          ))}
        </div>
      </MdmPanel>
    </div>
  );
}
