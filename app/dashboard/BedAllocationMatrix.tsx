'use client';

import { useState } from 'react';
import { BedDouble, Check } from 'lucide-react';

import {
  MasterPanel,
  MasterTabBar,
  MasterViewHeader,
  masterBtnPrimary,
} from './_masterLightUi';

type BedStatus = 'Occupied' | 'Available' | 'Reserved' | 'Isolation';

type Bed = {
  id: string;
  label: string;
  ward: 'ICU' | 'General' | 'Deluxe Private';
  status: BedStatus;
  patient?: string;
};

const INITIAL_BEDS: Bed[] = [
  { id: '1', label: 'ICU-01', ward: 'ICU', status: 'Occupied', patient: 'Rahul S.' },
  { id: '2', label: 'ICU-02', ward: 'ICU', status: 'Available' },
  { id: '3', label: 'ICU-03', ward: 'ICU', status: 'Isolation' },
  { id: '4', label: 'GEN-101', ward: 'General', status: 'Available' },
  { id: '5', label: 'GEN-102', ward: 'General', status: 'Occupied', patient: 'Priya P.' },
  { id: '6', label: 'GEN-103', ward: 'General', status: 'Reserved' },
  { id: '7', label: 'DLX-201', ward: 'Deluxe Private', status: 'Available' },
  { id: '8', label: 'DLX-202', ward: 'Deluxe Private', status: 'Occupied', patient: 'Meera K.' },
];

function statusPill(status: BedStatus): string {
  return {
    Occupied: 'bg-blue-100 text-blue-800 ring-blue-200',
    Available: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
    Reserved: 'bg-amber-100 text-amber-800 ring-amber-200',
    Isolation: 'bg-purple-100 text-purple-800 ring-purple-200',
  }[status];
}

function cellBorder(status: BedStatus, selected: boolean): string {
  if (selected) return 'ring-2 ring-blue-500 ring-offset-2';
  return {
    Occupied: 'border-blue-200 bg-blue-50/50',
    Available: 'border-emerald-200 bg-emerald-50/50',
    Reserved: 'border-amber-200 bg-amber-50/50',
    Isolation: 'border-purple-200 bg-purple-50/50',
  }[status];
}

export default function BedAllocationMatrix() {
  const [beds, setBeds] = useState(INITIAL_BEDS);
  const [wardTab, setWardTab] = useState<Bed['ward']>('ICU');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [assignPatient, setAssignPatient] = useState('New Admit Patient');

  const wardBeds = beds.filter((b) => b.ward === wardTab);
  const selected = beds.find((b) => b.id === selectedId);

  const commitAssignment = () => {
    if (!selectedId || !selected || selected.status !== 'Available') return;
    setBeds((rows) =>
      rows.map((b) =>
        b.id === selectedId
          ? { ...b, status: 'Occupied' as BedStatus, patient: assignPatient }
          : b,
      ),
    );
    setSelectedId(null);
  };

  return (
    <div className="space-y-6">
      <MasterViewHeader
        title="Bed Allocation Matrix"
        subtitle="Interactive ward grid with status-coded beds and assignment commit panel."
        icon={BedDouble}
      />

      <MasterTabBar
        tabs={[
          { id: 'ICU', label: 'ICU' },
          { id: 'General', label: 'General' },
          { id: 'Deluxe Private', label: 'Deluxe Private' },
        ]}
        active={wardTab}
        onChange={setWardTab}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:col-span-2">
          {wardBeds.map((bed) => (
            <button
              key={bed.id}
              type="button"
              onClick={() => setSelectedId(bed.id)}
              className={`flex min-h-[96px] flex-col items-start rounded-xl border-2 p-3 text-left transition hover:shadow-md ${cellBorder(bed.status, selectedId === bed.id)}`}
            >
              <span className="font-mono text-xs font-bold text-slate-800">{bed.label}</span>
              <span
                className={`mt-2 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ring-1 ${statusPill(bed.status)}`}
              >
                {bed.status}
              </span>
              {bed.patient && (
                <span className="mt-1 truncate text-[11px] text-slate-600">{bed.patient}</span>
              )}
            </button>
          ))}
        </div>

        <MasterPanel title="Assignment Panel" description="Commit bed to patient">
          {selected ? (
            <div className="space-y-4">
              <dl className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Bed</dt>
                  <dd className="font-mono font-bold text-blue-600">{selected.label}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Status</dt>
                  <dd>{selected.status}</dd>
                </div>
              </dl>
              {selected.status === 'Available' && (
                <>
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={assignPatient}
                    onChange={(e) => setAssignPatient(e.target.value)}
                    placeholder="Patient name"
                  />
                  <button type="button" className={`${masterBtnPrimary} w-full justify-center`} onClick={commitAssignment}>
                    <Check className="h-3.5 w-3.5" />
                    Commit Assignment
                  </button>
                </>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400">Select an available bed from the grid.</p>
          )}
        </MasterPanel>
      </div>
    </div>
  );
}
