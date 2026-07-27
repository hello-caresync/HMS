'use client';

import { useCallback, useMemo, useState } from 'react';

import { EmrShortcutDrawer, MessageThreadDrawer } from './components/HpWorkspaceDrawers';
import HpWorkspaceModuleHeader from './components/HpWorkspaceModuleHeader';
import {
  AdmitPatientModal,
  ApproveRequestModal,
  CreateAppointmentModal,
  CreatePurchaseRequestModal,
  GenerateBillModal,
  RegisterPatientModal,
} from './components/HpWorkspaceModals';
import {
  INITIAL_ACTIVITY_FEED,
  INITIAL_AI_INSIGHTS,
  INITIAL_APPROVALS,
  INITIAL_WORK_QUEUE,
  searchUniversal,
} from './lib/hpWorkspaceMockData';
import type { ActivePatientSummary, ChatThread } from './lib/hpWorkspaceMockData';
import type { AiInsightStatus, HpModalType, HpRolePersona, HpWorkspaceTab } from './hpWorkspaceNav.types';
import { HP_WORKSPACE_TABS, advanceApprovalStatus, advanceTaskStatus } from './hpWorkspaceNav.types';
import ClinicalSuitesTab from './views/ClinicalSuitesTab';
import EnterpriseComplianceTab from './views/EnterpriseComplianceTab';
import MyCockpitTab from './views/MyCockpitTab';

export default function HpWorkspaceModuleWorkspace() {
  const [activeTab, setActiveTab] = useState<HpWorkspaceTab>('cockpit');
  const [lookupQuery, setLookupQuery] = useState('');
  const [activeRole, setActiveRole] = useState<HpRolePersona>('Admin');
  const [widgetsExpanded, setWidgetsExpanded] = useState(true);
  const [modal, setModal] = useState<HpModalType>(null);
  const [tasks, setTasks] = useState(INITIAL_WORK_QUEUE);
  const [activityFeed] = useState(INITIAL_ACTIVITY_FEED);
  const [approvals, setApprovals] = useState(INITIAL_APPROVALS);
  const [aiInsights, setAiInsights] = useState(INITIAL_AI_INSIGHTS);
  const [selectedPatientId, setSelectedPatientId] = useState('pt-1');
  const [emrPatient, setEmrPatient] = useState<ActivePatientSummary | null>(null);
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);

  const lookupResults = useMemo(() => {
    const q = lookupQuery.trim();
    if (!q) return undefined;
    return searchUniversal(q).length;
  }, [lookupQuery]);

  const handleAdvanceTask = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: advanceTaskStatus(t.status) } : t)),
    );
  }, []);

  const handleAdvanceApproval = useCallback((id: string) => {
    setApprovals((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: advanceApprovalStatus(a.status) } : a)),
    );
  }, []);

  const handleUpdateAiStatus = useCallback((id: string, status: AiInsightStatus) => {
    setAiInsights((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col overflow-hidden bg-[#F8FAFC]">
      <HpWorkspaceModuleHeader
        lookupValue={lookupQuery}
        onLookupChange={setLookupQuery}
        resultCount={lookupResults}
        activeRole={activeRole}
        onRoleChange={setActiveRole}
        widgetsExpanded={widgetsExpanded}
        onToggleWidgets={() => setWidgetsExpanded((v) => !v)}
      />

      <nav className="shrink-0 border-b border-[#E2E8F0] bg-white px-4" aria-label="HP Workspace tabs">
        <div className="flex gap-1 overflow-x-auto py-1">
          {HP_WORKSPACE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 rounded-md px-4 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 ${
                activeTab === tab.id ? 'bg-[#0F172A] text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="block text-sm font-bold">{tab.label}</span>
              <span className={`block text-sm ${activeTab === tab.id ? 'text-slate-300' : 'text-slate-500'}`}>{tab.description}</span>
            </button>
          ))}
        </div>
      </nav>

      <div className="custom-scrollbar flex-1 overflow-y-auto p-3">
        {activeTab === 'cockpit' && (
          <MyCockpitTab
            activeRole={activeRole}
            widgetsExpanded={widgetsExpanded}
            tasks={tasks}
            activityFeed={activityFeed}
            onAdvanceTask={handleAdvanceTask}
            onOpenThread={setActiveThread}
            onQuickAction={(a) => setModal(a)}
          />
        )}
        {activeTab === 'clinical' && (
          <ClinicalSuitesTab
            selectedPatientId={selectedPatientId}
            onSelectPatient={setSelectedPatientId}
            onOpenEmr={setEmrPatient}
          />
        )}
        {activeTab === 'enterprise' && (
          <EnterpriseComplianceTab
            approvals={approvals}
            aiInsights={aiInsights}
            onAdvanceApproval={handleAdvanceApproval}
            onUpdateAiStatus={handleUpdateAiStatus}
          />
        )}
      </div>

      {modal === 'register-patient' && <RegisterPatientModal onClose={() => setModal(null)} />}
      {modal === 'create-appointment' && <CreateAppointmentModal onClose={() => setModal(null)} />}
      {modal === 'admit-patient' && <AdmitPatientModal onClose={() => setModal(null)} />}
      {modal === 'generate-bill' && <GenerateBillModal onClose={() => setModal(null)} />}
      {modal === 'create-purchase-request' && <CreatePurchaseRequestModal onClose={() => setModal(null)} />}
      {modal === 'approve-request' && <ApproveRequestModal onClose={() => setModal(null)} />}

      {emrPatient && <EmrShortcutDrawer patient={emrPatient} onClose={() => setEmrPatient(null)} />}
      {activeThread && (
        <MessageThreadDrawer
          channel={activeThread.channel}
          lastMessage={activeThread.lastMessage}
          participants={activeThread.participants}
          onClose={() => setActiveThread(null)}
        />
      )}
    </div>
  );
}
