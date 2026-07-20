'use client';

import { useState } from 'react';
import { AlertTriangle, Lock, Pill, RefreshCw, ShieldCheck, ShoppingBag } from 'lucide-react';

import { DataTable, KpiGrid, Panel, SearchDesk, TabBar, ViewHeader } from './_viewUi';

type PharmTab = 'dispensary' | 'substitution' | 'stock' | 'narcotics' | 'eprescribe';

export default function PharmacyView() {
  const [tab, setTab] = useState<PharmTab>('dispensary');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState([
    { id: 'RX-901', patient: 'Rahul Sharma', drug: 'Metformin 500mg', source: 'OPD', status: 'Queued' },
    { id: 'RX-902', patient: 'Meera K.', drug: 'Salbutamol Neb', source: 'IPD', status: 'Verified' },
  ]);

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Pharmacy Dispensary"
        subtitle="OPD/IPD order desk, substitutions, stock alerts, narcotics registry, e-Rx verification."
        icon={Pill}
      />
      <KpiGrid
        items={[
          { label: 'Rx Queue', value: '89', icon: ShoppingBag, tone: 'cyan' },
          { label: 'Low Stock SKUs', value: '23', icon: AlertTriangle, tone: 'amber' },
          { label: 'Narcotics Vault', value: 'Secure', icon: Lock, tone: 'rose' },
          { label: 'Verified Today', value: '1,140', icon: ShieldCheck, tone: 'emerald' },
        ]}
      />
      <SearchDesk value={search} onChange={setSearch} placeholder="Search dispensary orders..." />
      <TabBar
        tabs={[
          { id: 'dispensary', label: 'Order Desk' },
          { id: 'substitution', label: 'Substitution Engine' },
          { id: 'stock', label: 'Stock Alerts' },
          { id: 'narcotics', label: 'Narcotics Registry' },
          { id: 'eprescribe', label: 'E-Rx Verify' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === 'dispensary' && (
        <Panel title="Live Dispensary Order Desk">
          <DataTable
            columns={['Rx', 'Patient', 'Drug', 'Source', 'Status']}
            rows={orders
              .filter((row) => row.patient.toLowerCase().includes(search.toLowerCase()))
              .map((row) => [row.id, row.patient, row.drug, row.source, row.status])}
          />
        </Panel>
      )}
      {tab === 'substitution' && (
        <Panel title="Drug Substitution Engine">
          <DataTable
            columns={['Ordered', 'Substitute', 'Reason']}
            rows={[
              ['Brand A Atorvastatin', 'Generic Atorvastatin', 'Formulary preferred'],
            ]}
          />
        </Panel>
      )}
      {tab === 'stock' && (
        <Panel title="Stock Alert Indicators">
          <ul className="space-y-2 text-xs text-amber-300">
            <li>Amoxicillin 500mg — below reorder point</li>
            <li>Insulin Glargine — 18 days to expiry batch</li>
          </ul>
        </Panel>
      )}
      {tab === 'narcotics' && (
        <Panel title="Narcotics Registry Ledger">
          <DataTable
            columns={['Drug', 'Balance', 'Last Issue']}
            rows={[
              ['Morphine 10mg amp', '42', '2026-07-16 08:12'],
              ['Fentanyl patch', '16', '2026-07-15 21:40'],
            ]}
          />
        </Panel>
      )}
      {tab === 'eprescribe' && (
        <Panel title="E-Prescribing Verification Workflow">
          <button
            type="button"
            onClick={() =>
              setOrders((rows) =>
                rows.map((row) => (row.id === 'RX-901' ? { ...row, status: 'Verified' } : row)),
              )
            }
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Verify Selected Rx
          </button>
        </Panel>
      )}
    </div>
  );
}
