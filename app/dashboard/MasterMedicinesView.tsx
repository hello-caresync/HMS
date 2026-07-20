'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, Pill, Plus } from 'lucide-react';

import {
  MasterDataTable,
  MasterField,
  MasterPanel,
  MasterSearchBar,
  MasterSheet,
  MasterViewHeader,
  masterBtnPrimary,
  masterInputClass,
} from './_masterLightUi';

type Medicine = {
  id: string;
  generic: string;
  brand: string;
  hsn: string;
  gst: '0%' | '5%' | '12%' | '18%';
  unit: 'Tablets' | 'Capsules' | 'Vials' | 'Strips' | 'Bottles';
  mrp: string;
  batchVerified: boolean;
};

const SEED_MEDICINES: Medicine[] = [
  {
    id: 'M001',
    generic: 'Paracetamol',
    brand: 'Paracetamol 650',
    hsn: '30049061',
    gst: '12%',
    unit: 'Tablets',
    mrp: '₹32.00',
    batchVerified: true,
  },
  {
    id: 'M002',
    generic: 'Amoxicillin + Clavulanic Acid',
    brand: 'Augmentin 625 Duo',
    hsn: '30041010',
    gst: '12%',
    unit: 'Tablets',
    mrp: '₹204.50',
    batchVerified: true,
  },
  {
    id: 'M003',
    generic: 'Insulin Glargine',
    brand: 'Lantus 100IU',
    hsn: '30043100',
    gst: '5%',
    unit: 'Vials',
    mrp: '₹1,842.00',
    batchVerified: false,
  },
  {
    id: 'M004',
    generic: 'Omeprazole',
    brand: 'Omez 20',
    hsn: '30049099',
    gst: '12%',
    unit: 'Capsules',
    mrp: '₹118.00',
    batchVerified: true,
  },
];

const GST_OPTIONS: Medicine['gst'][] = ['0%', '5%', '12%', '18%'];
const UNIT_OPTIONS: Medicine['unit'][] = ['Tablets', 'Capsules', 'Vials', 'Strips', 'Bottles'];

export default function MasterMedicinesView() {
  const [medicines, setMedicines] = useState(SEED_MEDICINES);
  const [search, setSearch] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState({
    generic: '',
    brand: '',
    hsn: '',
    gst: '12%' as Medicine['gst'],
    unit: 'Tablets' as Medicine['unit'],
    mrp: '',
  });

  const filtered = useMemo(
    () =>
      medicines.filter(
        (m) =>
          m.generic.toLowerCase().includes(search.toLowerCase()) ||
          m.brand.toLowerCase().includes(search.toLowerCase()) ||
          m.hsn.includes(search),
      ),
    [medicines, search],
  );

  const verifiedCount = medicines.filter((m) => m.batchVerified).length;

  const handleAdd = () => {
    if (!form.brand.trim() || !form.generic.trim()) return;
    setMedicines((rows) => [
      ...rows,
      {
        id: `M${String(rows.length + 1).padStart(3, '0')}`,
        generic: form.generic.trim(),
        brand: form.brand.trim(),
        hsn: form.hsn.trim() || '[HSN Pending]',
        gst: form.gst,
        unit: form.unit,
        mrp: form.mrp.trim() ? `₹${form.mrp.trim()}` : '₹0.00',
        batchVerified: false,
      },
    ]);
    setSheetOpen(false);
    setForm({ generic: '', brand: '', hsn: '', gst: '12%', unit: 'Tablets', mrp: '' });
  };

  return (
    <div className="space-y-6">
      <MasterViewHeader
        title="Medicine Master Ledger"
        subtitle="HSN/GST compliant formulary with unit types, MRP points, and batch verification."
        icon={Pill}
        action={
          <button type="button" className={masterBtnPrimary} onClick={() => setSheetOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add SKU
          </button>
        }
      />

      <MasterSearchBar value={search} onChange={setSearch} placeholder="Search generic, brand, HSN…" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Formulary SKUs</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{medicines.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Batch Verified</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{verifiedCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pending Verification</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{medicines.length - verifiedCount}</p>
        </div>
      </div>

      <MasterPanel title="Verification Checklist" description="Dynamic batch compliance indicators">
        <ul className="space-y-2">
          {medicines.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
            >
              <span className="text-xs font-medium text-slate-800">{m.brand}</span>
              {m.batchVerified ? (
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Verified
                </span>
              ) : (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700 ring-1 ring-amber-200">
                  Batch Review
                </span>
              )}
            </li>
          ))}
        </ul>
      </MasterPanel>

      <MasterPanel title="Enterprise Medicine Registry" description="Generic · Brand · HSN · GST · Unit · MRP">
        <MasterDataTable
          columns={['Brand', 'Generic', 'HSN', 'GST', 'Unit', 'MRP', 'Batch']}
          rows={filtered.map((m) => [
            <span key="b" className="font-semibold text-slate-800">
              {m.brand}
            </span>,
            m.generic,
            <span key="h" className="font-mono text-[11px] text-slate-600">
              {m.hsn}
            </span>,
            m.gst,
            m.unit,
            <span key="m" className="font-semibold tabular-nums text-slate-800">
              {m.mrp}
            </span>,
            m.batchVerified ? (
              <CheckCircle2 key="v" className="h-4 w-4 text-emerald-500" />
            ) : (
              <span key="p" className="text-[10px] font-bold text-amber-600">
                Pending
              </span>
            ),
          ])}
        />
      </MasterPanel>

      <MasterSheet open={sheetOpen} title="Register Medicine SKU" onClose={() => setSheetOpen(false)}>
        <div className="space-y-4">
          <MasterField label="Generic Name">
            <input
              className={masterInputClass}
              value={form.generic}
              onChange={(e) => setForm((f) => ({ ...f, generic: e.target.value }))}
            />
          </MasterField>
          <MasterField label="Brand Name">
            <input
              className={masterInputClass}
              value={form.brand}
              onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
            />
          </MasterField>
          <MasterField label="HSN Code">
            <input
              className={masterInputClass}
              value={form.hsn}
              onChange={(e) => setForm((f) => ({ ...f, hsn: e.target.value }))}
              placeholder="30049061"
            />
          </MasterField>
          <div className="grid grid-cols-2 gap-3">
            <MasterField label="GST Tier">
              <select
                className={masterInputClass}
                value={form.gst}
                onChange={(e) => setForm((f) => ({ ...f, gst: e.target.value as Medicine['gst'] }))}
              >
                {GST_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </MasterField>
            <MasterField label="Unit Type">
              <select
                className={masterInputClass}
                value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value as Medicine['unit'] }))}
              >
                {UNIT_OPTIONS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </MasterField>
          </div>
          <MasterField label="MRP (₹)">
            <input
              className={masterInputClass}
              value={form.mrp}
              onChange={(e) => setForm((f) => ({ ...f, mrp: e.target.value }))}
              placeholder="204.50"
            />
          </MasterField>
          <button type="button" className={`${masterBtnPrimary} w-full justify-center`} onClick={handleAdd}>
            Save to Formulary
          </button>
        </div>
      </MasterSheet>
    </div>
  );
}
