'use client';

import { useState } from 'react';
import { AlertTriangle, FlaskConical, PenLine, ScanBarcode, TestTube } from 'lucide-react';

import { DataTable, KpiGrid, Panel, SearchDesk, TabBar, ViewHeader } from './_viewUi';

type LabTab = 'orders' | 'samples' | 'results' | 'critical' | 'signoff';

export default function LaboratoryView() {
  const [tab, setTab] = useState<LabTab>('orders');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([
    { test: 'Hemoglobin', value: '11.2 g/dL', ref: '13-17', flag: 'Low' },
    { test: 'WBC', value: '8.4 x10³', ref: '4-11', flag: 'Normal' },
  ]);

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Laboratory (LIS)"
        subtitle="Order intake, sample tracking, result entry, critical alerts, and e-signature approval."
        icon={FlaskConical}
      />
      <KpiGrid
        items={[
          { label: 'Orders In Queue', value: '126', icon: TestTube, tone: 'cyan' },
          { label: 'Samples In Transit', value: '34', icon: ScanBarcode, tone: 'indigo' },
          { label: 'Critical Values', value: '5', icon: AlertTriangle, tone: 'rose' },
          { label: 'Pending Sign-off', value: '11', icon: PenLine, tone: 'amber' },
        ]}
      />
      <SearchDesk value={search} onChange={setSearch} placeholder="Search lab orders and samples..." />
      <TabBar
        tabs={[
          { id: 'orders', label: 'Order Queue' },
          { id: 'samples', label: 'Sample Tracking' },
          { id: 'results', label: 'Result Entry' },
          { id: 'critical', label: 'Critical Ticker' },
          { id: 'signoff', label: 'E-Signature' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === 'orders' && (
        <Panel title="LIS Order Intake Queue">
          <DataTable
            columns={['Order', 'Patient', 'Panel', 'Priority']}
            rows={[
              ['LAB-4412', 'Rahul Sharma', 'CBC', 'STAT'],
              ['LAB-4413', 'Priya Patel', 'LFT', 'Routine'],
            ]}
          />
        </Panel>
      )}
      {tab === 'samples' && (
        <Panel title="Barcode / Sample Tracking Log">
          <DataTable
            columns={['Barcode', 'Specimen', 'Location', 'Status']}
            rows={[
              ['BC-98214', 'Blood EDTA', 'Centrifuge A', 'Processing'],
              ['BC-98215', 'Serum', 'Analyzer 2', 'Queued'],
            ]}
          />
        </Panel>
      )}
      {tab === 'results' && (
        <Panel title="Test Parameter Results Grid">
          <DataTable
            columns={['Parameter', 'Value', 'Reference', 'Flag']}
            rows={results.map((row) => [
              row.test,
              row.value,
              row.ref,
              <span key={row.test} className={row.flag === 'Low' ? 'text-amber-400' : 'text-emerald-400'}>
                {row.flag}
              </span>,
            ])}
          />
          <button
            type="button"
            onClick={() =>
              setResults((rows) => [...rows, { test: 'Platelet', value: '210 x10³', ref: '150-400', flag: 'Normal' }])
            }
            className="mt-3 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white"
          >
            Add Result Row
          </button>
        </Panel>
      )}
      {tab === 'critical' && (
        <Panel title="Critical Value Alert Ticker">
          <ul className="space-y-2 text-xs text-rose-300">
            <li className="animate-pulse rounded border border-rose-900/40 bg-rose-500/10 p-2">
              K+ 6.2 mmol/L — NX-415 — physician ack pending
            </li>
          </ul>
        </Panel>
      )}
      {tab === 'signoff' && (
        <Panel title="Report E-Signature Approval">
          <DataTable
            columns={['Report', 'Pathologist', 'Status']}
            rows={[
              ['CBC — NX-412', 'Dr. Sinha', 'Awaiting sign'],
              ['LFT — NX-413', 'Dr. Sinha', 'Signed'],
            ]}
          />
        </Panel>
      )}
    </div>
  );
}
