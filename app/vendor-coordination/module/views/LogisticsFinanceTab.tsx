'use client';

import { Brain, Receipt, RotateCcw, Shield, Truck } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import type { AiVendorInsight } from '../lib/vendorCoordinationMockData';
import {
  INITIAL_DELIVERY_TRACKING,
  MOCK_LICENSE_LOGS,
  MOCK_RETURN_NOTES,
  OUTSTANDING_BALANCE_TREND,
  formatInr,
} from '../lib/vendorCoordinationMockData';
import type { AiVendorInsightStatus } from '../vendorCoordinationNav.types';
import {
  AiStatusPill,
  FulfillmentPill,
  LicensePill,
  PaymentPill,
  SecureSupplierPlaceholder,
  VrmPanel,
} from '../components/vendorCoordinationUi';

type LogisticsFinanceTabProps = {
  deliveryRecords: typeof INITIAL_DELIVERY_TRACKING;
  onAdvanceDelivery: (id: string) => void;
  aiInsights: AiVendorInsight[];
  onUpdateAiStatus: (id: string, status: AiVendorInsightStatus) => void;
};

export default function LogisticsFinanceTab({ deliveryRecords, onAdvanceDelivery, aiInsights, onUpdateAiStatus }: LogisticsFinanceTabProps) {
  const pendingAi = aiInsights.filter((i) => i.status === 'Pending Review');
  const expiredLicenses = MOCK_LICENSE_LOGS.filter((l) => l.status === 'Expired').length;

  return (
    <div className="space-y-2">
      {expiredLicenses > 0 && (
        <div className="flex items-center gap-2 rounded-md border-2 border-red-500 bg-red-600 px-3 py-1.5 text-white animate-pulse">
          <Shield className="h-4 w-4" />
          <span className="text-[10px] font-bold uppercase">{expiredLicenses} Vendor License Expired — Compliance action required</span>
        </div>
      )}

      <VrmPanel title="Delivery Tracking & Invoice Settlement Ledger" subtitle="Fulfillment pipeline · three-way match · payment approvals" icon={Truck}>
        <table className="w-full min-w-[900px] text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['PO #', 'Vendor', 'Fulfillment', 'Tracking', 'Expected', 'Invoice', 'Amount', 'Payment', 'Advance'].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {deliveryRecords.map((d) => (
              <tr key={d.id} className={`border-b border-slate-50 ${d.paymentStatus === 'Overdue' ? 'bg-red-50/40' : d.stage === 'In Transit' ? 'bg-violet-50/20' : ''}`}>
                <td className="px-1.5 py-1 font-mono text-[8px] font-bold text-[#2563EB]">{d.poNumber}</td>
                <td className="max-w-[90px] truncate px-1.5 py-1 text-[8px] font-semibold" title={d.vendorName}>{d.vendorName}</td>
                <td className="px-1.5 py-1"><FulfillmentPill stage={d.stage} /></td>
                <td className="px-1.5 py-1 font-mono text-[7px] text-slate-500">{d.trackingRef}</td>
                <td className="px-1.5 py-1 text-[8px] text-slate-500">{d.expectedDelivery}</td>
                <td className="px-1.5 py-1 font-mono text-[7px] text-slate-600">{d.invoiceNumber}</td>
                <td className="px-1.5 py-1 text-[9px] font-bold tabular-nums">{d.invoiceAmount ? formatInr(d.invoiceAmount) : '—'}</td>
                <td className="px-1.5 py-1"><PaymentPill status={d.paymentStatus} /></td>
                <td className="px-1.5 py-1">
                  {d.stage !== 'Delivered' && (
                    <button type="button" onClick={() => onAdvanceDelivery(d.id)} className="rounded bg-[#2563EB] px-1 py-0.5 text-[7px] font-bold text-white">+Stage</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <SecureSupplierPlaceholder verified />
      </VrmPanel>

      <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
        <VrmPanel title="Return & Replacement Credit Notes" icon={RotateCcw}>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['RRN #', 'PO Ref', 'Vendor', 'Reason', 'Credit', 'Status'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_RETURN_NOTES.map((r) => (
                <tr key={r.id} className="border-b border-slate-50">
                  <td className="px-1.5 py-1 font-mono text-[8px] font-bold text-[#2563EB]">{r.rrnNumber}</td>
                  <td className="px-1.5 py-1 font-mono text-[7px] text-slate-500">{r.poReference}</td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-600">{r.vendorName}</td>
                  <td className="max-w-[120px] truncate px-1.5 py-1 text-[8px] text-slate-500" title={r.reason}>{r.reason}</td>
                  <td className="px-1.5 py-1 text-[9px] font-bold tabular-nums text-red-600">{formatInr(r.creditValue)}</td>
                  <td className="px-1.5 py-1">
                    <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${r.status === 'Credit Issued' ? 'bg-emerald-100 text-emerald-800' : r.status === 'Replacement Dispatched' ? 'bg-violet-100 text-violet-800' : 'bg-amber-100 text-amber-800'}`}>{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </VrmPanel>

        <VrmPanel title="Regulatory License Compliance Log" subtitle="Drug license · device registration · audit dates" icon={Shield} critical={expiredLicenses > 0}>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Vendor', 'License Type', 'Expiry', 'Status', 'Last Audit', 'Credentials'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_LICENSE_LOGS.map((l) => (
                <tr key={l.id} className={`border-b border-slate-50 ${l.status === 'Expired' ? 'bg-red-50/50' : l.status === 'Expiring Soon' ? 'bg-amber-50/30' : ''}`}>
                  <td className="px-1.5 py-1 text-[9px] font-semibold">{l.vendorName}</td>
                  <td className="max-w-[100px] truncate px-1.5 py-1 text-[8px] text-slate-600" title={l.licenseType}>{l.licenseType}</td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-500">{l.expiryDate}</td>
                  <td className="px-1.5 py-1"><LicensePill status={l.status} /></td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-400">{l.lastAudit}</td>
                  <td className="px-1.5 py-1 text-[8px] italic text-slate-500">[Supplier Documents Verified/Masked for Security]</td>
                </tr>
              ))}
            </tbody>
          </table>
        </VrmPanel>
      </div>

      <VrmPanel title="AI-Based Vendor Intelligence & Compliance Hub" subtitle="Smart recommendations · cost optimization · risk predictions" icon={Brain} secure>
        <table className="w-full min-w-[860px] text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['Type', 'Insight', 'Detail', 'Action', 'Impact / Risk', 'Conf.', 'Status', ''].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {aiInsights.map((i) => (
              <tr key={i.id} className={`border-b border-slate-50 ${i.status === 'Pending Review' ? 'bg-indigo-50/30' : ''}`}>
                <td className="px-1.5 py-1 text-[8px] font-bold text-indigo-700">{i.insightType}</td>
                <td className="px-1.5 py-1 text-[9px] font-semibold">{i.title}</td>
                <td className="max-w-[120px] truncate px-1.5 py-1 text-[8px] text-slate-500" title={i.detail}>{i.detail}</td>
                <td className="max-w-[130px] truncate px-1.5 py-1 text-[8px] text-[#2563EB]" title={i.suggestedAction}>{i.suggestedAction}</td>
                <td className="px-1.5 py-1 text-[8px]">
                  {i.estimatedSavings && <span className="font-bold text-emerald-700">{i.estimatedSavings}</span>}
                  {i.riskLevel && <span className={`font-bold ${i.riskLevel === 'High' ? 'text-red-600' : 'text-amber-700'}`}>{i.riskLevel} Risk</span>}
                </td>
                <td className="px-1.5 py-1 text-[9px] font-bold tabular-nums">{i.confidence}%</td>
                <td className="px-1.5 py-1"><AiStatusPill status={i.status} /></td>
                <td className="px-1.5 py-1">
                  {i.status === 'Pending Review' && (
                    <div className="flex gap-0.5">
                      <button type="button" onClick={() => onUpdateAiStatus(i.id, 'Accepted')} className="rounded bg-emerald-600 px-1 py-0.5 text-[7px] font-bold text-white">Accept</button>
                      <button type="button" onClick={() => onUpdateAiStatus(i.id, 'Rejected')} className="rounded border border-slate-300 px-1 py-0.5 text-[7px] font-bold text-slate-600">Reject</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </VrmPanel>

      <VrmPanel title="Outstanding Balance vs Payments" subtitle="Weekly vendor payment ledger" icon={Receipt}>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={OUTSTANDING_BALANCE_TREND} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="week" tick={{ fontSize: 8, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 8, fill: '#64748B' }} tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`} />
              <Tooltip contentStyle={{ fontSize: 10, borderRadius: 6, border: '1px solid #E2E8F0' }} formatter={(v: number) => formatInr(v)} />
              <Legend wrapperStyle={{ fontSize: 9 }} />
              <Bar dataKey="outstanding" fill="#DC2626" name="Outstanding" radius={[2, 2, 0, 0]} />
              <Bar dataKey="paid" fill="#059669" name="Paid" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </VrmPanel>
    </div>
  );
}
