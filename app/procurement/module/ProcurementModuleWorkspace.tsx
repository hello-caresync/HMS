'use client';

import { useCallback, useMemo, useState } from 'react';

import ProcurementModuleHeader from './components/ProcurementModuleHeader';
import {
  CreatePrModal,
  EmergencyPurchaseModal,
  GeneratePoModal,
  ProcessRfqModal,
  UploadInvoiceModal,
} from './components/ProcurementModals';
import { INITIAL_AI_INSIGHTS, INITIAL_PURCHASE_REQUESTS, advancePrLifecycle, searchProcurement } from './lib/procurementMockData';
import type { AiProcurementStatus, ApprovalStageName, ProcurementModalType, ProcurementWorkspaceTab } from './procurementNav.types';
import { PROCUREMENT_WORKSPACE_TABS, advanceApprovalStage, allApprovalsComplete } from './procurementNav.types';
import LogisticsAccountingTab from './views/LogisticsAccountingTab';
import P2PCommandCenterTab from './views/P2PCommandCenterTab';
import VendorSourcingTab from './views/VendorSourcingTab';

export default function ProcurementModuleWorkspace() {
  const [activeTab, setActiveTab] = useState<ProcurementWorkspaceTab>('p2p');
  const [lookupQuery, setLookupQuery] = useState('');
  const [modal, setModal] = useState<ProcurementModalType>(null);
  const [requests, setRequests] = useState(INITIAL_PURCHASE_REQUESTS);
  const [aiInsights, setAiInsights] = useState(INITIAL_AI_INSIGHTS);

  const lookupResults = useMemo(() => {
    const q = lookupQuery.trim();
    if (!q) return undefined;
    return searchProcurement(q, requests);
  }, [lookupQuery, requests]);

  const handleAdvancePr = useCallback((id: string) => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        if (!allApprovalsComplete(r.approvals) && r.status !== 'Sent to Vendor' && r.status !== 'PO Generated' && r.status !== 'Completed') {
          return r;
        }
        return { ...r, status: advancePrLifecycle(r.status) };
      }),
    );
  }, []);

  const handleApproveStage = useCallback((id: string, stage: ApprovalStageName) => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== id || r.approvals[stage] === 'Approved') return r;
        const approvals = advanceApprovalStage(r.approvals, stage);
        const allDone = allApprovalsComplete(approvals);
        return {
          ...r,
          approvals,
          status: allDone && r.status === 'Draft' ? 'Pending Approval' : allDone && r.status === 'Pending Approval' ? 'Approved' : r.status,
        };
      }),
    );
  }, []);

  const handleUpdateAiStatus = useCallback((id: string, status: AiProcurementStatus) => {
    setAiInsights((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col overflow-hidden bg-[#F8FAFC]">
      <ProcurementModuleHeader lookupValue={lookupQuery} onLookupChange={setLookupQuery} resultCount={lookupResults} />

      <nav className="shrink-0 border-b border-[#E2E8F0] bg-white px-4" aria-label="Procurement workspace tabs">
        <div className="flex gap-1 overflow-x-auto py-1">
          {PROCUREMENT_WORKSPACE_TABS.map((tab) => (
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
        {activeTab === 'p2p' && (
          <P2PCommandCenterTab
            lookupQuery={lookupQuery}
            requests={requests}
            onAdvancePr={handleAdvancePr}
            onApproveStage={handleApproveStage}
            onQuickAction={(a) => setModal(a)}
          />
        )}
        {activeTab === 'vendor' && <VendorSourcingTab />}
        {activeTab === 'logistics' && <LogisticsAccountingTab aiInsights={aiInsights} onUpdateAiStatus={handleUpdateAiStatus} />}
      </div>

      {modal === 'create-pr' && <CreatePrModal onClose={() => setModal(null)} />}
      {modal === 'generate-po' && <GeneratePoModal onClose={() => setModal(null)} />}
      {modal === 'process-rfq' && <ProcessRfqModal onClose={() => setModal(null)} />}
      {modal === 'upload-invoice' && <UploadInvoiceModal onClose={() => setModal(null)} />}
      {modal === 'emergency-purchase' && <EmergencyPurchaseModal onClose={() => setModal(null)} />}
    </div>
  );
}
