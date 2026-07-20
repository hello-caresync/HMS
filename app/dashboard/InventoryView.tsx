'use client';

import { useState } from 'react';
import { ArrowLeftRight, Boxes, CalendarClock, Package, Warehouse } from 'lucide-react';

import { DataTable, KpiGrid, Panel, SearchDesk, TabBar, ViewHeader } from './_viewUi';

type InvTab = 'ledger' | 'batch' | 'transfer' | 'adjust';

export default function InventoryView() {
  const [tab, setTab] = useState<InvTab>('ledger');
  const [search, setSearch] = useState('');

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Inventory & Warehouse"
        subtitle="Central stock ledger, batch/expiry tracking, transfers, adjustments."
        icon={Package}
      />
      <KpiGrid
        items={[
          { label: 'SKUs Tracked', value: '4,820', icon: Boxes, tone: 'cyan' },
          { label: 'Warehouse Units', value: '3', icon: Warehouse, tone: 'indigo' },
          { label: 'Expiry Alerts', value: '17', icon: CalendarClock, tone: 'amber' },
          { label: 'Transfers Today', value: '8', icon: ArrowLeftRight, tone: 'emerald' },
        ]}
      />
      <SearchDesk value={search} onChange={setSearch} placeholder="Search inventory SKU or batch..." />
      <TabBar
        tabs={[
          { id: 'ledger', label: 'Stock Ledger' },
          { id: 'batch', label: 'Batch / Expiry' },
          { id: 'transfer', label: 'Transfers' },
          { id: 'adjust', label: 'Adjustments' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === 'ledger' && (
        <Panel title="Central Warehouse Stock Ledger">
          <DataTable
            columns={['SKU', 'Item', 'On Hand', 'Reserved']}
            rows={[
              ['SKU-441', 'Paracetamol 500mg', '12,400', '820'],
              ['SKU-882', 'Surgical Gloves M', '3,200', '140'],
            ]}
          />
        </Panel>
      )}
      {tab === 'batch' && (
        <Panel title="Batch Number & Expiry Tracking">
          <DataTable
            columns={['Batch', 'SKU', 'Expiry', 'Qty']}
            rows={[
              ['BT-2026-A14', 'SKU-441', '2026-12-01', '4,200'],
              ['BT-2026-B02', 'SKU-882', '2026-08-15', '900'],
            ]}
          />
        </Panel>
      )}
      {tab === 'transfer' && (
        <Panel title="Stock Transfer Logs">
          <DataTable
            columns={['Transfer', 'From', 'To', 'Status']}
            rows={[
              ['TR-771', 'Central WH', 'Pharmacy', 'Completed'],
              ['TR-772', 'Central WH', 'OT Store', 'In transit'],
            ]}
          />
        </Panel>
      )}
      {tab === 'adjust' && (
        <Panel title="Stock Adjustment Matrix">
          <DataTable
            columns={['Adj ID', 'Reason', 'Delta', 'Approver']}
            rows={[
              ['ADJ-12', 'Cycle count variance', '-24', 'Store Manager'],
              ['ADJ-13', 'Damaged goods', '-8', 'QA Lead'],
            ]}
          />
        </Panel>
      )}
    </div>
  );
}
