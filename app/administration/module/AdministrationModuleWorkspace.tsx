'use client';

import { useCallback, useMemo, useState } from 'react';

import AdministrationModuleHeader from './components/AdministrationModuleHeader';
import {
  CreateUserModal,
  EmergencyProtocolModal,
  IncidentReportModal,
  ProcessApprovalModal,
  PublishPolicyModal,
  RegisterVisitorModal,
} from './components/AdministrationModals';
import { OrgConfigDrawer } from './components/OrgConfigDrawer';
import { COMPLAINTS, INITIAL_AI_INSIGHTS, INITIAL_INCIDENTS, searchAdministration } from './lib/administrationMockData';
import type { AdministrationModalType, AdministrationWorkspaceTab, AiAdminInsightStatus, OrgTreeNodeId } from './administrationNav.types';
import { ADMINISTRATION_WORKSPACE_TABS, DEFAULT_ORG_NODE, advanceIncidentStatus } from './administrationNav.types';
import ComplianceAiTab from './views/ComplianceAiTab';
import GovernanceCockpitTab from './views/GovernanceCockpitTab';
import OrgAccessTab from './views/OrgAccessTab';

export default function AdministrationModuleWorkspace() {
  const [activeTab, setActiveTab] = useState<AdministrationWorkspaceTab>('governance');
  const [lookupQuery, setLookupQuery] = useState('');
  const [modal, setModal] = useState<AdministrationModalType>(null);
  const [selectedOrgNode, setSelectedOrgNode] = useState<OrgTreeNodeId>(DEFAULT_ORG_NODE);
  const [drawerNode, setDrawerNode] = useState<OrgTreeNodeId | null>(null);
  const [incidents, setIncidents] = useState(INITIAL_INCIDENTS);
  const [aiInsights, setAiInsights] = useState(INITIAL_AI_INSIGHTS);

  const lookupResults = useMemo(() => {
    const q = lookupQuery.trim();
    if (!q) return undefined;
    return searchAdministration(q);
  }, [lookupQuery]);

  const handleAdvanceIncident = useCallback((id: string) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, status: advanceIncidentStatus(inc.status) } : inc)),
    );
  }, []);

  const handleUpdateAiStatus = useCallback((id: string, status: AiAdminInsightStatus) => {
    setAiInsights((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col overflow-hidden bg-[#F8FAFC]">
      <AdministrationModuleHeader lookupValue={lookupQuery} onLookupChange={setLookupQuery} resultCount={lookupResults} />

      <nav className="shrink-0 border-b border-[#E2E8F0] bg-white px-4" aria-label="Administration workspace tabs">
        <div className="flex gap-1 overflow-x-auto py-1">
          {ADMINISTRATION_WORKSPACE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 rounded-md px-3 py-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 ${
                activeTab === tab.id ? 'bg-[#0F172A] text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="block text-[11px] font-bold">{tab.label}</span>
              <span className={`block text-[9px] ${activeTab === tab.id ? 'text-slate-300' : 'text-slate-400'}`}>{tab.description}</span>
            </button>
          ))}
        </div>
      </nav>

      <div className="custom-scrollbar flex-1 overflow-y-auto p-3">
        {activeTab === 'governance' && <GovernanceCockpitTab onQuickAction={(a) => setModal(a)} />}
        {activeTab === 'organization' && (
          <OrgAccessTab
            selectedNode={selectedOrgNode}
            onSelectNode={setSelectedOrgNode}
            onOpenConfigDrawer={(id) => setDrawerNode(id)}
          />
        )}
        {activeTab === 'compliance' && (
          <ComplianceAiTab
            complaints={COMPLAINTS}
            incidents={incidents}
            aiInsights={aiInsights}
            onAdvanceIncident={handleAdvanceIncident}
            onUpdateAiStatus={handleUpdateAiStatus}
          />
        )}
      </div>

      {modal === 'create-user' && <CreateUserModal onClose={() => setModal(null)} />}
      {modal === 'incident-report' && <IncidentReportModal onClose={() => setModal(null)} />}
      {modal === 'process-approval' && <ProcessApprovalModal onClose={() => setModal(null)} />}
      {modal === 'publish-policy' && <PublishPolicyModal onClose={() => setModal(null)} />}
      {modal === 'register-visitor' && <RegisterVisitorModal onClose={() => setModal(null)} />}
      {modal === 'emergency-protocol' && <EmergencyProtocolModal onClose={() => setModal(null)} />}

      {drawerNode && <OrgConfigDrawer nodeId={drawerNode} onClose={() => setDrawerNode(null)} />}
    </div>
  );
}
