'use client';

import { useState } from 'react';
import { CheckSquare, ClipboardCheck, Package, Scissors, UserCheck } from 'lucide-react';

import { DataTable, KpiGrid, Panel, SearchDesk, TabBar, ViewHeader } from './_viewUi';

type OtTab = 'schedule' | 'roster' | 'checklists' | 'anesthesia' | 'consumables';

export default function OtView() {
  const [tab, setTab] = useState<OtTab>('schedule');
  const [search, setSearch] = useState('');
  const [preOpDone, setPreOpDone] = useState(false);

  const schedule = [
    { theater: 'OT-1', time: '08:30', procedure: 'Appendectomy', surgeon: 'Dr. Iyer', status: 'In Progress' },
    { theater: 'OT-2', time: '11:00', procedure: 'TKR', surgeon: 'Dr. Nair', status: 'Pre-Op' },
    { theater: 'OT-3', time: '14:30', procedure: 'C-Section', surgeon: 'Dr. Thomas', status: 'Scheduled' },
  ].filter((row) => row.procedure.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Operation Theatre"
        subtitle="Theater schedule matrix, surgeon roster, checklists, anesthesia, and consumables."
        icon={Scissors}
      />
      <KpiGrid
        items={[
          { label: 'Theaters Active', value: '6/8', icon: Scissors, tone: 'cyan' },
          { label: 'Cases Today', value: '14', icon: ClipboardCheck, tone: 'indigo' },
          { label: 'Surgeons On Roster', value: '9', icon: UserCheck, tone: 'emerald' },
          { label: 'Consumables Low', value: '3 SKUs', icon: Package, tone: 'amber' },
        ]}
      />
      <SearchDesk value={search} onChange={setSearch} placeholder="Search OT schedule..." />
      <TabBar
        tabs={[
          { id: 'schedule', label: 'Schedule Matrix' },
          { id: 'roster', label: 'Surgeon Roster' },
          { id: 'checklists', label: 'Pre/Post-Op' },
          { id: 'anesthesia', label: 'Anesthesia' },
          { id: 'consumables', label: 'Consumables' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === 'schedule' && (
        <Panel title="Live Operation Theatre Schedule Matrix">
          <DataTable
            columns={['Theater', 'Time', 'Procedure', 'Surgeon', 'Status']}
            rows={schedule.map((row) => [
              row.theater,
              row.time,
              row.procedure,
              row.surgeon,
              row.status,
            ])}
          />
        </Panel>
      )}
      {tab === 'roster' && (
        <Panel title="Surgeon Roster Logs">
          <DataTable
            columns={['Surgeon', 'Specialty', 'Cases', 'On-Call']}
            rows={[
              ['Dr. Meera Iyer', 'General Surgery', '3', 'Yes'],
              ['Dr. Karthik Nair', 'Orthopedics', '2', 'No'],
              ['Dr. Sarah Thomas', 'OB-GYN', '2', 'Yes'],
            ]}
          />
        </Panel>
      )}
      {tab === 'checklists' && (
        <Panel title="Pre-Op & Post-Op Checklists">
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input type="checkbox" checked={preOpDone} onChange={(e) => setPreOpDone(e.target.checked)} />
            WHO Surgical Safety Checklist — sign-in complete
          </label>
          <ul className="mt-3 space-y-1 text-xs text-slate-400">
            <li className="flex items-center gap-2">
              <CheckSquare className="h-3.5 w-3.5 text-emerald-400" />
              Patient identity confirmed
            </li>
            <li className="flex items-center gap-2">
              <CheckSquare className="h-3.5 w-3.5 text-emerald-400" />
              Site marked and consented
            </li>
          </ul>
        </Panel>
      )}
      {tab === 'anesthesia' && (
        <Panel title="Anesthesia Assessment Entry">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              placeholder="ASA Class"
              className="rounded-lg border border-slate-800 bg-slate-900/60 p-2 text-xs text-slate-200"
            />
            <input
              placeholder="Airway assessment"
              className="rounded-lg border border-slate-800 bg-slate-900/60 p-2 text-xs text-slate-200"
            />
          </div>
        </Panel>
      )}
      {tab === 'consumables' && (
        <Panel title="Surgical Equipment Consumables Tracking">
          <DataTable
            columns={['Item', 'Used', 'Remaining']}
            rows={[
              ['Suture Kit 3-0', '4', '18'],
              ['Orthopedic Implant Set', '1', '2'],
              ['Laparoscopic Trocar', '2', '9'],
            ]}
          />
        </Panel>
      )}
    </div>
  );
}
