'use client';

import { ChevronDown, ChevronRight, FolderTree } from 'lucide-react';
import { useState } from 'react';

import type { RegistryTreeNodeId } from '../masterDataNav.types';
import { REGISTRY_TREE } from '../masterDataNav.types';
import { RegistryTableCanvas } from '../components/RegistryTableCanvas';
import { MdmPanel } from '../components/masterDataUi';

type RegistriesMappingTabProps = {
  selectedNode: RegistryTreeNodeId;
  onSelectNode: (id: RegistryTreeNodeId) => void;
};

export default function RegistriesMappingTab({ selectedNode, onSelectNode }: RegistriesMappingTabProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(REGISTRY_TREE.map((g) => [g.id, true])),
  );

  return (
    <div className="flex flex-col gap-2 xl:flex-row">
      <div className="w-full shrink-0 xl:w-[35%]">
        <MdmPanel title="Core Sub-System Masters Tree" subtitle="Clinical · Support · Ancillary · SCM clusters" icon={FolderTree}>
          <nav className="max-h-[560px] overflow-y-auto" aria-label="Master registries">
            {REGISTRY_TREE.map((group) => (
              <div key={group.id} className="mb-1">
                <button
                  type="button"
                  onClick={() => setExpanded((p) => ({ ...p, [group.id]: !p[group.id] }))}
                  className="flex w-full items-center gap-1 rounded px-1.5 py-1 text-left"
                >
                  {expanded[group.id] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  <span className="text-[9px] font-bold uppercase text-[#0F172A]">{group.label}</span>
                  <span className="ml-auto rounded bg-slate-100 px-1 text-[7px] font-bold text-slate-500">{group.cluster}</span>
                </button>
                {expanded[group.id] && (
                  <ul className="ml-4 space-y-0.5 border-l border-slate-200 pl-2">
                    {group.children.map((child) => (
                      <li key={child.id}>
                        <button
                          type="button"
                          onClick={() => onSelectNode(child.id)}
                          className={`w-full rounded px-2 py-1 text-left text-[9px] ${
                            selectedNode === child.id ? 'bg-[#0F172A] font-semibold text-white' : 'text-slate-600 hover:bg-slate-100'
                          }`}
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
        </MdmPanel>
      </div>

      <div className="min-w-0 flex-1">
        <MdmPanel title="Relational Inventory & Ancillary Configurator" subtitle="Service charges · rooms · lab · pharmacy · SCM registries">
          <RegistryTableCanvas nodeId={selectedNode} />
        </MdmPanel>
      </div>
    </div>
  );
}
