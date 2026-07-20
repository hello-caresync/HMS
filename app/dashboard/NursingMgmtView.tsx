'use client';

import { useState } from 'react';
import { AlertCircle, ClipboardCheck, HeartPulse, RotateCw, Users } from 'lucide-react';

import { DataTable, KpiGrid, Panel, SearchDesk, TabBar, ViewHeader } from './_viewUi';

type NursingTab = 'stations' | 'shifts' | 'handover' | 'duty' | 'incidents';

export default function NursingMgmtView() {
  const [tab, setTab] = useState<NursingTab>('stations');
  const [search, setSearch] = useState('');
  const [incidents, setIncidents] = useState([
    { id: 'INC-12', ward: 'ICU-A', detail: 'Near-miss medication', severity: 'Medium' },
  ]);

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Nursing Management"
        subtitle="Station allocation, shift rosters, handover matrices, ward duty, incident logging."
        icon={HeartPulse}
      />
      <KpiGrid
        items={[
          { label: 'Nurses On Duty', value: '50', icon: Users, tone: 'cyan' },
          { label: 'Stations Covered', value: '12', icon: HeartPulse, tone: 'indigo' },
          { label: 'Handovers Due', value: '6', icon: ClipboardCheck, tone: 'amber' },
          { label: 'Open Incidents', value: String(incidents.length), icon: AlertCircle, tone: 'rose' },
        ]}
      />
      <SearchDesk value={search} onChange={setSearch} placeholder="Search nursing ledger..." />
      <TabBar
        tabs={[
          { id: 'stations', label: 'Station Ledger' },
          { id: 'shifts', label: 'Shift Rosters' },
          { id: 'handover', label: 'Handover Matrix' },
          { id: 'duty', label: 'Ward Duty' },
          { id: 'incidents', label: 'Incidents' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === 'stations' && (
        <Panel title="Nurse Station Allocation Ledger">
          <DataTable
            columns={['Station', 'Charge Nurse', 'Beds', 'Load']}
            rows={[
              ['ICU-A', 'Sister Mary', '12', 'High'],
              ['Gen-2', 'Sister Anitha', '28', 'Moderate'],
            ]}
          />
        </Panel>
      )}
      {tab === 'shifts' && (
        <Panel title="Shift Rotation Rosters">
          <DataTable
            columns={['Shift', 'Nurses', 'Coverage']}
            rows={[
              ['Morning', '18', '98%'],
              ['Evening', '16', '94%'],
              ['Night', '12', '91%'],
            ]}
          />
        </Panel>
      )}
      {tab === 'handover' && (
        <Panel title="Handover Checklist Matrices">
          <DataTable
            columns={['Ward', 'SBAR Complete', 'Pending Tasks']}
            rows={[
              ['ICU-A', 'Yes', '2'],
              ['Semi-1', 'Yes', '0'],
            ]}
          />
        </Panel>
      )}
      {tab === 'duty' && (
        <Panel title="Ward-Duty Assignment Trackers">
          <DataTable
            columns={['Nurse', 'Ward', 'Assignment']}
            rows={[
              ['Nurse Priya', 'Gen-2', 'Medication round'],
              ['Nurse Joel', 'ICU-A', 'Ventilator checks'],
            ]}
          />
        </Panel>
      )}
      {tab === 'incidents' && (
        <Panel title="Active Nursing Incident Logging">
          <DataTable
            columns={['ID', 'Ward', 'Detail', 'Severity']}
            rows={incidents.map((row) => [row.id, row.ward, row.detail, row.severity])}
          />
          <button
            type="button"
            onClick={() =>
              setIncidents((rows) => [
                ...rows,
                {
                  id: `INC-${rows.length + 13}`,
                  ward: 'Gen-2',
                  detail: 'Patient fall precaution review',
                  severity: 'Low',
                },
              ])
            }
            className="mt-3 flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white"
          >
            <RotateCw className="h-4 w-4" />
            Log Incident
          </button>
        </Panel>
      )}
    </div>
  );
}
