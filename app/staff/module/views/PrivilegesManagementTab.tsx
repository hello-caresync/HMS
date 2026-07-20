'use client';

import { DollarSign, Lock, ShieldCheck } from 'lucide-react';

import {
  MOCK_PAYSLIP_LOGS,
  PERMISSION_MATRIX,
  SALARY_STRUCTURES,
  formatInr,
} from '../lib/staffMockData';
import { StaffPanel, StatusPill } from '../components/staffUi';

export default function PrivilegesManagementTab() {
  return (
    <div className="space-y-3">
      <StaffPanel title="Role & Access Control Matrix" icon={ShieldCheck} subtitle="Admin · HR · Dept Head · IT · Employee self-service">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                <th className="px-2 py-2 text-[9px] font-bold uppercase text-slate-500">Module / Permission</th>
                {['Admin', 'HR', 'Dept Head', 'IT', 'Employee'].map((h) => (
                  <th key={h} className="px-2 py-2 text-center text-[9px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_MATRIX.map((row) => (
                <tr key={row.module} className="border-b border-slate-50">
                  <td className="px-2 py-1.5 text-[10px] font-medium text-[#0F172A]">{row.module}</td>
                  <td className="px-2 py-1.5 text-center"><PermCheck checked={row.admin} /></td>
                  <td className="px-2 py-1.5 text-center"><PermCheck checked={row.hr} /></td>
                  <td className="px-2 py-1.5 text-center"><PermCheck checked={row.deptHead} /></td>
                  <td className="px-2 py-1.5 text-center"><PermCheck checked={row.it} /></td>
                  <td className="px-2 py-1.5 text-center"><PermCheck checked={row.employee} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 flex items-center gap-1 text-[9px] text-slate-500">
          <Lock className="h-3 w-3" /> Device access permissions managed via IT terminal registry — changes audited
        </p>
      </StaffPanel>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <StaffPanel title="Salary Structure Configuration" icon={DollarSign} subtitle="Pay bands · component breakdown">
          <ul className="space-y-2">
            {SALARY_STRUCTURES.map((s) => (
              <li key={s.band} className="rounded border border-[#E2E8F0] px-2.5 py-2">
                <p className="text-[10px] font-bold text-[#0F172A]">{s.band}</p>
                <p className="text-[10px] font-semibold text-[#2563EB]">{s.base}</p>
                <p className="text-[9px] text-slate-500">{s.components}</p>
              </li>
            ))}
          </ul>
        </StaffPanel>

        <StaffPanel title="Payslip Generation Logs" icon={DollarSign} subtitle="Jun 2026 payroll cycle">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                {['Employee', 'Period', 'Amount', 'Status'].map((h) => (
                  <th key={h} className="pb-1.5 pr-2 text-[9px] font-bold uppercase text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_PAYSLIP_LOGS.map((p) => (
                <tr key={p.id} className="border-b border-slate-50">
                  <td className="py-1.5 pr-2 text-[10px] font-semibold text-[#0F172A]">{p.employeeName}</td>
                  <td className="py-1.5 pr-2 text-[10px] text-slate-600">{p.period}</td>
                  <td className="py-1.5 pr-2 text-[10px] font-bold tabular-nums">{formatInr(p.amount)}</td>
                  <td className="py-1.5"><StatusPill status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'Processed', value: 462 },
              { label: 'Pending', value: 18 },
              { label: 'On Hold', value: 6 },
            ].map((k) => (
              <div key={k.label} className="rounded bg-[#F8FAFC] p-2">
                <p className="text-sm font-bold text-[#0F172A]">{k.value}</p>
                <p className="text-[8px] uppercase text-slate-500">{k.label}</p>
              </div>
            ))}
          </div>
        </StaffPanel>
      </div>
    </div>
  );
}

function PermCheck({ checked }: { checked: boolean }) {
  return checked ? (
    <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-[#2563EB] text-[10px] text-white">✓</span>
  ) : (
    <span className="inline-flex h-4 w-4 items-center justify-center rounded border border-slate-200 bg-slate-50 text-slate-300">—</span>
  );
}
