'use client';

import {
  Building2,
  Copy,
  FileText,
  Hash,
  RefreshCw,
  Shield,
  UserPlus,
  Zap,
} from 'lucide-react';

import type { MasterDataModalType } from '../masterDataNav.types';
import { MDM_CENSUS, NUMBERING_TEMPLATES, ORG_HIERARCHY } from '../lib/masterDataMockData';
import { MdmPanel, OrgLevelPill, RecordStatusPill, SecureLicensePlaceholder } from '../components/masterDataUi';

type DataQualityTabProps = {
  onQuickAction: (action: Exclude<MasterDataModalType, null | 'auto-merger'>) => void;
};

export default function DataQualityTab({ onQuickAction }: DataQualityTabProps) {
  const c = MDM_CENSUS;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 xl:grid-cols-6">
        {[
          { label: 'Total Master Records', value: c.totalMasterRecords.toLocaleString(), accent: true },
          { label: 'Active Configurations', value: c.activeConfigurations.toLocaleString(), success: true },
          { label: 'Recently Updated', value: c.recentlyUpdated, accent: true },
          { label: 'Pending Approvals', value: c.pendingApprovals, warn: true },
          { label: 'Inactive / Duplicate', value: c.inactiveDuplicate, danger: true },
          { label: 'Data Quality Score', value: `${c.dataQualityScore}%`, success: true },
        ].map((k) => (
          <div key={k.label} className="rounded-md border border-[#E2E8F0] bg-white p-2">
            <p className={`text-sm font-bold tabular-nums ${k.danger ? 'text-red-600' : k.warn ? 'text-amber-600' : k.success ? 'text-emerald-600' : k.accent ? 'text-[#2563EB]' : 'text-[#0F172A]'}`}>{k.value}</p>
            <p className="text-[7px] font-bold uppercase tracking-wide text-slate-500">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
        <MdmPanel title="Hospital Organization Master" subtitle="Branch · Building · Floor · Block · Department · Unit" icon={Building2}>
          <table className="w-full min-w-[480px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Level', 'Name', 'Parent', 'Status'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ORG_HIERARCHY.map((o) => (
                <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                  <td className="px-1.5 py-1"><OrgLevelPill level={o.level} /></td>
                  <td className="px-1.5 py-1 text-[9px] font-semibold">{o.name}</td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-500">{o.parent}</td>
                  <td className="px-1.5 py-1"><RecordStatusPill status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </MdmPanel>

        <MdmPanel title="Code & Numbering Master" subtitle="Patient UHID · Invoice · PR · Lab · Employee ID templates" icon={Hash} secure>
          <SecureLicensePlaceholder verified />
          <table className="mt-2 w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Entity', 'Template', 'Prefix', 'Pad', 'Last Generated', 'Status'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {NUMBERING_TEMPLATES.map((n) => (
                <tr key={n.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                  <td className="px-1.5 py-1 text-[9px] font-semibold">{n.entity}</td>
                  <td className="px-1.5 py-1 font-mono text-[8px] text-[#2563EB]">{n.template}</td>
                  <td className="px-1.5 py-1 text-[8px]">{n.prefix}</td>
                  <td className="px-1.5 py-1 text-[8px] tabular-nums">{n.sequencePad}</td>
                  <td className="px-1.5 py-1 font-mono text-[7px] text-slate-600">{n.lastGenerated}</td>
                  <td className="px-1.5 py-1"><RecordStatusPill status={n.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </MdmPanel>
      </div>

      <MdmPanel title="Quick Actions Matrix" subtitle="Create · scan · audit · permissions · charges · sync" icon={Zap}>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: 'New Master Record', icon: UserPlus, action: 'new-master-record' as const },
            { label: 'Duplicate Scan', icon: Copy, action: 'duplicate-scan' as const },
            { label: 'Audit Logs', icon: FileText, action: 'audit-logs' as const },
            { label: 'Assign Permissions', icon: Shield, action: 'assign-permissions' as const },
            { label: 'Update Charge Master', icon: Hash, action: 'update-charge-master' as const },
            { label: 'Sync Sub-Modules', icon: RefreshCw, action: 'sync-submodules' as const },
          ].map(({ label, icon: Icon, action }) => (
            <button
              key={action}
              type="button"
              onClick={() => onQuickAction(action)}
              className="flex flex-col items-center gap-1 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-2 transition-colors hover:border-[#2563EB] hover:bg-blue-50"
            >
              <Icon className="h-4 w-4 text-[#2563EB]" />
              <span className="text-center text-[8px] font-bold uppercase text-[#0F172A]">{label}</span>
            </button>
          ))}
        </div>
      </MdmPanel>
    </div>
  );
}
