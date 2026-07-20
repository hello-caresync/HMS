'use client';

import { useState } from 'react';
import { Bed, Map, UserPlus, Wrench } from 'lucide-react';

import { KpiGrid, Panel, SearchDesk, ViewHeader } from './_viewUi';

type BedState = 'Occupied' | 'Available' | 'Maintenance';

const BED_MAP: { id: string; ward: string; state: BedState; patient?: string }[] = [
  { id: 'ICU-A-01', ward: 'ICU', state: 'Occupied', patient: 'Rahul Sharma' },
  { id: 'ICU-A-02', ward: 'ICU', state: 'Available' },
  { id: 'ICU-A-03', ward: 'ICU', state: 'Maintenance' },
  { id: 'GEN-214', ward: 'General', state: 'Occupied', patient: 'Meera K.' },
  { id: 'SEM-108', ward: 'Semi-Private', state: 'Available' },
  { id: 'SEM-109', ward: 'Semi-Private', state: 'Occupied', patient: 'Arjun D.' },
];

const stateClass: Record<BedState, string> = {
  Occupied: 'border-indigo-500/40 bg-indigo-500/15 text-indigo-200',
  Available: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
  Maintenance: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
};

export default function BedWardView() {
  const [search, setSearch] = useState('');
  const [beds, setBeds] = useState(BED_MAP);
  const [selectedBed, setSelectedBed] = useState<string | null>(null);

  const filtered = beds.filter(
    (bed) =>
      bed.id.toLowerCase().includes(search.toLowerCase()) ||
      bed.ward.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Bed & Ward Management"
        subtitle="Interactive ward bed map with dynamic occupancy states and allocation drawer."
        icon={Bed}
      />
      <KpiGrid
        items={[
          {
            label: 'Occupied',
            value: String(beds.filter((b) => b.state === 'Occupied').length),
            icon: Bed,
            tone: 'indigo',
          },
          {
            label: 'Available',
            value: String(beds.filter((b) => b.state === 'Available').length),
            icon: UserPlus,
            tone: 'emerald',
          },
          {
            label: 'Maintenance',
            value: String(beds.filter((b) => b.state === 'Maintenance').length),
            icon: Wrench,
            tone: 'amber',
          },
          { label: 'Wards Online', value: '8', icon: Map, tone: 'cyan' },
        ]}
      />
      <SearchDesk value={search} onChange={setSearch} placeholder="Filter beds by ward or bed ID..." />
      <Panel title="Real-time Interactive Ward Bed Map">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((bed) => (
            <button
              key={bed.id}
              type="button"
              onClick={() => setSelectedBed(bed.id)}
              className={`rounded-xl border p-3 text-left text-xs transition-all ${stateClass[bed.state]} ${
                selectedBed === bed.id ? 'ring-2 ring-cyan-400' : ''
              }`}
            >
              <p className="font-mono font-bold">{bed.id}</p>
              <p className="text-[10px] opacity-80">{bed.ward}</p>
              <p className="mt-1 font-semibold">{bed.state}</p>
              {bed.patient && <p className="mt-0.5 text-[10px]">{bed.patient}</p>}
            </button>
          ))}
        </div>
      </Panel>
      {selectedBed && (
        <Panel title="Patient Allocation Mapping Drawer">
          <p className="text-xs text-slate-400">Selected bed: {selectedBed}</p>
          <button
            type="button"
            onClick={() =>
              setBeds((rows) =>
                rows.map((bed) =>
                  bed.id === selectedBed
                    ? { ...bed, state: 'Occupied', patient: 'New Admission' }
                    : bed,
                ),
              )
            }
            className="mt-3 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white"
          >
            Assign Patient to Bed
          </button>
        </Panel>
      )}
    </div>
  );
}
