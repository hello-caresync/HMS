'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import {
  PurchaseOrder,
  URGENCIES,
  UserRole,
  RolePermissions,
} from '../types/procurement';
import {
  alertWarningClassName,
  bodyTextClassName,
  btnPrimaryClassName,
  EmptyState,
  featureHeaderClassName,
  inputClassName,
  monoDataClassName,
  overlineClassName,
  panelClassName,
  selectClassName,
  StatusBadge,
  workspaceClassName,
} from './hospitalUi';

export type CatalogProduct = {
  sku: string;
  name: string;
  hsn: string;
  rate: number;
};

export const medicalCatalog: CatalogProduct[] = [
  {
    sku: 'PROD-OML20',
    name: 'Omez 20mg Gastro-Resistant Capsules',
    hsn: '30049034',
    rate: 3.5,
  },
  {
    sku: 'PROD-DOLO650',
    name: 'Dolo 650mg Antipyretic Tablets',
    hsn: '30049061',
    rate: 2.0,
  },
  {
    sku: 'PROD-PARA500',
    name: 'Paracetamol 500mg Analgesic Tablets',
    hsn: '30049061',
    rate: 1.8,
  },
  {
    sku: 'PROD-TELM40',
    name: 'Telmisartan 40mg Baseline Tablets',
    hsn: '30049099',
    rate: 7.1,
  },
  {
    sku: 'PROD-PANT40',
    name: 'Pantocid 40mg Gastro Capsules',
    hsn: '30049034',
    rate: 9.3,
  },
  {
    sku: 'PROD-AMOX500',
    name: 'Amoxicillin 500mg Antibiotic Capsules',
    hsn: '30041010',
    rate: 6.5,
  },
  {
    sku: 'PROD-AZI500',
    name: 'Azithromycin 500mg Broad-Spectrum Tablets',
    hsn: '30042019',
    rate: 11.2,
  },
  {
    sku: 'PROD-LIMCEE',
    name: 'Limcee Vitamin C Chewable Tablets (500mg)',
    hsn: '30045036',
    rate: 1.5,
  },
  {
    sku: 'PROD-MET500',
    name: 'Metformin 500mg Antidiabetic Tablets',
    hsn: '30049089',
    rate: 2.2,
  },
  {
    sku: 'PROD-ATOR10',
    name: 'Atorvastatin 10mg Cholesterol Control Tablets',
    hsn: '30049099',
    rate: 4.8,
  },
];

/** @deprecated Use `medicalCatalog` — kept for existing imports */
export const MEDICAL_CATALOG = medicalCatalog;

const searchInputClassName =
  'w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold bg-white text-slate-900 focus:outline-none focus:border-[#D48D82] focus:ring-1 focus:ring-[#D48D82] shadow-3xs placeholder:text-slate-800 transition-all';

const resultsPanelClassName =
  'absolute left-0 top-full mt-1.5 w-full bg-white border border-slate-200/90 rounded-xl shadow-xl z-50 max-h-52 overflow-y-auto p-1.5';

const resultItemClassName =
  'w-full text-left px-4 py-3 rounded-lg hover:bg-[#FDF4F2] hover:text-[#A65E53] transition-colors cursor-pointer block text-xs';

type POCreationViewProps = {
  purchaseOrders: PurchaseOrder[];
  poQty: string;
  setPoQty: (value: string) => void;
  urgencyTier: URGENCIES;
  setUrgencyTier: (value: URGENCIES) => void;
  onCreatePO: (event: React.FormEvent, product: CatalogProduct) => void;
  permissions: RolePermissions;
  currentRole: UserRole;
};

export default function POCreationView({
  purchaseOrders,
  poQty,
  setPoQty,
  urgencyTier,
  setUrgencyTier,
  onCreatePO,
  permissions,
  currentRole,
}: POCreationViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectionError, setSelectionError] = useState(false);

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

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextQuery = event.target.value;
    setSearchQuery(nextQuery);
    setSelectionError(false);
    setIsDropdownOpen(true);
    setSelectedProduct(null);
  };

  const handleSearchFocus = () => {
    setIsDropdownOpen(true);
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setSearchQuery('');
      setSelectedProduct(null);
      setSelectionError(false);
      setIsDropdownOpen(false);
      return;
    }

    if (event.key === 'Backspace' || event.key === 'Delete') {
      setSelectionError(false);
      setSelectedProduct(null);
    }
  };

  const handleSelectProduct = (product: CatalogProduct) => {
    setSelectedProduct(product);
    setSearchQuery(product.name);
    setSelectionError(false);
    setIsDropdownOpen(false);
  };

  const handleTransmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedProduct) {
      setSelectionError(true);
      return;
    }

    onCreatePO(event, selectedProduct);
    setSearchQuery('');
    setSelectedProduct(null);
    setSelectionError(false);
    setIsDropdownOpen(false);
  };

  const qtyPreview = parseInt(poQty, 10) || 0;
  const lineTotalPreview =
    selectedProduct && qtyPreview > 0 ? selectedProduct.rate * qtyPreview : 0;

  return (
    <div className={workspaceClassName}>
      <form onSubmit={handleTransmit} className={`${panelClassName} space-y-5`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-slate-200 pb-4">
          <div>
            <span className={overlineClassName}>Procurement manifest</span>
            <h3 className={featureHeaderClassName}>
              Draft Secure Bulk Purchase Manifest
            </h3>
          </div>
          {permissions.isRequisitionOnly && (
            <span className="inline-flex items-center bg-[#FCEEEB] text-[#A65E53] border border-[#F5D5CF] rounded-lg px-3 py-1 font-mono font-semibold text-xs tracking-wider uppercase">
              Requisition · {currentRole}
            </span>
          )}
        </div>

        {!permissions.canCreatePO ? (
          <p className={alertWarningClassName}>
            Access denied: your role cannot raise purchase manifests.
          </p>
        ) : (
          <>
            {selectionError && (
              <p className={alertWarningClassName} role="alert">
                Select a catalog item by searching HSN code or product name before
                transmitting.
              </p>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="flex flex-col gap-1.5">
                <label className={overlineClassName} htmlFor="po-supplier-node">
                  Target supplier node
                </label>
                <input
                  id="po-supplier-node"
                  type="text"
                  readOnly
                  value="CuraSync Solutions"
                  className={`${inputClassName} bg-slate-50 text-slate-800`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={overlineClassName} htmlFor="po-volume">
                  Volume requested (units)
                </label>
                <input
                  id="po-volume"
                  type="number"
                  required
                  min={1}
                  placeholder="e.g. 5000"
                  value={poQty}
                  onChange={(event) => setPoQty(event.target.value)}
                  className={inputClassName}
                />
              </div>

              <div ref={searchRef} className="flex flex-col gap-1.5">
                <label className={overlineClassName} htmlFor="po-catalog-search">
                  Search medicine or HSN code
                </label>

                <div className="relative w-full">
                  <input
                    id="po-catalog-search"
                    type="text"
                    autoComplete="off"
                    placeholder="Type product name or HSN…"
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    onFocus={handleSearchFocus}
                    onKeyDown={handleSearchKeyDown}
                    className={searchInputClassName}
                  />

                  {isDropdownOpen && (
                    <div className={resultsPanelClassName} role="listbox">
                      {filteredCatalog.length === 0 ? (
                        <p className="px-4 py-3 text-xs font-medium text-slate-800">
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
                            aria-selected={selectedProduct?.sku === product.sku}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => handleSelectProduct(product)}
                            className={resultItemClassName}
                          >
                            <span className="block font-semibold text-slate-800">
                              {product.name}
                            </span>
                            <span className="mt-0.5 block font-mono text-xs text-slate-800">
                              HSN {product.hsn} · {product.sku} · ₹{product.rate}/unit
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {selectedProduct && (
                  <p className="text-xs font-semibold text-[#A65E53]">
                    Selected: {selectedProduct.sku} · HSN {selectedProduct.hsn}
                    {lineTotalPreview > 0 && (
                      <>
                        {' '}
                        · Est. ₹{lineTotalPreview.toLocaleString('en-IN')}
                      </>
                    )}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={overlineClassName} htmlFor="po-urgency">
                  Urgency level
                </label>
                <select
                  id="po-urgency"
                  value={urgencyTier}
                  onChange={(event) =>
                    setUrgencyTier(event.target.value as URGENCIES)
                  }
                  className={selectClassName}
                >
                  <option value="Normal">Normal Flow</option>
                  <option value="Urgent">Urgent Tier 2</option>
                  <option value="Critical">Critical Emergency Lane</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={!selectedProduct}
              className={`${btnPrimaryClassName} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {permissions.isRequisitionOnly
                ? 'Submit Base Requisition'
                : 'Transmit PO to Supplier'}
            </button>
          </>
        )}
      </form>

      <section className="space-y-4">
        <span className={overlineClassName}>Active manifest tracking log</span>

        {purchaseOrders.length === 0 ? (
          <EmptyState message="No purchase manifests on record." />
        ) : (
          purchaseOrders.map((po) => {
            const lineItem = po.items[0];
            const lineTotal =
              (lineItem?.quantityRequested ?? 0) * (lineItem?.unitPrice ?? 0);

            return (
              <article
                key={po.id}
                className={`${panelClassName} flex flex-wrap items-center justify-between gap-4`}
              >
                <div>
                  <span className={`${monoDataClassName} text-xs`}>{po.id}</span>
                  <h5 className={`${featureHeaderClassName} mt-1`}>
                    {lineItem?.name} (x
                    {lineItem?.quantityRequested.toLocaleString('en-IN')})
                  </h5>
                  <p className={`mt-1 ${bodyTextClassName}`}>
                    SKU {lineItem?.id} · Vendor: {po.vendorName} · Created by{' '}
                    {po.createdBy}
                  </p>
                  {lineTotal > 0 && (
                    <p className={`mt-0.5 text-xs ${monoDataClassName} text-[#A65E53]`}>
                      Line value ₹{lineTotal.toLocaleString('en-IN')}
                    </p>
                  )}
                </div>
                <StatusBadge label={po.status} />
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
