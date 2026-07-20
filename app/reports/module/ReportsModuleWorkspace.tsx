'use client';

import { useCallback, useMemo, useState } from 'react';

import ReportsModuleHeader from './components/ReportsModuleHeader';
import {
  AiForecastModal,
  CustomReportBuilderModal,
  ExportDashboardModal,
  ReportAccessSecurityModal,
  ScheduleReportModal,
} from './components/ReportsModals';
import { INITIAL_AI_INSIGHTS, searchReports } from './lib/reportsMockData';
import type { AiReportInsightStatus, AnalyticsTreeNodeId, ReportsModalType, ReportsWorkspaceTab } from './reportsNav.types';
import { DEFAULT_ANALYTICS_NODE, REPORTS_WORKSPACE_TABS } from './reportsNav.types';
import ExecutiveCommandTab from './views/ExecutiveCommandTab';
import FinanceAiTab from './views/FinanceAiTab';
import OperationalIntelligenceTab from './views/OperationalIntelligenceTab';

export default function ReportsModuleWorkspace() {
  const [activeTab, setActiveTab] = useState<ReportsWorkspaceTab>('executive');
  const [lookupQuery, setLookupQuery] = useState('');
  const [modal, setModal] = useState<ReportsModalType>(null);
  const [selectedNode, setSelectedNode] = useState<AnalyticsTreeNodeId>(DEFAULT_ANALYTICS_NODE);
  const [aiInsights, setAiInsights] = useState(INITIAL_AI_INSIGHTS);

  const lookupResults = useMemo(() => {
    const q = lookupQuery.trim();
    if (!q) return undefined;
    return searchReports(q);
  }, [lookupQuery]);

  const handleUpdateAiStatus = useCallback((id: string, status: AiReportInsightStatus) => {
    setAiInsights((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col overflow-hidden bg-[#F8FAFC]">
      <ReportsModuleHeader lookupValue={lookupQuery} onLookupChange={setLookupQuery} resultCount={lookupResults} />

      <nav className="shrink-0 border-b border-[#E2E8F0] bg-white px-4" aria-label="Reports workspace tabs">
        <div className="flex gap-1 overflow-x-auto py-1">
          {REPORTS_WORKSPACE_TABS.map((tab) => (
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
        {activeTab === 'executive' && <ExecutiveCommandTab onQuickAction={(a) => setModal(a)} />}
        {activeTab === 'operational' && (
          <OperationalIntelligenceTab selectedNode={selectedNode} onSelectNode={setSelectedNode} />
        )}
        {activeTab === 'finance' && (
          <FinanceAiTab aiInsights={aiInsights} onUpdateAiStatus={handleUpdateAiStatus} />
        )}
      </div>

      {modal === 'custom-report-builder' && <CustomReportBuilderModal onClose={() => setModal(null)} />}
      {modal === 'export-dashboard' && <ExportDashboardModal onClose={() => setModal(null)} />}
      {modal === 'schedule-report' && <ScheduleReportModal onClose={() => setModal(null)} />}
      {modal === 'ai-forecast' && <AiForecastModal onClose={() => setModal(null)} />}
      {modal === 'report-access-security' && <ReportAccessSecurityModal onClose={() => setModal(null)} />}
    </div>
  );
}
