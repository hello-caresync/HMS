'use client';

import { useState } from 'react';
import { AlertTriangle, BookOpen, Receipt, Shield } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { NarcoticRegisterEntry } from '../lib/pharmacyMockData';
import {
  MOCK_AUDIT_LOG,
  MOCK_BILLING_LINES,
  MOCK_DRUG_INFO,
  REVENUE_TREND,
  formatInr,
} from '../lib/pharmacyMockData';
import {
  ControlledStagePill,
  PharmPanel,
  SecureIdentityPlaceholder,
  StatusPill,
} from '../components/pharmacyUi';

type ComplianceBillingTabProps = {
  narcoticEntries: NarcoticRegisterEntry[];
  onAdvanceControlled: (id: string) => void;
};

export default function ComplianceBillingTab({ narcoticEntries, onAdvanceControlled }: ComplianceBillingTabProps) {
  const [selectedDrug, setSelectedDrug] = useState(MOCK_DRUG_INFO[0].id);
  const drug = MOCK_DRUG_INFO.find((d) => d.id === selectedDrug) ?? MOCK_DRUG_INFO[0];
  const pendingControlled = narcoticEntries.filter((n) => n.stage !== 'Audit Logged');

  return (
    <div className="space-y-2">
      {pendingControlled.length > 0 && (
        <div className="rounded-md border-2 border-violet-600 bg-violet-700 px-3 py-2 text-white">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 animate-pulse" />
            <span className="text-[11px] font-bold uppercase">
              Narcotic Register — {pendingControlled.length} controlled substance entr{pendingControlled.length !== 1 ? 'ies' : 'y'} under audit
            </span>
          </div>
        </div>
      )}

      <PharmPanel
        title="Controlled Drug & Narcotic Register"
        subtitle="Schedule H/H1/X · chief pharmacist signature · regulatory audit trail"
        icon={Shield}
        secure
        critical={pendingControlled.some((n) => n.stage === 'Pending Chief Pharmacist')}
      >
        <SecureIdentityPlaceholder verified />
        <table className="mt-2 w-full min-w-[780px] text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['RX #', 'Patient', 'Drug', 'Schedule', 'Qty', 'Stage', 'Chief Pharmacist', 'Action'].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {narcoticEntries.map((n) => (
              <tr
                key={n.id}
                className={`border-b border-slate-50 ${n.schedule === 'Schedule X' ? 'bg-red-50/40' : 'bg-violet-50/20'}`}
              >
                <td className="px-1.5 py-1 font-mono text-[8px] font-bold text-[#2563EB]">{n.rxNumber}</td>
                <td className="px-1.5 py-1">
                  <p className="text-[9px] font-semibold">{n.patientName}</p>
                  <p className="font-mono text-[7px] text-slate-500">{n.uhid}</p>
                </td>
                <td className="max-w-[120px] truncate px-1.5 py-1 text-[8px] font-medium" title={n.drugName}>
                  {n.drugName}
                </td>
                <td className="px-1.5 py-1">
                  <StatusPill status={n.schedule} />
                </td>
                <td className="px-1.5 py-1 text-[9px] font-bold">{n.quantity}</td>
                <td className="px-1.5 py-1">
                  <button type="button" onClick={() => onAdvanceControlled(n.id)} disabled={n.stage === 'Audit Logged'}>
                    <ControlledStagePill stage={n.stage} />
                  </button>
                </td>
                <td className="px-1.5 py-1 text-[7px] text-slate-500">
                  {n.chiefPharmacistSignature ?? (
                    <span className="italic text-amber-600">Signature pending</span>
                  )}
                </td>
                <td className="px-1.5 py-1">
                  {n.stage !== 'Audit Logged' && (
                    <button
                      type="button"
                      onClick={() => onAdvanceControlled(n.id)}
                      className="rounded bg-violet-700 px-1.5 py-0.5 text-[8px] font-bold text-white"
                    >
                      Advance
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </PharmPanel>

      <PharmPanel title="Regulatory Audit Log" subtitle="Immutable track — controlled actions · recalls · QC events" icon={AlertTriangle}>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['Timestamp', 'Action', 'Drug', 'Performed By', 'Reference'].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_AUDIT_LOG.map((a) => (
              <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                <td className="px-1.5 py-1 font-mono text-[8px] text-slate-500">{a.timestamp}</td>
                <td className="px-1.5 py-1 text-[9px] font-semibold text-[#0F172A]">{a.action}</td>
                <td className="px-1.5 py-1 text-[8px] text-slate-600">{a.drugName}</td>
                <td className="px-1.5 py-1 text-[8px] text-slate-500">{a.performedBy}</td>
                <td className="px-1.5 py-1 font-mono text-[8px] text-[#2563EB]">{a.reference}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </PharmPanel>

      <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
        <PharmPanel title="Billing Coordination" subtitle="Itemized lines · insurance · discount locks" icon={Receipt}>
          <SecureIdentityPlaceholder verified />
          <table className="mt-2 w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['RX #', 'Patient', 'Medicine', 'Qty', 'Amount', 'Insurance', 'Payment'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_BILLING_LINES.map((b) => (
                <tr key={b.id} className="border-b border-slate-50">
                  <td className="px-1.5 py-1 font-mono text-[8px] font-bold text-[#2563EB]">{b.rxNumber}</td>
                  <td className="px-1.5 py-1 text-[9px] font-semibold">{b.patientName}</td>
                  <td className="max-w-[100px] truncate px-1.5 py-1 text-[8px] text-slate-600" title={b.medicine}>
                    {b.medicine}
                  </td>
                  <td className="px-1.5 py-1 text-[9px] tabular-nums">{b.qty}</td>
                  <td className="px-1.5 py-1 text-[9px] font-bold tabular-nums">{formatInr(b.qty * b.unitPrice)}</td>
                  <td className="px-1.5 py-1">
                    {b.insuranceVerified ? (
                      <span className="text-[8px] font-bold text-emerald-600">Verified</span>
                    ) : (
                      <span className="text-[8px] font-bold text-amber-600">Pending</span>
                    )}
                  </td>
                  <td className="px-1.5 py-1">
                    <StatusPill status={b.paymentStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </PharmPanel>

        <PharmPanel title="Drug Information Center" subtitle="Interactions · contraindications · generic alternatives" icon={BookOpen}>
          <input
            type="search"
            placeholder="Quick lookup — brand or generic"
            className="mb-2 w-full rounded-md border border-[#E2E8F0] px-2 py-1 text-[10px] focus:border-[#2563EB] focus:outline-none"
            defaultValue="Azithromycin"
          />
          <div className="mb-2 flex flex-wrap gap-1">
            {MOCK_DRUG_INFO.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedDrug(d.id)}
                className={`rounded px-2 py-0.5 text-[8px] font-bold ${
                  selectedDrug === d.id ? 'bg-[#2563EB] text-white' : 'border border-[#E2E8F0] text-slate-600 hover:bg-slate-50'
                }`}
              >
                {d.brandName}
              </button>
            ))}
          </div>
          <div className="space-y-2 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-2">
            <p className="text-[10px] font-bold text-[#0F172A]">
              {drug.brandName} <span className="font-normal text-slate-500">({drug.genericName})</span>
            </p>
            <div>
              <p className="text-[8px] font-bold uppercase text-red-700">Interactions</p>
              <p className="text-[9px] text-slate-600">{drug.interactions}</p>
            </div>
            <div>
              <p className="text-[8px] font-bold uppercase text-amber-700">Contraindications</p>
              <p className="text-[9px] text-slate-600">{drug.contraindications}</p>
            </div>
            <div>
              <p className="text-[8px] font-bold uppercase text-emerald-700">Generic Alternatives</p>
              <p className="text-[9px] text-slate-600">{drug.alternatives}</p>
            </div>
          </div>
        </PharmPanel>
      </div>

      <PharmPanel title="Revenue Analytics — OPD / IPD / ER" subtitle="7-day pharmacy revenue breakdown">
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={REVENUE_TREND} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="day" tick={{ fontSize: 8, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 8, fill: '#64748B' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ fontSize: 10, borderRadius: 6, border: '1px solid #E2E8F0' }} formatter={(v: number) => formatInr(v)} />
              <Legend wrapperStyle={{ fontSize: 9 }} />
              <Bar dataKey="opd" fill="#2563EB" name="OPD" stackId="a" radius={[0, 0, 0, 0]} />
              <Bar dataKey="ipd" fill="#6366F1" name="IPD" stackId="a" />
              <Bar dataKey="er" fill="#DC2626" name="ER" stackId="a" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </PharmPanel>
    </div>
  );
}
