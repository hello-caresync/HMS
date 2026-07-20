'use client';

import { useState } from 'react';
import { Building2, ClipboardList, Lock, Settings, Shield } from 'lucide-react';

import { DataTable, KpiGrid, Panel, SearchDesk, TabBar, ViewHeader } from './_viewUi';

type AdminTab = 'rbac' | 'audit' | 'master';

export default function AdminSettingsView() {
  const [tab, setTab] = useState<AdminTab>('rbac');
  const [search, setSearch] = useState('');

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Admin & Settings"
        subtitle="RBAC policy matrix, audit trail security logs, system master parameter configuration."
        icon={Settings}
      />
      <KpiGrid
        items={[
          { label: 'Active Roles', value: '14', icon: Shield, tone: 'cyan' },
          { label: 'Audit Events (24h)', value: '1,842', icon: ClipboardList, tone: 'indigo' },
          { label: 'Departments', value: '28', icon: Building2, tone: 'emerald' },
          { label: 'Locked Policies', value: '6', icon: Lock, tone: 'amber' },
        ]}
      />
      <SearchDesk value={search} onChange={setSearch} placeholder="Search roles, logs, master configs..." />
      <TabBar
        tabs={[
          { id: 'rbac', label: 'RBAC Matrix' },
          { id: 'audit', label: 'Audit Trail' },
          { id: 'master', label: 'Master Parameters' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === 'rbac' && (
        <Panel title="Role-Based Access Control Policy Matrix">
          <DataTable
            columns={['Role', 'Module', 'Permission']}
            rows={[
              ['Consultant', 'EMR', 'Read/Write'],
              ['Billing Exec', 'Billing', 'Read/Write'],
              ['Nurse', 'MAR', 'Write'],
            ]}
          />
        </Panel>
      )}
      {tab === 'audit' && (
        <Panel title="Audit Trail Security Logs">
          <DataTable
            columns={['Timestamp', 'User', 'Action', 'Resource']}
            rows={[
              ['2026-07-16 10:42', 'admin@nexora', 'UPDATE', 'Tariff Master'],
              ['2026-07-16 10:38', 'dr.rao', 'VIEW', 'Patient UHID-8821'],
            ]}
          />
        </Panel>
      )}
      {tab === 'master' && (
        <Panel title="System Master Parameter Configs">
          <DataTable
            columns={['Category', 'Parameter', 'Value']}
            rows={[
              ['Departments', 'Cardiology', 'Active'],
              ['Specializations', 'Interventional Cardiology', 'Active'],
              ['Tariffs', 'OPD Consultation', '₹800'],
            ]}
          />
        </Panel>
      )}
    </div>
  );
}
