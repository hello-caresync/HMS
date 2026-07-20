'use client';

import { useState } from 'react';
import { Activity, FileText, FolderHeart, Search, Stethoscope, TestTube } from 'lucide-react';

import { DataTable, KpiGrid, Panel, SearchDesk, TabBar, ViewHeader } from './_viewUi';

type EmrTab = 'vault' | 'timeline' | 'chronic' | 'reports' | 'vitals';

export default function EmrView() {
  const [tab, setTab] = useState<EmrTab>('vault');
  const [uhidQuery, setUhidQuery] = useState('NX-2026-000412');
  const [search, setSearch] = useState('');

  const encounters = [
    { date: '2026-07-14', type: 'OPD Consult', provider: 'Dr. Rao', summary: 'Hypertension review' },
    { date: '2026-06-02', type: 'IPD Admission', provider: 'Dr. Menon', summary: 'Chest pain workup' },
    { date: '2026-04-18', type: 'Lab Panel', provider: 'LIS Auto', summary: 'HbA1c 7.1%' },
  ].filter((row) => row.summary.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <ViewHeader
        title="EMR Vault"
        subtitle="UHID search vault, encounter timeline, chronic registries, and longitudinal vitals."
        icon={FolderHeart}
      />
      <KpiGrid
        items={[
          { label: 'Indexed Charts', value: '12,842', icon: FileText, tone: 'cyan' },
          { label: 'Encounters Today', value: '186', icon: Stethoscope, tone: 'indigo' },
          { label: 'Chronic Registry', value: '2,410', icon: Activity, tone: 'amber' },
          { label: 'Reports Linked', value: '8,902', icon: TestTube, tone: 'emerald' },
        ]}
      />
      <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-[#1e293b] p-4 sm:flex-row sm:items-center">
        <Search className="h-4 w-4 text-cyan-400" />
        <input
          value={uhidQuery}
          onChange={(event) => setUhidQuery(event.target.value)}
          placeholder="Master EMR search by UHID..."
          className="flex-1 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
        />
        <span className="font-mono text-[10px] text-cyan-400">Vault index: {uhidQuery}</span>
      </div>
      <SearchDesk value={search} onChange={setSearch} placeholder="Filter timeline and reports..." />
      <TabBar
        tabs={[
          { id: 'vault', label: 'Search Vault' },
          { id: 'timeline', label: 'Encounter Timeline' },
          { id: 'chronic', label: 'Chronic Illness' },
          { id: 'reports', label: 'Lab / Rad Grid' },
          { id: 'vitals', label: 'Vitals Trajectory' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === 'vault' && (
        <Panel title="Master EMR Search Vault">
          <p className="text-xs text-slate-400">
            Active record: Rahul Sharma — {uhidQuery} — Type-2 DM, HTN, Penicillin allergy.
          </p>
        </Panel>
      )}
      {tab === 'timeline' && (
        <Panel title="Historical Encounter Timeline">
          <DataTable
            columns={['Date', 'Type', 'Provider', 'Summary']}
            rows={encounters.map((row) => [row.date, row.type, row.provider, row.summary])}
          />
        </Panel>
      )}
      {tab === 'chronic' && (
        <Panel title="Chronic Illness Registries">
          <DataTable
            columns={['Condition', 'Patients', 'Control Rate']}
            rows={[
              ['Type-2 Diabetes', '842', '68%'],
              ['Hypertension', '1,204', '72%'],
              ['COPD', '318', '61%'],
            ]}
          />
        </Panel>
      )}
      {tab === 'reports' && (
        <Panel title="Past Lab / Radiology Report Grid">
          <DataTable
            columns={['Report', 'Date', 'Status']}
            rows={[
              ['CBC Panel', '2026-07-10', 'Final'],
              ['Chest X-Ray PA', '2026-06-28', 'Signed'],
              ['Lipid Profile', '2026-05-14', 'Final'],
            ]}
          />
        </Panel>
      )}
      {tab === 'vitals' && (
        <Panel title="Longitudinal Vitals Trajectory">
          <DataTable
            columns={['Metric', 'Latest', 'Trend']}
            rows={[
              ['BP', '128/82', 'Improving'],
              ['HR', '78 bpm', 'Stable'],
              ['SpO2', '97%', 'Stable'],
              ['Weight', '74.2 kg', 'Down 1.2kg'],
            ]}
          />
        </Panel>
      )}
    </div>
  );
}
