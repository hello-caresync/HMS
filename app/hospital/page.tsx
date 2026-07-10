'use client';

import { ChevronDown } from 'lucide-react';
import React, { useState } from 'react';

type VolumeUnit = 'Strips' | 'Boxes' | 'Vials' | 'Bottles';
type ManifestStatus = 'SENT' | 'ACCEPTED' | 'DELIVERED';

interface Product {
  sku: string;
  name: string;
  hsn: string;
  rate: number;
}

interface Manifest {
  id: string;
  productName: string;
  hsn: string;
  volume: number;
  unit: VolumeUnit;
  urgency: string;
  status: ManifestStatus;
}

const VOLUME_UNITS: VolumeUnit[] = ['Strips', 'Boxes', 'Vials', 'Bottles'];

const STATUS_BADGE: Record<ManifestStatus, string> = {
  DELIVERED: 'bg-[#d4f0e4] text-[#1b5e3b] ring-1 ring-[#a8dcc4]',
  SENT: 'bg-[#fef3c7] text-[#92400e] ring-1 ring-[#fde68a]',
  ACCEPTED: 'bg-[#fef9c3] text-[#854d0e] ring-1 ring-[#fef08a]',
};

export default function HospitalHub() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [volume, setVolume] = useState('');
  const [volumeUnit, setVolumeUnit] = useState<VolumeUnit>('Strips');
  const [urgency, setUrgency] = useState('Normal Flow');
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState('PO Manifests');

  const medicalCatalog: Product[] = [
    { sku: 'PROD-OML20', name: 'Omez 20mg Gastro-Resistant Capsules', hsn: '30049034', rate: 3.5 },
    { sku: 'PROD-DOLO650', name: 'Dolo 650mg Antipyretic Tablets', hsn: '30049061', rate: 2.0 },
    { sku: 'PROD-PARA500', name: 'Paracetamol 500mg Analgesic Tablets', hsn: '30049061', rate: 1.8 },
    { sku: 'PROD-TELM40', name: 'Telmisartan 40mg Baseline Tablets', hsn: '30049099', rate: 7.1 },
    { sku: 'PROD-PANT40', name: 'Pantocid 40mg Gastro Capsules', hsn: '30049034', rate: 9.3 },
    { sku: 'PROD-AMOX500', name: 'Amoxicillin 500mg Antibiotic Capsules', hsn: '30041010', rate: 6.5 },
  ];

  const [manifests, setManifests] = useState<Manifest[]>([
    {
      id: 'HOS-PO-288',
      productName: 'Telmisartan 40mg Baseline Tablets',
      hsn: '30049099',
      volume: 3000,
      unit: 'Strips',
      urgency: 'Critical Emergency Lane',
      status: 'SENT',
    },
    {
      id: 'HOS-PO-341',
      productName: 'Pantocid 40mg Gastro Capsules',
      hsn: '30049034',
      volume: 500,
      unit: 'Boxes',
      urgency: 'Urgent Dispatch Routing',
      status: 'DELIVERED',
    },
    {
      id: 'HOS-PO-101',
      productName: 'Telmisartan 40mg Baseline Tablets',
      hsn: '30049099',
      volume: 5000,
      unit: 'Strips',
      urgency: 'Normal Flow',
      status: 'ACCEPTED',
    },
  ]);

  const sidebarLinks = [
    'PO Manifests',
    'Vendor Directory',
    '3-Way Audits',
    'Stock Control',
    'Goods Receiving',
    'Dept Analytics',
    'Access Control',
  ];

  const filteredCatalog = medicalCatalog.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.hsn.includes(searchQuery.trim()),
  );

  const handleTransmitManifest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !volume || Number.isNaN(Number(volume))) return;

    const newManifest: Manifest = {
      id: `HOS-PO-${Math.floor(100 + Math.random() * 900)}`,
      productName: selectedProduct.name,
      hsn: selectedProduct.hsn,
      volume: Number(volume),
      unit: volumeUnit,
      urgency,
      status: 'SENT',
    };

    setManifests([newManifest, ...manifests]);
    setSearchQuery('');
    setSelectedProduct(null);
    setVolume('');
    setVolumeUnit('Strips');
  };

  return (
    <div className="flex min-h-screen bg-[#eef2f7] font-sans antialiased selection:bg-blue-200/40">
      {/* Sidebar — slate-blue corporate */}
      <aside className="flex w-64 shrink-0 flex-col justify-between border-r border-slate-700/40 bg-[#1e293b] p-4 shadow-xl">
        <div>
          <div className="mb-6 px-2 py-3">
            <span className="block font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-blue-300/90">
              Enterprise Procurement
            </span>
            <h1 className="mt-1 text-lg font-bold leading-tight tracking-tight text-white">
              Victoria Healthcare
            </h1>
          </div>

          <nav className="space-y-0.5">
            {sidebarLinks.map((link) => {
              const active = activeTab === link;
              return (
                <button
                  key={link}
                  type="button"
                  onClick={() => setActiveTab(link)}
                  className={`block w-full cursor-pointer rounded-lg px-3.5 py-2.5 text-left text-xs transition-all duration-150 ${
                    active
                      ? 'border border-blue-500/40 bg-[#334155] font-semibold text-white shadow-sm'
                      : 'border border-transparent font-medium text-slate-800 hover:border-slate-600/50 hover:bg-[#334155]/70 hover:text-white'
                  }`}
                >
                  {link}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="rounded-lg border border-slate-600/50 bg-slate-800/50 px-3 py-2.5">
          <span className="block font-mono text-[10px] font-semibold text-slate-900">
            curasync-hospital
          </span>
          <span className="mt-0.5 block text-[9px] text-slate-800">Secure SCM Node</span>
        </div>
      </aside>

      {/* Workspace */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="mb-6 border-b-2 border-slate-200 pb-4">
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">
            Secure Bulk Purchase Engine
          </h2>
          <p className="mt-1 text-sm text-slate-800">
            Volume procurement · HSN-validated manifests · supplier tracking
          </p>
        </div>

        {/* PO creation form */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleTransmitManifest} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="relative">
              <label className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-wider text-slate-800">
                Search Product or HSN
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                placeholder="Search by Drug Name or 8-digit HSN..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-800 placeholder:text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              />

              {showDropdown && searchQuery.trim() !== '' && (
                <div className="absolute left-0 top-full z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                  {filteredCatalog.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-slate-800">No matches found</p>
                  ) : (
                    filteredCatalog.map((p) => (
                      <button
                        type="button"
                        key={p.sku}
                        onMouseDown={() => {
                          setSelectedProduct(p);
                          setSearchQuery(p.name);
                          setShowDropdown(false);
                        }}
                        className="mb-0.5 block w-full rounded-lg px-3 py-2 text-left text-xs text-slate-800 hover:bg-slate-50"
                      >
                        <strong className="font-semibold">{p.name}</strong>
                        <span className="mt-0.5 block text-[10px] text-slate-800">
                          HSN: {p.hsn} · ₹{p.rate}/unit
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-wider text-slate-800">
                Volume Requested
              </label>
              <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                <input
                  type="text"
                  inputMode="numeric"
                  value={volume}
                  onChange={(e) => setVolume(e.target.value.replace(/[^\d]/g, ''))}
                  placeholder="e.g. 5000"
                  className="min-w-0 flex-1 border-0 bg-transparent px-4 py-3 text-xs text-slate-800 placeholder:text-slate-800 focus:outline-none focus:ring-0"
                />
                <div className="relative flex shrink-0 items-center border-l border-slate-200 bg-slate-50">
                  <select
                    value={volumeUnit}
                    onChange={(e) => setVolumeUnit(e.target.value as VolumeUnit)}
                    className="cursor-pointer appearance-none border-0 bg-transparent py-3 pl-3 pr-8 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-0"
                    aria-label="Volume unit"
                  >
                    {VOLUME_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-slate-800" />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-wider text-slate-800">
                Urgency Level
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option>Normal Flow</option>
                <option>Urgent Dispatch Routing</option>
                <option>Critical Emergency Lane</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={!selectedProduct || !volume}
              className="cursor-pointer rounded-xl bg-[#1e40af] py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-[#1e3a8a] disabled:cursor-not-allowed disabled:opacity-40 lg:col-span-3"
            >
              Transmit PO to Supplier Node
            </button>
          </form>
        </div>

        {/* Active Tracking Registry */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-slate-800">Active Tracking Registry</h3>
          {manifests.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div>
                <span className="block font-mono text-[10px] font-semibold text-slate-800">
                  {m.id}
                </span>
                <span className="mt-0.5 block font-mono text-[10px] text-slate-800">
                  HSN: {m.hsn}
                </span>
                <h4 className="mt-1 text-sm font-bold text-slate-800">
                  {m.productName}{' '}
                  <span className="font-normal text-slate-800">
                    (×{m.volume.toLocaleString('en-IN')} {m.unit})
                  </span>
                </h4>
                <span className="mt-0.5 block text-[11px] italic text-slate-800">{m.urgency}</span>
              </div>
              <span
                className={`shrink-0 rounded-lg px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wide ${STATUS_BADGE[m.status]}`}
              >
                {m.status}
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
