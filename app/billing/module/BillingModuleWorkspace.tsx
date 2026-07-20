'use client';

import { useCallback, useMemo, useState } from 'react';

import BillingModuleHeader from './components/BillingModuleHeader';
import {
  ApproveDiscountModal,
  CollectPaymentModal,
  DailyClosingModal,
  GenerateInvoiceModal,
  ProcessRefundModal,
  SelectPackageModal,
  UpdateChargeMasterModal,
} from './components/BillingModals';
import {
  INITIAL_AI_FINANCE,
  INITIAL_BILLING_QUEUE,
  INITIAL_INSURANCE_CLAIMS,
  advanceClaimFromDenial,
  advanceClaimStage,
  searchBilling,
} from './lib/billingMockData';
import type { AiFinanceInsightStatus, BillingModalType, BillingQueueType, BillingWorkspaceTab } from './billingNav.types';
import { BILLING_WORKSPACE_TABS } from './billingNav.types';
import AccountingAiTab from './views/AccountingAiTab';
import FinancialCommandTab from './views/FinancialCommandTab';
import RcmInsuranceTab from './views/RcmInsuranceTab';

export default function BillingModuleWorkspace() {
  const [activeTab, setActiveTab] = useState<BillingWorkspaceTab>('command');
  const [lookupQuery, setLookupQuery] = useState('');
  const [modal, setModal] = useState<BillingModalType>(null);
  const [queueFilter, setQueueFilter] = useState<BillingQueueType | 'All'>('All');
  const [selectedPackage, setSelectedPackage] = useState<string | undefined>();
  const [billingQueue] = useState(INITIAL_BILLING_QUEUE);
  const [claims, setClaims] = useState(INITIAL_INSURANCE_CLAIMS);
  const [aiInsights, setAiInsights] = useState(INITIAL_AI_FINANCE);

  const lookupResults = useMemo(() => {
    const q = lookupQuery.trim();
    if (!q) return undefined;
    return searchBilling(q, billingQueue);
  }, [lookupQuery, billingQueue]);

  const handleAdvanceClaim = useCallback((id: string) => {
    setClaims((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const next = c.stage === 'Denial Management' ? advanceClaimFromDenial(c.stage) : advanceClaimStage(c.stage);
        return {
          ...c,
          stage: next,
          approvedAmount: next === 'Settlement' ? Math.round(c.claimAmount * 0.9) : c.approvedAmount,
        };
      }),
    );
  }, []);

  const handleUpdateAiStatus = useCallback((id: string, status: AiFinanceInsightStatus) => {
    setAiInsights((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col overflow-hidden bg-[#F8FAFC]">
      <BillingModuleHeader lookupValue={lookupQuery} onLookupChange={setLookupQuery} resultCount={lookupResults} />

      <nav className="shrink-0 border-b border-[#E2E8F0] bg-white px-4" aria-label="Billing workspace tabs">
        <div className="flex gap-1 overflow-x-auto py-1">
          {BILLING_WORKSPACE_TABS.map((tab) => (
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
        {activeTab === 'command' && (
          <FinancialCommandTab
            lookupQuery={lookupQuery}
            queue={billingQueue}
            queueFilter={queueFilter}
            onQueueFilterChange={setQueueFilter}
            onQuickAction={(a) => setModal(a)}
            selectedPackage={selectedPackage}
          />
        )}
        {activeTab === 'rcm' && <RcmInsuranceTab claims={claims} onAdvanceClaim={handleAdvanceClaim} />}
        {activeTab === 'accounting' && <AccountingAiTab aiInsights={aiInsights} onUpdateAiStatus={handleUpdateAiStatus} />}
      </div>

      {modal === 'generate-invoice' && <GenerateInvoiceModal onClose={() => setModal(null)} />}
      {modal === 'collect-payment' && <CollectPaymentModal onClose={() => setModal(null)} />}
      {modal === 'approve-discount' && <ApproveDiscountModal onClose={() => setModal(null)} />}
      {modal === 'process-refund' && <ProcessRefundModal onClose={() => setModal(null)} />}
      {modal === 'update-charge-master' && <UpdateChargeMasterModal onClose={() => setModal(null)} />}
      {modal === 'daily-closing' && <DailyClosingModal onClose={() => setModal(null)} />}
      {modal === 'select-package' && (
        <SelectPackageModal
          onClose={() => setModal(null)}
          onSelect={(pkg) => setSelectedPackage(pkg.name)}
        />
      )}
    </div>
  );
}
