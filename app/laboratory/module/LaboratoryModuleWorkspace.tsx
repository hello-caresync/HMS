'use client';

import { useCallback, useMemo, useState } from 'react';

import LaboratoryModuleHeader from './components/LaboratoryModuleHeader';
import {
  AssignTestModal,
  CollectSampleModal,
  PrintBarcodeModal,
  ReleaseReportModal,
  ReportCriticalModal,
  VerifyResultModal,
} from './components/LaboratoryModals';
import {
  INITIAL_SAMPLE_ORDERS,
  INITIAL_VERIFICATIONS,
  advanceSampleStatus,
  advanceVerificationStage,
  searchLaboratory,
} from './lib/laboratoryMockData';
import type { LaboratoryModalType, LaboratoryWorkspaceTab } from './laboratoryNav.types';
import { LABORATORY_WORKSPACE_TABS } from './laboratoryNav.types';
import CommandCenterTab from './views/CommandCenterTab';
import ProcessingQcTab from './views/ProcessingQcTab';
import VerificationReagentsTab from './views/VerificationReagentsTab';

export default function LaboratoryModuleWorkspace() {
  const [activeTab, setActiveTab] = useState<LaboratoryWorkspaceTab>('command');
  const [lookupQuery, setLookupQuery] = useState('');
  const [modal, setModal] = useState<LaboratoryModalType>(null);
  const [orders, setOrders] = useState(INITIAL_SAMPLE_ORDERS);
  const [verifications, setVerifications] = useState(INITIAL_VERIFICATIONS);

  const lookupResults = useMemo(() => {
    const q = lookupQuery.trim();
    if (!q) return undefined;
    return searchLaboratory(q, orders);
  }, [lookupQuery, orders]);

  const handleAdvancePipeline = useCallback((id: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        const next = advanceSampleStatus(o.pipelineStatus);
        return {
          ...o,
          pipelineStatus: next,
          collectionStatus: next !== 'Pending Collection' ? 'Collected' : o.collectionStatus,
          barcodeStatus: o.barcodeStatus === 'Pending' && next !== 'Pending Collection' ? 'Printed' : o.barcodeStatus,
        };
      }),
    );
  }, []);

  const handleToggleRecollection = useCallback((id: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? { ...o, collectionStatus: 'Recollection Requested' as const, pipelineStatus: 'Delayed' as const, barcodeStatus: 'Pending' as const }
          : o,
      ),
    );
  }, []);

  const handleAdvanceVerification = useCallback((id: string) => {
    setVerifications((prev) =>
      prev.map((v) => (v.id === id ? { ...v, stage: advanceVerificationStage(v.stage) } : v)),
    );
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col overflow-hidden bg-[#F8FAFC]">
      <LaboratoryModuleHeader lookupValue={lookupQuery} onLookupChange={setLookupQuery} resultCount={lookupResults} />

      <nav className="shrink-0 border-b border-[#E2E8F0] bg-white px-4" aria-label="Laboratory workspace tabs">
        <div className="flex gap-1 overflow-x-auto py-1">
          {LABORATORY_WORKSPACE_TABS.map((tab) => (
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

      <div className="custom-scrollbar flex-1 overflow-y-auto p-3">
        {activeTab === 'command' && (
          <CommandCenterTab
            lookupQuery={lookupQuery}
            orders={orders}
            onAdvancePipeline={handleAdvancePipeline}
            onToggleRecollection={handleToggleRecollection}
            onQuickAction={(a) => setModal(a)}
          />
        )}
        {activeTab === 'processing' && <ProcessingQcTab />}
        {activeTab === 'verification' && (
          <VerificationReagentsTab verifications={verifications} onAdvanceVerification={handleAdvanceVerification} />
        )}
      </div>

      {modal === 'collect-sample' && <CollectSampleModal onClose={() => setModal(null)} />}
      {modal === 'print-barcode' && <PrintBarcodeModal onClose={() => setModal(null)} />}
      {modal === 'assign-test' && <AssignTestModal onClose={() => setModal(null)} />}
      {modal === 'verify-result' && <VerifyResultModal onClose={() => setModal(null)} />}
      {modal === 'release-report' && <ReleaseReportModal onClose={() => setModal(null)} />}
      {modal === 'report-critical' && <ReportCriticalModal onClose={() => setModal(null)} />}
    </div>
  );
}
