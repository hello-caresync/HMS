'use client';

import { ChevronDown, ChevronRight, FolderTree } from 'lucide-react';
import { useState } from 'react';

import type { OrgTreeNodeId } from '../administrationNav.types';
import { ORG_CONFIG_TREE } from '../administrationNav.types';
import { RBAC_MATRIX, SHIFT_ROSTERS, USER_PROFILES } from '../lib/administrationMockData';
import { GovPanel, GovStatusPill } from '../components/administrationUi';

type OrgAccessTabProps = {
  selectedNode: OrgTreeNodeId;
  onSelectNode: (id: OrgTreeNodeId) => void;
  onOpenConfigDrawer: (id: OrgTreeNodeId) => void;
};

export default function OrgAccessTab({ selectedNode, onSelectNode, onOpenConfigDrawer }: OrgAccessTabProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(ORG_CONFIG_TREE.map((g) => [g.id, true])),
  );

  return (
    <div className="flex flex-col gap-2 xl:flex-row">
      <div className="w-full shrink-0 xl:w-[35%]">
        <GovPanel title="System Hierarchies & Setups Tree" subtitle="Hospital profile · org structure · employee · dept parameters" icon={FolderTree}>
          <nav className="max-h-[520px] overflow-y-auto">
            {ORG_CONFIG_TREE.map((group) => (
              <div key={group.id} className="mb-1">
                <button type="button" onClick={() => setExpanded((p) => ({ ...p, [group.id]: !p[group.id] }))} className="flex w-full items-center gap-1 rounded px-1.5 py-1 text-[9px] font-bold uppercase text-[#0F172A]">
                  {expanded[group.id] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  {group.label}
                </button>
                {expanded[group.id] && (
                  <ul className="ml-4 space-y-0.5 border-l border-slate-200 pl-2">
                    {group.children.map((child) => (
                      <li key={child.id}>
                        <button
                          type="button"
                          onClick={() => { onSelectNode(child.id); onOpenConfigDrawer(child.id); }}
                          className={`w-full rounded px-2 py-1 text-left text-[9px] ${selectedNode === child.id ? 'bg-[#0F172A] font-semibold text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                          {child.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </nav>
        </GovPanel>
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <GovPanel title="User Profiles & Account Provisioning" subtitle="Active accounts · roles · last login">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['User', 'Role', 'Department', 'Last Login', 'Status'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {USER_PROFILES.map((u) => (
                <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                  <td className="px-1.5 py-1 text-[9px] font-semibold">{u.displayName}</td>
                  <td className="px-1.5 py-1 text-[8px]">{u.role}</td>
                  <td className="px-1.5 py-1 text-[8px]">{u.department}</td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-500">{formatTimeShort(u.lastLogin)}</td>
                  <td className="px-1.5 py-1"><GovStatusPill status={u.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </GovPanel>

        <GovPanel title="Role-Based Access Control Matrix" subtitle="System roles vs module data access permissions">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Role', 'Modules', 'Data Access', 'Status'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RBAC_MATRIX.map((r) => (
                <tr key={r.id} className="border-b border-slate-50">
                  <td className="px-1.5 py-1 text-[9px] font-semibold">{r.role}</td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-600">{r.modules}</td>
                  <td className="px-1.5 py-1 text-[8px] text-violet-700">{r.dataAccess}</td>
                  <td className="px-1.5 py-1"><GovStatusPill status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </GovPanel>

        <GovPanel title="Staff Duty Shift Rosters" subtitle="Morning · evening · night coverage assignments">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Staff', 'Role', 'Department', 'Shift', 'Coverage', 'Status'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SHIFT_ROSTERS.map((s) => (
                <tr key={s.id} className={`border-b border-slate-50 ${s.status === 'Pending' ? 'bg-amber-50/30' : ''}`}>
                  <td className="px-1.5 py-1 text-[9px] font-semibold">{s.staffName}</td>
                  <td className="px-1.5 py-1 text-[8px]">{s.role}</td>
                  <td className="px-1.5 py-1 text-[8px]">{s.department}</td>
                  <td className="px-1.5 py-1 text-[8px] font-bold text-[#2563EB]">{s.shift}</td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-500">{s.coverage}</td>
                  <td className="px-1.5 py-1"><GovStatusPill status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </GovPanel>
      </div>
    </div>
  );
}

function formatTimeShort(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}
