'use client';

import { useMemo, useState } from 'react';

import AdmissionsModuleHeader from './components/AdmissionsModuleHeader';
import {
  AdmitPatientModal,
  AllocateBedModal,
  CollectDepositModal,
  PrintAdmissionSlipModal,
  TransferPatientModal,
  VerifyInsuranceModal,
  VisitorPassModal,
} from './components/AdmissionModals';
import { searchAdmissions } from './lib/admissionsMockData';
import {
  ADMISSIONS_WORKSPACE_TABS,
  type AdmissionModalType,
  type AdmissionsWorkspaceTab,
} from './admissionsNav.types';
import ExecutiveDeskTab from './views/ExecutiveDeskTab';
import FinancialDischargeTab from './views/FinancialDischargeTab';
import SpatialCapacityTab from './views/SpatialCapacityTab';

export default function AdmissionsModuleWorkspace() {
  const [activeTab, setActiveTab] = useState<AdmissionsWorkspaceTab>('executive');
  const [lookupQuery, setLookupQuery] = useState('');
  const [modal, setModal] = useState<AdmissionModalType>(null);

  const lookupResults = useMemo(() => {
    const q = lookupQuery.trim();
    if (!q) return undefined;
    return searchAdmissions(q);
  }, [lookupQuery]);

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col overflow-hidden bg-[#F8FAFC]">
      <AdmissionsModuleHeader
        lookupValue={lookupQuery}
        onLookupChange={setLookupQuery}
        resultCount={lookupResults}
        onAdmitClick={() => setModal('admit-patient')}
      />

      <nav className="shrink-0 border-b border-[#E2E8F0] bg-white px-4" aria-label="Admissions workspace tabs">
        <div className="flex gap-1 overflow-x-auto py-1.5">
          {ADMISSIONS_WORKSPACE_TABS.map((tab) => (
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
        {activeTab === 'executive' && (
          <ExecutiveDeskTab lookupQuery={lookupQuery} onQuickAction={(a) => setModal(a)} />
        )}
        {activeTab === 'spatial' && <SpatialCapacityTab />}
        {activeTab === 'financial' && <FinancialDischargeTab />}
      </div>

      {modal === 'admit-patient' && <AdmitPatientModal onClose={() => setModal(null)} />}
      {modal === 'allocate-bed' && <AllocateBedModal onClose={() => setModal(null)} />}
      {modal === 'transfer-patient' && <TransferPatientModal onClose={() => setModal(null)} />}
      {modal === 'collect-deposit' && <CollectDepositModal onClose={() => setModal(null)} />}
      {modal === 'verify-insurance' && <VerifyInsuranceModal onClose={() => setModal(null)} />}
      {modal === 'print-slip' && <PrintAdmissionSlipModal onClose={() => setModal(null)} />}
      {modal === 'visitor-pass' && <VisitorPassModal onClose={() => setModal(null)} />}
    </div>
  );
}
