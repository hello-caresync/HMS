'use client';

import { useState } from 'react';
import { Ambulance, Clock, HeartPulse, ShieldAlert, Siren, Timer } from 'lucide-react';

import { DataTable, KpiGrid, Panel, SearchDesk, TabBar, ViewHeader } from './_viewUi';

type ErTab = 'triage' | 'trauma' | 'ambulance' | 'alerts';

export default function EmergencyView() {
  const [tab, setTab] = useState<ErTab>('triage');
  const [search, setSearch] = useState('');
  const [triage, setTriage] = useState([
    { id: 'ER-01', patient: 'Unknown M/34', zone: 'Red', wait: '2m', complaint: 'Polytrauma' },
    { id: 'ER-02', patient: 'Lakshmi R.', zone: 'Yellow', wait: '11m', complaint: 'Chest pain' },
    { id: 'ER-03', patient: 'Karan M.', zone: 'Green', wait: '24m', complaint: 'Laceration' },
  ]);

  const filtered = triage.filter((row) =>
    `${row.patient} ${row.complaint}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Emergency & Trauma"
        subtitle="Red/yellow triage board, trauma intake, ambulance sync, and live ER KPIs."
        icon={ShieldAlert}
      />
      <KpiGrid
        items={[
          { label: 'Time to Doctor', value: '7.2m', icon: Timer, tone: 'rose' },
          { label: 'Active Critical Beds', value: '3/4', icon: HeartPulse, tone: 'amber' },
          { label: 'Red Zone Cases', value: '1', icon: Siren, tone: 'rose' },
          { label: 'Ambulance Inbound', value: '2', icon: Ambulance, tone: 'cyan' },
        ]}
      />
      <SearchDesk value={search} onChange={setSearch} placeholder="Filter triage board..." />
      <TabBar
        tabs={[
          { id: 'triage', label: 'Triage Board' },
          { id: 'trauma', label: 'Trauma Logger' },
          { id: 'ambulance', label: 'Ambulance Sync' },
          { id: 'alerts', label: 'Med Alerts' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === 'triage' && (
        <Panel title="Red-Zone / Yellow-Zone Triage Board">
          <DataTable
            columns={['Case', 'Patient', 'Zone', 'Wait', 'Presentation']}
            rows={filtered.map((row) => [
              row.id,
              row.patient,
              <span
                key={row.id}
                className={`rounded px-2 py-0.5 font-bold ${
                  row.zone === 'Red'
                    ? 'animate-pulse bg-rose-500/20 text-rose-300'
                    : row.zone === 'Yellow'
                      ? 'bg-amber-500/15 text-amber-300'
                      : 'bg-emerald-500/10 text-emerald-300'
                }`}
              >
                {row.zone}
              </span>,
              row.wait,
              row.complaint,
            ])}
          />
        </Panel>
      )}
      {tab === 'trauma' && (
        <Panel title="Trauma Intake Logger">
          <DataTable
            columns={['Field', 'Value']}
            rows={[
              ['Mechanism', 'RTA — high velocity impact'],
              ['GCS on arrival', '13'],
              ['Primary survey', 'Airway patent, breathing labored'],
              ['Team lead', 'Dr. Vikram Menon'],
            ]}
          />
          <button
            type="button"
            onClick={() =>
              setTriage((rows) => [
                {
                  id: `ER-0${rows.length + 1}`,
                  patient: 'New Trauma',
                  zone: 'Red',
                  wait: '0m',
                  complaint: 'MVC intake',
                },
                ...rows,
              ])
            }
            className="mt-3 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700"
          >
            Log Trauma Intake
          </button>
        </Panel>
      )}
      {tab === 'ambulance' && (
        <Panel title="Ambulance Status Sync Feed">
          <DataTable
            columns={['Unit', 'Status', 'ETA', 'Destination']}
            rows={[
              ['AMB-07', 'En route', '6 min', 'ER Bay 2'],
              ['AMB-12', 'At scene', '14 min', 'ER Bay 1'],
              ['AMB-03', 'Available', '—', 'Standby'],
            ]}
          />
        </Panel>
      )}
      {tab === 'alerts' && (
        <Panel title="Med-Alert Flags">
          <ul className="space-y-2 text-xs">
            <li className="flex items-center gap-2 rounded border border-rose-900/40 bg-rose-500/10 p-2 text-rose-300">
              <ShieldAlert className="h-4 w-4" />
              Penicillin allergy — ER-01
            </li>
            <li className="flex items-center gap-2 rounded border border-amber-900/40 bg-amber-500/10 p-2 text-amber-300">
              <Clock className="h-4 w-4" />
              Anticoagulant therapy — ER-02
            </li>
          </ul>
        </Panel>
      )}
    </div>
  );
}
