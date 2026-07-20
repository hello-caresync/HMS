'use client';

import { Fragment } from 'react';
import { BarChart3, ChevronDown, ChevronRight, Shield } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  AUDIT_LOG,
  COMPLIANCE_CHECKPOINTS,
  CONSENT_TRACKING,
  DISEASE_TRENDS,
  READMISSION_ANALYSIS,
  RECORD_COMPLETENESS,
} from '../lib/emrMockData';
import { CompliancePill, EmrPanel, OutcomePill } from '../components/emrUi';

type ComplianceAuditTabProps = {
  expandedAuditIds: Set<string>;
  onToggleAudit: (id: string) => void;
};

export default function ComplianceAuditTab({ expandedAuditIds, onToggleAudit }: ComplianceAuditTabProps) {
  return (
    <div className="space-y-2">
      <EmrPanel title="EMR Audit Log & Access History" subtitle="Record access · modifications · user activity" icon={Shield}>
        <table className="w-full min-w-[800px] text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['', 'Timestamp', 'Event', 'User', 'Action', 'Resource', 'Outcome'].map((h) => (
                <th key={h || 'expand'} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {AUDIT_LOG.map((entry) => {
              const expanded = expandedAuditIds.has(entry.id);
              return (
                <Fragment key={entry.id}>
                  <tr
                    className="cursor-pointer border-b border-slate-50 hover:bg-slate-50/80"
                    onClick={() => onToggleAudit(entry.id)}
                  >
                    <td className="px-1 py-1">
                      {expanded ? <ChevronDown className="h-3 w-3 text-slate-400" /> : <ChevronRight className="h-3 w-3 text-slate-400" />}
                    </td>
                    <td className="px-1.5 py-1 font-mono text-[8px] text-slate-500">{entry.timestamp}</td>
                    <td className="px-1.5 py-1"><OutcomePill outcome={entry.eventType} /></td>
                    <td className="px-1.5 py-1">
                      <p className="text-[9px] font-semibold text-[#0F172A]">{entry.user}</p>
                      <p className="text-[7px] text-slate-400">{entry.role}</p>
                    </td>
                    <td className="px-1.5 py-1 text-[8px] text-slate-600">{entry.action}</td>
                    <td className="max-w-[120px] truncate px-1.5 py-1 text-[8px] text-[#2563EB]" title={entry.resource}>{entry.resource}</td>
                    <td className="px-1.5 py-1"><OutcomePill outcome={entry.outcome} /></td>
                  </tr>
                  {expanded && (
                    <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                      <td colSpan={7} className="px-3 py-2 text-[9px] text-slate-600">
                        <span className="font-semibold">IP:</span> {entry.ipAddress}
                        {entry.details && (
                          <>
                            <span className="mx-2">·</span>
                            <span className="font-semibold">Details:</span> {entry.details}
                          </>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </EmrPanel>

      <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
        <EmrPanel title="Consent Tracking" subtitle="Active · revoked · expired consents">
          <ul className="space-y-1">
            {CONSENT_TRACKING.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded border border-[#E2E8F0] px-2 py-1.5">
                <div>
                  <p className="text-[9px] font-semibold text-[#0F172A]">{c.consentType}</p>
                  <p className="text-[8px] text-slate-500">{c.grantedAt} → {c.expiresAt}</p>
                </div>
                <OutcomePill outcome={c.status} />
              </li>
            ))}
          </ul>
        </EmrPanel>

        <EmrPanel title="HIPAA / NABH Compliance Checkpoints">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Standard', 'Checkpoint', 'Status', 'Audited'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPLIANCE_CHECKPOINTS.map((cp) => (
                <tr key={cp.id} className="border-b border-slate-50">
                  <td className="px-1.5 py-1 text-[8px] font-medium text-[#0F172A]">{cp.standard}</td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-600">{cp.checkpoint}</td>
                  <td className="px-1.5 py-1"><CompliancePill status={cp.status} /></td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-400">{cp.lastAudited}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </EmrPanel>
      </div>

      <div className="grid grid-cols-1 gap-2 xl:grid-cols-3">
        <EmrPanel title="Disease Trends" icon={BarChart3}>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={DISEASE_TRENDS} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="quarter" tick={{ fontSize: 8, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 8, fill: '#64748B' }} />
                <Tooltip contentStyle={{ fontSize: 10, borderRadius: 6, border: '1px solid #E2E8F0' }} />
                <Legend wrapperStyle={{ fontSize: 8 }} />
                <Line type="monotone" dataKey="dm" stroke="#2563EB" strokeWidth={2} dot={{ r: 2 }} name="Diabetes" />
                <Line type="monotone" dataKey="htn" stroke="#EF4444" strokeWidth={2} dot={{ r: 2 }} name="Hypertension" />
                <Line type="monotone" dataKey="resp" stroke="#10B981" strokeWidth={2} dot={{ r: 2 }} name="Respiratory" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </EmrPanel>

        <EmrPanel title="Readmission Analysis" icon={BarChart3}>
          <ul className="space-y-1.5">
            {READMISSION_ANALYSIS.map((r) => (
              <li key={r.period} className="flex items-center justify-between rounded bg-[#F8FAFC] px-2 py-1.5">
                <span className="text-[10px] font-semibold">{r.period}</span>
                <span className={`text-sm font-bold tabular-nums ${r.rate > r.benchmark ? 'text-red-600' : 'text-emerald-600'}`}>
                  {r.rate}% <span className="text-[8px] font-normal text-slate-400">/ {r.benchmark}% target</span>
                </span>
              </li>
            ))}
          </ul>
        </EmrPanel>

        <EmrPanel title="Record Completeness" icon={BarChart3}>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={RECORD_COMPLETENESS} layout="vertical" margin={{ left: 60, right: 8, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 8, fill: '#64748B' }} unit="%" />
                <YAxis type="category" dataKey="dept" tick={{ fontSize: 7, fill: '#64748B' }} width={58} />
                <Tooltip contentStyle={{ fontSize: 10, borderRadius: 6, border: '1px solid #E2E8F0' }} />
                <Bar dataKey="complete" fill="#2563EB" name="Complete %" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </EmrPanel>
      </div>
    </div>
  );
}
