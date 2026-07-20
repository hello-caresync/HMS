'use client';

import { useMemo, useState } from 'react';
import { Building2, Layers, Plus } from 'lucide-react';

import {
  MasterDataTable,
  MasterField,
  MasterPanel,
  MasterSearchBar,
  MasterSheet,
  MasterViewHeader,
  masterBtnPrimary,
  masterInputClass,
} from './_masterLightUi';

type Department = {
  id: string;
  name: string;
  code: string;
  status: 'Active' | 'Inactive';
  hodSlots: number;
  roomCount: number;
};

const SEED_DEPARTMENTS: Department[] = [
  { id: 'D001', name: 'Cardiology', code: 'CARD', status: 'Active', hodSlots: 2, roomCount: 18 },
  { id: 'D002', name: 'Orthopedics', code: 'ORTHO', status: 'Active', hodSlots: 1, roomCount: 14 },
  { id: 'D003', name: 'Pediatrics', code: 'PEDS', status: 'Active', hodSlots: 2, roomCount: 22 },
  { id: 'D004', name: 'General Medicine', code: 'GENMED', status: 'Active', hodSlots: 3, roomCount: 26 },
];

export default function MasterDeptsView() {
  const [departments, setDepartments] = useState(SEED_DEPARTMENTS);
  const [search, setSearch] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', hodSlots: '1', roomCount: '0' });

  const filtered = useMemo(
    () =>
      departments.filter(
        (d) =>
          d.name.toLowerCase().includes(search.toLowerCase()) ||
          d.code.toLowerCase().includes(search.toLowerCase()),
      ),
    [departments, search],
  );

  const handleProvision = () => {
    if (!form.name.trim() || !form.code.trim()) return;
    setDepartments((rows) => [
      ...rows,
      {
        id: `D${String(rows.length + 1).padStart(3, '0')}`,
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        status: 'Active',
        hodSlots: Number(form.hodSlots) || 1,
        roomCount: Number(form.roomCount) || 0,
      },
    ]);
    setForm({ name: '', code: '', hodSlots: '1', roomCount: '0' });
    setSheetOpen(false);
  };

  return (
    <div className="space-y-6">
      <MasterViewHeader
        title="Department Master"
        subtitle="Clinical subdivision directory with operational parameters and HOD allocation indices."
        icon={Layers}
        action={
          <button type="button" className={masterBtnPrimary} onClick={() => setSheetOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Provision Subdivision
          </button>
        }
      />

      <MasterSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search departments by name or route code…"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Active Units', value: departments.filter((d) => d.status === 'Active').length },
          { label: 'Total HOD Slots', value: departments.reduce((s, d) => s + d.hodSlots, 0) },
          { label: 'Indexed Rooms', value: departments.reduce((s, d) => s + d.roomCount, 0) },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{kpi.label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-800">{kpi.value}</p>
          </div>
        ))}
      </div>

      <MasterPanel title="Department Master Directory" description="Pre-configured clinical specialty units">
        <MasterDataTable
          columns={['Code', 'Specialty Unit', 'Operational Status', 'HOD Slots', 'Room Index']}
          rows={filtered.map((d) => [
            <span key="code" className="font-mono font-semibold text-blue-600">
              {d.code}
            </span>,
            d.name,
            <span
              key="status"
              className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700 ring-1 ring-emerald-200"
            >
              {d.status}
            </span>,
            String(d.hodSlots),
            String(d.roomCount),
          ])}
        />
      </MasterPanel>

      <MasterSheet open={sheetOpen} title="Provision Clinical Subdivision" onClose={() => setSheetOpen(false)}>
        <div className="space-y-4">
          <MasterField label="Subdivision Name">
            <input
              className={masterInputClass}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Interventional Cardiology"
            />
          </MasterField>
          <MasterField label="Index Route Code">
            <input
              className={masterInputClass}
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              placeholder="e.g. ICARD"
            />
          </MasterField>
          <div className="grid grid-cols-2 gap-3">
            <MasterField label="HOD Slots">
              <input
                type="number"
                min={0}
                className={masterInputClass}
                value={form.hodSlots}
                onChange={(e) => setForm((f) => ({ ...f, hodSlots: e.target.value }))}
              />
            </MasterField>
            <MasterField label="Room Count Index">
              <input
                type="number"
                min={0}
                className={masterInputClass}
                value={form.roomCount}
                onChange={(e) => setForm((f) => ({ ...f, roomCount: e.target.value }))}
              />
            </MasterField>
          </div>
          <button type="button" className={`${masterBtnPrimary} w-full justify-center`} onClick={handleProvision}>
            <Building2 className="h-3.5 w-3.5" />
            Save Subdivision
          </button>
        </div>
      </MasterSheet>
    </div>
  );
}
