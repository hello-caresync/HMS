'use client';

import { useMemo, useState } from 'react';
import { Activity, Bed, ClipboardList, FileText, Pill, Users } from 'lucide-react';

import {
  DataTable,
  KpiGrid,
  Panel,
  SearchDesk,
  TabBar,
  ViewHeader,
} from './_viewUi';

type IpdTab = 'census' | 'wards' | 'mar' | 'discharge';

const INITIAL_CENSUS = [
  { uhid: 'NX-412', name: 'Rahul Sharma', ward: 'ICU-A', bed: 'A-03', los: '4d', status: 'Stable' },
  { uhid: 'NX-415', name: 'Meera Krishnan', ward: 'Gen-2', bed: 'G-214', los: '2d', status: 'Observing' },
  { uhid: 'NX-421', name: 'Arjun Desai', ward: 'Semi-1', bed: 'S-108', los: '6d', status: 'Post-Op' },
];

export default function IpdView() {
  const [tab, setTab] = useState<IpdTab>('census');
  const [search, setSearch] = useState('');
  const [census, setCensus] = useState(INITIAL_CENSUS);
  const [dischargeDraft, setDischargeDraft] = useState('Patient stable for discharge. Follow-up in 7 days.');

  const filtered = useMemo(
    () =>
      census.filter(
        (row) =>
          row.name.toLowerCase().includes(search.toLowerCase()) ||
          row.uhid.toLowerCase().includes(search.toLowerCase()),
      ),
    [census, search],
  );

  return (
    <div className="space-y-6">
      <ViewHeader
        title="IPD Management"
        subtitle="Admission tracker, census roster, ward logs, MAR charting, and discharge summaries."
        icon={Bed}
      />
      <KpiGrid
        items={[
          { label: 'Active Admissions', value: String(census.length), icon: Users, tone: 'cyan' },
          { label: 'Bed Occupancy', value: '86%', icon: Bed, tone: 'indigo' },
          { label: 'MAR Due', value: '18', icon: Pill, tone: 'amber' },
          { label: 'Discharge Queue', value: '5', icon: FileText, tone: 'emerald' },
        ]}
      />
      <SearchDesk value={search} onChange={setSearch} placeholder="Search census by UHID or patient name..." />
      <TabBar
        tabs={[
          { id: 'census', label: 'Patient Census' },
          { id: 'wards', label: 'Ward / Room Logs' },
          { id: 'mar', label: 'MAR Records' },
          { id: 'discharge', label: 'Discharge Builder' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === 'census' && (
        <Panel title="IPD Admission Tracker & Census Roster">
          <DataTable
            columns={['UHID', 'Patient', 'Ward', 'Bed', 'LOS', 'Status']}
            rows={filtered.map((row) => [
              row.uhid,
              row.name,
              row.ward,
              row.bed,
              row.los,
              <span key={row.uhid} className="rounded bg-cyan-500/10 px-2 py-0.5 text-cyan-300">
                {row.status}
              </span>,
            ])}
          />
        </Panel>
      )}
      {tab === 'wards' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Ward Activity Log" description="Daily ward rounds and bed turnover events.">
            <DataTable
              columns={['Ward', 'Event', 'Time']}
              rows={[
                ['ICU-A', 'Bed A-03 linen change', '08:10'],
                ['Gen-2', 'Isolation protocol activated G-214', '09:45'],
                ['Semi-1', 'Maintenance cleared S-108', '11:20'],
              ]}
            />
          </Panel>
          <Panel title="Daily Progress Charts" description="Structured nursing and physician progress notes.">
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="rounded border border-slate-800 bg-slate-900/40 p-2">
                <Activity className="mr-1 inline h-3.5 w-3.5 text-cyan-400" />
                Rahul Sharma — vitals stable, ambulating with assistance.
              </li>
              <li className="rounded border border-slate-800 bg-slate-900/40 p-2">
                Meera Krishnan — pain score 2/10, oral intake improving.
              </li>
            </ul>
          </Panel>
        </div>
      )}
      {tab === 'mar' && (
        <Panel title="Medication Administration Records (MAR)">
          <DataTable
            columns={['Patient', 'Medication', 'Schedule', 'Status']}
            rows={[
              ['Rahul Sharma', 'Metformin 500mg', '08:00', 'Given'],
              ['Meera Krishnan', 'Salbutamol Neb', '10:00', 'Due'],
              ['Arjun Desai', 'Ceftriaxone IV', '14:00', 'Held'],
            ]}
          />
        </Panel>
      )}
      {tab === 'discharge' && (
        <Panel title="Discharge Summary Builder">
          <textarea
            value={dischargeDraft}
            onChange={(event) => setDischargeDraft(event.target.value)}
            rows={5}
            className="w-full rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setCensus((rows) => rows.slice(1))}
            className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            <ClipboardList className="h-4 w-4" />
            Finalize Discharge Summary
          </button>
        </Panel>
      )}
    </div>
  );
}
