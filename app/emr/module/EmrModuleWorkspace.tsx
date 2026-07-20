'use client';

import { useCallback, useMemo, useState } from 'react';

import EmrModuleHeader from './components/EmrModuleHeader';
import {
  DownloadAuditedModal,
  ExportSummaryModal,
  PatientSummaryModal,
  PrintFullEmrModal,
  PrintRecordModal,
  ShareRecordModal,
  VerifyDocumentsModal,
} from './components/EmrModals';
import { AuditedBanner } from './components/emrUi';
import { DEFAULT_PATIENT, getRecordDetail, searchEmr } from './lib/emrMockData';
import type { EmrModalType, EmrWorkspaceTab } from './emrNav.types';
import { EMR_WORKSPACE_TABS } from './emrNav.types';
import CommandCenterTab from './views/CommandCenterTab';
import ComplianceAuditTab from './views/ComplianceAuditTab';
import DiscoveryVaultTab from './views/DiscoveryVaultTab';

export default function EmrModuleWorkspace() {
  const [activeTab, setActiveTab] = useState<EmrWorkspaceTab>('command');
  const [lookupQuery, setLookupQuery] = useState('');
  const [modal, setModal] = useState<EmrModalType>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['cat-clinical']));
  const [selectedRecordId, setSelectedRecordId] = useState('ch-1');
  const [expandedAuditIds, setExpandedAuditIds] = useState<Set<string>>(new Set());

  const patient = DEFAULT_PATIENT;
  const matchFound = useMemo(() => searchEmr(lookupQuery, patient), [lookupQuery, patient]);
  const recordDetail = useMemo(() => getRecordDetail(selectedRecordId), [selectedRecordId]);

  const handleToggleCategory = useCallback((id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleToggleAudit = useCallback((id: string) => {
    setExpandedAuditIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col overflow-hidden bg-[#F8FAFC]">
      <EmrModuleHeader
        lookupValue={lookupQuery}
        onLookupChange={setLookupQuery}
        matchFound={matchFound}
        patient={patient}
        onPrintFull={() => setModal('print-full')}
        onExportSummary={() => setModal('export-summary')}
      />

      <div className="shrink-0 px-3 pt-2">
        <AuditedBanner />
      </div>

      <nav className="shrink-0 border-b border-[#E2E8F0] bg-white px-4" aria-label="EMR workspace tabs">
        <div className="flex gap-1 overflow-x-auto py-1">
          {EMR_WORKSPACE_TABS.map((tab) => (
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
        {activeTab === 'command' && <CommandCenterTab onQuickAction={(a) => setModal(a)} />}
        {activeTab === 'discovery' && (
          <DiscoveryVaultTab
            expandedCategories={expandedCategories}
            selectedRecordId={selectedRecordId}
            recordDetail={recordDetail}
            onToggleCategory={handleToggleCategory}
            onSelectRecord={setSelectedRecordId}
          />
        )}
        {activeTab === 'compliance' && (
          <ComplianceAuditTab expandedAuditIds={expandedAuditIds} onToggleAudit={handleToggleAudit} />
        )}
      </div>

      {modal === 'print-full' && <PrintFullEmrModal onClose={() => setModal(null)} patient={patient} />}
      {modal === 'export-summary' && <ExportSummaryModal onClose={() => setModal(null)} patient={patient} />}
      {modal === 'print-record' && <PrintRecordModal onClose={() => setModal(null)} />}
      {modal === 'download-audited' && <DownloadAuditedModal onClose={() => setModal(null)} />}
      {modal === 'share-record' && <ShareRecordModal onClose={() => setModal(null)} />}
      {modal === 'verify-documents' && <VerifyDocumentsModal onClose={() => setModal(null)} />}
      {modal === 'patient-summary' && <PatientSummaryModal onClose={() => setModal(null)} patient={patient} />}
    </div>
  );
}
