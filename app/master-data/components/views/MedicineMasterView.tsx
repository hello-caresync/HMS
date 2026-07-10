'use client';

import { useMemo, useState } from 'react';
import { Pill } from 'lucide-react';

import { useMasterData } from '../../context/MasterDataProvider';
import { formatCurrency } from '../../lib/seedData';
import type { MedicineMaster } from '../../types';
import MedicineForm from '../forms/MedicineForm';
import DataTable from '../shared/DataTable';
import MasterToolbar, { filterByQuery, RowActions } from '../shared/MasterToolbar';
import Sheet from '../shared/Sheet';
import StatusBadge from '../shared/StatusBadge';

type SheetMode = { type: 'add' } | { type: 'edit'; medicine: MedicineMaster } | null;

export default function MedicineMasterView() {
  const { data, addMedicine, updateMedicine, removeMedicine, getVendorName } = useMasterData();
  const [search, setSearch] = useState('');
  const [sheet, setSheet] = useState<SheetMode>(null);

  const filtered = useMemo(
    () =>
      filterByQuery(
        data.medicines,
        search,
        (m) =>
          `${m.brandName} ${m.genericName} ${m.hsnCode} ${m.unit} ${getVendorName(m.vendorId)}`,
      ),
    [data.medicines, search, getVendorName],
  );

  const closeSheet = () => setSheet(null);

  return (
    <div className="space-y-3">
      <div>
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Pill className="h-4 w-4 text-primary" />
          Medicine Master
        </h2>
        <p className="text-[11px] text-slate-800">Pharmacy SKU catalog · HSN · GST · vendor linkage</p>
      </div>

      <MasterToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search brand, generic, HSN, vendor…"
        recordCount={filtered.length}
        recordLabel="SKUs"
        onAdd={() => setSheet({ type: 'add' })}
        addLabel="Add Medicine"
      />

      <DataTable
        columns={[
          { key: 'brand', header: 'Brand Name' },
          { key: 'generic', header: 'Generic Name' },
          { key: 'hsn', header: 'HSN Code' },
          { key: 'gst', header: 'GST %' },
          { key: 'unit', header: 'Unit' },
          { key: 'mrp', header: 'MRP' },
          { key: 'vendor', header: 'Vendor' },
          { key: 'action', header: 'Action', className: 'text-right w-28' },
        ]}
        rows={filtered.map((med) => ({
          brand: <span className="font-medium text-slate-900">{med.brandName}</span>,
          generic: <span className="text-xs text-slate-800">{med.genericName}</span>,
          hsn: <span className="font-mono text-[11px]">{med.hsnCode}</span>,
          gst: <StatusBadge label={`${med.gstPercentage}%`} tone="warning" />,
          unit: med.unit,
          mrp: <span className="font-semibold tabular-nums">{formatCurrency(med.mrp)}</span>,
          vendor: <span className="text-xs text-slate-800">{getVendorName(med.vendorId)}</span>,
          action: (
            <RowActions
              onEdit={() => setSheet({ type: 'edit', medicine: med })}
              onDelete={() => {
                if (confirm(`Remove ${med.brandName} from catalog?`)) removeMedicine(med.id);
              }}
            />
          ),
        }))}
        emptyMessage={search ? 'No medicines match your search.' : 'No medicines in catalog.'}
      />

      <Sheet
        open={sheet !== null}
        title={sheet?.type === 'edit' ? 'Edit Medicine SKU' : 'Add New Medicine'}
        description="Base price + GST auto-calculates final MRP."
        onClose={closeSheet}
        width="xl"
      >
        {sheet && (
          <MedicineForm
            key={sheet.type === 'edit' ? sheet.medicine.id : 'new'}
            vendors={data.vendors}
            initial={sheet.type === 'edit' ? sheet.medicine : undefined}
            submitLabel={sheet.type === 'edit' ? 'Update Medicine' : 'Save Medicine'}
            onSubmit={(payload) => {
              if (sheet.type === 'edit') updateMedicine(sheet.medicine.id, payload);
              else addMedicine(payload);
              closeSheet();
            }}
            onCancel={closeSheet}
          />
        )}
      </Sheet>
    </div>
  );
}
