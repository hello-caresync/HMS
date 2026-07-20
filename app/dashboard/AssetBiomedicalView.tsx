'use client';

import { useState } from 'react';
import { AlertTriangle, Calendar, Ticket, TrendingDown, Wrench } from 'lucide-react';

import { DataTable, KpiGrid, Panel, SearchDesk, TabBar, ViewHeader } from './_viewUi';

type AssetTab = 'inventory' | 'pm' | 'breakdown' | 'downtime';

export default function AssetBiomedicalView() {
  const [tab, setTab] = useState<AssetTab>('inventory');
  const [search, setSearch] = useState('');
  const [tickets, setTickets] = useState([
    { id: 'TK-441', asset: 'Ventilator V60', issue: 'Alarm sensor fault', status: 'Open' },
  ]);

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Asset & Biomedical Engineering"
        subtitle="Equipment inventory, preventive maintenance, breakdown tickets, downtime analytics."
        icon={Wrench}
      />
      <KpiGrid
        items={[
          { label: 'Equipment Assets', value: '186', icon: Wrench, tone: 'cyan' },
          { label: 'PM Due (7d)', value: '14', icon: Calendar, tone: 'amber' },
          { label: 'Open Tickets', value: String(tickets.length), icon: Ticket, tone: 'rose' },
          { label: 'Downtime MTD', value: '42h', icon: TrendingDown, tone: 'indigo' },
        ]}
      />
      <SearchDesk value={search} onChange={setSearch} placeholder="Search biomedical assets..." />
      <TabBar
        tabs={[
          { id: 'inventory', label: 'Equipment Inventory' },
          { id: 'pm', label: 'PM Calendar' },
          { id: 'breakdown', label: 'Breakdown Console' },
          { id: 'downtime', label: 'Downtime Analytics' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === 'inventory' && (
        <Panel title="Equipment Inventory Tracker">
          <DataTable
            columns={['Asset Tag', 'Device', 'Location', 'AMC']}
            rows={[
              ['BM-VENT-07', 'Ventilator V60', 'ICU-A', 'Active'],
              ['BM-CT-02', 'CT Scanner', 'Radiology', 'Active'],
            ]}
          />
        </Panel>
      )}
      {tab === 'pm' && (
        <Panel title="Preventive Maintenance Calendar">
          <DataTable
            columns={['Asset', 'Next PM', 'Vendor']}
            rows={[
              ['Ventilator V60', '2026-07-22', 'Philips Care'],
              ['Infusion Pump IP5', '2026-07-28', 'In-house'],
            ]}
          />
        </Panel>
      )}
      {tab === 'breakdown' && (
        <Panel title="Breakdown / Ticket Reporting Console">
          <DataTable
            columns={['Ticket', 'Asset', 'Issue', 'Status']}
            rows={tickets.map((row) => [row.id, row.asset, row.issue, row.status])}
          />
          <button
            type="button"
            onClick={() =>
              setTickets((rows) => [
                ...rows,
                {
                  id: `TK-${442 + rows.length}`,
                  asset: 'Patient Monitor',
                  issue: 'SpO2 probe intermittent',
                  status: 'Open',
                },
              ])
            }
            className="mt-3 flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white"
          >
            <AlertTriangle className="h-4 w-4" />
            Raise Breakdown Ticket
          </button>
        </Panel>
      )}
      {tab === 'downtime' && (
        <Panel title="Downtime Tracking Analytics">
          <DataTable
            columns={['Modality', 'Downtime', 'Impact']}
            rows={[
              ['CT Scanner', '12h', 'High'],
              ['Lab Analyzer 2', '6h', 'Medium'],
            ]}
          />
        </Panel>
      )}
    </div>
  );
}
