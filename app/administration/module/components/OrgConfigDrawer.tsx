'use client';

import type { OrgTreeNodeId } from '../administrationNav.types';
import { ORG_CONFIG_DETAILS } from '../lib/administrationMockData';
import { DrawerOverlay, SecureAdminPlaceholder } from './administrationUi';

type OrgConfigDrawerProps = {
  nodeId: OrgTreeNodeId;
  onClose: () => void;
};

export function OrgConfigDrawer({ nodeId, onClose }: OrgConfigDrawerProps) {
  const config = ORG_CONFIG_DETAILS[nodeId];

  return (
    <DrawerOverlay title={config.title} subtitle="Operational configuration — read/write in admin scope" onClose={onClose}>
      <SecureAdminPlaceholder verified />
      <dl className="mt-3 space-y-2">
        {config.rows.map((row) => (
          <div key={row.label} className="rounded-md border border-slate-100 bg-[#F8FAFC] px-3 py-2">
            <dt className="text-[8px] font-bold uppercase text-slate-500">{row.label}</dt>
            <dd className={`mt-0.5 text-[10px] ${row.value.includes('[') ? 'italic text-indigo-700' : 'font-semibold text-[#0F172A]'}`}>{row.value}</dd>
          </div>
        ))}
      </dl>
      <button type="button" onClick={onClose} className="mt-4 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">Save Configuration</button>
    </DrawerOverlay>
  );
}
