'use client';

import { useState } from 'react';
import { GitCompare, Package, ShoppingCart, Stamp } from 'lucide-react';

import { DataTable, KpiGrid, Panel, SearchDesk, TabBar, ViewHeader } from './_viewUi';

type ProcTab = 'po' | 'requisition' | 'quotes' | 'reorder';

export default function ProcurementView() {
  const [tab, setTab] = useState<ProcTab>('po');
  const [search, setSearch] = useState('');
  const [pos, setPos] = useState([
    { id: 'PO-4412', vendor: 'MedSupply Co.', amount: '₹2,40,000', status: 'Awaiting GRN' },
    { id: 'PO-4413', vendor: 'SurgicalMart', amount: '₹88,000', status: 'Approved' },
  ]);

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Procurement"
        subtitle="PO builder, requisition approvals, quotation comparison, reorder triggers."
        icon={ShoppingCart}
      />
      <KpiGrid
        items={[
          { label: 'Open POs', value: '38', icon: ShoppingCart, tone: 'cyan' },
          { label: 'Pending Approvals', value: '7', icon: Stamp, tone: 'amber' },
          { label: 'Active RFQs', value: '5', icon: GitCompare, tone: 'indigo' },
          { label: 'Reorder Alerts', value: '12', icon: Package, tone: 'rose' },
        ]}
      />
      <SearchDesk value={search} onChange={setSearch} placeholder="Search procurement pipeline..." />
      <TabBar
        tabs={[
          { id: 'po', label: 'PO Builder' },
          { id: 'requisition', label: 'Requisitions' },
          { id: 'quotes', label: 'Quote Compare' },
          { id: 'reorder', label: 'Reorder Triggers' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === 'po' && (
        <Panel title="Purchase Order Builder">
          <DataTable
            columns={['PO', 'Vendor', 'Amount', 'Status']}
            rows={pos.map((row) => [row.id, row.vendor, row.amount, row.status])}
          />
          <button
            type="button"
            onClick={() =>
              setPos((rows) => [
                {
                  id: `PO-${4414 + rows.length}`,
                  vendor: 'New Vendor',
                  amount: '₹50,000',
                  status: 'Draft',
                },
                ...rows,
              ])
            }
            className="mt-3 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white"
          >
            Create PO Draft
          </button>
        </Panel>
      )}
      {tab === 'requisition' && (
        <Panel title="Requisition Approval Workflow Tree">
          <DataTable
            columns={['Req', 'Department', 'Stage']}
            rows={[
              ['REQ-881', 'Pharmacy', 'HOD Approved → Finance'],
              ['REQ-882', 'OT', 'Pending HOD'],
            ]}
          />
        </Panel>
      )}
      {tab === 'quotes' && (
        <Panel title="Quotation Comparison Matrix">
          <DataTable
            columns={['Vendor', 'Quote', 'Lead Time', 'Score']}
            rows={[
              ['MedSupply Co.', '₹2,38,000', '5 days', '92'],
              ['HealthProc Ltd.', '₹2,45,000', '3 days', '88'],
            ]}
          />
        </Panel>
      )}
      {tab === 'reorder' && (
        <Panel title="Minimum Stock Reorder Triggers">
          <DataTable
            columns={['SKU', 'On Hand', 'Reorder Point', 'Action']}
            rows={[
              ['Gloves Nitrile M', '120', '200', 'Auto-PO draft ready'],
              ['IV Set Standard', '45', '80', 'RFQ suggested'],
            ]}
          />
        </Panel>
      )}
    </div>
  );
}
