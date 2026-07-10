'use client';

import { AlertTriangle } from 'lucide-react';

import {
  CATEGORY_STYLES,
  WAREHOUSE_LOCATIONS,
  getExpiryStatus,
  isLowStock,
  type WarehouseStockItem,
} from '../../../lib/supplychain';

type InventoryStockTableProps = {
  items: WarehouseStockItem[];
  onLocationChange: (sku: string, location: string) => void;
};

export default function InventoryStockTable({
  items,
  onLocationChange,
}: InventoryStockTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-800 text-white">
              <th className="px-2 py-2 text-left text-[10px] font-black uppercase">SKU</th>
              <th className="px-2 py-2 text-left text-[10px] font-black uppercase">Item Name</th>
              <th className="px-2 py-2 text-left text-[10px] font-black uppercase">Category</th>
              <th className="px-2 py-2 text-left text-[10px] font-black uppercase">Warehouse</th>
              <th className="px-2 py-2 text-left text-[10px] font-black uppercase">Batch</th>
              <th className="px-2 py-2 text-center text-[10px] font-black uppercase">Stock</th>
              <th className="px-2 py-2 text-left text-[10px] font-black uppercase">Expiry</th>
              <th className="px-2 py-2 text-left text-[10px] font-black uppercase">Alerts</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const low = isLowStock(item);
              const expiry = getExpiryStatus(item.expiryDate);

              return (
                <tr
                  key={item.sku}
                  className={`border-b-2 border-slate-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}
                >
                  <td className="px-2 py-2">
                    <span className="font-mono text-[10px] font-black text-slate-900">{item.sku}</span>
                    <p className="font-mono text-[9px] text-slate-800">{item.barcode}</p>
                  </td>
                  <td className="px-2 py-2 text-xs font-bold text-slate-950">{item.itemName}</td>
                  <td className="px-2 py-2">
                    <span
                      className={`inline-flex rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ring-1 ${CATEGORY_STYLES[item.category]}`}
                    >
                      {item.category}
                    </span>
                  </td>
                  <td className="px-2 py-2">
                    <select
                      value={item.warehouseLocation}
                      onChange={(e) => onLocationChange(item.sku, e.target.value)}
                      className="max-w-[160px] rounded border border-slate-300 bg-white px-1.5 py-1 text-[10px] outline-none focus:border-sky-600"
                    >
                      {WAREHOUSE_LOCATIONS.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-2 font-mono text-[10px] text-slate-950">{item.batchNumber}</td>
                  <td className="px-2 py-2 text-center">
                    <span
                      className={`font-mono text-xs font-bold tabular-nums ${low ? 'text-rose-700' : 'text-slate-900'}`}
                    >
                      {item.availableStock}
                    </span>
                    <p className="text-[9px] text-slate-800">min {item.minimumThreshold}</p>
                  </td>
                  <td className="px-2 py-2 font-mono text-[10px] text-slate-900">{item.expiryDate}</td>
                  <td className="px-2 py-2">
                    <div className="flex flex-col gap-1">
                      {low && (
                        <span className="inline-flex w-fit items-center gap-0.5 rounded bg-rose-700 px-1.5 py-0.5 text-[8px] font-black uppercase text-white">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          Low Stock Alert
                        </span>
                      )}
                      {expiry === 'expired' && (
                        <span className="inline-flex w-fit rounded bg-rose-100 px-1.5 py-0.5 text-[8px] font-bold uppercase text-rose-800 ring-1 ring-rose-300">
                          Expired · Do Not Use
                        </span>
                      )}
                      {expiry === 'warning' && (
                        <span className="inline-flex w-fit rounded bg-amber-100 px-1.5 py-0.5 text-[8px] font-bold uppercase text-amber-900 ring-1 ring-amber-400">
                          Expiry Approaching
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {items.length === 0 && (
        <p className="px-4 py-8 text-center text-sm text-slate-800">No items match your search.</p>
      )}
    </div>
  );
}
