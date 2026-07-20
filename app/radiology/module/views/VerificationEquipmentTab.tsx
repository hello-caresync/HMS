'use client';

import { AlertTriangle, Package, Wrench } from 'lucide-react';
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

import type { ReportRecord } from '../lib/radiologyMockData';
import {
  MOCK_CONTRAST,
  MOCK_EQUIPMENT,
  TAT_ANALYTICS,
} from '../lib/radiologyMockData';
import {
  EquipmentPill,
  ModalityPill,
  RadPanel,
  ReportStagePill,
  SecureIdentityPlaceholder,
} from '../components/radiologyUi';

type VerificationEquipmentTabProps = {
  reports: ReportRecord[];
  onAdvanceReport: (id: string) => void;
};

export default function VerificationEquipmentTab({ reports, onAdvanceReport }: VerificationEquipmentTabProps) {
  const criticalItems = reports.filter((r) => r.critical && r.stage !== 'Released');

  return (
    <div className="space-y-2">
      {criticalItems.length > 0 && (
        <div className="rounded-md border-2 border-red-500 bg-red-600 px-3 py-2 text-white animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-[11px] font-bold uppercase">
              Critical Finding Escalation — {criticalItems.length} report(s) awaiting radiologist sign-off
            </span>
          </div>
        </div>
      )}

      <RadPanel
        title="Report Verification & Sign-off Panel"
        subtitle="Draft reports · radiologist verification · digital signatures · critical escalation"
        icon={AlertTriangle}
        critical={criticalItems.length > 0}
      >
        <SecureIdentityPlaceholder verified />
        <table className="mt-2 w-full min-w-[860px] text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['Order', 'Patient', 'Study', 'Modality', 'Impression', 'Stage', 'Signatures', 'Action'].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr
                key={r.id}
                className={`border-b border-slate-50 ${r.critical ? 'bg-red-50/60 ring-1 ring-inset ring-red-200' : 'hover:bg-slate-50/80'}`}
              >
                <td className="px-1.5 py-1 font-mono text-[8px] font-bold text-[#2563EB]">{r.orderNumber}</td>
                <td className="px-1.5 py-1">
                  <p className="text-[9px] font-semibold">{r.patientName}</p>
                  <p className="font-mono text-[7px] text-slate-500">{r.uhid}</p>
                </td>
                <td className="max-w-[100px] truncate px-1.5 py-1 text-[8px] text-slate-600" title={r.study}>
                  {r.study}
                </td>
                <td className="px-1.5 py-1">
                  <ModalityPill modality={r.modality} />
                </td>
                <td
                  className={`max-w-[160px] truncate px-1.5 py-1 text-[8px] ${r.critical ? 'font-bold text-red-600 animate-pulse' : 'text-slate-600'}`}
                  title={r.impression}
                >
                  {r.impression}
                </td>
                <td className="px-1.5 py-1">
                  <button type="button" onClick={() => onAdvanceReport(r.id)} disabled={r.stage === 'Released'}>
                    <ReportStagePill stage={r.stage} />
                  </button>
                </td>
                <td className="px-1.5 py-1 text-[7px] text-slate-500">
                  {r.techSignature && <p>Tech: {r.techSignature}</p>}
                  {r.radiologistSignature && <p>Rad: {r.radiologistSignature}</p>}
                </td>
                <td className="px-1.5 py-1">
                  {r.stage !== 'Released' && (
                    <button
                      type="button"
                      onClick={() => onAdvanceReport(r.id)}
                      className="rounded bg-[#2563EB] px-1.5 py-0.5 text-[8px] font-bold text-white"
                    >
                      Advance
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </RadPanel>

      <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
        <RadPanel title="Equipment Dashboard" subtitle="MRI · CT · X-Ray availability · calibration · maintenance" icon={Wrench}>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Equipment', 'Modality', 'Room', 'Status', 'Calibration', 'Utilization'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_EQUIPMENT.map((eq) => (
                <tr key={eq.id} className={`border-b border-slate-50 ${eq.status === 'Maintenance' ? 'bg-red-50/30' : ''}`}>
                  <td className="px-1.5 py-1 text-[9px] font-semibold text-[#0F172A]">{eq.name}</td>
                  <td className="px-1.5 py-1">
                    <ModalityPill modality={eq.modality} />
                  </td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-600">{eq.room}</td>
                  <td className="px-1.5 py-1">
                    <EquipmentPill status={eq.status} />
                  </td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-500">{eq.nextCalibration}</td>
                  <td className="px-1.5 py-1">
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${eq.utilizationPct > 75 ? 'bg-amber-500' : 'bg-[#2563EB]'}`}
                          style={{ width: `${eq.utilizationPct}%` }}
                        />
                      </div>
                      <span className="text-[8px] font-bold tabular-nums text-slate-600">{eq.utilizationPct}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </RadPanel>

        <RadPanel title="Contrast Media Inventory Ledger" subtitle="Stock counts · expiry · low stock alerts" icon={Package}>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Agent', 'Concentration', 'Lot', 'Qty', 'Expiry', 'Alerts'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_CONTRAST.map((c) => (
                <tr key={c.id} className={`border-b border-slate-50 ${c.lowStock ? 'bg-amber-50/40' : ''}`}>
                  <td className="px-1.5 py-1 text-[9px] font-semibold">{c.agentName}</td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-500">{c.concentration}</td>
                  <td className="px-1.5 py-1 font-mono text-[7px] text-slate-500">{c.lotNumber}</td>
                  <td className="px-1.5 py-1 text-[9px] font-bold tabular-nums">
                    {c.quantity} {c.unit}
                  </td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-500">{c.expiryDate}</td>
                  <td className="px-1.5 py-1">
                    {c.lowStock && (
                      <span className="rounded bg-amber-100 px-1 py-0.5 text-[7px] font-bold uppercase text-amber-800">Low Stock</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </RadPanel>
      </div>

      <RadPanel title="Turnaround Time Analytics" subtitle="Routine vs STAT median report TAT (minutes) — 7-day trend">
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={TAT_ANALYTICS} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="day" tick={{ fontSize: 8, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 8, fill: '#64748B' }} unit=" min" />
              <Tooltip contentStyle={{ fontSize: 10, borderRadius: 6, border: '1px solid #E2E8F0' }} />
              <Legend wrapperStyle={{ fontSize: 9 }} />
              <Bar dataKey="routine" fill="#2563EB" name="Routine TAT" radius={[2, 2, 0, 0]} />
              <Bar dataKey="stat" fill="#DC2626" name="STAT TAT" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </RadPanel>
    </div>
  );
}
