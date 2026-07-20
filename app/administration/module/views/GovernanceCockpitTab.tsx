'use client';

import {
  AlertTriangle,
  FileText,
  Shield,
  Siren,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react';

import type { AdministrationModalType } from '../administrationNav.types';
import { ADMIN_CENSUS, OPERATIONAL_STREAM, formatInrCr, formatTime } from '../lib/administrationMockData';
import { GovPanel, SeverityDot } from '../components/administrationUi';

type GovernanceCockpitTabProps = {
  onQuickAction: (action: Exclude<AdministrationModalType, null>) => void;
};

export default function GovernanceCockpitTab({ onQuickAction }: GovernanceCockpitTabProps) {
  const c = ADMIN_CENSUS;
  const netPl = c.todayRevenue - c.todayExpenses;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
        {[
          { label: 'Total Patients', value: c.totalPatients.toLocaleString(), accent: true },
          { label: 'OPD Load', value: c.opdLoad, accent: true },
          { label: 'IPD Admissions', value: c.ipdAdmissions, success: true },
          { label: 'ER Cases', value: c.erCases, danger: true },
          { label: 'Available Beds', value: c.availableBeds, warn: c.availableBeds < 25 },
          { label: 'OT Utilization', value: `${c.otUtilizationPct}%`, purple: true },
        ].map((k) => (
          <div key={k.label} className="rounded-md border border-[#E2E8F0] bg-white p-2">
            <p className={`text-sm font-bold tabular-nums ${k.danger ? 'text-red-600' : k.warn ? 'text-amber-600' : k.success ? 'text-emerald-600' : k.purple ? 'text-violet-600' : k.accent ? 'text-[#2563EB]' : 'text-[#0F172A]'}`}>{k.value}</p>
            <p className="text-[7px] font-bold uppercase tracking-wide text-slate-500">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 xl:grid-cols-5">
        {[
          { label: 'Pending Approvals', value: c.pendingApprovals, warn: true },
          { label: 'Open Complaints', value: c.openComplaints, warn: true },
          { label: 'Open Incidents', value: c.openIncidents, danger: true },
          { label: 'Compliance Alerts', value: c.complianceAlerts, danger: true },
          { label: 'Net P&L Today', value: formatInrCr(netPl), success: netPl > 0 },
        ].map((k) => (
          <div key={k.label} className="rounded-md border border-[#E2E8F0] bg-white p-2">
            <p className={`text-sm font-bold tabular-nums ${k.danger ? 'text-red-600' : k.warn ? 'text-amber-600' : k.success ? 'text-emerald-600' : 'text-[#2563EB]'}`}>{k.value}</p>
            <p className="text-[7px] font-bold uppercase tracking-wide text-slate-500">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-2">
        <div className="rounded-md border border-[#E2E8F0] bg-white p-2">
          <p className="text-[7px] font-bold uppercase text-slate-500">Today Revenue</p>
          <p className="text-sm font-bold text-emerald-600">{formatInrCr(c.todayRevenue)}</p>
        </div>
        <div className="rounded-md border border-[#E2E8F0] bg-white p-2">
          <p className="text-[7px] font-bold uppercase text-slate-500">Today Expenses</p>
          <p className="text-sm font-bold text-slate-600">{formatInrCr(c.todayExpenses)}</p>
        </div>
      </div>

      <GovPanel title="Live Operational Monitoring Stream" subtitle="Patient flow · staff activity · bottlenecks · finance" icon={AlertTriangle}>
        <ul className="max-h-[240px] space-y-1 overflow-y-auto">
          {OPERATIONAL_STREAM.map((entry) => (
            <li key={entry.id} className={`flex gap-2 rounded border px-2 py-1.5 ${entry.severity === 'Critical' ? 'border-red-200 bg-red-50/40' : entry.severity === 'Warning' ? 'border-amber-100 bg-amber-50/30' : 'border-slate-50'}`}>
              <SeverityDot severity={entry.severity} />
              <div className="min-w-0 flex-1">
                <p className="text-[9px] text-slate-800">{entry.message}</p>
                <p className="text-[8px] text-slate-500">{entry.category} · {entry.department} · {formatTime(entry.timestamp)}</p>
              </div>
            </li>
          ))}
        </ul>
      </GovPanel>

      <GovPanel title="Quick Actions Matrix" subtitle="User · incident · approval · policy · visitor · emergency" icon={Zap}>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: 'Create User', icon: UserPlus, action: 'create-user' as const },
            { label: 'Incident Report', icon: Siren, action: 'incident-report' as const },
            { label: 'Process Approval', icon: Shield, action: 'process-approval' as const },
            { label: 'Publish Policy', icon: FileText, action: 'publish-policy' as const },
            { label: 'Register Visitor', icon: Users, action: 'register-visitor' as const },
            { label: 'Emergency Protocol', icon: AlertTriangle, action: 'emergency-protocol' as const },
          ].map(({ label, icon: Icon, action }) => (
            <button key={action} type="button" onClick={() => onQuickAction(action)} className="flex flex-col items-center gap-1 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-2 hover:border-[#2563EB] hover:bg-blue-50">
              <Icon className="h-4 w-4 text-[#2563EB]" />
              <span className="text-center text-[8px] font-bold uppercase text-[#0F172A]">{label}</span>
            </button>
          ))}
        </div>
      </GovPanel>
    </div>
  );
}
