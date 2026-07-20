'use client';

import { Barcode, CreditCard, QrCode, Zap } from 'lucide-react';

import type { QuickActionModalType } from '../patientsNav.types';
import { getPatientByUhid } from '../lib/patientsMockData';
import { PatientPanel } from '../components/patientsUi';

type QuickActionsMatrixViewProps = {
  selectedUhid: string | null;
  onOpenModal: (type: QuickActionModalType) => void;
};

const ACTIONS = [
  { id: 'print-card' as const, label: 'Print Patient Card', icon: CreditCard, desc: 'Wallet-size ID with UHID and barcode' },
  { id: 'print-barcode' as const, label: 'Print Barcode', icon: Barcode, desc: 'Specimen / wristband barcode label' },
  { id: 'generate-qr' as const, label: 'Generate QR Code', icon: QrCode, desc: 'Secure patient lookup QR for kiosk check-in' },
];

export default function QuickActionsMatrixView({ selectedUhid, onOpenModal }: QuickActionsMatrixViewProps) {
  const patient = selectedUhid ? getPatientByUhid(selectedUhid) : getPatientByUhid('NX-2026-000412');

  return (
    <div className="space-y-2">
      <div>
        <h2 className="text-sm font-bold text-[#0F172A]">Quick Actions Matrix</h2>
        <p className="text-[10px] text-slate-500">
          Fast triggers for front desk · Active patient:{' '}
          <span className="font-mono font-semibold text-[#2563EB]">{patient?.uhid ?? 'None selected'}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {ACTIONS.map(({ id, label, icon: Icon, desc }) => (
          <button
            key={id}
            type="button"
            onClick={() => onOpenModal(id)}
            className="group rounded-md border border-slate-200 bg-white p-3 text-left transition-all hover:border-[#2563EB]/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0F172A] transition-colors group-hover:bg-[#2563EB]">
              <Icon className="h-4 w-4 text-white" />
            </span>
            <p className="mt-2 text-[11px] font-bold text-[#0F172A]">{label}</p>
            <p className="mt-0.5 text-[9px] text-slate-500">{desc}</p>
          </button>
        ))}
      </div>

      <PatientPanel title="Action Log" icon={Zap}>
        <ul className="space-y-1 text-[10px] text-slate-600">
          <li>11:04 — Patient card printed · NX-2026-000412 · Desk-02</li>
          <li>09:28 — Barcode label generated · specimen collection</li>
          <li>08:15 — QR code issued · kiosk check-in enabled</li>
        </ul>
      </PatientPanel>
    </div>
  );
}

export function QuickActionModalContent({
  type,
  uhid,
  patientName,
}: {
  type: Exclude<import('../patientsNav.types').QuickActionModalType, null>;
  uhid: string;
  patientName: string;
}) {
  if (type === 'send-sms') {
    return (
      <div className="space-y-3">
        <p className="text-[10px] text-slate-600">
          Send templated SMS to <span className="font-semibold text-[#0F172A]">{patientName}</span>
          {uhid !== '—' && <span className="font-mono text-[#2563EB]"> · {uhid}</span>}
        </p>
        <select className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-[11px]">
          <option>Appointment reminder — Cardiology follow-up</option>
          <option>Lab report available notification</option>
          <option>Outstanding balance reminder</option>
          <option>Discharge instructions summary</option>
        </select>
        <textarea
          className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-[11px]"
          rows={3}
          defaultValue="Dear patient, your appointment at Nexora Central Hospital is scheduled for 18 Jul, 10:00 AM — Cardiology OPD Block A."
        />
        <button type="button" className="w-full rounded-md bg-[#2563EB] py-2 text-[11px] font-bold text-white">
          Queue SMS for Delivery
        </button>
      </div>
    );
  }

  if (type === 'print-card') {
    return (
      <div className="space-y-3 text-center">
        <div className="mx-auto w-48 rounded-lg border-2 border-[#0F172A] bg-white p-3 shadow-md">
          <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Nexora HMS</p>
          <p className="mt-1 text-[11px] font-bold text-[#0F172A]">{patientName}</p>
          <p className="font-mono text-[10px] text-[#2563EB]">{uhid}</p>
          <div className="mt-2 flex h-8 items-end justify-center gap-px">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="bg-[#0F172A]" style={{ width: 2, height: `${12 + (i % 4) * 3}px` }} />
            ))}
          </div>
        </div>
        <p className="text-[10px] text-slate-500">Preview — send to label printer at Desk-02</p>
        <button type="button" className="w-full rounded-md bg-[#2563EB] py-2 text-[11px] font-bold text-white">
          Send to Printer
        </button>
      </div>
    );
  }

  if (type === 'print-barcode') {
    return (
      <div className="space-y-3 text-center">
        <Barcode className="mx-auto h-10 w-10 text-[#0F172A]" />
        <div className="flex h-14 items-end justify-center gap-0.5 px-4">
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} className="bg-[#0F172A]" style={{ width: i % 3 === 0 ? 3 : 2, height: `${20 + (i % 6) * 4}px` }} />
          ))}
        </div>
        <p className="font-mono text-sm font-bold text-[#0F172A]">{uhid}</p>
        <button type="button" className="w-full rounded-md bg-[#2563EB] py-2 text-[11px] font-bold text-white">
          Print Barcode Label
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-center">
      <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50">
        <QrCode className="h-16 w-16 text-[#0F172A]" />
      </div>
      <p className="text-[10px] text-slate-600">
        Secure QR encodes tokenized patient reference — no raw PII embedded
      </p>
      <p className="font-mono text-[10px] text-[#2563EB]">{uhid}</p>
      <button type="button" className="w-full rounded-md bg-[#2563EB] py-2 text-[11px] font-bold text-white">
        Download QR PNG
      </button>
    </div>
  );
}
