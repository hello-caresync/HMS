'use client';

import { useState } from 'react';
import { Activity, AlertOctagon, Brain, Clock, TrendingUp } from 'lucide-react';

import { DataTable, KpiGrid, Panel, SearchDesk, TabBar, ViewHeader } from './_viewUi';

type AiTab = 'diagnosis' | 'los' | 'risk';

export default function AiDecisionSupportView() {
  const [tab, setTab] = useState<AiTab>('diagnosis');
  const [search, setSearch] = useState('');

  return (
    <div className="space-y-6">
      <ViewHeader
        title="AI Clinical Decision Support"
        subtitle="Diagnosis suggestions, length-of-stay prediction, sepsis and early warning risk parameters."
        icon={Brain}
      />
      <KpiGrid
        items={[
          { label: 'Active Suggestions', value: '18', icon: Brain, tone: 'cyan' },
          { label: 'High LOS Risk', value: '5', icon: Clock, tone: 'amber' },
          { label: 'Sepsis Alerts', value: '2', icon: AlertOctagon, tone: 'rose' },
          { label: 'Model Confidence', value: '91%', icon: TrendingUp, tone: 'emerald' },
        ]}
      />
      <SearchDesk value={search} onChange={setSearch} placeholder="Search patient UHID for AI insights..." />
      <TabBar
        tabs={[
          { id: 'diagnosis', label: 'Diagnosis Feed' },
          { id: 'los', label: 'LOS Prediction' },
          { id: 'risk', label: 'Risk Early Warning' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === 'diagnosis' && (
        <Panel title="AI Clinical Diagnosis Suggestions Feed">
          <DataTable
            columns={['Patient', 'Presentation', 'Suggestion', 'Confidence']}
            rows={[
              ['UHID-8821', 'Fever + cough 5d', 'Community pneumonia', '87%'],
              ['UHID-8824', 'Chest pain radiating', 'ACS rule-out', '92%'],
            ]}
          />
        </Panel>
      )}
      {tab === 'los' && (
        <Panel title="Patient Length-of-Stay Prediction Matrix">
          <DataTable
            columns={['Patient', 'Ward', 'Predicted LOS', 'Risk']}
            rows={[
              ['UHID-8810', 'ICU-A', '6.2 days', 'High'],
              ['UHID-8812', 'Gen-3', '2.1 days', 'Low'],
            ]}
          />
        </Panel>
      )}
      {tab === 'risk' && (
        <Panel title="Smart Risk Early Warning (Sepsis Markers)">
          <DataTable
            columns={['Patient', 'qSOFA', 'Lactate', 'Alert']}
            rows={[
              ['UHID-8801', '2', '2.8 mmol/L', 'Critical'],
              ['UHID-8805', '1', '1.2 mmol/L', 'Watch'],
            ]}
          />
          <Activity className="mt-3 h-4 w-4 text-rose-400" />
        </Panel>
      )}
    </div>
  );
}
