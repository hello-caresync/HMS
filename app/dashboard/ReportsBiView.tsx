'use client';

import { useState } from 'react';
import { BarChart3, Download, FileSpreadsheet, Layers, SlidersHorizontal } from 'lucide-react';

import { DataTable, KpiGrid, Panel, SearchDesk, TabBar, ViewHeader } from './_viewUi';

type ReportsTab = 'generator' | 'kpi' | 'cohort' | 'export';

export default function ReportsBiView() {
  const [tab, setTab] = useState<ReportsTab>('generator');
  const [search, setSearch] = useState('');
  const [exportQueue, setExportQueue] = useState([
    { id: 'EXP-101', report: 'Revenue Summary', format: 'PDF', status: 'Queued' },
  ]);

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Reports & Business Intelligence"
        subtitle="Executive report generator, custom KPI builder, cohort analysis, automated export queues."
        icon={BarChart3}
      />
      <KpiGrid
        items={[
          { label: 'Saved Reports', value: '48', icon: FileSpreadsheet, tone: 'cyan' },
          { label: 'Custom KPIs', value: '16', icon: SlidersHorizontal, tone: 'emerald' },
          { label: 'Cohort Models', value: '7', icon: Layers, tone: 'indigo' },
          { label: 'Export Queue', value: String(exportQueue.length), icon: Download, tone: 'amber' },
        ]}
      />
      <SearchDesk value={search} onChange={setSearch} placeholder="Search reports and KPIs..." />
      <TabBar
        tabs={[
          { id: 'generator', label: 'Report Generator' },
          { id: 'kpi', label: 'KPI Builder' },
          { id: 'cohort', label: 'Cohort Analysis' },
          { id: 'export', label: 'Export Queue' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === 'generator' && (
        <Panel title="Executive Report Generator">
          <DataTable
            columns={['Template', 'Department', 'Last Run']}
            rows={[
              ['Daily Census', 'Operations', 'Today 06:00'],
              ['Revenue Flash', 'Finance', 'Today 08:30'],
            ]}
          />
        </Panel>
      )}
      {tab === 'kpi' && (
        <Panel title="Custom KPI Builder">
          <DataTable
            columns={['KPI', 'Formula', 'Owner']}
            rows={[
              ['Bed Occupancy %', 'Occupied / Total × 100', 'Admin'],
              ['AR Days', 'AR / Daily Revenue', 'Finance'],
            ]}
          />
        </Panel>
      )}
      {tab === 'cohort' && (
        <Panel title="Cohort Analysis Parameters">
          <DataTable
            columns={['Cohort', 'Filter', 'Size']}
            rows={[
              ['Diabetes OPD', 'ICD E11 + OPD visits', '1,240'],
              ['Post-Op LOS', 'Surgery + IPD > 5d', '312'],
            ]}
          />
        </Panel>
      )}
      {tab === 'export' && (
        <Panel title="Automated Excel / PDF Export Queue">
          <DataTable
            columns={['Job', 'Report', 'Format', 'Status']}
            rows={exportQueue.map((row) => [row.id, row.report, row.format, row.status])}
          />
          <button
            type="button"
            onClick={() =>
              setExportQueue((rows) => [
                ...rows,
                {
                  id: `EXP-${102 + rows.length}`,
                  report: 'Departmental P&L',
                  format: 'Excel',
                  status: 'Queued',
                },
              ])
            }
            className="mt-3 flex items-center gap-2 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white"
          >
            <Download className="h-4 w-4" />
            Queue Export
          </button>
        </Panel>
      )}
    </div>
  );
}
