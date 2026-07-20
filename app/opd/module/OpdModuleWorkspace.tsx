'use client';

import { useCallback, useMemo, useState } from 'react';

import OpdModuleHeader from './components/OpdModuleHeader';
import {
  AssignDoctorModal,
  CheckInPatientModal,
  GenerateTokenModal,
  PrintOpdSlipModal,
  RecommendAdmissionModal,
  ReferPatientModal,
} from './components/OpdModals';
import { advanceQueueStatus, INITIAL_OPD_QUEUE, searchOpd, type OpdQueueEntry } from './lib/opdMockData';
import { OPD_WORKSPACE_TABS, type OpdModalType, type OpdWorkspaceTab } from './opdNav.types';
import AccountingAnalyticsTab from './views/AccountingAnalyticsTab';
import ClinicalWorkflowTab from './views/ClinicalWorkflowTab';
import OperationalConsoleTab from './views/OperationalConsoleTab';

export default function OpdModuleWorkspace() {
  const [activeTab, setActiveTab] = useState<OpdWorkspaceTab>('console');
  const [lookupQuery, setLookupQuery] = useState('');
  const [modal, setModal] = useState<OpdModalType>(null);
  const [queue, setQueue] = useState<OpdQueueEntry[]>(INITIAL_OPD_QUEUE);

  const lookupResults = useMemo(() => {
    const q = lookupQuery.trim();
    if (!q) return undefined;
    return searchOpd(q, queue);
  }, [lookupQuery, queue]);

  const handleAdvanceStatus = useCallback((id: string) => {
    setQueue((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const nextStatus = advanceQueueStatus(e.status);
        return {
          ...e,
          status: nextStatus,
          waitMinutes: nextStatus === 'Consultation in Progress' ? 0 : e.waitMinutes,
        };
      }),
    );
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col overflow-hidden bg-[#F8FAFC]">
      <OpdModuleHeader
        lookupValue={lookupQuery}
        onLookupChange={setLookupQuery}
        resultCount={lookupResults}
        onCheckInClick={() => setModal('check-in')}
      />

      <nav className="shrink-0 border-b border-[#E2E8F0] bg-white px-4" aria-label="OPD workspace tabs">
        <div className="flex gap-1 overflow-x-auto py-1.5">
          {OPD_WORKSPACE_TABS.map((tab) => (
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
              <span className={`block text-[9px] ${activeTab === tab.id ? 'text-slate-300' : 'text-slate-400'}`}>
                {tab.description}
              </span>
            </button>
          ))}
        </div>
      </nav>

      <div className="custom-scrollbar flex-1 overflow-y-auto p-4">
        {activeTab === 'console' && (
          <OperationalConsoleTab
            lookupQuery={lookupQuery}
            queue={queue}
            onQueueChange={setQueue}
            onAdvanceStatus={handleAdvanceStatus}
            onQuickAction={(a) => setModal(a)}
          />
        )}
        {activeTab === 'clinical' && <ClinicalWorkflowTab onRecommendAdmission={() => setModal('recommend-admission')} />}
        {activeTab === 'accounting' && <AccountingAnalyticsTab />}
      </div>

      {modal === 'check-in' && <CheckInPatientModal onClose={() => setModal(null)} />}
      {modal === 'generate-token' && <GenerateTokenModal onClose={() => setModal(null)} />}
      {modal === 'assign-doctor' && <AssignDoctorModal onClose={() => setModal(null)} />}
      {modal === 'refer-patient' && <ReferPatientModal onClose={() => setModal(null)} />}
      {modal === 'recommend-admission' && <RecommendAdmissionModal onClose={() => setModal(null)} />}
      {modal === 'print-slip' && <PrintOpdSlipModal onClose={() => setModal(null)} />}
    </div>
  );
}
