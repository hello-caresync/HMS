'use client';

import { useCallback, useMemo, useState } from 'react';

import { AssetDetailDrawer } from './components/AssetDetailDrawer';
import AssetModuleHeader from './components/AssetModuleHeader';
import {
  AllocateSparePartsModal,
  AssignAssetModal,
  LogBreakdownModal,
  PrintTagLabelsModal,
  RegisterAssetModal,
  RenewAmcModal,
  ScheduleAuditModal,
} from './components/AssetModals';
import {
  INITIAL_AI_INSIGHTS,
  INITIAL_ASSET_LOCATIONS,
  INITIAL_ASSET_MASTER,
  INITIAL_ASSET_REQUESTS,
  INITIAL_BREAKDOWN_TICKETS,
  searchAssets,
} from './lib/assetMockData';
import type { AssetMasterRecord } from './lib/assetMockData';
import type { AiAssetInsightStatus, AssetModalType, AssetWorkspaceTab } from './assetNav.types';
import {
  ASSET_WORKSPACE_TABS,
  advanceBreakdownTicket,
  advanceRequestStage,
  cycleAssetStatus,
} from './assetNav.types';
import FinancialAiTab from './views/FinancialAiTab';
import MaintenanceCalibrationTab from './views/MaintenanceCalibrationTab';
import OperationalCockpitTab from './views/OperationalCockpitTab';

export default function AssetModuleWorkspace() {
  const [activeTab, setActiveTab] = useState<AssetWorkspaceTab>('cockpit');
  const [lookupQuery, setLookupQuery] = useState('');
  const [modal, setModal] = useState<AssetModalType>(null);
  const [requests, setRequests] = useState(INITIAL_ASSET_REQUESTS);
  const [locations, setLocations] = useState(INITIAL_ASSET_LOCATIONS);
  const [assets, setAssets] = useState(INITIAL_ASSET_MASTER);
  const [breakdownTickets, setBreakdownTickets] = useState(INITIAL_BREAKDOWN_TICKETS);
  const [aiInsights, setAiInsights] = useState(INITIAL_AI_INSIGHTS);
  const [drawerAsset, setDrawerAsset] = useState<AssetMasterRecord | null>(null);

  const lookupResults = useMemo(() => {
    const q = lookupQuery.trim();
    if (!q) return undefined;
    return searchAssets(q);
  }, [lookupQuery]);

  const handleAdvanceRequest = useCallback((id: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, stage: advanceRequestStage(r.stage) } : r)),
    );
  }, []);

  const handleCycleLocationStatus = useCallback((id: string) => {
    setLocations((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: cycleAssetStatus(l.status) } : l)),
    );
  }, []);

  const handleCycleAssetStatus = useCallback((id: string) => {
    setAssets((prev) => {
      const asset = prev.find((a) => a.id === id);
      if (!asset) return prev;
      const next = cycleAssetStatus(asset.status);
      setLocations((locs) =>
        locs.map((l) => (l.assetTag === asset.assetTag ? { ...l, status: next } : l)),
      );
      return prev.map((a) => (a.id === id ? { ...a, status: next } : a));
    });
  }, []);

  const handleAdvanceBreakdown = useCallback((id: string) => {
    setBreakdownTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: advanceBreakdownTicket(t.status) } : t)),
    );
  }, []);

  const handleUpdateAiStatus = useCallback((id: string, status: AiAssetInsightStatus) => {
    setAiInsights((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
  }, []);

  const openAssetByTag = useCallback(
    (assetTag: string) => {
      const asset = assets.find((a) => a.assetTag === assetTag);
      if (asset) setDrawerAsset(asset);
    },
    [assets],
  );

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col overflow-hidden bg-[#F8FAFC]">
      <AssetModuleHeader lookupValue={lookupQuery} onLookupChange={setLookupQuery} resultCount={lookupResults} />

      <nav className="shrink-0 border-b border-[#E2E8F0] bg-white px-4" aria-label="Asset workspace tabs">
        <div className="flex gap-1 overflow-x-auto py-1">
          {ASSET_WORKSPACE_TABS.map((tab) => (
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
        {activeTab === 'cockpit' && (
          <OperationalCockpitTab
            lookupQuery={lookupQuery}
            requests={requests}
            locations={locations}
            onAdvanceRequest={handleAdvanceRequest}
            onCycleLocationStatus={handleCycleLocationStatus}
            onOpenAssetDetail={openAssetByTag}
            onQuickAction={(a) => setModal(a)}
          />
        )}
        {activeTab === 'maintenance' && (
          <MaintenanceCalibrationTab
            assets={assets}
            breakdownTickets={breakdownTickets}
            onCycleAssetStatus={handleCycleAssetStatus}
            onAdvanceBreakdown={handleAdvanceBreakdown}
            onOpenAssetDetail={setDrawerAsset}
          />
        )}
        {activeTab === 'financial' && (
          <FinancialAiTab aiInsights={aiInsights} onUpdateAiStatus={handleUpdateAiStatus} />
        )}
      </div>

      {modal === 'register-asset' && <RegisterAssetModal onClose={() => setModal(null)} />}
      {modal === 'assign-asset' && <AssignAssetModal onClose={() => setModal(null)} />}
      {modal === 'log-breakdown' && <LogBreakdownModal onClose={() => setModal(null)} />}
      {modal === 'allocate-spare-parts' && <AllocateSparePartsModal onClose={() => setModal(null)} />}
      {modal === 'renew-amc' && <RenewAmcModal onClose={() => setModal(null)} />}
      {modal === 'print-tag-labels' && <PrintTagLabelsModal onClose={() => setModal(null)} />}
      {modal === 'schedule-audit' && <ScheduleAuditModal onClose={() => setModal(null)} />}

      {drawerAsset && <AssetDetailDrawer asset={drawerAsset} onClose={() => setDrawerAsset(null)} />}
    </div>
  );
}
