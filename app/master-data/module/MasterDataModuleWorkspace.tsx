'use client';

import { useCallback, useMemo, useState } from 'react';

import MasterDataModuleHeader from './components/MasterDataModuleHeader';
import {
  AssignPermissionsModal,
  AuditLogsModal,
  AutoMergerModal,
  DuplicateScanModal,
  NewMasterRecordModal,
  SyncSubModulesModal,
  UpdateChargeMasterModal,
} from './components/MasterDataModals';
import {
  AI_ANOMALY_ALERTS,
  AI_DUPLICATE_ALERTS,
  INITIAL_PENDING_SERVICES,
  searchMasterData,
} from './lib/masterDataMockData';
import type { MasterDataModalType, MasterDataWorkspaceTab, RegistryTreeNodeId } from './masterDataNav.types';
import {
  DEFAULT_REGISTRY_NODE,
  MASTER_DATA_WORKSPACE_TABS,
  advanceApprovalStatus,
} from './masterDataNav.types';
import AuditAiTab from './views/AuditAiTab';
import DataQualityTab from './views/DataQualityTab';
import RegistriesMappingTab from './views/RegistriesMappingTab';

export default function MasterDataModuleWorkspace() {
  const [activeTab, setActiveTab] = useState<MasterDataWorkspaceTab>('foundation');
  const [lookupQuery, setLookupQuery] = useState('');
  const [modal, setModal] = useState<MasterDataModalType>(null);
  const [selectedNode, setSelectedNode] = useState<RegistryTreeNodeId>(DEFAULT_REGISTRY_NODE);
  const [pendingServices, setPendingServices] = useState(INITIAL_PENDING_SERVICES);
  const [duplicateAlerts, setDuplicateAlerts] = useState(AI_DUPLICATE_ALERTS);
  const [anomalyAlerts, setAnomalyAlerts] = useState(AI_ANOMALY_ALERTS);

  const lookupResults = useMemo(() => {
    const q = lookupQuery.trim();
    if (!q) return undefined;
    return searchMasterData(q);
  }, [lookupQuery]);

  const handleAdvanceApproval = useCallback((id: string) => {
    setPendingServices((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: advanceApprovalStatus(p.status) } : p)),
    );
  }, []);

  const handleMergeDuplicate = useCallback((id: string) => {
    setDuplicateAlerts((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'Merged' as const } : d)));
  }, []);

  const handleDismissDuplicate = useCallback((id: string) => {
    setDuplicateAlerts((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'Dismissed' as const } : d)));
  }, []);

  const handleResolveAnomaly = useCallback((id: string) => {
    setAnomalyAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'Resolved' as const } : a)));
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col overflow-hidden bg-[#F8FAFC]">
      <MasterDataModuleHeader lookupValue={lookupQuery} onLookupChange={setLookupQuery} resultCount={lookupResults} />

      <nav className="shrink-0 border-b border-[#E2E8F0] bg-white px-4" aria-label="Master data workspace tabs">
        <div className="flex gap-1 overflow-x-auto py-1">
          {MASTER_DATA_WORKSPACE_TABS.map((tab) => (
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
        {activeTab === 'foundation' && <DataQualityTab onQuickAction={(a) => setModal(a)} />}
        {activeTab === 'registries' && (
          <RegistriesMappingTab selectedNode={selectedNode} onSelectNode={setSelectedNode} />
        )}
        {activeTab === 'audit' && (
          <AuditAiTab
            pendingServices={pendingServices}
            duplicateAlerts={duplicateAlerts}
            anomalyAlerts={anomalyAlerts}
            onAdvanceApproval={handleAdvanceApproval}
            onMergeDuplicate={handleMergeDuplicate}
            onDismissDuplicate={handleDismissDuplicate}
            onResolveAnomaly={handleResolveAnomaly}
            onOpenMerger={() => setModal('auto-merger')}
          />
        )}
      </div>

      {modal === 'new-master-record' && <NewMasterRecordModal onClose={() => setModal(null)} />}
      {modal === 'duplicate-scan' && <DuplicateScanModal onClose={() => setModal(null)} />}
      {modal === 'audit-logs' && <AuditLogsModal onClose={() => setModal(null)} />}
      {modal === 'assign-permissions' && <AssignPermissionsModal onClose={() => setModal(null)} />}
      {modal === 'update-charge-master' && <UpdateChargeMasterModal onClose={() => setModal(null)} />}
      {modal === 'sync-submodules' && <SyncSubModulesModal onClose={() => setModal(null)} />}
      {modal === 'auto-merger' && (
        <AutoMergerModal
          onClose={() => setModal(null)}
          onConfirm={() => handleMergeDuplicate('dup-1')}
        />
      )}
    </div>
  );
}
