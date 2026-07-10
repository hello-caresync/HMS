'use client';

import React from 'react';

import { CatalogProduct } from '../types';
import {
  cardClassName,
  ModuleTransition,
  nestedPanelClassName,
  overlineClassName,
  PageHeader,
  sectionTitleClassName,
} from './hubUi';

interface CatalogProps {
  catalog: CatalogProduct[];
}

export default function CatalogView({ catalog }: CatalogProps) {
  const products = catalog ?? [];

  return (
    <ModuleTransition moduleKey="catalog">
      <PageHeader
        title="Medical Product Catalog"
        description="Read-only contract rate matrices, HSN mappings, and live warehouse availability."
      />

      {products.length === 0 ? (
        <p className="text-center text-xs font-medium text-slate-800 py-12">
          No catalog products configured.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {products.map((prod, index) => (
            <article
              key={prod?.id ?? `prod-row-${index}`}
              className={`${cardClassName} space-y-3`}
            >
              <div>
                <p className={overlineClassName}>SKU</p>
                <p className="font-mono text-xs font-black text-slate-950">
                  {prod?.id ?? '—'}
                </p>
                <h3 className={`${sectionTitleClassName} mt-1`}>
                  {prod?.name ?? 'Unnamed product'}
                </h3>
              </div>

              <div className={`${nestedPanelClassName} grid grid-cols-2 gap-3`}>
                <div>
                  <p className={overlineClassName}>HSN code</p>
                  <p className="mt-1 font-mono text-sm font-black text-slate-950">
                    {prod?.hsnCode ?? '—'}
                  </p>
                </div>
                <div>
                  <p className={overlineClassName}>Contract rate</p>
                  <p className="mt-1 font-mono text-sm font-black text-blue-700">
                    ₹{prod?.price ?? 0}/unit
                  </p>
                </div>
              </div>

              {prod?.expiryBatch && (
                <p className="font-mono text-[10px] font-black text-slate-800">
                  {prod.expiryBatch}
                </p>
              )}

              <div className="border-t border-slate-200 pt-3">
                <p className={overlineClassName}>Live stock</p>
                <p className="mt-1 font-mono text-xl font-black text-slate-900">
                  {(prod?.stockAvailable ?? 0).toLocaleString('en-IN')}
                  <span className="ml-2 text-xs font-black text-slate-800">
                    units left
                  </span>
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </ModuleTransition>
  );
}
