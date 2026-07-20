'use client';

import { useCallback, useMemo, useState } from 'react';

import SettingsModuleHeader from './components/SettingsModuleHeader';
import {
  AddDepartmentModal,
  BackupSystemModal,
  ConfigureRoleModal,
  CreateUserModal,
  ManageNotificationsModal,
  SetupIntegrationModal,
} from './components/SettingsModals';
import { IntegrationLogDrawer } from './components/IntegrationLogDrawer';
import {
  INTEGRATION_ENDPOINTS,
  MODULE_TOGGLES,
  PROVISIONED_USERS,
  WORKFLOW_APPROVAL_RULES,
  searchSettings,
} from './lib/settingsMockData';
import type { IntegrationLogId, RegistryTreeNodeId, SettingsModalType, SettingsWorkspaceTab } from './settingsNav.types';
import { DEFAULT_REGISTRY_NODE, SETTINGS_WORKSPACE_TABS, toggleUserStatus } from './settingsNav.types';
import { settingsType } from './components/settingsUi';
import ErpControlTab from './views/ErpControlTab';
import IntegrationsSecurityTab from './views/IntegrationsSecurityTab';
import WorkflowBuilderTab from './views/WorkflowBuilderTab';

export default function SettingsModuleWorkspace() {
  const [activeTab, setActiveTab] = useState<SettingsWorkspaceTab>('control');
  const [lookupQuery, setLookupQuery] = useState('');
  const [modal, setModal] = useState<SettingsModalType>(null);
  const [selectedNode, setSelectedNode] = useState<RegistryTreeNodeId>(DEFAULT_REGISTRY_NODE);
  const [drawerLogId, setDrawerLogId] = useState<IntegrationLogId | null>(null);
  const [users, setUsers] = useState(PROVISIONED_USERS);
  const [moduleToggles, setModuleToggles] = useState(MODULE_TOGGLES);
  const [workflowRules] = useState(WORKFLOW_APPROVAL_RULES);

  const lookupResults = useMemo(() => {
    const q = lookupQuery.trim();
    if (!q) return undefined;
    return searchSettings(q);
  }, [lookupQuery]);

  const handleToggleUserStatus = useCallback((id: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: toggleUserStatus(u.status) } : u)),
    );
  }, []);

  const handleToggleFeature = useCallback((id: string) => {
    setModuleToggles((prev) =>
      prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t)),
    );
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col overflow-hidden bg-[#F8FAFC]">
      <SettingsModuleHeader lookupValue={lookupQuery} onLookupChange={setLookupQuery} resultCount={lookupResults} />

      <nav className="shrink-0 border-b border-[#E2E8F0] bg-white px-5" aria-label="Settings workspace tabs">
        <div className="flex gap-2 overflow-x-auto py-2">
          {SETTINGS_WORKSPACE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 rounded-lg px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 ${
                activeTab === tab.id ? 'bg-[#0F172A] text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className={`block ${settingsType.tabLabel}`}>{tab.label}</span>
              <span className={`block ${settingsType.tabDescription} ${activeTab === tab.id ? 'text-slate-300' : 'text-slate-400'}`}>{tab.description}</span>
            </button>
          ))}
        </div>
      </nav>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-5">
        {activeTab === 'control' && (
          <ErpControlTab users={users} onToggleUserStatus={handleToggleUserStatus} onQuickAction={setModal} />
        )}
        {activeTab === 'workflow' && (
          <WorkflowBuilderTab
            selectedNode={selectedNode}
            onSelectNode={setSelectedNode}
            moduleToggles={moduleToggles}
            onToggleFeature={handleToggleFeature}
            workflowRules={workflowRules}
          />
        )}
        {activeTab === 'integrations' && (
          <IntegrationsSecurityTab integrations={INTEGRATION_ENDPOINTS} onOpenIntegrationLog={setDrawerLogId} />
        )}
      </div>

      {modal === 'create-user' && <CreateUserModal onClose={() => setModal(null)} />}
      {modal === 'configure-role' && <ConfigureRoleModal onClose={() => setModal(null)} />}
      {modal === 'add-department' && <AddDepartmentModal onClose={() => setModal(null)} />}
      {modal === 'setup-integration' && <SetupIntegrationModal onClose={() => setModal(null)} />}
      {modal === 'manage-notifications' && <ManageNotificationsModal onClose={() => setModal(null)} />}
      {modal === 'backup-system' && <BackupSystemModal onClose={() => setModal(null)} />}
      {drawerLogId && <IntegrationLogDrawer logId={drawerLogId} onClose={() => setDrawerLogId(null)} />}
    </div>
  );
}
