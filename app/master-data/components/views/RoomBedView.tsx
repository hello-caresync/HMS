'use client';

import { useMemo, useState } from 'react';
import { BedDouble } from 'lucide-react';

import { useMasterData } from '../../context/MasterDataProvider';
import type { BedAvailability, RoomBedMaster } from '../../types';
import BedForm from '../forms/BedForm';
import DataTable from '../shared/DataTable';
import MasterToolbar, { filterByQuery, RowActions } from '../shared/MasterToolbar';
import Sheet from '../shared/Sheet';
import StatusBadge from '../shared/StatusBadge';

type SheetMode = { type: 'add' } | { type: 'edit'; bed: RoomBedMaster } | null;

const BED_TONE: Record<BedAvailability, 'success' | 'danger' | 'warning' | 'info'> = {
  Vacant: 'success',
  Occupied: 'danger',
  Maintenance: 'warning',
  Reserved: 'info',
};

export default function RoomBedView() {
  const { data, addRoomBed, updateRoomBed, removeRoomBed } = useMasterData();
  const [search, setSearch] = useState('');
  const [sheet, setSheet] = useState<SheetMode>(null);

  const filtered = useMemo(
    () =>
      filterByQuery(
        data.roomBeds,
        search,
        (b) => `${b.bedNumber} ${b.roomType} ${b.availabilityStatus}`,
      ),
    [data.roomBeds, search],
  );

  const closeSheet = () => setSheet(null);

  return (
    <div className="space-y-3">
      <div>
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <BedDouble className="h-4 w-4 text-primary" />
          Bed / Room Registry
        </h2>
        <p className="text-[11px] text-slate-800">Inpatient bed inventory · ICU / General / Private</p>
      </div>

      <MasterToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search bed no., room type, status…"
        recordCount={filtered.length}
        recordLabel="beds"
        onAdd={() => setSheet({ type: 'add' })}
        addLabel="Add Bed"
      />

      <DataTable
        columns={[
          { key: 'bed', header: 'Bed No.' },
          { key: 'type', header: 'Room Type' },
          { key: 'status', header: 'Status' },
          { key: 'action', header: 'Action', className: 'text-right w-28' },
        ]}
        rows={filtered.map((b) => ({
          bed: <span className="font-mono font-semibold text-slate-900">{b.bedNumber}</span>,
          type: <StatusBadge label={b.roomType} tone="neutral" />,
          status: <StatusBadge label={b.availabilityStatus} tone={BED_TONE[b.availabilityStatus]} />,
          action: (
            <RowActions
              onEdit={() => setSheet({ type: 'edit', bed: b })}
              onDelete={() => {
                if (confirm(`Remove bed ${b.bedNumber}?`)) removeRoomBed(b.id);
              }}
            />
          ),
        }))}
        emptyMessage={search ? 'No beds match your search.' : 'No beds registered.'}
      />

      <Sheet
        open={sheet !== null}
        title={sheet?.type === 'edit' ? 'Edit Bed Record' : 'Add New Bed'}
        description="Track occupancy across ward types."
        onClose={closeSheet}
        width="md"
      >
        {sheet && (
          <BedForm
            key={sheet.type === 'edit' ? sheet.bed.id : 'new'}
            initial={sheet.type === 'edit' ? sheet.bed : undefined}
            submitLabel={sheet.type === 'edit' ? 'Update Bed' : 'Save Bed'}
            onSubmit={(payload) => {
              if (sheet.type === 'edit') updateRoomBed(sheet.bed.id, payload);
              else addRoomBed(payload);
              closeSheet();
            }}
            onCancel={closeSheet}
          />
        )}
      </Sheet>
    </div>
  );
}
