'use client';

import { useCallback, useMemo, useState } from 'react';

import EmergencyModuleHeader from './components/EmergencyModuleHeader';
import {
  ActivateCodeBlueModal,
  AllocateErBedModal,
  AssignDoctorModal,
  DispatchAmbulanceModal,
  RegisterEmergencyModal,
  StartTriageModal,
} from './components/EmergencyModals';
import {
  bumpTriagePriority,
  INITIAL_ER_BEDS,
  INITIAL_TRIAGE_STREAM,
  searchEmergency,
} from './lib/emergencyMockData';
import type { EmergencyModalType, EmergencyWorkspaceTab } from './emergencyNav.types';
import { EMERGENCY_WORKSPACE_TABS } from './emergencyNav.types';
import CommandCenterTab from './views/CommandCenterTab';
import DispositionTab from './views/DispositionTab';
import LogisticsTab from './views/LogisticsTab';

export default function EmergencyModuleWorkspace() {
  const [activeTab, setActiveTab] = useState<EmergencyWorkspaceTab>('command');
  const [lookupQuery, setLookupQuery] = useState('');
  const [modal, setModal] = useState<EmergencyModalType>(null);
  const [triageStream, setTriageStream] = useState(INITIAL_TRIAGE_STREAM);
  const [erBeds] = useState(INITIAL_ER_BEDS);
  const [codeBlueActive, setCodeBlueActive] = useState(true);

  const lookupResults = useMemo(() => {
    const q = lookupQuery.trim();
    if (!q) return undefined;
    return searchEmergency(q, triageStream);
  }, [lookupQuery, triageStream]);

  const handleBumpTriage = useCallback((id: string) => {
    setTriageStream((prev) =>
      prev.map((t) => (t.id === id ? { ...t, priority: bumpTriagePriority(t.priority) } : t)),
    );
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col overflow-hidden bg-[#F8FAFC]">
      <EmergencyModuleHeader
        lookupValue={lookupQuery}
        onLookupChange={setLookupQuery}
        resultCount={lookupResults}
        codeBlueActive={codeBlueActive}
        onRegisterClick={() => setModal('register-patient')}
      />

      <nav className="shrink-0 border-b border-[#E2E8F0] bg-white px-4" aria-label="Emergency workspace tabs">
        <div className="flex gap-1 overflow-x-auto py-1">
          {EMERGENCY_WORKSPACE_TABS.map((tab) => (
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
            triageStream={triageStream}
            erBeds={erBeds}
            codeBlueActive={codeBlueActive}
            onBumpTriage={handleBumpTriage}
            onQuickAction={(a) => setModal(a)}
          />
        )}
        {activeTab === 'logistics' && <LogisticsTab />}
        {activeTab === 'disposition' && <DispositionTab />}
      </div>

      {modal === 'register-patient' && <RegisterEmergencyModal onClose={() => setModal(null)} />}
      {modal === 'start-triage' && <StartTriageModal onClose={() => setModal(null)} />}
      {modal === 'assign-doctor' && <AssignDoctorModal onClose={() => setModal(null)} />}
      {modal === 'allocate-er-bed' && <AllocateErBedModal onClose={() => setModal(null)} />}
      {modal === 'dispatch-ambulance' && <DispatchAmbulanceModal onClose={() => setModal(null)} />}
      {modal === 'activate-code-blue' && (
        <ActivateCodeBlueModal onClose={() => setModal(null)} onConfirm={() => setCodeBlueActive(true)} />
      )}
    </div>
  );
}
