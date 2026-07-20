'use client';

import { useState } from 'react';
import { Binary, Monitor, ScanLine, Server, Stethoscope } from 'lucide-react';

import { DataTable, KpiGrid, Panel, SearchDesk, TabBar, ViewHeader } from './_viewUi';

type RadTab = 'schedule' | 'pacs' | 'modality' | 'report' | 'icd';

export default function RadiologyView() {
  const [tab, setTab] = useState<RadTab>('schedule');
  const [search, setSearch] = useState('');
  const [modality, setModality] = useState('All');
  const [reportText, setReportText] = useState('No acute cardiopulmonary abnormality.');

  const modalities = ['All', 'X-Ray', 'CT', 'MRI', 'Ultrasound'];

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Radiology (RIS/PACS)"
        subtitle="Imaging schedule desk, PACS status, modality filters, reporting, and ICD mapping."
        icon={Binary}
      />
      <KpiGrid
        items={[
          { label: 'Scans Scheduled', value: '64', icon: ScanLine, tone: 'cyan' },
          { label: 'PACS Nodes', value: 'Live', icon: Server, tone: 'emerald' },
          { label: 'Reports Pending', value: '11', icon: Stethoscope, tone: 'amber' },
          { label: 'Modalities Online', value: '5', icon: Monitor, tone: 'indigo' },
        ]}
      />
      <SearchDesk value={search} onChange={setSearch} placeholder="Search imaging worklist..." />
      <TabBar
        tabs={[
          { id: 'schedule', label: 'Schedule Desk' },
          { id: 'pacs', label: 'PACS Console' },
          { id: 'modality', label: 'Modality Filters' },
          { id: 'report', label: 'Reporting' },
          { id: 'icd', label: 'ICD Mapping' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === 'schedule' && (
        <Panel title="RIS Imaging Schedule Desk">
          <DataTable
            columns={['Accession', 'Patient', 'Study', 'Slot']}
            rows={[
              ['RAD-7781', 'Rahul Sharma', 'Chest X-Ray', '09:30'],
              ['RAD-7782', 'Meera K.', 'MRI Brain', '11:00'],
            ]}
          />
        </Panel>
      )}
      {tab === 'pacs' && (
        <Panel title="PACS Server Link Status Console">
          <DataTable
            columns={['Node', 'Latency', 'Status']}
            rows={[
              ['PACS-CORE-01', '12ms', 'Online'],
              ['PACS-EDGE-02', '28ms', 'Online'],
              ['ARCHIVE-01', '45ms', 'Degraded'],
            ]}
          />
        </Panel>
      )}
      {tab === 'modality' && (
        <Panel title="Modality Filters">
          <div className="mb-3 flex flex-wrap gap-2">
            {modalities.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setModality(item)}
                className={`rounded-md px-3 py-1 text-[11px] font-semibold ${
                  modality === item ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400">Showing worklist for: {modality}</p>
        </Panel>
      )}
      {tab === 'report' && (
        <Panel title="Radiologist Structural Reporting">
          <textarea
            value={reportText}
            onChange={(event) => setReportText(event.target.value)}
            rows={4}
            className="w-full rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-200"
          />
        </Panel>
      )}
      {tab === 'icd' && (
        <Panel title="ICD Diagnostic Mapping Integration">
          <DataTable
            columns={['Finding', 'ICD-10']}
            rows={[
              ['Essential hypertension', 'I10'],
              ['Type 2 diabetes mellitus', 'E11.9'],
            ]}
          />
        </Panel>
      )}
    </div>
  );
}
