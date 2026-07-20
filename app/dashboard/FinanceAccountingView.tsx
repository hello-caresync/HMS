'use client';

import { useState } from 'react';
import { Calculator, DollarSign, Landmark, PieChart, Receipt } from 'lucide-react';

import { DataTable, KpiGrid, Panel, SearchDesk, TabBar, ViewHeader } from './_viewUi';

type FinTab = 'ledger' | 'pnl' | 'apar' | 'budget' | 'gst';

export default function FinanceAccountingView() {
  const [tab, setTab] = useState<FinTab>('ledger');
  const [search, setSearch] = useState('');

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Finance & Accounting"
        subtitle="Double-entry ledger, P&L, AP/AR, departmental budgets, GST summaries."
        icon={DollarSign}
      />
      <KpiGrid
        items={[
          { label: 'Net Collections MTD', value: '₹18.4L', icon: DollarSign, tone: 'emerald' },
          { label: 'Accounts Payable', value: '₹4.2L', icon: Receipt, tone: 'amber' },
          { label: 'Accounts Receivable', value: '₹6.8L', icon: Landmark, tone: 'cyan' },
          { label: 'Budget Utilization', value: '72%', icon: PieChart, tone: 'indigo' },
        ]}
      />
      <SearchDesk value={search} onChange={setSearch} placeholder="Search ledger entries..." />
      <TabBar
        tabs={[
          { id: 'ledger', label: 'General Ledger' },
          { id: 'pnl', label: 'P&L Overview' },
          { id: 'apar', label: 'AP / AR' },
          { id: 'budget', label: 'Dept Budgets' },
          { id: 'gst', label: 'Tax / GST' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === 'ledger' && (
        <Panel title="Double-Entry Ledger">
          <DataTable
            columns={['Account', 'Debit', 'Credit', 'Balance']}
            rows={[
              ['Cash & Bank', '₹4,82,900', '—', '₹12.4L'],
              ['Revenue — OPD', '—', '₹2,10,000', '₹8.2L'],
            ]}
          />
        </Panel>
      )}
      {tab === 'pnl' && (
        <Panel title="Profit & Loss Overview Grid">
          <DataTable
            columns={['Line Item', 'MTD', 'YTD']}
            rows={[
              ['Revenue', '₹18.4L', '₹1.02Cr'],
              ['Operating Expense', '₹12.1L', '₹68L'],
              ['Net Margin', '34%', '33%'],
            ]}
          />
        </Panel>
      )}
      {tab === 'apar' && (
        <Panel title="Accounts Payable / Receivable Summaries">
          <DataTable
            columns={['Party', 'Type', 'Outstanding']}
            rows={[
              ['MedSupply Co.', 'AP', '₹1.2L'],
              ['Star Health TPA', 'AR', '₹2.4L'],
            ]}
          />
        </Panel>
      )}
      {tab === 'budget' && (
        <Panel title="Departmental Budget Tracker">
          <DataTable
            columns={['Department', 'Budget', 'Spent', 'Variance']}
            rows={[
              ['Radiology', '₹8L', '₹5.6L', '-₹2.4L'],
              ['Pharmacy', '₹12L', '₹11.2L', '-₹0.8L'],
            ]}
          />
        </Panel>
      )}
      {tab === 'gst' && (
        <Panel title="Tax / GST Summary Tools">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Calculator className="h-4 w-4 text-cyan-400" />
            Output GST MTD: ₹1.84L | Input GST: ₹1.12L | Net payable: ₹72,000
          </div>
        </Panel>
      )}
    </div>
  );
}
