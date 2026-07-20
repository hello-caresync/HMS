'use client';

import { ClipboardList, CreditCard, FileText, IndianRupee, Package, Percent, RefreshCw, Settings, Zap } from 'lucide-react';

import type { BillingModalType, BillingQueueType } from '../billingNav.types';
import type { BillingQueueItem } from '../lib/billingMockData';
import { FINANCE_CENSUS, MOCK_PAYMENTS, formatInr } from '../lib/billingMockData';
import {
  BillStatusPill,
  FinPanel,
  FraudAlertBanner,
  PaymentModePill,
  QueueTypePill,
  SecureFinancialPlaceholder,
} from '../components/billingUi';

type FinancialCommandTabProps = {
  lookupQuery: string;
  queue: BillingQueueItem[];
  queueFilter: BillingQueueType | 'All';
  onQueueFilterChange: (f: BillingQueueType | 'All') => void;
  onQuickAction: (action: Exclude<BillingModalType, null>) => void;
  selectedPackage?: string;
};

export default function FinancialCommandTab({
  lookupQuery,
  queue,
  queueFilter,
  onQueueFilterChange,
  onQuickAction,
  selectedPackage,
}: FinancialCommandTabProps) {
  const census = FINANCE_CENSUS;
  const q = lookupQuery.trim().toLowerCase();
  const disputed = queue.filter((b) => b.status === 'Disputed').length;

  const filtered = queue
    .filter((b) => (queueFilter === 'All' ? true : b.queueType === queueFilter))
    .filter((b) =>
      !q
        ? true
        : b.patientName.toLowerCase().includes(q) ||
          b.uhid.toLowerCase().includes(q) ||
          b.invoiceNumber.toLowerCase().includes(q),
    );

  return (
    <div className="space-y-2">
      <FraudAlertBanner count={disputed} />

      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 xl:grid-cols-6">
        {[
          { label: "Today's Revenue", value: formatInr(census.todayRevenue), accent: true },
          { label: 'Monthly Revenue', value: formatInr(census.monthlyRevenue), accent: true },
          { label: 'Pending Payments', value: formatInr(census.pendingPayments), warn: true },
          { label: 'Outstanding AR', value: formatInr(census.outstandingReceivables), warn: true },
          { label: 'OPD Collection', value: formatInr(census.opdCollection), success: true },
          { label: 'IPD Collection', value: formatInr(census.ipdCollection), success: true },
        ].map((k) => (
          <div key={k.label} className="rounded-md border border-[#E2E8F0] bg-white p-2">
            <p className={`text-sm font-bold tabular-nums ${k.warn ? 'text-amber-600' : k.success ? 'text-emerald-600' : k.accent ? 'text-[#2563EB]' : 'text-[#0F172A]'}`}>{k.value}</p>
            <p className="text-[7px] font-bold uppercase tracking-wide text-slate-500">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
        {[
          { label: 'Emergency', value: formatInr(census.emergencyCollection) },
          { label: 'Pharmacy', value: formatInr(census.pharmacyRevenue) },
          { label: 'Laboratory', value: formatInr(census.labRevenue) },
          { label: 'Radiology', value: formatInr(census.radiologyRevenue) },
          { label: 'OT', value: formatInr(census.otRevenue) },
        ].map((k) => (
          <div key={k.label} className="rounded-md border border-[#E2E8F0] bg-white p-2">
            <p className="text-[11px] font-bold tabular-nums text-violet-600">{k.value}</p>
            <p className="text-[7px] font-bold uppercase text-slate-500">{k.label} Revenue</p>
          </div>
        ))}
      </div>

      {selectedPackage && (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-[10px] font-semibold text-emerald-800">
          Package applied: {selectedPackage}
        </div>
      )}

      <FinPanel
        title="Active Billing Queues"
        subtitle="OPD · IPD room/nursing accumulation · Emergency quick billing"
        icon={ClipboardList}
        headerRight={
          <div className="flex gap-0.5">
            {(['All', 'OPD', 'IPD', 'Emergency'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => onQueueFilterChange(f)}
                className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${queueFilter === f ? 'bg-[#2563EB] text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                {f}
              </button>
            ))}
          </div>
        }
      >
        <SecureFinancialPlaceholder verified />
        <table className="mt-2 w-full min-w-[920px] text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['Invoice', 'Patient', 'Type', 'Charges', 'Gross', 'Disc', 'Net', 'Paid', 'Balance', 'Status', 'Ins'].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => {
              const balance = b.netAmount - b.paidAmount;
              return (
                <tr key={b.id} className={`border-b border-slate-50 ${b.status === 'Disputed' ? 'bg-red-50/40' : b.status === 'Partial' ? 'bg-amber-50/20' : 'hover:bg-slate-50/80'}`}>
                  <td className="px-1.5 py-1 font-mono text-[8px] font-bold text-[#2563EB]">{b.invoiceNumber}</td>
                  <td className="px-1.5 py-1">
                    <p className="text-[9px] font-semibold">{b.patientName}</p>
                    <p className="font-mono text-[7px] text-slate-500">{b.uhid}</p>
                  </td>
                  <td className="px-1.5 py-1"><QueueTypePill type={b.queueType} /></td>
                  <td className="max-w-[120px] truncate px-1.5 py-1 text-[8px] text-slate-600" title={b.charges}>{b.charges}</td>
                  <td className="px-1.5 py-1 text-[9px] tabular-nums">{formatInr(b.grossAmount)}</td>
                  <td className="px-1.5 py-1 text-[9px] tabular-nums text-emerald-600">{b.discount ? formatInr(b.discount) : '—'}</td>
                  <td className="px-1.5 py-1 text-[9px] font-bold tabular-nums">{formatInr(b.netAmount)}</td>
                  <td className="px-1.5 py-1 text-[9px] tabular-nums">{formatInr(b.paidAmount)}</td>
                  <td className={`px-1.5 py-1 text-[9px] font-bold tabular-nums ${balance > 0 ? 'text-amber-700' : 'text-emerald-600'}`}>{formatInr(balance)}</td>
                  <td className="px-1.5 py-1"><BillStatusPill status={b.status} /></td>
                  <td className="px-1.5 py-1">{b.insuranceLinked ? <span className="text-[8px] font-bold text-violet-600">Yes</span> : <span className="text-[8px] text-slate-400">No</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </FinPanel>

      <FinPanel title="Payment Collection Center" subtitle="Cash · Card · UPI · Corporate credit · partial payments" icon={CreditCard}>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['Receipt', 'Patient', 'Amount', 'Mode', 'Partial', 'Collected By', 'Time'].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_PAYMENTS.map((p) => (
              <tr key={p.id} className={`border-b border-slate-50 ${p.partial ? 'bg-amber-50/20' : ''}`}>
                <td className="px-1.5 py-1 font-mono text-[8px] font-bold text-[#2563EB]">{p.receiptNumber}</td>
                <td className="px-1.5 py-1 text-[9px] font-semibold">{p.patientName}</td>
                <td className="px-1.5 py-1 text-[9px] font-bold tabular-nums text-emerald-700">{formatInr(p.amount)}</td>
                <td className="px-1.5 py-1"><PaymentModePill mode={p.mode} /></td>
                <td className="px-1.5 py-1">{p.partial ? <span className="text-[8px] font-bold text-amber-700">Partial</span> : <span className="text-[8px] text-emerald-600">Full</span>}</td>
                <td className="px-1.5 py-1 text-[8px] text-slate-500">{p.collectedBy}</td>
                <td className="px-1.5 py-1 text-[8px] text-slate-400">{p.collectedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </FinPanel>

      <FinPanel title="Quick Actions" icon={Zap} subtitle="Invoice · payment · discount · refund · charge master · closing · packages">
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 xl:grid-cols-7">
          {[
            { id: 'generate-invoice' as const, label: 'Generate Invoice', icon: FileText },
            { id: 'collect-payment' as const, label: 'Collect Payment', icon: IndianRupee },
            { id: 'approve-discount' as const, label: 'Approve Discount', icon: Percent },
            { id: 'process-refund' as const, label: 'Process Refund', icon: RefreshCw, danger: true },
            { id: 'update-charge-master' as const, label: 'Update Charge Master', icon: Settings },
            { id: 'daily-closing' as const, label: 'Run Daily Closing', icon: ClipboardList },
            { id: 'select-package' as const, label: 'Select Package', icon: Package },
          ].map(({ id, label, icon: Icon, danger }) => (
            <button key={id} type="button" onClick={() => onQuickAction(id)} className={`inline-flex flex-col items-center gap-1 rounded-md border px-2 py-2 text-center hover:border-[#2563EB]/40 ${danger ? 'border-red-300 bg-red-50 hover:bg-red-100' : 'border-[#E2E8F0] bg-[#F8FAFC] hover:bg-blue-50/50'}`}>
              <Icon className={`h-4 w-4 ${danger ? 'text-red-600' : 'text-[#2563EB]'}`} />
              <span className="text-[8px] font-bold uppercase text-[#0F172A]">{label}</span>
            </button>
          ))}
        </div>
      </FinPanel>
    </div>
  );
}
