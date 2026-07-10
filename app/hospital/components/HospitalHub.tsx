'use client';

import React, { useMemo, useRef, useState } from 'react';
import Link from 'next/link';

import { APP_ROUTES } from '../../lib/routes';
import HospitalInventoryDashboard from './HospitalInventoryDashboard';

type CatalogProduct = {
  sku: string;
  name: string;
  hsn: string;
  rate: number;
};

export const medicalCatalog: CatalogProduct[] = [
  { sku: 'PROD-OML20', name: 'Omez 20mg Gastro-Resistant Capsules', hsn: '30049034', rate: 3.5 },
  { sku: 'PROD-DOLO650', name: 'Dolo 650mg Antipyretic Tablets', hsn: '30049061', rate: 2.0 },
  { sku: 'PROD-PARA500', name: 'Paracetamol 500mg Analgesic Tablets', hsn: '30049061', rate: 1.8 },
  { sku: 'PROD-TELM40', name: 'Telmisartan 40mg Baseline Tablets', hsn: '30049099', rate: 7.1 },
  { sku: 'PROD-PANT40', name: 'Pantocid 40mg Gastro Capsules', hsn: '30049034', rate: 9.3 },
  { sku: 'PROD-AMOX500', name: 'Amoxicillin 500mg Antibiotic Capsules', hsn: '30041010', rate: 6.5 },
  { sku: 'PROD-AZI500', name: 'Azithromycin 500mg Broad-Spectrum Tablets', hsn: '30042019', rate: 11.2 },
  { sku: 'PROD-LIMCEE', name: 'Limcee Vitamin C Chewable Tablets (500mg)', hsn: '30045036', rate: 1.5 },
  { sku: 'PROD-MET500', name: 'Metformin 500mg Antidiabetic Tablets', hsn: '30049089', rate: 2.2 },
  { sku: 'PROD-ATOR10', name: 'Atorvastatin 10mg Cholesterol Control Tablets', hsn: '30049099', rate: 4.8 },
];

type HospitalTab = 'dashboard' | 'procurement' | 'inventory' | 'audits';

type NavItem = { id: HospitalTab; label: string };

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Command Dashboard' },
  { id: 'procurement', label: 'PO Manifests' },
  { id: 'inventory', label: 'Stock Control' },
  { id: 'audits', label: '3-Way Audits' },
];

const STOCK_UNITS: Record<string, number> = {
  'PROD-TELM40': 84500,
  'PROD-PANT40': 42000,
  'PROD-DOLO650': 61200,
  'PROD-OML20': 28800,
};

const ACTIVE_NAV_CLASS =
  'w-full text-left px-4 py-3 rounded-xl text-xs font-bold bg-[#7BBDE8] text-[#001D39] border border-[#BDD8E9]/40 shadow-sm';

const INACTIVE_NAV_CLASS =
  'w-full text-left px-4 py-3 rounded-xl text-xs font-semibold text-[#BDD8E9]/80 hover:text-[#BDD8E9] hover:bg-[#0A4174]/50 transition-all';

const SEARCH_INPUT_CLASS =
  'w-full border border-[#49769F]/30 rounded-xl px-4 py-3 text-xs font-semibold bg-white text-[#001D39] focus:outline-none focus:border-[#0A4174] focus:ring-1 focus:ring-[#0A4174] placeholder:text-[#49769F]/60';

const RESULTS_PANEL_CLASS =
  'absolute left-0 top-full mt-1.5 w-full bg-white border border-[#49769F]/25 rounded-xl shadow-xl z-50 max-h-52 overflow-y-auto p-1.5';

const RESULT_ITEM_CLASS =
  'w-full text-left px-4 py-3 rounded-lg hover:bg-[#BDD8E9]/40 hover:text-[#001D39] transition-colors cursor-pointer block text-xs';

export default function HospitalHub() {
  const [activeTab, setActiveTab] = useState<HospitalTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  const filteredCatalog = useMemo(
    () =>
      medicalCatalog.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.hsn.includes(searchQuery.trim()),
      ),
    [searchQuery],
  );

  const activeInventoryValue = useMemo(
    () =>
      medicalCatalog.reduce((sum, item) => {
        const units = STOCK_UNITS[item.sku] ?? 0;
        return sum + units * item.rate;
      }, 0),
    [],
  );

  const handleSelectProduct = (product: CatalogProduct) => {
    setSelectedProduct(product);
    setSearchQuery(product.name);
    setIsDropdownOpen(false);
  };

  return (
    <div className="min-h-screen flex bg-[#BDD8E9]/25">
      <aside className="w-64 shrink-0 flex flex-col justify-between bg-[#001D39] border-r border-[#0A4174] p-4 text-white">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-[#BDD8E9]/70">
            CuraSync Hospital Hub
          </p>
          <p className="mt-2 text-sm font-black tracking-tight text-[#BDD8E9]">
            Procurement Node
          </p>

          <nav className="mt-8 space-y-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={activeTab === item.id ? ACTIVE_NAV_CLASS : INACTIVE_NAV_CLASS}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="space-y-2 border-t border-[#0A4174] pt-4">
          <Link
            href={APP_ROUTES.patient}
            className="block rounded-xl border border-[#49769F]/40 bg-[#0A4174]/30 px-4 py-2.5 text-center text-[10px] font-bold text-[#BDD8E9]/80 transition-all hover:bg-[#0A4174]/50 hover:text-[#BDD8E9]"
          >
            Patient command center
          </Link>
          <p className="text-center font-mono text-[9px] uppercase tracking-wider text-[#49769F]">
            Deep oceanic lane · v2
          </p>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        <header>
          <p className="font-mono text-[11px] uppercase tracking-wider text-[#49769F]">
            Hospital workspace
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-[#001D39]">
            Victoria Procurement Command Center
          </h1>
        </header>

        {activeTab === 'inventory' ? (
          <HospitalInventoryDashboard />
        ) : (
          <>
        <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-[#49769F]/20 bg-white p-6 shadow-xs">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#49769F]">
              Pipeline
            </p>
            <p className="mt-2 font-mono text-2xl font-black text-[#001D39]">18</p>
            <p className="mt-1 text-xs font-medium text-[#49769F]">Active purchase orders</p>
          </article>

          <article className="rounded-2xl border border-[#49769F]/20 bg-white p-6 shadow-xs">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#49769F]">
              Settlement
            </p>
            <p className="mt-2 font-mono text-2xl font-black text-[#0A4174]">₹4.18L</p>
            <p className="mt-1 text-xs font-medium text-[#49769F]">Pending invoice clearance</p>
          </article>

          <article className="rounded-2xl border border-[#49769F]/20 bg-white p-6 shadow-xs">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#49769F]">
              Inventory value
            </p>
            <p className="mt-2 font-mono text-2xl font-black text-[#001D39]">
              ₹{activeInventoryValue.toLocaleString('en-IN')}
            </p>
            <p className="mt-1 text-xs font-medium text-[#49769F]">
              Active on-hand stock valuation
            </p>
          </article>
        </section>

        <section className="mt-6 rounded-2xl border border-[#49769F]/20 bg-white p-6 shadow-xs">
          <div className="mb-4">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#49769F]">
              Smart catalog search
            </p>
            <h2 className="mt-1 text-lg font-black tracking-tight text-[#001D39]">
              Draft purchase manifest
            </h2>
            <p className="mt-1 text-xs font-medium text-[#49769F]">
              Search by product title or HSN code to locate contract-rate items.
            </p>
          </div>

          <div ref={searchRef} className="relative w-full max-w-xl">
            <input
              type="text"
              autoComplete="off"
              placeholder="Type product name or HSN…"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setSelectedProduct(null);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              className={SEARCH_INPUT_CLASS}
            />

            {isDropdownOpen && (
              <div className={RESULTS_PANEL_CLASS} role="listbox">
                {filteredCatalog.length === 0 ? (
                  <p className="px-4 py-3 text-xs font-medium text-[#49769F]">
                    {searchQuery.trim().length > 0
                      ? `No catalog matches for "${searchQuery.trim()}"`
                      : 'Start typing to filter the catalog…'}
                  </p>
                ) : (
                  filteredCatalog.map((product) => (
                    <button
                      key={product.sku}
                      type="button"
                      role="option"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleSelectProduct(product)}
                      className={RESULT_ITEM_CLASS}
                    >
                      <span className="block font-semibold text-[#001D39]">{product.name}</span>
                      <span className="mt-0.5 block font-mono text-[10px] text-[#49769F]">
                        HSN {product.hsn} · {product.sku} · ₹{product.rate}/unit
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {selectedProduct && (
            <p className="mt-3 text-xs font-semibold text-[#0A4174]">
              Selected: {selectedProduct.sku} · HSN {selectedProduct.hsn} · ₹
              {selectedProduct.rate}/unit
            </p>
          )}

          <button
            type="button"
            disabled={!selectedProduct}
            className="mt-5 rounded-xl bg-[#0A4174] px-5 py-3 text-xs font-bold text-white shadow-md shadow-[#0A4174]/20 transition-all hover:bg-[#001D39] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Transmit PO to Supplier
          </button>
        </section>
          </>
        )}
      </main>
    </div>
  );
}
