'use client';

import { useState } from 'react';
import { CalendarOff, Fingerprint, UserPlus, Users, Wallet } from 'lucide-react';

import { DataTable, KpiGrid, Panel, SearchDesk, TabBar, ViewHeader } from './_viewUi';

type HrmsTab = 'directory' | 'attendance' | 'leave' | 'payroll' | 'recruitment';

export default function HrmsView() {
  const [tab, setTab] = useState<HrmsTab>('directory');
  const [search, setSearch] = useState('');

  return (
    <div className="space-y-6">
      <ViewHeader
        title="HRMS"
        subtitle="Employee master directory, biometric attendance, leave approvals, payroll, recruitment."
        icon={Users}
      />
      <KpiGrid
        items={[
          { label: 'Total Employees', value: '842', icon: Users, tone: 'cyan' },
          { label: 'Present Today', value: '612', icon: Fingerprint, tone: 'emerald' },
          { label: 'Leave Requests', value: '9', icon: CalendarOff, tone: 'amber' },
          { label: 'Open Requisitions', value: '14', icon: UserPlus, tone: 'indigo' },
        ]}
      />
      <SearchDesk value={search} onChange={setSearch} placeholder="Search employee directory..." />
      <TabBar
        tabs={[
          { id: 'directory', label: 'Employee Master' },
          { id: 'attendance', label: 'Biometric Logs' },
          { id: 'leave', label: 'Leave Approval' },
          { id: 'payroll', label: 'Payroll Board' },
          { id: 'recruitment', label: 'Recruitment' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === 'directory' && (
        <Panel title="Employee Master Directory">
          <DataTable
            columns={['ID', 'Name', 'Department', 'Role']}
            rows={[
              ['EMP-441', 'Anitha Raj', 'Nursing', 'Charge Nurse'],
              ['EMP-442', 'Rajesh Misra', 'General Medicine', 'Consultant'],
            ]}
          />
        </Panel>
      )}
      {tab === 'attendance' && (
        <Panel title="Biometric Attendance Logs">
          <DataTable
            columns={['Employee', 'Clock In', 'Clock Out', 'Status']}
            rows={[
              ['Anitha Raj', '07:58', '—', 'Present'],
              ['Rajesh Misra', '08:42', '—', 'Late'],
            ]}
          />
        </Panel>
      )}
      {tab === 'leave' && (
        <Panel title="Leave Approval Interface">
          <DataTable
            columns={['Request', 'Employee', 'Dates', 'Status']}
            rows={[['LV-881', 'Anitha Raj', 'Jul 20-22', 'Pending']]}
          />
        </Panel>
      )}
      {tab === 'payroll' && (
        <Panel title="Payroll Processing Board">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Wallet className="h-4 w-4 text-emerald-400" />
            July payroll cycle — 72% processed | Net disbursement: ₹42.8L
          </div>
        </Panel>
      )}
      {tab === 'recruitment' && (
        <Panel title="Recruitment Tracking Loop">
          <DataTable
            columns={['Req', 'Role', 'Stage', 'Candidates']}
            rows={[
              ['REC-12', 'Lab Technician', 'Interview', '8'],
              ['REC-13', 'Billing Executive', 'Screening', '24'],
            ]}
          />
        </Panel>
      )}
    </div>
  );
}
