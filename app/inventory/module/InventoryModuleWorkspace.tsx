'use client';

import { useCallback, useMemo, useState } from 'react';

import InventoryModuleHeader from './components/InventoryModuleHeader';
import {
  CreatePurchaseRequestModal,
  GeneratePoModal,
  IssueStockModal,
  LogGrnModal,
  RegisterItemModal,
  TransferStockModal,
} from './components/InventoryModals';
import {
  INITIAL_AI_SUGGESTIONS,
  INITIAL_GRN_RECORDS,
  INITIAL_PURCHASE_ORDERS,
  advancePoStatus,
  searchInventory,
} from './lib/inventoryMockData';
import type { AiSuggestionStatus, InventoryModalType, InventoryWorkspaceTab } from './inventoryNav.types';
import { INVENTORY_WORKSPACE_TABS } from './inventoryNav.types';
import AuditAiTab from './views/AuditAiTab';
import ItemMasterTab from './views/ItemMasterTab';
import ProcureToPayTab from './views/ProcureToPayTab';

export default function InventoryModuleWorkspace() {
  const [activeTab, setActiveTab] = useState<InventoryWorkspaceTab>('procure');
  const [lookupQuery, setLookupQuery] = useState('');
  const [modal, setModal] = useState<InventoryModalType>(null);
  const [purchaseOrders, setPurchaseOrders] = useState(INITIAL_PURCHASE_ORDERS);
  const [grnRecords] = useState(INITIAL_GRN_RECORDS);
  const [aiSuggestions, setAiSuggestions] = useState(INITIAL_AI_SUGGESTIONS);

  const lookupResults = useMemo(() => {
    const q = lookupQuery.trim();
    if (!q) return undefined;
    return searchInventory(q, purchaseOrders);
  }, [lookupQuery, purchaseOrders]);

  const handleAdvancePo = useCallback((id: string) => {
    setPurchaseOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: advancePoStatus(o.status) } : o)),
    );
  }, []);

  const handleUpdateAiStatus = useCallback((id: string, status: AiSuggestionStatus) => {
    setAiSuggestions((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col overflow-hidden bg-[#F8FAFC]">
      <InventoryModuleHeader lookupValue={lookupQuery} onLookupChange={setLookupQuery} resultCount={lookupResults} />

      <nav className="shrink-0 border-b border-[#E2E8F0] bg-white px-4" aria-label="Inventory workspace tabs">
        <div className="flex gap-1 overflow-x-auto py-1">
          {INVENTORY_WORKSPACE_TABS.map((tab) => (
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
        {activeTab === 'procure' && (
          <ProcureToPayTab
            lookupQuery={lookupQuery}
            purchaseOrders={purchaseOrders}
            grnRecords={grnRecords}
            onAdvancePo={handleAdvancePo}
            onQuickAction={(a) => setModal(a)}
          />
        )}
        {activeTab === 'master' && <ItemMasterTab />}
        {activeTab === 'audit' && (
          <AuditAiTab aiSuggestions={aiSuggestions} onUpdateAiStatus={handleUpdateAiStatus} />
        )}
      </div>

      {modal === 'register-item' && <RegisterItemModal onClose={() => setModal(null)} />}
      {modal === 'create-pr' && <CreatePurchaseRequestModal onClose={() => setModal(null)} />}
      {modal === 'generate-po' && <GeneratePoModal onClose={() => setModal(null)} />}
      {modal === 'log-grn' && <LogGrnModal onClose={() => setModal(null)} />}
      {modal === 'issue-stock' && <IssueStockModal onClose={() => setModal(null)} />}
      {modal === 'transfer-stock' && <TransferStockModal onClose={() => setModal(null)} />}
    </div>
  );
}
