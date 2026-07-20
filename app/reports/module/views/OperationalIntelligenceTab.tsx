'use client';

import { ChevronDown, ChevronRight, FolderTree } from 'lucide-react';
import { useState } from 'react';

import type { AnalyticsTreeNodeId } from '../reportsNav.types';
import { ANALYTICS_TREE } from '../reportsNav.types';
import { AnalyticsVisualizationCanvas } from '../components/AnalyticsVisualizationCanvas';
import { HbiPanel } from '../components/reportsUi';

type OperationalIntelligenceTabProps = {
  selectedNode: AnalyticsTreeNodeId;
  onSelectNode: (id: AnalyticsTreeNodeId) => void;
};

export default function OperationalIntelligenceTab({ selectedNode, onSelectNode }: OperationalIntelligenceTabProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(ANALYTICS_TREE.map((g) => [g.id, true])),
  );

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex flex-col gap-2 xl:flex-row">
      <div className="w-full shrink-0 xl:w-[30%]">
        <HbiPanel title="Modality & Performance Directory" subtitle="Patient · OPD/IPD · quality · ancillary analytics tree" icon={FolderTree}>
          <nav className="max-h-[520px] overflow-y-auto" aria-label="Analytics directory">
            {ANALYTICS_TREE.map((group) => (
              <div key={group.id} className="mb-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="flex w-full items-center gap-1 rounded px-1.5 py-1 text-left text-[9px] font-bold uppercase text-[#0F172A] hover:bg-slate-50"
                >
                  {expandedGroups[group.id] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  {group.label}
                </button>
                {expandedGroups[group.id] && (
                  <ul className="ml-4 space-y-0.5 border-l border-slate-200 pl-2">
                    {group.children.map((child) => (
                      <li key={child.id}>
                        <button
                          type="button"
                          onClick={() => onSelectNode(child.id)}
                          className={`w-full rounded px-2 py-1 text-left text-[9px] transition-colors ${
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
        </HbiPanel>
      </div>

      <div className="min-w-0 flex-1">
        <HbiPanel title="Selected Report Visualization Canvas" subtitle="Trend graphs · heat maps · performance analytics for active folder">
          <AnalyticsVisualizationCanvas nodeId={selectedNode} />
        </HbiPanel>
      </div>
    </div>
  );
}
