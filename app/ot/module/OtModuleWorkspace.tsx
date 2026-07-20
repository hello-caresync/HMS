'use client';

import { useCallback, useMemo, useState } from 'react';

import OtModuleHeader from './components/OtModuleHeader';
import {
  AssignOtRoomModal,
  AssignTeamModal,
  PrintScheduleModal,
  RequestBloodModal,
  ScheduleSurgeryModal,
  VerifyChecklistModal,
} from './components/OtModals';
import { INITIAL_SURGERIES, advanceTimelineStep, searchSurgeries } from './lib/otMockData';
import type { OtModalType, OtWorkspaceTab } from './otNav.types';
import { OT_WORKSPACE_TABS } from './otNav.types';
import PostOpAnalyticsTab from './views/PostOpAnalyticsTab';
import ResourceAllocationTab from './views/ResourceAllocationTab';
import SurgicalCommandTab from './views/SurgicalCommandTab';

export default function OtModuleWorkspace() {
  const [activeTab, setActiveTab] = useState<OtWorkspaceTab>('command');
  const [lookupQuery, setLookupQuery] = useState('');
  const [modal, setModal] = useState<OtModalType>(null);
  const [surgeries, setSurgeries] = useState(INITIAL_SURGERIES);

  const lookupResults = useMemo(() => {
    const q = lookupQuery.trim();
    if (!q) return undefined;
    return searchSurgeries(q, surgeries);
  }, [lookupQuery, surgeries]);

  const handleAdvanceTimeline = useCallback((id: string) => {
    setSurgeries((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        return { ...s, timelineStep: advanceTimelineStep(s.timelineStep) };
      }),
    );
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col overflow-hidden bg-[#F8FAFC]">
      <OtModuleHeader
        lookupValue={lookupQuery}
        onLookupChange={setLookupQuery}
        resultCount={lookupResults}
        onScheduleClick={() => setModal('schedule-surgery')}
      />

      <nav className="shrink-0 border-b border-[#E2E8F0] bg-white px-4" aria-label="OT workspace tabs">
        <div className="flex gap-1 overflow-x-auto py-1">
          {OT_WORKSPACE_TABS.map((tab) => (
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
          <SurgicalCommandTab
            lookupQuery={lookupQuery}
            surgeries={surgeries}
            onAdvanceTimeline={handleAdvanceTimeline}
            onQuickAction={(a) => setModal(a)}
          />
        )}
        {activeTab === 'resources' && <ResourceAllocationTab />}
        {activeTab === 'postop' && <PostOpAnalyticsTab />}
      </div>

      {modal === 'schedule-surgery' && <ScheduleSurgeryModal onClose={() => setModal(null)} />}
      {modal === 'assign-room' && <AssignOtRoomModal onClose={() => setModal(null)} />}
      {modal === 'assign-team' && <AssignTeamModal onClose={() => setModal(null)} />}
      {modal === 'verify-checklist' && <VerifyChecklistModal onClose={() => setModal(null)} />}
      {modal === 'request-blood' && <RequestBloodModal onClose={() => setModal(null)} />}
      {modal === 'print-schedule' && <PrintScheduleModal onClose={() => setModal(null)} />}
    </div>
  );
}
