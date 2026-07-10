'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, Package, Search } from 'lucide-react';

import {
  SEED_WAREHOUSE_STOCK,
  getExpiryStatus,
  isLowStock,
  type WarehouseStockItem,
} from '../../../lib/supplychain';
import InventoryStockTable from './InventoryStockTable';

export default function InventoryMatrixWorkbench() {
  const [items, setItems] = useState<WarehouseStockItem[]>(SEED_WAREHOUSE_STOCK);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.sku.toLowerCase().includes(q) ||
        i.itemName.toLowerCase().includes(q) ||
        i.batchNumber.toLowerCase().includes(q) ||
        i.barcode.includes(q),
    );
  }, [items, search]);

  const alertCounts = useMemo(() => {
    let lowStock = 0;
    let expiry = 0;
    for (const item of items) {
      if (isLowStock(item)) lowStock += 1;
      const exp = getExpiryStatus(item.expiryDate);
      if (exp === 'warning' || exp === 'expired') expiry += 1;
    }
    return { lowStock, expiry };
  }, [items]);

  const handleLocationChange = (sku: string, location: string) => {
    setItems((prev) =>
      prev.map((i) => (i.sku === sku ? { ...i, warehouseLocation: location } : i)),
    );
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <header className="border-b-2 border-slate-200 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-sky-700" />
            <div>
              <h1 className="text-lg font-black text-slate-900">Asset Inventory Matrix</h1>
              <p className="text-xs text-slate-800">
                Phase 6 · Module 17 · Stock levels &amp; expiry watch
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase">
            {alertCounts.lowStock > 0 && (
              <span className="inline-flex items-center gap-1 rounded border border-rose-400 bg-rose-50 px-2 py-1 text-rose-800">
                <AlertTriangle className="h-3 w-3" />
                {alertCounts.lowStock} Low Stock
              </span>
            )}
            {alertCounts.expiry > 0 && (
              <span className="inline-flex items-center gap-1 rounded border border-amber-400 bg-amber-50 px-2 py-1 text-amber-900">
                <AlertTriangle className="h-3 w-3" />
                {alertCounts.expiry} Expiry Watch
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-800" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search SKU, item name, batch, barcode…"
          className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
        />
      </div>

      <InventoryStockTable items={filtered} onLocationChange={handleLocationChange} />
    </div>
  );
}
