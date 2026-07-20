'use client';

import { useCallback, useMemo, useState } from 'react';

import VendorCoordinationModuleHeader from './components/VendorCoordinationModuleHeader';
import {
  AddVendorModal,
  DispatchPoModal,
  IssueRfqModal,
  LogComplaintModal,
  OpenChatModal,
  ProcessApprovalModal,
  TrackShipmentModal,
} from './components/VendorCoordinationModals';
import { VendorDetailDrawer } from './components/vendorCoordinationUi';
import {
  INITIAL_AI_VENDOR_INSIGHTS,
  INITIAL_DELIVERY_TRACKING,
  INITIAL_ONBOARDING_REQUESTS,
  INITIAL_PO_COORDINATION,
  advanceFulfillmentStage,
  advanceOnboardingPhase,
  searchVendorCoordination,
} from './lib/vendorCoordinationMockData';
import type { AiVendorInsightStatus, VendorCoordinationModalType, VendorCoordinationWorkspaceTab } from './vendorCoordinationNav.types';
import { VENDOR_COORDINATION_WORKSPACE_TABS } from './vendorCoordinationNav.types';
import LogisticsFinanceTab from './views/LogisticsFinanceTab';
import SupplierMasterTab from './views/SupplierMasterTab';
import VrmCommandCenterTab from './views/VrmCommandCenterTab';

type DrawerState = { vendorName: string; category: string; rating: number } | null;

export default function VendorCoordinationModuleWorkspace() {
  const [activeTab, setActiveTab] = useState<VendorCoordinationWorkspaceTab>('vrm');
  const [lookupQuery, setLookupQuery] = useState('');
  const [modal, setModal] = useState<VendorCoordinationModalType>(null);
  const [drawer, setDrawer] = useState<DrawerState>(null);
  const [onboarding, setOnboarding] = useState(INITIAL_ONBOARDING_REQUESTS);
  const [poRecords, setPoRecords] = useState(INITIAL_PO_COORDINATION);
  const [deliveryRecords, setDeliveryRecords] = useState(INITIAL_DELIVERY_TRACKING);
  const [aiInsights, setAiInsights] = useState(INITIAL_AI_VENDOR_INSIGHTS);

  const lookupResults = useMemo(() => {
    const q = lookupQuery.trim();
    if (!q) return undefined;
    return searchVendorCoordination(q, onboarding);
  }, [lookupQuery, onboarding]);

  const handleAdvanceOnboarding = useCallback((id: string) => {
    setOnboarding((prev) =>
      prev.map((v) => {
        if (v.id !== id) return v;
        const next = advanceOnboardingPhase(v.phase);
        return {
          ...v,
          phase: next,
          documentsVerified: next !== 'Registration' ? true : v.documentsVerified,
          qualityReview: next === 'Activated' ? 'Passed' : v.qualityReview,
          performanceScore: next === 'Activated' ? 4.5 : v.performanceScore,
        };
      }),
    );
  }, []);

  const handleAdvanceFulfillment = useCallback((id: string) => {
    setPoRecords((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const next = advanceFulfillmentStage(p.fulfillmentStage);
        return {
          ...p,
          fulfillmentStage: next,
          status: next === 'Dispatched' || next === 'In Transit' ? 'Dispatched' : next === 'Delivered' ? 'Confirmed' : p.status,
        };
      }),
    );
  }, []);

  const handleAdvanceDelivery = useCallback((id: string) => {
    setDeliveryRecords((prev) =>
      prev.map((d) => (d.id === id ? { ...d, stage: advanceFulfillmentStage(d.stage) } : d)),
    );
  }, []);

  const handleUpdateAiStatus = useCallback((id: string, status: AiVendorInsightStatus) => {
    setAiInsights((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
  }, []);

  const openDrawer = useCallback((vendorName: string, category: string, rating: number) => {
    setDrawer({ vendorName, category, rating });
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col overflow-hidden bg-[#F8FAFC]">
      <VendorCoordinationModuleHeader lookupValue={lookupQuery} onLookupChange={setLookupQuery} resultCount={lookupResults} />

      <nav className="shrink-0 border-b border-[#E2E8F0] bg-white px-4" aria-label="Vendor coordination workspace tabs">
        <div className="flex gap-1 overflow-x-auto py-1">
          {VENDOR_COORDINATION_WORKSPACE_TABS.map((tab) => (
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

      <div className="custom-scrollbar relative flex-1 overflow-y-auto p-3">
        {activeTab === 'vrm' && (
          <VrmCommandCenterTab
            lookupQuery={lookupQuery}
            onboarding={onboarding}
            poRecords={poRecords}
            onAdvanceOnboarding={handleAdvanceOnboarding}
            onAdvanceFulfillment={handleAdvanceFulfillment}
            onOpenVendorDrawer={openDrawer}
            onQuickAction={(a) => setModal(a)}
          />
        )}
        {activeTab === 'supplier' && <SupplierMasterTab onOpenVendorDrawer={openDrawer} />}
        {activeTab === 'logistics' && (
          <LogisticsFinanceTab
            deliveryRecords={deliveryRecords}
            onAdvanceDelivery={handleAdvanceDelivery}
            aiInsights={aiInsights}
            onUpdateAiStatus={handleUpdateAiStatus}
          />
        )}
      </div>

      {drawer && (
        <>
          <button type="button" className="fixed inset-0 z-40 bg-[#0F172A]/30" onClick={() => setDrawer(null)} aria-label="Close drawer backdrop" />
          <VendorDetailDrawer vendorName={drawer.vendorName} category={drawer.category} rating={drawer.rating} onClose={() => setDrawer(null)} />
        </>
      )}

      {modal === 'add-vendor' && <AddVendorModal onClose={() => setModal(null)} />}
      {modal === 'process-approval' && <ProcessApprovalModal onClose={() => setModal(null)} />}
      {modal === 'open-chat' && <OpenChatModal onClose={() => setModal(null)} />}
      {modal === 'issue-rfq' && <IssueRfqModal onClose={() => setModal(null)} />}
      {modal === 'dispatch-po' && <DispatchPoModal onClose={() => setModal(null)} />}
      {modal === 'track-shipment' && <TrackShipmentModal onClose={() => setModal(null)} />}
      {modal === 'log-complaint' && <LogComplaintModal onClose={() => setModal(null)} />}
    </div>
  );
}
