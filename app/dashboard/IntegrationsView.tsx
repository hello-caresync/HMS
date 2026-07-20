'use client';

import { useState } from 'react';
import { Activity, CreditCard, Database, Globe, Radio, Wifi } from 'lucide-react';

import { DataTable, KpiGrid, Panel, SearchDesk, TabBar, ViewHeader } from './_viewUi';

type IntegrationsTab = 'abdm' | 'fhir' | 'iot' | 'payments';

export default function IntegrationsView() {
  const [tab, setTab] = useState<IntegrationsTab>('abdm');
  const [search, setSearch] = useState('');

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Integrations Hub"
        subtitle="ABDM sandbox sync, FHIR pipelines, IoT telemetry feeds, payment gateway APIs."
        icon={Globe}
      />
      <KpiGrid
        items={[
          { label: 'ABDM Sync', value: 'Online', icon: Globe, tone: 'emerald' },
          { label: 'FHIR Pipelines', value: '3', icon: Database, tone: 'cyan' },
          { label: 'IoT Devices', value: '42', icon: Radio, tone: 'indigo' },
          { label: 'Payment APIs', value: '2', icon: CreditCard, tone: 'amber' },
        ]}
      />
      <SearchDesk value={search} onChange={setSearch} placeholder="Search integrations..." />
      <TabBar
        tabs={[
          { id: 'abdm', label: 'ABDM Sandbox' },
          { id: 'fhir', label: 'FHIR Pipeline' },
          { id: 'iot', label: 'IoT Telemetry' },
          { id: 'payments', label: 'Payment Gateway' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === 'abdm' && (
        <Panel title="ABDM (Ayushman Bharat) Sandbox Sync Status">
          <DataTable
            columns={['Endpoint', 'Last Sync', 'Status']}
            rows={[
              ['Health ID Create', '2m ago', 'Success'],
              ['Consent Manager', '5m ago', 'Success'],
            ]}
          />
          <Wifi className="mt-3 h-4 w-4 text-emerald-400" />
        </Panel>
      )}
      {tab === 'fhir' && (
        <Panel title="FHIR Data Pipeline Maps">
          <DataTable
            columns={['Resource', 'Direction', 'Throughput']}
            rows={[
              ['Patient', 'Inbound', '1.2k/hr'],
              ['Observation', 'Outbound', '840/hr'],
            ]}
          />
        </Panel>
      )}
      {tab === 'iot' && (
        <Panel title="External IoT Device Telemetry Feeds">
          <DataTable
            columns={['Device', 'Location', 'Last Reading']}
            rows={[
              ['Bed Monitor BM-12', 'ICU-A', 'HR 88 | SpO2 97%'],
              ['Env Sensor ES-04', 'OT-2', 'Temp 21°C | RH 45%'],
            ]}
          />
        </Panel>
      )}
      {tab === 'payments' && (
        <Panel title="Third-Party Payment Gateway APIs Console">
          <DataTable
            columns={['Gateway', 'Mode', 'Status']}
            rows={[
              ['Razorpay', 'UPI + Card', 'Active'],
              ['PayU', 'Net Banking', 'Active'],
            ]}
          />
          <Activity className="mt-3 h-4 w-4 text-cyan-400" />
        </Panel>
      )}
    </div>
  );
}
