'use client';

import { useState } from 'react';
import { CreditCard, DollarSign, Receipt, RefreshCcw, TrendingUp, Wallet } from 'lucide-react';

import { DataTable, KpiGrid, Panel, SearchDesk, TabBar, ViewHeader } from './_viewUi';

type BillTab = 'invoice' | 'interim' | 'pos' | 'refunds';

export default function BillingView() {
  const [tab, setTab] = useState<BillTab>('invoice');
  const [search, setSearch] = useState('');
  const [invoices, setInvoices] = useState([
    { id: 'INV-982', patient: 'Rahul Sharma', amount: '₹42,800', status: 'Pending' },
    { id: 'INV-981', patient: 'Priya Patel', amount: '₹8,420', status: 'Paid' },
  ]);

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Billing & Revenue"
        subtitle="Invoice generator, interim bills, POS ledger, refunds, and revenue KPIs."
        icon={CreditCard}
      />
      <KpiGrid
        items={[
          { label: "Today's Collections", value: '₹4,82,900', icon: TrendingUp, tone: 'emerald' },
          { label: 'Pending Dues', value: '₹1,24,500', icon: Wallet, tone: 'amber' },
          { label: 'Invoices Open', value: '156', icon: Receipt, tone: 'cyan' },
          { label: 'Refunds Today', value: '₹12,400', icon: RefreshCcw, tone: 'rose' },
        ]}
      />
      <SearchDesk value={search} onChange={setSearch} placeholder="Search billing ledger..." />
      <TabBar
        tabs={[
          { id: 'invoice', label: 'Final Invoice' },
          { id: 'interim', label: 'Interim Bills' },
          { id: 'pos', label: 'POS Ledger' },
          { id: 'refunds', label: 'Refunds' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === 'invoice' && (
        <Panel title="Final Invoice Generator">
          <DataTable
            columns={['Invoice', 'Patient', 'Amount', 'Status']}
            rows={invoices
              .filter((row) => row.patient.toLowerCase().includes(search.toLowerCase()))
              .map((row) => [row.id, row.patient, row.amount, row.status])}
          />
          <button
            type="button"
            onClick={() =>
              setInvoices((rows) => [
                {
                  id: `INV-${980 + rows.length}`,
                  patient: 'New Patient',
                  amount: '₹15,000',
                  status: 'Pending',
                },
                ...rows,
              ])
            }
            className="mt-3 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white"
          >
            Generate Invoice
          </button>
        </Panel>
      )}
      {tab === 'interim' && (
        <Panel title="Interim Bills Audit Desk">
          <DataTable
            columns={['Bill', 'Ward', 'Running Total']}
            rows={[
              ['INT-441', 'ICU-A', '₹18,200'],
              ['INT-442', 'Gen-2', '₹6,800'],
            ]}
          />
        </Panel>
      )}
      {tab === 'pos' && (
        <Panel title="Cash / Card / UPI POS Processing Ledger">
          <DataTable
            columns={['Txn', 'Mode', 'Amount']}
            rows={[
              ['POS-771', 'UPI', '₹4,200'],
              ['POS-772', 'Card', '₹12,800'],
              ['POS-773', 'Cash', '₹2,000'],
            ]}
          />
        </Panel>
      )}
      {tab === 'refunds' && (
        <Panel title="Refunding Ledger">
          <DataTable
            columns={['Refund', 'Reason', 'Amount']}
            rows={[['RF-12', 'Duplicate charge', '₹1,200']]}
          />
        </Panel>
      )}
    </div>
  );
}
