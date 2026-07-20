'use client';

import { useMemo, useState } from 'react';
import { BedDouble, Building2, Wrench } from 'lucide-react';

import {
  MasterDataTable,
  MasterField,
  MasterPanel,
  MasterSearchBar,
  MasterTabBar,
  MasterViewHeader,
  masterInputClass,
} from './_masterLightUi';

type RoomType = 'General' | 'Private' | 'Deluxe' | 'ICU';
type BedType = 'Manual' | 'Semi-Fowler' | 'Motorized';
type MaintenanceState = 'Operational' | 'Maintenance' | 'Reserved';

type FacilityRow = {
  id: string;
  roomType: RoomType;
  bedType: BedType;
  ward: string;
  bedLabel: string;
  dailyTariff: string;
  maintenance: MaintenanceState;
};

const SEED_FACILITIES: FacilityRow[] = [
  {
    id: 'F01',
    roomType: 'General',
    bedType: 'Manual',
    ward: 'Ward-3A',
    bedLabel: 'B-301',
    dailyTariff: '₹2,200',
    maintenance: 'Operational',
  },
  {
    id: 'F02',
    roomType: 'Private',
    bedType: 'Semi-Fowler',
    ward: 'Block-B',
    bedLabel: 'P-112',
    dailyTariff: '₹4,800',
    maintenance: 'Operational',
  },
  {
    id: 'F03',
    roomType: 'Deluxe',
    bedType: 'Motorized',
    ward: 'Tower-1',
    bedLabel: 'D-204',
    dailyTariff: '₹8,500',
    maintenance: 'Reserved',
  },
  {
    id: 'F04',
    roomType: 'ICU',
    bedType: 'Motorized',
    ward: 'ICU-A',
    bedLabel: 'ICU-07',
    dailyTariff: '₹12,000',
    maintenance: 'Operational',
  },
  {
    id: 'F05',
    roomType: 'General',
    bedType: 'Manual',
    ward: 'Ward-2C',
    bedLabel: 'B-218',
    dailyTariff: '₹2,200',
    maintenance: 'Maintenance',
  },
];

const ROOM_TABS: RoomType[] = ['General', 'Private', 'Deluxe', 'ICU'];

export default function MasterRoomsBedsView() {
  const [facilities] = useState(SEED_FACILITIES);
  const [search, setSearch] = useState('');
  const [roomTab, setRoomTab] = useState<RoomType>('General');
  const [layoutNote, setLayoutNote] = useState('Block A · Floors 2–4 · 48 beds indexed');

  const filtered = useMemo(
    () =>
      facilities.filter(
        (f) =>
          f.roomType === roomTab &&
          (f.ward.toLowerCase().includes(search.toLowerCase()) ||
            f.bedLabel.toLowerCase().includes(search.toLowerCase())),
      ),
    [facilities, search, roomTab],
  );

  const maintenanceBadge = (state: MaintenanceState) => {
    const styles = {
      Operational: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
      Maintenance: 'bg-amber-50 text-amber-700 ring-amber-200',
      Reserved: 'bg-blue-50 text-blue-700 ring-blue-200',
    }[state];
    return (
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ${styles}`}>
        {state}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <MasterViewHeader
        title="Ward & Facility Setup"
        subtitle="Room and bed type matrix with tariff profiles, maintenance flags, and layout schemas."
        icon={BedDouble}
      />

      <MasterSearchBar value={search} onChange={setSearch} placeholder="Search ward, bed label…" />

      <MasterTabBar
        tabs={ROOM_TABS.map((r) => ({ id: r, label: r }))}
        active={roomTab}
        onChange={setRoomTab}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <MasterPanel title="Facility Layout Schema" description="Ward topology reference">
          <MasterField label="Layout Descriptor">
            <textarea
              className={`${masterInputClass} min-h-[80px] resize-y`}
              value={layoutNote}
              onChange={(e) => setLayoutNote(e.target.value)}
            />
          </MasterField>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <Building2 className="h-4 w-4 text-blue-600" />
            Indexed beds update billing and admission routing automatically.
          </div>
        </MasterPanel>

        <MasterPanel title="Bed Tariff Profile Summary" description={`${roomTab} category rates`}>
          <ul className="space-y-2">
            {filtered.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
              >
                <span className="text-xs font-medium text-slate-800">
                  {f.bedLabel} · {f.bedType}
                </span>
                <span className="text-xs font-bold tabular-nums text-blue-600">{f.dailyTariff}/day</span>
              </li>
            ))}
          </ul>
        </MasterPanel>
      </div>

      <MasterPanel title="Room & Bed Configuration Matrix" description="Maintenance state and tariff mapping">
        <MasterDataTable
          columns={['Bed', 'Ward', 'Room Type', 'Bed Type', 'Daily Tariff', 'Maintenance']}
          rows={filtered.map((f) => [
            <span key="b" className="font-mono font-semibold text-slate-800">
              {f.bedLabel}
            </span>,
            f.ward,
            f.roomType,
            f.bedType,
            <span key="t" className="font-semibold tabular-nums text-blue-600">
              {f.dailyTariff}
            </span>,
            maintenanceBadge(f.maintenance),
          ])}
        />
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
          <Wrench className="h-3.5 w-3.5" />
          Maintenance flags suppress bed allocation in admission workflows.
        </p>
      </MasterPanel>
    </div>
  );
}
