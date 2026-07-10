'use client';

import { useMemo, useState } from 'react';
import { Building2 } from 'lucide-react';

import { useMasterData } from '../../context/MasterDataProvider';
import type { VendorMaster } from '../../types';
import VendorForm from '../forms/VendorForm';
import DataTable from '../shared/DataTable';
import MasterToolbar, { filterByQuery, RowActions } from '../shared/MasterToolbar';
import Sheet from '../shared/Sheet';
import StatusBadge from '../shared/StatusBadge';

type SheetMode = { type: 'add' } | { type: 'edit'; vendor: VendorMaster } | null;

export default function VendorDirectoryView() {
  const { data, addVendor, updateVendor, removeVendor } = useMasterData();
  const [search, setSearch] = useState('');
  const [sheet, setSheet] = useState<SheetMode>(null);

  const filtered = useMemo(
    () =>
      filterByQuery(
        data.vendors,
        search,
        (v) => `${v.vendorName} ${v.contactPerson} ${v.taxId} ${v.supplyCategory}`,
      ),
    [data.vendors, search],
  );

  const closeSheet = () => setSheet(null);

  return (
    <div className="space-y-3">
      <div>
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Building2 className="h-4 w-4 text-primary" />
          Vendor Master
        </h2>
        <p className="text-[11px] text-slate-800">Procurement partner directory with GSTIN validation</p>
      </div>

      <MasterToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search company, contact, GSTIN, category…"
        recordCount={filtered.length}
        recordLabel="vendors"
        onAdd={() => setSheet({ type: 'add' })}
        addLabel="Add Vendor"
      />

      <DataTable
        columns={[
          { key: 'company', header: 'Company Name' },
          { key: 'contact', header: 'Contact' },
          { key: 'gstin', header: 'GSTIN' },
          { key: 'category', header: 'Supply Category' },
          { key: 'status', header: 'Status' },
          { key: 'action', header: 'Action', className: 'text-right w-28' },
        ]}
        rows={filtered.map((v) => ({
          company: <span className="font-medium text-slate-900">{v.vendorName}</span>,
          contact: <span className="text-xs text-slate-800">{v.contactPerson || '—'}</span>,
          gstin: <span className="font-mono text-[11px]">{v.taxId}</span>,
          category: <StatusBadge label={v.supplyCategory} tone="info" />,
          status: (
            <StatusBadge
              label={v.active ? 'Active' : 'Inactive'}
              tone={v.active ? 'success' : 'neutral'}
            />
          ),
          action: (
            <RowActions
              onEdit={() => setSheet({ type: 'edit', vendor: v })}
              onDelete={() => {
                if (confirm(`Remove ${v.vendorName}?`)) removeVendor(v.id);
              }}
            />
          ),
        }))}
        emptyMessage={search ? 'No vendors match your search.' : 'No vendors registered.'}
      />

      <Sheet
        open={sheet !== null}
        title={sheet?.type === 'edit' ? 'Edit Vendor' : 'Add New Vendor'}
        description="GSTIN must be exactly 15 characters."
        onClose={closeSheet}
        width="lg"
      >
        {sheet && (
          <VendorForm
            key={sheet.type === 'edit' ? sheet.vendor.id : 'new'}
            initial={sheet.type === 'edit' ? sheet.vendor : undefined}
            submitLabel={sheet.type === 'edit' ? 'Update Vendor' : 'Save Vendor'}
            onSubmit={(payload) => {
              if (sheet.type === 'edit') updateVendor(sheet.vendor.id, payload);
              else addVendor(payload);
              closeSheet();
            }}
            onCancel={closeSheet}
          />
        )}
      </Sheet>
    </div>
  );
}
