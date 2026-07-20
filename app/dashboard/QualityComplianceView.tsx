'use client';

import { useState } from 'react';
import { ClipboardCheck, Heart, ShieldAlert, ShieldCheck, Star } from 'lucide-react';

import { DataTable, KpiGrid, Panel, SearchDesk, TabBar, ViewHeader } from './_viewUi';

type QualityTab = 'incidents' | 'infection' | 'audit' | 'satisfaction';

export default function QualityComplianceView() {
  const [tab, setTab] = useState<QualityTab>('incidents');
  const [search, setSearch] = useState('');

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Quality & Compliance"
        subtitle="Incident reporting, infection control, NABH/JCI audits, patient satisfaction matrix."
        icon={ShieldCheck}
      />
      <KpiGrid
        items={[
          { label: 'Open Incidents', value: '6', icon: ClipboardCheck, tone: 'rose' },
          { label: 'HAI Rate', value: '0.8%', icon: ShieldAlert, tone: 'amber' },
          { label: 'Audit Score', value: '94%', icon: ShieldCheck, tone: 'emerald' },
          { label: 'CSAT Index', value: '4.6/5', icon: Star, tone: 'cyan' },
        ]}
      />
      <SearchDesk value={search} onChange={setSearch} placeholder="Search quality records..." />
      <TabBar
        tabs={[
          { id: 'incidents', label: 'Incidents' },
          { id: 'infection', label: 'Infection Control' },
          { id: 'audit', label: 'NABH / JCI' },
          { id: 'satisfaction', label: 'Patient CSAT' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === 'incidents' && (
        <Panel title="Hospital Incident Reporting">
          <DataTable
            columns={['IR', 'Category', 'Severity', 'Status']}
            rows={[
              ['IR-881', 'Medication', 'Medium', 'Investigating'],
              ['IR-882', 'Patient Fall', 'Low', 'Closed'],
            ]}
          />
        </Panel>
      )}
      {tab === 'infection' && (
        <Panel title="Infection Control Metrics Tracker">
          <DataTable
            columns={['Unit', 'Metric', 'Value']}
            rows={[
              ['ICU-A', 'CLABSI rate', '0.5/1000'],
              ['Gen Ward', 'Hand hygiene compliance', '92%'],
            ]}
          />
        </Panel>
      )}
      {tab === 'audit' && (
        <Panel title="NABH / JCI Audit Checklists">
          <DataTable
            columns={['Standard', 'Items', 'Complete']}
            rows={[
              ['AAC.1 Access Control', '24', '22'],
              ['COP.2 Patient Rights', '18', '18'],
            ]}
          />
        </Panel>
      )}
      {tab === 'satisfaction' && (
        <Panel title="Patient Satisfaction Rating Matrix">
          <DataTable
            columns={['Department', 'Score', 'Responses']}
            rows={[
              ['OPD', '4.7', '412'],
              ['Emergency', '4.2', '88'],
            ]}
          />
          <Heart className="mt-3 h-4 w-4 text-rose-400" />
        </Panel>
      )}
    </div>
  );
}
