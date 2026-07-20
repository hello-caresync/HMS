'use client';

import { ChevronDown, ChevronRight, FolderTree, GitBranch } from 'lucide-react';
import { useState } from 'react';

import type { ModuleFeatureToggle, WorkflowApprovalRule } from '../lib/settingsMockData';
import { REGISTRY_CONFIG_DETAILS } from '../lib/settingsMockData';
import type { RegistryTreeNodeId } from '../settingsNav.types';
import { REGISTRY_CONFIG_TREE } from '../settingsNav.types';
import { SecureParameterBlock, SettingsPanel, SettingsStatusPill, ToggleSwitch, settingsType } from '../components/settingsUi';

type WorkflowBuilderTabProps = {
  selectedNode: RegistryTreeNodeId;
  onSelectNode: (id: RegistryTreeNodeId) => void;
  moduleToggles: ModuleFeatureToggle[];
  onToggleFeature: (id: string) => void;
  workflowRules: WorkflowApprovalRule[];
};

export default function WorkflowBuilderTab({
  selectedNode,
  onSelectNode,
  moduleToggles,
  onToggleFeature,
  workflowRules,
}: WorkflowBuilderTabProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(REGISTRY_CONFIG_TREE.map((g) => [g.id, true])),
  );

  const config = REGISTRY_CONFIG_DETAILS[selectedNode];
  const isModuleNode = selectedNode.startsWith('module-');

  const moduleMap: Record<string, string> = {
    'module-opd': 'OPD',
    'module-ipd': 'IPD',
    'module-emergency': 'Emergency',
    'module-ot': 'OT',
    'module-emr': 'EMR',
  };
  const togglesForNode = isModuleNode ? moduleToggles.filter((t) => t.module === moduleMap[selectedNode]) : [];

  return (
    <div className="flex flex-col gap-4 xl:flex-row">
      <div className="w-full shrink-0 xl:w-[35%]">
        <SettingsPanel title="Structural Master Registries Tree" subtitle="Hospital · branches · localization · module toggles · process profiles" icon={FolderTree}>
          <nav className="max-h-[640px] overflow-y-auto">
            {REGISTRY_CONFIG_TREE.map((group) => (
              <div key={group.id} className="mb-2">
                <button
                  type="button"
                  onClick={() => setExpanded((p) => ({ ...p, [group.id]: !p[group.id] }))}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-2 ${settingsType.sectionTitle}`}
                >
                  {expanded[group.id] ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  {group.label}
                </button>
                {expanded[group.id] && (
                  <ul className="ml-4 space-y-1 border-l-2 border-slate-200 pl-3">
                    {group.children.map((child) => (
                      <li key={child.id}>
                        <button
                          type="button"
                          onClick={() => onSelectNode(child.id)}
                          className={`w-full rounded-md px-3 py-2 text-left text-base ${selectedNode === child.id ? 'bg-[#0F172A] font-semibold text-white' : 'text-slate-600 hover:bg-slate-100'}`}
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
        </SettingsPanel>
      </div>

      <div className="min-w-0 flex-1 space-y-4">
        <SettingsPanel title={config.title} subtitle={config.subtitle} icon={GitBranch}>
          <dl className="grid gap-3 sm:grid-cols-2">
            {config.fields.map((field) => (
              <div key={field.label} className="rounded-lg border border-slate-100 bg-[#F8FAFC] px-4 py-3">
                <dt className={`${settingsType.label} font-semibold uppercase tracking-wide`}>{field.label}</dt>
                <dd className="mt-1">
                  {field.masked ? <SecureParameterBlock verified /> : <span className={settingsType.body}>{field.value}</span>}
                </dd>
              </div>
            ))}
          </dl>
        </SettingsPanel>

        {togglesForNode.length > 0 && (
          <SettingsPanel title="Module Feature Toggles" subtitle="Enable/disable sub-features within selected module">
            <ul className="space-y-2">
              {togglesForNode.map((t) => (
                <li key={t.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3">
                  <div>
                    <p className={`${settingsType.body} font-semibold`}>{t.feature}</p>
                    <p className={settingsType.bodyMuted}>{t.scope}</p>
                  </div>
                  <ToggleSwitch enabled={t.enabled} onChange={() => onToggleFeature(t.id)} label={t.feature} />
                </li>
              ))}
            </ul>
          </SettingsPanel>
        )}

        {selectedNode === 'workflow-approvals' && (
          <SettingsPanel title="Workflow & Approval Rules" subtitle="PR · discount · vendor · OT · controlled drug logic" icon={GitBranch}>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                    {['Rule', 'Trigger', 'Threshold', 'Approver Chain', 'Status'].map((h) => (
                      <th key={h} className={settingsType.tableHead}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {workflowRules.map((rule) => (
                    <tr key={rule.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                      <td className={`${settingsType.tableCell} font-semibold`}>{rule.ruleName}</td>
                      <td className={settingsType.tableCell}>{rule.trigger}</td>
                      <td className={settingsType.tableCell}>{rule.threshold}</td>
                      <td className={settingsType.tableCellMuted}>{rule.approverChain}</td>
                      <td className={settingsType.tableCell}><SettingsStatusPill status={rule.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SettingsPanel>
        )}

        {selectedNode === 'billing-tax' && (
          <SettingsPanel title="GST/CGST Tax Structure Preview" subtitle="Intra-state · inter-state · concession rules" secure>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: 'CGST', value: '9%', tone: 'text-[#2563EB]' },
                { label: 'SGST', value: '9%', tone: 'text-[#2563EB]' },
                { label: 'IGST', value: '18%', tone: 'text-violet-600' },
              ].map((tax) => (
                <div key={tax.label} className="rounded-lg border border-slate-100 p-4 text-center">
                  <p className={`${settingsType.metricLabel} uppercase`}>{tax.label}</p>
                  <p className={`${settingsType.metricValue} ${tax.tone}`}>{tax.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4"><SecureParameterBlock verified /></div>
          </SettingsPanel>
        )}
      </div>
    </div>
  );
}
