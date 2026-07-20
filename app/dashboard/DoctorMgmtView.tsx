'use client';

import { useState } from 'react';
import { Briefcase, CalendarOff, Filter, Stethoscope, TrendingUp, Users } from 'lucide-react';

import { DataTable, KpiGrid, Panel, SearchDesk, TabBar, ViewHeader } from './_viewUi';

type DocTab = 'roster' | 'specialty' | 'load' | 'leave' | 'commission';

export default function DoctorMgmtView() {
  const [tab, setTab] = useState<DocTab>('roster');
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('All');

  const doctors = [
    { name: 'Dr. Ananya Rao', dept: 'General Medicine', opd: 18, ipd: 6, leave: 'None' },
    { name: 'Dr. Vikram Menon', dept: 'Cardiology', opd: 22, ipd: 9, leave: 'None' },
    { name: 'Dr. Meera Iyer', dept: 'Orthopedics', opd: 14, ipd: 4, leave: '2026-07-20' },
  ].filter(
    (row) =>
      row.name.toLowerCase().includes(search.toLowerCase()) &&
      (specialty === 'All' || row.dept === specialty),
  );

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Doctor Management"
        subtitle="Consultant directories, specialty filters, consult load, leave logs, commission splits."
        icon={Stethoscope}
      />
      <KpiGrid
        items={[
          { label: 'Consultants Active', value: '36', icon: Users, tone: 'cyan' },
          { label: 'OPD Load', value: '142', icon: Briefcase, tone: 'indigo' },
          { label: 'On Leave', value: '4', icon: CalendarOff, tone: 'amber' },
          { label: 'Revenue Share MTD', value: '₹18.4L', icon: TrendingUp, tone: 'emerald' },
        ]}
      />
      <SearchDesk value={search} onChange={setSearch} placeholder="Search consultant roster..." />
      <TabBar
        tabs={[
          { id: 'roster', label: 'Consultant Roster' },
          { id: 'specialty', label: 'Specialty Filters' },
          { id: 'load', label: 'Consult Load' },
          { id: 'leave', label: 'Leave Logs' },
          { id: 'commission', label: 'Commission Split' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === 'specialty' && (
        <Panel title="Specialty Department Filters">
          <div className="flex flex-wrap gap-2">
            {['All', 'General Medicine', 'Cardiology', 'Orthopedics'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setSpecialty(item)}
                className={`flex items-center gap-1 rounded-md px-3 py-1 text-[11px] font-semibold ${
                  specialty === item ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Filter className="h-3 w-3" />
                {item}
              </button>
            ))}
          </div>
        </Panel>
      )}
      {(tab === 'roster' || tab === 'load' || tab === 'leave' || tab === 'commission') && (
        <Panel title="Consultant Roster Directory">
          <DataTable
            columns={['Consultant', 'Department', 'OPD', 'IPD', 'Leave']}
            rows={doctors.map((row) => [row.name, row.dept, String(row.opd), String(row.ipd), row.leave])}
          />
        </Panel>
      )}
    </div>
  );
}
