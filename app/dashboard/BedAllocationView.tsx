'use client';

import { useState } from 'react';
import { ArrowRightLeft, BedDouble, LogOut, Wrench } from 'lucide-react';

import {
  MasterField,
  MasterPanel,
  MasterSheet,
  MasterViewHeader,
  masterBtnPrimary,
  masterInputClass,
} from './_masterLightUi';

type BedState = 'Occupied' | 'Available' | 'Maintenance';

type BedCell = {
  id: string;
  label: string;
  ward: string;
  wardType: 'ICU' | 'Deluxe' | 'Semi-Private' | 'General';
  state: BedState;
  patient?: string;
};

const INITIAL_BEDS: BedCell[] = [
  { id: 'b1', label: 'ICU-01', ward: 'ICU-A', wardType: 'ICU', state: 'Occupied', patient: 'Rahul S.' },
  { id: 'b2', label: 'ICU-02', ward: 'ICU-A', wardType: 'ICU', state: 'Available' },
  { id: 'b3', label: 'ICU-03', ward: 'ICU-A', wardType: 'ICU', state: 'Maintenance' },
  { id: 'b4', label: 'DLX-101', ward: 'Tower-1', wardType: 'Deluxe', state: 'Occupied', patient: 'Priya P.' },
  { id: 'b5', label: 'DLX-102', ward: 'Tower-1', wardType: 'Deluxe', state: 'Available' },
  { id: 'b6', label: 'SP-201', ward: 'Block-B', wardType: 'Semi-Private', state: 'Occupied', patient: 'Meera K.' },
  { id: 'b7', label: 'SP-202', ward: 'Block-B', wardType: 'Semi-Private', state: 'Available' },
  { id: 'b8', label: 'GEN-301', ward: 'Ward-3', wardType: 'General', state: 'Occupied', patient: 'Sanjay R.' },
  { id: 'b9', label: 'GEN-302', ward: 'Ward-3', wardType: 'General', state: 'Available' },
  { id: 'b10', label: 'GEN-303', ward: 'Ward-3', wardType: 'General', state: 'Maintenance' },
];

const WARD_TYPES = ['ICU', 'Deluxe', 'Semi-Private', 'General'] as const;

function bedColor(state: BedState): string {
  return {
    Occupied: 'border-blue-300 bg-blue-50 text-blue-800',
    Available: 'border-emerald-300 bg-emerald-50 text-emerald-800',
    Maintenance: 'border-amber-300 bg-amber-50 text-amber-800',
  }[state];
}

function bedLegend(state: BedState) {
  const icons = {
    Occupied: BedDouble,
    Available: BedDouble,
    Maintenance: Wrench,
  };
  const Icon = icons[state];
  return (
    <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600">
      <Icon className="h-3.5 w-3.5" />
      {state}
    </span>
  );
}

export default function BedAllocationView() {
  const [beds, setBeds] = useState(INITIAL_BEDS);
  const [filterWard, setFilterWard] = useState<(typeof WARD_TYPES)[number]>('ICU');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedBed, setSelectedBed] = useState<BedCell | null>(null);
  const [transferTarget, setTransferTarget] = useState('');

  const filtered = beds.filter((b) => b.wardType === filterWard);

  const openDrawer = (bed: BedCell) => {
    setSelectedBed(bed);
    setTransferTarget('');
    setDrawerOpen(true);
  };

  const handleDischarge = () => {
    if (!selectedBed) return;
    setBeds((rows) =>
      rows.map((b) =>
        b.id === selectedBed.id
          ? { ...b, state: 'Available' as BedState, patient: undefined }
          : b,
      ),
    );
    setDrawerOpen(false);
  };

  const handleTransfer = () => {
    if (!selectedBed || !transferTarget.trim()) return;
    setBeds((rows) =>
      rows.map((b) => {
        if (b.id === selectedBed.id) {
          return { ...b, state: 'Available' as BedState, patient: undefined };
        }
        if (b.label === transferTarget.trim()) {
          return {
            ...b,
            state: 'Occupied' as BedState,
            patient: selectedBed.patient ?? 'Transferred Patient',
          };
        }
        return b;
      }),
    );
    setDrawerOpen(false);
  };

  return (
    <div className="space-y-6">
      <MasterViewHeader
        title="Ward Bed Allocation Map"
        subtitle="Interactive bed state matrix with transfer and discharge workflows."
        icon={BedDouble}
      />

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap gap-2">
          {WARD_TYPES.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setFilterWard(w)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                filterWard === w
                  ? 'bg-blue-600 text-white'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {w}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-4 border-l border-slate-200 pl-4">
          {(['Occupied', 'Available', 'Maintenance'] as BedState[]).map((s) => (
            <span key={s}>{bedLegend(s)}</span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {filtered.map((bed) => (
          <button
            key={bed.id}
            type="button"
            onClick={() => openDrawer(bed)}
            className={`flex min-h-[88px] flex-col items-start justify-between rounded-xl border-2 p-3 text-left transition hover:shadow-md ${bedColor(bed.state)}`}
          >
            <span className="font-mono text-xs font-bold">{bed.label}</span>
            <span className="text-[10px] opacity-80">{bed.ward}</span>
            {bed.patient && (
              <span className="mt-1 truncate text-[11px] font-semibold">{bed.patient}</span>
            )}
            <span className="mt-1 text-[9px] font-bold uppercase tracking-wider">{bed.state}</span>
          </button>
        ))}
      </div>

      <MasterPanel title="Ward Summary" description={`${filterWard} allocation snapshot`}>
        <div className="grid grid-cols-3 gap-4 text-center">
          {(['Occupied', 'Available', 'Maintenance'] as BedState[]).map((state) => (
            <div key={state} className="rounded-lg border border-slate-200 bg-slate-50 py-3">
              <p className="text-2xl font-bold text-slate-800">
                {filtered.filter((b) => b.state === state).length}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{state}</p>
            </div>
          ))}
        </div>
      </MasterPanel>

      <MasterSheet
        open={drawerOpen}
        title={selectedBed ? `Bed ${selectedBed.label}` : 'Bed Actions'}
        onClose={() => setDrawerOpen(false)}
      >
        {selectedBed && (
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
              <p className="font-semibold text-slate-800">{selectedBed.ward} · {selectedBed.wardType}</p>
              <p className="mt-1 text-slate-500">
                Status: <span className="font-bold text-blue-600">{selectedBed.state}</span>
              </p>
              {selectedBed.patient && (
                <p className="mt-1 text-slate-600">Patient: {selectedBed.patient}</p>
              )}
            </div>

            {selectedBed.state === 'Occupied' && (
              <>
                <MasterField label="Transfer to Bed Label">
                  <input
                    className={masterInputClass}
                    value={transferTarget}
                    onChange={(e) => setTransferTarget(e.target.value)}
                    placeholder="e.g. GEN-302"
                  />
                </MasterField>
                <button
                  type="button"
                  className={`${masterBtnPrimary} w-full justify-center`}
                  onClick={handleTransfer}
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  Execute Transfer
                </button>
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  onClick={handleDischarge}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Process Discharge
                </button>
              </>
            )}

            {selectedBed.state === 'Available' && (
              <p className="text-xs text-slate-500">
                Bed is available for admission allocation from the IPD desk.
              </p>
            )}

            {selectedBed.state === 'Maintenance' && (
              <p className="flex items-center gap-2 text-xs text-amber-700">
                <Wrench className="h-4 w-4" />
                Bed blocked for maintenance — not allocatable.
              </p>
            )}
          </div>
        )}
      </MasterSheet>
    </div>
  );
}
