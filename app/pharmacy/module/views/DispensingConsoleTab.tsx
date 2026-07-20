'use client';

import { CheckSquare, ClipboardList, Pill, Users, Zap } from 'lucide-react';

import type { PharmacyModalType } from '../pharmacyNav.types';
import type { PrescriptionOrder, QueueToken } from '../lib/pharmacyMockData';
import { PHARMACY_CENSUS, formatInr, formatTime } from '../lib/pharmacyMockData';
import {
  BarcodePill,
  BatchPill,
  ControlledAlertBanner,
  OutOfStockBanner,
  PharmPanel,
  PriorityBadge,
  QueuePill,
  RxStatusPill,
  SourcePill,
} from '../components/pharmacyUi';

type DispensingConsoleTabProps = {
  lookupQuery: string;
  prescriptions: PrescriptionOrder[];
  queueTokens: QueueToken[];
  onAdvancePrescription: (id: string) => void;
  onToggleVerification: (id: string) => void;
  onQuickAction: (action: Exclude<PharmacyModalType, null | 'print-label'>) => void;
};

export default function DispensingConsoleTab({
  lookupQuery,
  prescriptions,
  queueTokens,
  onAdvancePrescription,
  onToggleVerification,
  onQuickAction,
}: DispensingConsoleTabProps) {
  const census = PHARMACY_CENSUS;
  const q = lookupQuery.trim().toLowerCase();
  const controlledCount = prescriptions.filter((p) => p.controlledDrug && p.status !== 'Dispensed').length;
  const oosCount = prescriptions.filter((p) => p.batchAvailability === 'Out of Stock').length;

  const filtered = q
    ? prescriptions.filter(
        (p) =>
          p.patientName.toLowerCase().includes(q) ||
          p.uhid.toLowerCase().includes(q) ||
          p.rxNumber.toLowerCase().includes(q) ||
          p.medicines.toLowerCase().includes(q),
      )
    : prescriptions;

  return (
    <div className="space-y-2">
      <ControlledAlertBanner count={controlledCount} />
      <OutOfStockBanner count={oosCount} />

      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 xl:grid-cols-9">
        {[
          { label: "Today's Prescriptions", value: census.todayPrescriptions, accent: true },
          { label: 'Pending Prescriptions', value: census.pendingPrescriptions, warn: true },
          { label: 'Medicines Dispensed', value: census.medicinesDispensed, success: true },
          { label: 'Pending Dispensing', value: census.pendingDispensing, purple: true },
          { label: 'Low Stock Medicines', value: census.lowStockMedicines, warn: true },
          { label: 'Out-of-Stock', value: census.outOfStockMedicines, danger: true, pulse: true },
          { label: 'Expiring Medicines', value: census.expiringMedicines, warn: true },
          { label: 'Controlled Alerts', value: census.controlledDrugAlerts, danger: true },
          { label: 'Pharmacy Revenue', value: formatInr(census.pharmacyRevenue), accent: true },
        ].map((k) => (
          <div
            key={k.label}
            className={`rounded-md border bg-white p-2 ${k.danger ? 'border-red-200 bg-red-50/40' : 'border-[#E2E8F0]'} ${k.pulse ? 'animate-pulse' : ''}`}
          >
            <p
              className={`text-sm font-bold tabular-nums ${k.purple ? 'text-violet-600' : k.success ? 'text-emerald-600' : k.warn ? 'text-amber-600' : k.danger ? 'text-red-600' : k.accent ? 'text-[#2563EB]' : 'text-[#0F172A]'}`}
            >
              {k.value}
            </p>
            <p className="text-[7px] font-bold uppercase tracking-wide text-slate-500">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2 xl:grid-cols-[1fr_280px]">
        <PharmPanel title="Prescription Management Queue" subtitle="OPD · IPD · ER orders · verification · batch · barcode" icon={ClipboardList}>
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['RX #', 'Patient', 'Source', 'Medicines', 'Priority', 'Verified', 'Batch', 'Barcode', 'Status', 'Time', ''].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className={`border-b border-slate-50 ${p.controlledDrug ? 'bg-violet-50/30' : ''} ${p.batchAvailability === 'Out of Stock' ? 'bg-red-50/30' : 'hover:bg-slate-50/80'} ${p.priority === 'STAT' ? 'ring-1 ring-inset ring-red-100' : ''}`}
                >
                  <td className="px-1.5 py-1 font-mono text-[9px] font-bold text-[#2563EB]">{p.rxNumber}</td>
                  <td className="px-1.5 py-1">
                    <p className="text-[9px] font-semibold text-[#0F172A]">{p.patientName}</p>
                    <p className="font-mono text-[7px] text-slate-500">{p.uhid}</p>
                  </td>
                  <td className="px-1.5 py-1">
                    <SourcePill source={p.source} />
                  </td>
                  <td className="max-w-[130px] truncate px-1.5 py-1 text-[8px] text-slate-600" title={p.medicines}>
                    {p.medicines}
                  </td>
                  <td className="px-1.5 py-1">
                    <PriorityBadge priority={p.priority} />
                  </td>
                  <td className="px-1.5 py-1">
                    <button
                      type="button"
                      onClick={() => onToggleVerification(p.id)}
                      className={`flex h-4 w-4 items-center justify-center rounded border ${p.verified ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-amber-400 bg-white'}`}
                      title="Toggle verification"
                      aria-label={p.verified ? 'Verified' : 'Pending verification'}
                    >
                      {p.verified && <CheckSquare className="h-3 w-3" />}
                    </button>
                  </td>
                  <td className="px-1.5 py-1">
                    <BatchPill status={p.batchAvailability} />
                  </td>
                  <td className="px-1.5 py-1">
                    <BarcodePill status={p.barcodeStatus} />
                  </td>
                  <td className="px-1.5 py-1">
                    <button type="button" onClick={() => onAdvancePrescription(p.id)} title="Advance dispensing status" disabled={p.status === 'Dispensed' || !p.verified}>
                      <RxStatusPill status={p.status} />
                    </button>
                  </td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-500">{formatTime(p.orderedAt)}</td>
                  <td className="px-1.5 py-1">
                    {p.controlledDrug && p.status !== 'Dispensed' && (
                      <span className="rounded bg-violet-700 px-1 py-0.5 text-[7px] font-bold uppercase text-white">Ctrl</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </PharmPanel>

        <PharmPanel title="Pharmacy Queue Manager" subtitle="Token · wait time · triage priority" icon={Users}>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Token', 'Patient', 'Priority', 'Wait', 'Status'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {queueTokens.map((t) => (
                <tr key={t.id} className={`border-b border-slate-50 ${t.priority === 'STAT' ? 'bg-red-50/40' : ''}`}>
                  <td className="px-1.5 py-1 font-mono text-[10px] font-bold text-[#2563EB]">{t.tokenNumber}</td>
                  <td className="px-1.5 py-1">
                    <p className="text-[9px] font-semibold">{t.patientName}</p>
                    <p className="font-mono text-[7px] text-slate-500">{t.rxNumber}</p>
                  </td>
                  <td className="px-1.5 py-1">
                    <PriorityBadge priority={t.priority} />
                  </td>
                  <td className="px-1.5 py-1 text-[9px] font-bold tabular-nums text-amber-700">{t.waitMinutes}m</td>
                  <td className="px-1.5 py-1">
                    <QueuePill status={t.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </PharmPanel>
      </div>

      <PharmPanel title="Quick Actions" icon={Zap} subtitle="Dispense · search · procurement · stock · billing">
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 xl:grid-cols-6">
          {[
            { id: 'dispense' as const, label: 'Dispense Medicine', icon: Pill },
            { id: 'search-drug' as const, label: 'Search Drug', icon: ClipboardList },
            { id: 'purchase-request' as const, label: 'Create Purchase Request', icon: Zap },
            { id: 'receive-stock' as const, label: 'Receive Stock', icon: CheckSquare },
            { id: 'transfer-stock' as const, label: 'Transfer Stock', icon: Users },
            { id: 'print-invoice' as const, label: 'Print Invoice', icon: ClipboardList },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onQuickAction(id)}
              className="inline-flex flex-col items-center gap-1 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-2 text-center hover:border-[#2563EB]/40 hover:bg-blue-50/50"
            >
              <Icon className="h-4 w-4 text-[#2563EB]" />
              <span className="text-[8px] font-bold uppercase text-[#0F172A]">{label}</span>
            </button>
          ))}
        </div>
      </PharmPanel>
    </div>
  );
}
