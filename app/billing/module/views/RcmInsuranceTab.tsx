'use client';

import { Building2, Clock, Shield } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import type { InsuranceClaim } from '../lib/billingMockData';
import {
  AR_AGING,
  MOCK_AP_LINES,
  MOCK_CORPORATE,
  MOCK_EXPENSES,
  formatInr,
} from '../lib/billingMockData';
import {
  ApStatusPill,
  ClaimStagePill,
  FinPanel,
  SecureFinancialPlaceholder,
} from '../components/billingUi';

const AGING_COLORS = ['#059669', '#2563EB', '#D97706', '#DC2626'];

type RcmInsuranceTabProps = {
  claims: InsuranceClaim[];
  onAdvanceClaim: (id: string) => void;
};

export default function RcmInsuranceTab({ claims, onAdvanceClaim }: RcmInsuranceTabProps) {
  const denials = claims.filter((c) => c.stage === 'Denial Management').length;

  return (
    <div className="space-y-2">
      {denials > 0 && (
        <div className="flex items-center gap-2 rounded-md border-2 border-red-500 bg-red-600 px-3 py-1.5 text-white animate-pulse">
          <Shield className="h-4 w-4" />
          <span className="text-[10px] font-bold uppercase">{denials} Claim{denials !== 1 ? 's' : ''} in Denial Management — recovery action required</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
        <FinPanel title="Insurance & Claim Pipeline" subtitle="Pre-auth → submission → review → denial → settlement" icon={Shield} secure>
          <SecureFinancialPlaceholder verified />
          <table className="mt-2 w-full min-w-[520px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Claim #', 'Patient', 'Insurer', 'Amount', 'Approved', 'Stage', 'Denial', 'Action'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {claims.map((c) => (
                <tr key={c.id} className={`border-b border-slate-50 ${c.stage === 'Denial Management' ? 'bg-red-50/40' : c.stage === 'Under Review' ? 'bg-violet-50/20' : ''}`}>
                  <td className="px-1.5 py-1 font-mono text-[8px] font-bold text-[#2563EB]">{c.claimNumber}</td>
                  <td className="px-1.5 py-1">
                    <p className="text-[9px] font-semibold">{c.patientName}</p>
                    <p className="font-mono text-[7px] text-slate-500">{c.uhid}</p>
                  </td>
                  <td className="max-w-[80px] truncate px-1.5 py-1 text-[8px] text-slate-600" title={c.insurer}>{c.insurer}</td>
                  <td className="px-1.5 py-1 text-[9px] tabular-nums">{formatInr(c.claimAmount)}</td>
                  <td className="px-1.5 py-1 text-[9px] font-bold tabular-nums text-emerald-700">{c.approvedAmount ? formatInr(c.approvedAmount) : '—'}</td>
                  <td className="px-1.5 py-1">
                    <button type="button" onClick={() => onAdvanceClaim(c.id)} disabled={c.stage === 'Settlement'} title="Advance claim">
                      <ClaimStagePill stage={c.stage} />
                    </button>
                  </td>
                  <td className="max-w-[90px] truncate px-1.5 py-1 text-[7px] text-red-600" title={c.denialReason}>{c.denialReason ?? '—'}</td>
                  <td className="px-1.5 py-1">
                    {c.stage !== 'Settlement' && (
                      <button type="button" onClick={() => onAdvanceClaim(c.id)} className="rounded bg-[#2563EB] px-1 py-0.5 text-[7px] font-bold text-white">Advance</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </FinPanel>

        <div className="space-y-2">
          <FinPanel title="Accounts Payable & Vendor Matching" subtitle="Invoice validation · approval · payment" icon={Building2}>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                  {['Vendor', 'Invoice', 'Category', 'Amount', 'Status', 'Due'].map((h) => (
                    <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_AP_LINES.map((a) => (
                  <tr key={a.id} className="border-b border-slate-50">
                    <td className="max-w-[90px] truncate px-1.5 py-1 text-[8px] font-semibold" title={a.vendor}>{a.vendor}</td>
                    <td className="px-1.5 py-1 font-mono text-[7px] text-slate-500">{a.invoiceRef}</td>
                    <td className="px-1.5 py-1 text-[8px] text-slate-600">{a.category}</td>
                    <td className="px-1.5 py-1 text-[9px] font-bold tabular-nums">{formatInr(a.amount)}</td>
                    <td className="px-1.5 py-1"><ApStatusPill status={a.status} /></td>
                    <td className="px-1.5 py-1 text-[8px] text-slate-400">{a.dueDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </FinPanel>

          <FinPanel title="Operational Expenditure" subtitle="Salary · rent · consumables · utilities">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                  {['Category', 'Description', 'Amount', 'Period', 'Approved'].map((h) => (
                    <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_EXPENSES.map((e) => (
                  <tr key={e.id} className="border-b border-slate-50">
                    <td className="px-1.5 py-1 text-[9px] font-semibold">{e.category}</td>
                    <td className="max-w-[120px] truncate px-1.5 py-1 text-[8px] text-slate-600" title={e.description}>{e.description}</td>
                    <td className="px-1.5 py-1 text-[9px] font-bold tabular-nums">{formatInr(e.amount)}</td>
                    <td className="px-1.5 py-1 text-[8px] text-slate-500">{e.period}</td>
                    <td className="px-1.5 py-1">{e.approved ? <span className="text-[8px] font-bold text-emerald-600">Yes</span> : <span className="text-[8px] font-bold text-amber-600">Pending</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </FinPanel>

          <FinPanel title="Corporate Tie-Ups" subtitle="Credit limits · utilization · active patients">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                  {['Corporate', 'Limit', 'Utilized', 'Patients', 'Expiry'].map((h) => (
                    <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_CORPORATE.map((c) => (
                  <tr key={c.id} className="border-b border-slate-50">
                    <td className="px-1.5 py-1 text-[9px] font-semibold">{c.corporateName}</td>
                    <td className="px-1.5 py-1 text-[9px] tabular-nums">{formatInr(c.creditLimit)}</td>
                    <td className="px-1.5 py-1 text-[9px] font-bold tabular-nums text-amber-700">{formatInr(c.utilized)}</td>
                    <td className="px-1.5 py-1 text-[9px] tabular-nums">{c.activePatients}</td>
                    <td className="px-1.5 py-1 text-[8px] text-slate-500">{c.contractExpiry}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </FinPanel>
        </div>
      </div>

      <FinPanel title="Accounts Receivable (AR) Aging Analyzer" subtitle="Outstanding debt portfolio by aging interval" icon={Clock}>
        <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {AR_AGING.map((a, i) => (
              <div key={a.bucket} className={`rounded-md border p-2 ${i === 3 ? 'border-red-200 bg-red-50/40' : 'border-[#E2E8F0]'}`}>
                <p className={`text-sm font-bold tabular-nums ${i === 3 ? 'text-red-600' : i === 0 ? 'text-emerald-600' : 'text-amber-700'}`}>{formatInr(a.amount)}</p>
                <p className="text-[8px] font-bold uppercase text-slate-500">{a.bucket}</p>
                <p className="text-[8px] text-slate-400">{a.invoiceCount} invoices · {a.pct}%</p>
              </div>
            ))}
          </div>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={AR_AGING} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="bucket" tick={{ fontSize: 7, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 8, fill: '#64748B' }} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                <Tooltip contentStyle={{ fontSize: 10, borderRadius: 6, border: '1px solid #E2E8F0' }} formatter={(v: number) => formatInr(v)} />
                <Bar dataKey="amount" radius={[2, 2, 0, 0]}>
                  {AR_AGING.map((_, i) => (
                    <Cell key={i} fill={AGING_COLORS[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </FinPanel>
    </div>
  );
}
