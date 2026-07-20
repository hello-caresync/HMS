'use client';

import { useCallback, useMemo, useState } from 'react';

import PharmacyModuleHeader from './components/PharmacyModuleHeader';
import {
  DispenseMedicineModal,
  PrintInvoiceModal,
  PrintLabelModal,
  PurchaseRequestModal,
  ReceiveStockModal,
  SearchDrugModal,
  TransferStockModal,
} from './components/PharmacyModals';
import {
  INITIAL_NARCOTIC_ENTRIES,
  INITIAL_PRESCRIPTIONS,
  INITIAL_QUEUE_TOKENS,
  advanceControlledStage,
  advancePrescriptionStatus,
  searchPharmacy,
} from './lib/pharmacyMockData';
import type { PharmacyModalType, PharmacyWorkspaceTab } from './pharmacyNav.types';
import { PHARMACY_WORKSPACE_TABS } from './pharmacyNav.types';
import ComplianceBillingTab from './views/ComplianceBillingTab';
import DispensingConsoleTab from './views/DispensingConsoleTab';
import InventoryProcurementTab from './views/InventoryProcurementTab';

export default function PharmacyModuleWorkspace() {
  const [activeTab, setActiveTab] = useState<PharmacyWorkspaceTab>('dispensing');
  const [lookupQuery, setLookupQuery] = useState('');
  const [modal, setModal] = useState<PharmacyModalType>(null);
  const [prescriptions, setPrescriptions] = useState(INITIAL_PRESCRIPTIONS);
  const [narcoticEntries, setNarcoticEntries] = useState(INITIAL_NARCOTIC_ENTRIES);

  const lookupResults = useMemo(() => {
    const q = lookupQuery.trim();
    if (!q) return undefined;
    return searchPharmacy(q, prescriptions);
  }, [lookupQuery, prescriptions]);

  const handleAdvancePrescription = useCallback((id: string) => {
    setPrescriptions((prev) =>
      prev.map((p) => {
        if (p.id !== id || !p.verified) return p;
        const next = advancePrescriptionStatus(p.status);
        return {
          ...p,
          status: next,
          barcodeStatus: next !== 'Pending Verification' && p.barcodeStatus === 'Pending' ? 'Printed' : p.barcodeStatus,
        };
      }),
    );
  }, []);

  const handleToggleVerification = useCallback((id: string) => {
    setPrescriptions((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const verified = !p.verified;
        return {
          ...p,
          verified,
          status: verified && p.status === 'Pending Verification' ? 'Verified' : p.status,
        };
      }),
    );
  }, []);

  const handleAdvanceControlled = useCallback((id: string) => {
    setNarcoticEntries((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n;
        const next = advanceControlledStage(n.stage);
        return {
          ...n,
          stage: next,
          chiefPharmacistSignature:
            next !== 'Pending Chief Pharmacist' && !n.chiefPharmacistSignature
              ? 'Chief Pharm. Joseph M. — ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
              : n.chiefPharmacistSignature,
          auditLogged: next === 'Audit Logged',
        };
      }),
    );
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col overflow-hidden bg-[#F8FAFC]">
      <PharmacyModuleHeader lookupValue={lookupQuery} onLookupChange={setLookupQuery} resultCount={lookupResults} />

      <nav className="shrink-0 border-b border-[#E2E8F0] bg-white px-4" aria-label="Pharmacy workspace tabs">
        <div className="flex gap-1 overflow-x-auto py-1">
          {PHARMACY_WORKSPACE_TABS.map((tab) => (
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
        {activeTab === 'dispensing' && (
          <DispensingConsoleTab
            lookupQuery={lookupQuery}
            prescriptions={prescriptions}
            queueTokens={INITIAL_QUEUE_TOKENS}
            onAdvancePrescription={handleAdvancePrescription}
            onToggleVerification={handleToggleVerification}
            onQuickAction={(a) => setModal(a)}
          />
        )}
        {activeTab === 'inventory' && <InventoryProcurementTab />}
        {activeTab === 'compliance' && (
          <ComplianceBillingTab narcoticEntries={narcoticEntries} onAdvanceControlled={handleAdvanceControlled} />
        )}
      </div>

      {modal === 'dispense' && (
        <DispenseMedicineModal onClose={() => setModal(null)} onPrintLabel={() => setModal('print-label')} />
      )}
      {modal === 'search-drug' && <SearchDrugModal onClose={() => setModal(null)} />}
      {modal === 'purchase-request' && <PurchaseRequestModal onClose={() => setModal(null)} />}
      {modal === 'receive-stock' && <ReceiveStockModal onClose={() => setModal(null)} />}
      {modal === 'transfer-stock' && <TransferStockModal onClose={() => setModal(null)} />}
      {modal === 'print-invoice' && <PrintInvoiceModal onClose={() => setModal(null)} />}
      {modal === 'print-label' && <PrintLabelModal onClose={() => setModal(null)} />}
    </div>
  );
}
