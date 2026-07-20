'use client';

import { useState } from 'react';
import { Building2, FileCheck, ShieldCheck, Wallet } from 'lucide-react';

import { DataTable, KpiGrid, Panel, SearchDesk, TabBar, ViewHeader } from './_viewUi';

type TpaTab = 'preauth' | 'docs' | 'settlement' | 'copay' | 'credit';

export default function InsuranceTpaView() {
  const [tab, setTab] = useState<TpaTab>('preauth');
  const [search, setSearch] = useState('');
  const [claims, setClaims] = useState([
    { id: 'CLM-882', payer: 'Star Health', patient: 'Rahul Sharma', status: 'Pre-auth approved' },
    { id: 'CLM-883', payer: 'HDFC ERGO', patient: 'Meera K.', status: 'Documentation review' },
  ]);

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Insurance & TPA"
        subtitle="Pre-authorization desk, claim documentation, settlement tracker, co-pay parser."
        icon={ShieldCheck}
      />
      <KpiGrid
        items={[
          { label: 'Pre-auth Pending', value: '18', icon: FileCheck, tone: 'amber' },
          { label: 'Claims Submitted', value: '42', icon: Building2, tone: 'cyan' },
          { label: 'Settlements MTD', value: '₹2.1L', icon: Wallet, tone: 'emerald' },
          { label: 'Denials', value: '3', icon: ShieldCheck, tone: 'rose' },
        ]}
      />
      <SearchDesk value={search} onChange={setSearch} placeholder="Search TPA claims..." />
      <TabBar
        tabs={[
          { id: 'preauth', label: 'Pre-Authorization' },
          { id: 'docs', label: 'Doc Review' },
          { id: 'settlement', label: 'Settlement' },
          { id: 'copay', label: 'Co-pay Parser' },
          { id: 'credit', label: 'Corporate Credit' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {(tab === 'preauth' || tab === 'docs' || tab === 'settlement') && (
        <Panel title="TPA Claims Management Board">
          <DataTable
            columns={['Claim', 'Payer', 'Patient', 'Status']}
            rows={claims
              .filter((row) => row.patient.toLowerCase().includes(search.toLowerCase()))
              .map((row) => [row.id, row.payer, row.patient, row.status])}
          />
          <button
            type="button"
            onClick={() =>
              setClaims((rows) => [
                ...rows,
                {
                  id: `CLM-${884 + rows.length}`,
                  payer: 'ICICI Lombard',
                  patient: 'New Claim',
                  status: 'Submitted',
                },
              ])
            }
            className="mt-3 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white"
          >
            Submit Claim Batch
          </button>
        </Panel>
      )}
      {tab === 'copay' && (
        <Panel title="Co-pay / Deductible Parser Panels">
          <DataTable
            columns={['Policy', 'Co-pay', 'Deductible Remaining']}
            rows={[
              ['Corp Plan A', '10%', '₹12,000'],
              ['Retail Plan B', '20%', '₹25,000'],
            ]}
          />
        </Panel>
      )}
      {tab === 'credit' && (
        <Panel title="Corporate Credit Limit Logs">
          <DataTable
            columns={['Corporate', 'Limit', 'Utilized']}
            rows={[
              ['TechCorp India', '₹50L', '₹18L'],
              ['Nexora Staff Plan', '₹10L', '₹2.4L'],
            ]}
          />
        </Panel>
      )}
    </div>
  );
}
