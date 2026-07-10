'use client';

import { useState } from 'react';
import { Pill, Search } from 'lucide-react';

import {
  SEED_ACTIVE_PRESCRIPTION,
  type ActivePrescription,
  type PrescriptionLineItem,
} from '../../../lib/clinical';
import CheckoutPanel from './CheckoutPanel';
import PrescriptionBreakdownPanel from './PrescriptionBreakdownPanel';

const SEED_SCRIPTS: ActivePrescription[] = [
  SEED_ACTIVE_PRESCRIPTION,
  {
    scriptId: 'RX-2026-7710',
    patientName: 'Rajesh Kumar',
    patientUhid: 'NX-2026-482910',
    doctorName: 'Dr. Priya Menon',
    issuedAt: '2026-07-10T08:45:00Z',
    lines: [
      {
        id: 'rxl-r1',
        catalogId: 'PHM-006',
        drugName: 'Ceftriaxone 1g',
        genericFormula: 'Ceftriaxone Sodium',
        dosageInstructions: '1g IV OD · 3 days',
        quantityOrdered: 3,
        unitPrice: 145,
        stockLevel: 'In Stock',
        batch: {
          batchNumberCode: 'BT-CEFT-26B',
          manufacturedDate: '2026-02-10',
          expiryDate: '2027-02-09',
          stockCountRemaining: 56,
          genericCompoundKey: 'ceftriaxone',
        },
        fulfilled: true,
      },
      {
        id: 'rxl-r2',
        catalogId: 'PHM-004',
        drugName: 'Normal Saline 500 mL',
        genericFormula: 'Sodium Chloride 0.9%',
        dosageInstructions: 'IV infusion · as directed',
        quantityOrdered: 2,
        unitPrice: 85,
        stockLevel: 'In Stock',
        batch: null,
        fulfilled: true,
      },
    ],
  },
];

export default function PharmacyFulfillmentWorkbench() {
  const [search, setSearch] = useState('');
  const [prescription, setPrescription] = useState<ActivePrescription>(SEED_ACTIVE_PRESCRIPTION);

  const handleSearchSubmit = () => {
    const q = search.trim().toLowerCase();
    const hit = SEED_SCRIPTS.find(
      (s) =>
        s.patientName.toLowerCase().includes(q) ||
        s.patientUhid.toLowerCase().includes(q) ||
        s.scriptId.toLowerCase().includes(q),
    );
    if (hit) setPrescription(hit);
  };

  const handleToggleFulfill = (lineId: string) => {
    setPrescription((prev) => ({
      ...prev,
      lines: prev.lines.map((l) =>
        l.id === lineId && l.stockLevel !== 'Out of Stock'
          ? { ...l, fulfilled: !l.fulfilled }
          : l,
      ),
    }));
  };

  const handleSwapAlternative = (lineId: string, altDrugName: string) => {
    setPrescription((prev) => ({
      ...prev,
      lines: prev.lines.map((l) =>
        l.id === lineId
          ? {
              ...l,
              drugName: altDrugName,
              stockLevel: 'In Stock' as const,
              fulfilled: true,
              unitPrice: l.unitPrice * 0.92,
            }
          : l,
      ),
    }));
  };

  const handleCheckout = () => {
    window.alert(
      `Payment collected · Script ${prescription.scriptId} dispensed to ${prescription.patientName}`,
    );
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <header className="border-b-2 border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Pill className="h-5 w-5 text-sky-700" />
          <div>
            <h1 className="text-lg font-black text-slate-900">Pharmacy Fulfillment &amp; Checkout</h1>
            <p className="text-xs text-slate-800">
              Phase 3 · Module 10 · Retail counter · inventory-aware dispensing
            </p>
          </div>
        </div>
      </header>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-800" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
            placeholder="Search patient UHID, name, or script ID…"
            className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
          />
        </div>
        <button
          type="button"
          onClick={handleSearchSubmit}
          className="rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-900 hover:bg-slate-50"
        >
          Load Script
        </button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
        <span className="font-bold text-slate-800">{prescription.scriptId}</span>
        <span className="mx-2 text-slate-900">|</span>
        <span>{prescription.patientName}</span>
        <span className="mx-2 font-mono text-slate-800">{prescription.patientUhid}</span>
        <span className="text-slate-800">· {prescription.doctorName}</span>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <PrescriptionBreakdownPanel
          lines={prescription.lines}
          onToggleFulfill={handleToggleFulfill}
          onSwapAlternative={handleSwapAlternative}
        />
        <CheckoutPanel prescription={prescription} onCheckout={handleCheckout} />
      </div>
    </div>
  );
}

export type { PrescriptionLineItem };
