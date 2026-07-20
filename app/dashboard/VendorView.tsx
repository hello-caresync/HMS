'use client';

import { useState } from 'react';
import { Award, Building, Clock, FileText, Wallet } from 'lucide-react';

import { DataTable, KpiGrid, Panel, SearchDesk, TabBar, ViewHeader } from './_viewUi';

type VendorTab = 'directory' | 'compliance' | 'performance' | 'payments' | 'contracts';

export default function VendorView() {
  const [tab, setTab] = useState<VendorTab>('directory');
  const [search, setSearch] = useState('');

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Vendor Management"
        subtitle="Vendor directory, compliance badges, performance grids, payments, contract renewals."
        icon={Building}
      />
      <KpiGrid
        items={[
          { label: 'Active Vendors', value: '86', icon: Building, tone: 'cyan' },
          { label: 'Compliance Due', value: '5', icon: FileText, tone: 'amber' },
          { label: 'Avg Score', value: '88/100', icon: Award, tone: 'emerald' },
          { label: 'Renewals <30d', value: '4', icon: Clock, tone: 'rose' },
        ]}
      />
      <SearchDesk value={search} onChange={setSearch} placeholder="Search vendor directory..." />
      <TabBar
        tabs={[
          { id: 'directory', label: 'Directory' },
          { id: 'compliance', label: 'Compliance' },
          { id: 'performance', label: 'Performance' },
          { id: 'payments', label: 'Payments' },
          { id: 'contracts', label: 'Contracts' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === 'directory' && (
        <Panel title="Vendor Directory">
          <DataTable
            columns={['Vendor', 'Category', 'Contact', 'Status']}
            rows={[
              ['MedSupply Co.', 'Pharma', 'proc@medsupply.in', 'Active'],
              ['SurgicalMart', 'OT Consumables', 'sales@surgicalmart.in', 'Active'],
            ]}
          />
        </Panel>
      )}
      {tab === 'compliance' && (
        <Panel title="Compliance Status Badges">
          <DataTable
            columns={['Vendor', 'GST', 'ISO', 'Drug License']}
            rows={[
              ['MedSupply Co.', 'Valid', 'Valid', 'Valid'],
              ['SurgicalMart', 'Valid', 'Expiring', 'Valid'],
            ]}
          />
        </Panel>
      )}
      {tab === 'performance' && (
        <Panel title="Performance Evaluation Grid">
          <DataTable
            columns={['Vendor', 'OTIF', 'Quality', 'Score']}
            rows={[
              ['MedSupply Co.', '96%', '94%', '92'],
              ['SurgicalMart', '88%', '90%', '86'],
            ]}
          />
        </Panel>
      )}
      {tab === 'payments' && (
        <Panel title="Payment History Ledger">
          <DataTable
            columns={['Payment', 'Vendor', 'Amount', 'Date']}
            rows={[['PAY-771', 'MedSupply Co.', '₹2,40,000', '2026-07-10']]}
          />
        </Panel>
      )}
      {tab === 'contracts' && (
        <Panel title="Contract Renewal Countdown">
          <div className="flex items-center gap-2 text-xs text-amber-300">
            <Wallet className="h-4 w-4" />
            SurgicalMart MSA renews in 18 days
          </div>
        </Panel>
      )}
    </div>
  );
}
