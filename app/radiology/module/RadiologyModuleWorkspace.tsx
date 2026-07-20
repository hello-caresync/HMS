'use client';

import { useCallback, useMemo, useState } from 'react';

import RadiologyModuleHeader from './components/RadiologyModuleHeader';
import {
  AssignTechnicianModal,
  CheckInPatientModal,
  ReleaseReportModal,
  ScheduleScanModal,
  UploadImagesModal,
  VerifyReportModal,
} from './components/RadiologyModals';
import type { ImagingOrder } from './lib/radiologyMockData';
import {
  INITIAL_IMAGING_ORDERS,
  INITIAL_REPORTS,
  advanceReportStage,
  advanceScanStatus,
  searchRadiology,
} from './lib/radiologyMockData';
import type { RadiologyModalType, RadiologyWorkspaceTab, ScanPipelineStatus } from './radiologyNav.types';
import { RADIOLOGY_WORKSPACE_TABS } from './radiologyNav.types';
import CommandCenterTab from './views/CommandCenterTab';
import PacsSafetyTab from './views/PacsSafetyTab';
import VerificationEquipmentTab from './views/VerificationEquipmentTab';

function mapReadinessForStatus(status: ScanPipelineStatus): ImagingOrder['readiness'] {
  switch (status) {
    case 'Scheduled':
      return 'Not Ready';
    case 'Waiting':
      return 'Checked In';
    case 'Scan In Progress':
      return 'In Scanner';
    case 'Completed':
    case 'Pending Report':
      return 'Prepared';
    case 'Report Released':
      return 'Prepared';
    default:
      return 'Checked In';
  }
}

export default function RadiologyModuleWorkspace() {
  const [activeTab, setActiveTab] = useState<RadiologyWorkspaceTab>('command');
  const [lookupQuery, setLookupQuery] = useState('');
  const [modal, setModal] = useState<RadiologyModalType>(null);
  const [orders, setOrders] = useState(INITIAL_IMAGING_ORDERS);
  const [reports, setReports] = useState(INITIAL_REPORTS);

  const lookupResults = useMemo(() => {
    const q = lookupQuery.trim();
    if (!q) return undefined;
    return searchRadiology(q, orders);
  }, [lookupQuery, orders]);

  const handleAdvancePipeline = useCallback((id: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        const next = advanceScanStatus(o.pipelineStatus);
        return {
          ...o,
          pipelineStatus: next,
          readiness: mapReadinessForStatus(next),
        };
      }),
    );
  }, []);

  const handleAdvanceReport = useCallback((id: string) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, stage: advanceReportStage(r.stage) } : r)),
    );
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col overflow-hidden bg-[#F8FAFC]">
      <RadiologyModuleHeader lookupValue={lookupQuery} onLookupChange={setLookupQuery} resultCount={lookupResults} />

      <nav className="shrink-0 border-b border-[#E2E8F0] bg-white px-4" aria-label="Radiology workspace tabs">
        <div className="flex gap-1 overflow-x-auto py-1">
          {RADIOLOGY_WORKSPACE_TABS.map((tab) => (
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
            onQuickAction={(a) => setModal(a)}
          />
        )}
        {activeTab === 'pacs' && <PacsSafetyTab />}
        {activeTab === 'verification' && (
          <VerificationEquipmentTab reports={reports} onAdvanceReport={handleAdvanceReport} />
        )}
      </div>

      {modal === 'schedule-scan' && <ScheduleScanModal onClose={() => setModal(null)} />}
      {modal === 'check-in' && <CheckInPatientModal onClose={() => setModal(null)} />}
      {modal === 'assign-tech' && <AssignTechnicianModal onClose={() => setModal(null)} />}
      {modal === 'upload-images' && <UploadImagesModal onClose={() => setModal(null)} />}
      {modal === 'verify-report' && <VerifyReportModal onClose={() => setModal(null)} />}
      {modal === 'release-report' && <ReleaseReportModal onClose={() => setModal(null)} />}
    </div>
  );
}
