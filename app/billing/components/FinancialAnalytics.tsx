'use client';

import {
  Clock,
  FileText,
  IndianRupee,
  Receipt,
  ShieldCheck,
} from 'lucide-react';

import { formatCurrency } from '../../master-data/lib/seedData';
import { useBilling } from '../context/BillingProvider';

function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: typeof IndianRupee;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">{label}</p>
          <p className="mt-1 font-mono text-lg font-bold tabular-nums text-slate-900">{value}</p>
          {sub && <p className="mt-0.5 text-[10px] text-slate-800">{sub}</p>}
        </div>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

export default function FinancialAnalytics() {
  const { metrics, doctorRevenue, departmentRevenue, ledgerInvoices } = useBilling();

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Today's Collection"
          value={formatCurrency(metrics.todaysCollection)}
          sub="Real-time OPD + IPD receipts"
          icon={IndianRupee}
          accent="bg-emerald-100 text-emerald-700"
        />
        <MetricCard
          label="Pending Bills"
          value={formatCurrency(metrics.pendingBills)}
          sub={`${metrics.pendingBillCount} invoices outstanding`}
          icon={Clock}
          accent="bg-amber-100 text-amber-700"
        />
        <MetricCard
          label="Claims Awaiting Settlement"
          value={formatCurrency(metrics.claimsAwaitingSettlement)}
          sub={`${metrics.claimsCount} TPA / corporate claims`}
          icon={ShieldCheck}
          accent="bg-violet-100 text-violet-700"
        />
        <MetricCard
          label="Total GST Collected"
          value={formatCurrency(metrics.totalGstCollected)}
          sub="CGST + SGST ledger aggregate"
          icon={Receipt}
          accent="bg-sky-100 text-sky-700"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ReportTable
          title="Doctor-wise Revenue"
          subtitle="Consultation & procedure attribution"
          icon={FileText}
          headers={['Doctor', 'Department', 'Visits', 'Revenue']}
          rows={doctorRevenue.map((r) => [
            r.doctorName,
            r.department,
            String(r.consultations),
            formatCurrency(r.revenue),
          ])}
        />
        <ReportTable
          title="Department-wise Revenue"
          subtitle="Service line GST split"
          icon={Receipt}
          headers={['Department', 'Items', 'Revenue', 'GST']}
          rows={departmentRevenue.map((r) => [
            r.department,
            String(r.itemCount),
            formatCurrency(r.revenue),
            formatCurrency(r.gstCollected),
          ])}
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b-2 border-slate-200 bg-slate-50/80 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
            Recent Ledger Entries
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="border-b-2 border-slate-200 text-[10px] uppercase tracking-wider text-slate-800">
                <th className="px-3 py-2 font-black">Invoice</th>
                <th className="px-3 py-2 font-black">Patient</th>
                <th className="px-3 py-2 font-black">Type</th>
                <th className="px-3 py-2 font-black">Status</th>
              </tr>
            </thead>
            <tbody>
              {ledgerInvoices.slice(0, 6).map((inv) => (
                <tr key={inv.id} className="border-b border-slate-50 hover:bg-slate-100/50">
                  <td className="px-3 py-2 font-mono text-slate-950">{inv.invoiceNumber}</td>
                  <td className="px-3 py-2 text-slate-950">{inv.patientName}</td>
                  <td className="px-3 py-2 text-slate-950">{inv.billingType}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${
                        inv.status === 'Settled'
                          ? 'bg-emerald-100 text-emerald-800 ring-emerald-200'
                          : inv.status === 'Claim Pending'
                            ? 'bg-violet-100 text-violet-800 ring-violet-200'
                            : 'bg-amber-100 text-amber-800 ring-amber-200'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ReportTable({
  title,
  subtitle,
  icon: Icon,
  headers,
  rows,
}: {
  title: string;
  subtitle: string;
  icon: typeof FileText;
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b-2 border-slate-200 bg-[#0a0e14] px-3 py-2">
        <Icon className="h-4 w-4 text-indigo-400" />
        <div>
          <p className="text-xs font-bold text-white">{title}</p>
          <p className="text-[10px] text-slate-800">{subtitle}</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-100/80">
              {headers.map((h) => (
                <th
                  key={h}
                  className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-950"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50">
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className={`px-3 py-2 ${j >= 2 ? 'text-right font-mono tabular-nums' : 'text-slate-900'} ${j === 0 ? 'font-medium text-slate-900' : ''}`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
