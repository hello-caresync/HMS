'use client';

import { useCallback, useMemo, useState } from 'react';

import IpdModuleHeader from './components/IpdModuleHeader';
import {
  AllocateBedModal,
  AssignNurseModal,
  InitiateDischargeModal,
  PrintWristbandModal,
  ScheduleRoundModal,
  TransferPatientModal,
  ViewInpatientModal,
} from './components/IpdModals';
import {
  advanceClearanceStatus,
  advanceMovementStatus,
  INITIAL_DISCHARGE_CLEARANCE,
  INITIAL_MOVEMENTS,
  isBedReleaseReady,
  MOCK_INPATIENTS,
  searchInpatients,
} from './lib/ipdMockData';
import type { DirectoryGroupBy, IpdModalType, IpdWorkspaceTab } from './ipdNav.types';
import { IPD_WORKSPACE_TABS } from './ipdNav.types';
import DischargeFinanceTab from './views/DischargeFinanceTab';
import OperationalConsoleTab from './views/OperationalConsoleTab';
import WardCapacityTab from './views/WardCapacityTab';

export default function IpdModuleWorkspace() {
  const [activeTab, setActiveTab] = useState<IpdWorkspaceTab>('console');
  const [lookupQuery, setLookupQuery] = useState('');
  const [modal, setModal] = useState<IpdModalType>(null);
  const [groupBy, setGroupBy] = useState<DirectoryGroupBy>('ward');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(MOCK_INPATIENTS[0]?.id ?? null);
  const [movements, setMovements] = useState(INITIAL_MOVEMENTS);
  const [clearances, setClearances] = useState(INITIAL_DISCHARGE_CLEARANCE);

  const selectedPatient = useMemo(
    () => MOCK_INPATIENTS.find((p) => p.id === selectedPatientId) ?? null,
    [selectedPatientId],
  );

  const lookupResults = useMemo(() => {
    const q = lookupQuery.trim();
    if (!q) return undefined;
    return searchInpatients(q, MOCK_INPATIENTS);
  }, [lookupQuery]);

  const handleAdvanceMovement = useCallback((id: string) => {
    setMovements((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: advanceMovementStatus(m.status) } : m)),
    );
  }, []);

  const handleAdvanceClearanceStep = useCallback((clearanceId: string, stepIndex: number) => {
    setClearances((prev) =>
      prev.map((dc) => {
        if (dc.id !== clearanceId) return dc;
        const steps = dc.steps.map((step, idx) => {
          if (idx !== stepIndex || step.status === 'Blocked') return step;
          return { ...step, status: advanceClearanceStatus(step.status) };
        });
        return { ...dc, steps, bedReleaseReady: isBedReleaseReady(steps) };
      }),
    );
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col overflow-hidden bg-[#F8FAFC]">
      <IpdModuleHeader
        lookupValue={lookupQuery}
        onLookupChange={setLookupQuery}
        resultCount={lookupResults}
        selectedPatient={selectedPatient?.patientName}
        onViewInpatient={() => setModal('view-inpatient')}
      />

      <nav className="shrink-0 border-b border-[#E2E8F0] bg-white px-4" aria-label="IPD workspace tabs">
        <div className="flex gap-1 overflow-x-auto py-1.5">
          {IPD_WORKSPACE_TABS.map((tab) => (
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
        {activeTab === 'console' && (
          <OperationalConsoleTab
            lookupQuery={lookupQuery}
            groupBy={groupBy}
            onGroupByChange={setGroupBy}
            inpatients={MOCK_INPATIENTS}
            selectedPatientId={selectedPatientId}
            onSelectPatient={setSelectedPatientId}
            onQuickAction={(a) => setModal(a)}
          />
        )}
        {activeTab === 'ward' && (
          <WardCapacityTab movements={movements} onAdvanceMovement={handleAdvanceMovement} />
        )}
        {activeTab === 'discharge' && (
          <DischargeFinanceTab clearances={clearances} onAdvanceClearanceStep={handleAdvanceClearanceStep} />
        )}
      </div>

      {modal === 'view-inpatient' && <ViewInpatientModal onClose={() => setModal(null)} patient={selectedPatient} />}
      {modal === 'allocate-bed' && <AllocateBedModal onClose={() => setModal(null)} patient={selectedPatient} />}
      {modal === 'transfer-patient' && <TransferPatientModal onClose={() => setModal(null)} patient={selectedPatient} />}
      {modal === 'assign-nurse' && <AssignNurseModal onClose={() => setModal(null)} patient={selectedPatient} />}
      {modal === 'schedule-round' && <ScheduleRoundModal onClose={() => setModal(null)} patient={selectedPatient} />}
      {modal === 'initiate-discharge' && <InitiateDischargeModal onClose={() => setModal(null)} patient={selectedPatient} />}
      {modal === 'print-wristband' && <PrintWristbandModal onClose={() => setModal(null)} patient={selectedPatient} />}
    </div>
  );
}
