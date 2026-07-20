'use client';

import { AlertTriangle, Package, Receipt } from 'lucide-react';
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import type { VerificationRecord } from '../lib/laboratoryMockData';
import {
  DELTA_TREND,
  MOCK_REAGENTS,
  MOCK_TEST_BILLING,
  formatInr,
} from '../lib/laboratoryMockData';
import { LabPanel, SecureIdentityPlaceholder, StatusPill, VerificationPill } from '../components/laboratoryUi';

type VerificationReagentsTabProps = {
  verifications: VerificationRecord[];
  onAdvanceVerification: (id: string) => void;
};

export default function VerificationReagentsTab({ verifications, onAdvanceVerification }: VerificationReagentsTabProps) {
  const criticalItems = verifications.filter((v) => v.critical && v.stage !== 'Released');

  return (
    <div className="space-y-2">
      {criticalItems.length > 0 && (
        <div className="rounded-md border-2 border-red-500 bg-red-600 px-3 py-2 text-white animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-[11px] font-bold uppercase">Critical Value Center — {criticalItems.length} result(s) awaiting pathologist release</span>
          </div>
        </div>
      )}

      <LabPanel title="Result Verification & Critical Value Center" subtitle="Tech verification · pathologist review · delta checks · digital signatures" icon={AlertTriangle} critical={criticalItems.length > 0}>
        <SecureIdentityPlaceholder verified />
        <table className="mt-2 w-full min-w-[800px] text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['Order', 'Patient', 'Test', 'Result', 'Reference', 'Delta Check', 'Stage', 'Signatures', 'Action'].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {verifications.map((v) => (
              <tr key={v.id} className={`border-b border-slate-50 ${v.critical ? 'bg-red-50/60 ring-1 ring-inset ring-red-200' : ''}`}>
                <td className="px-1.5 py-1 font-mono text-[8px] font-bold text-[#2563EB]">{v.orderNumber}</td>
                <td className="px-1.5 py-1">
                  <p className="text-[9px] font-semibold">{v.patientName}</p>
                  <p className="font-mono text-[7px] text-slate-500">{v.uhid}</p>
                </td>
                <td className="px-1.5 py-1 text-[8px] font-medium">{v.testName}</td>
                <td className={`px-1.5 py-1 text-[9px] font-bold tabular-nums ${v.critical ? 'text-red-600 animate-pulse' : 'text-[#0F172A]'}`}>{v.result}</td>
                <td className="px-1.5 py-1 text-[8px] text-slate-500">{v.referenceRange}</td>
                <td className="max-w-[100px] truncate px-1.5 py-1 text-[8px] text-amber-700" title={v.deltaCheck}>{v.deltaCheck}</td>
                <td className="px-1.5 py-1">
                  <button type="button" onClick={() => onAdvanceVerification(v.id)} disabled={v.stage === 'Released'}>
                    <VerificationPill stage={v.stage} />
                  </button>
                </td>
                <td className="px-1.5 py-1 text-[7px] text-slate-500">
                  {v.techSignature && <p>Tech: {v.techSignature}</p>}
                  {v.pathologistSignature && <p>Path: {v.pathologistSignature}</p>}
                </td>
                <td className="px-1.5 py-1">
                  {v.stage !== 'Released' && (
                    <button type="button" onClick={() => onAdvanceVerification(v.id)} className="rounded bg-[#2563EB] px-1.5 py-0.5 text-[8px] font-bold text-white">
                      Advance
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {criticalItems.length > 0 && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50/50 p-2">
            <p className="mb-1 text-[8px] font-bold uppercase text-red-800">Delta Check — Lactate Trend (Meera Krishnan)</p>
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={DELTA_TREND} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#FECACA" />
                  <XAxis dataKey="date" tick={{ fontSize: 8, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 8, fill: '#64748B' }} unit=" mmol/L" />
                  <Tooltip contentStyle={{ fontSize: 10, borderRadius: 6, border: '1px solid #FECACA' }} />
                  <Line type="monotone" dataKey="value" stroke="#DC2626" strokeWidth={2} dot={{ r: 3 }} name="Lactate" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </LabPanel>

      <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
        <LabPanel title="Reagent Inventory" subtitle="Stock · expiry · low stock · auto reorder" icon={Package}>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Reagent', 'Lot', 'Qty', 'Expiry', 'Alerts'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_REAGENTS.map((r) => (
                <tr key={r.id} className={`border-b border-slate-50 ${r.lowStock ? 'bg-amber-50/50' : ''}`}>
                  <td className="px-1.5 py-1 text-[9px] font-semibold text-[#0F172A]">{r.reagentName}</td>
                  <td className="px-1.5 py-1 font-mono text-[8px] text-slate-500">{r.lotNumber}</td>
                  <td className="px-1.5 py-1 text-[9px] tabular-nums">{r.quantity} {r.unit}</td>
                  <td className={`px-1.5 py-1 text-[8px] ${r.expiryDate < '2026-07-01' ? 'font-bold text-red-600' : 'text-slate-600'}`}>{r.expiryDate}</td>
                  <td className="px-1.5 py-1">
                    {r.lowStock && <span className="mr-1 text-[8px] font-bold text-amber-700">Low Stock</span>}
                    {r.reorderTriggered && <span className="text-[8px] font-bold text-[#2563EB]">Reorder Sent</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </LabPanel>

        <LabPanel title="Test Billing Coordination" subtitle="Itemized test charges · payment status" icon={Receipt}>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Order', 'Patient', 'Test', 'Amount', 'Status'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_TEST_BILLING.map((b) => (
                <tr key={b.id} className="border-b border-slate-50">
                  <td className="px-1.5 py-1 font-mono text-[8px] text-[#2563EB]">{b.orderNumber}</td>
                  <td className="px-1.5 py-1 text-[9px] font-semibold">{b.patientName}</td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-600">{b.testName}</td>
                  <td className="px-1.5 py-1 text-[9px] font-bold tabular-nums">{formatInr(b.amount)}</td>
                  <td className="px-1.5 py-1"><StatusPill status={b.paymentStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </LabPanel>
      </div>
    </div>
  );
}
