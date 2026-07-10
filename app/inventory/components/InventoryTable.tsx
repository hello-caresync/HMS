'use client';

import { useInventory } from '../context/InventoryProvider';
import { INVENTORY_CATEGORIES } from '../types';
import { deriveStockStatus, isExpiringWithinDays, STATUS_STYLES } from '../types';

export default function InventoryTable() {
  const { categoryFilter, setCategoryFilter, filteredItems } = useInventory();

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap gap-1 border-b-2 border-slate-200 bg-slate-50/80 p-2">
        {INVENTORY_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter(cat)}
            className={`rounded-md px-2.5 py-1 text-[10px] font-bold transition ${
              categoryFilter === cat
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-[11px]">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-[#0a0e14] text-[10px] uppercase tracking-wider text-slate-800">
              <th className="px-3 py-2 font-black">Item Name</th>
              <th className="px-3 py-2 font-black">SKU / Batch</th>
              <th className="px-3 py-2 font-black">Dept / Location</th>
              <th className="px-3 py-2 text-right font-black">Qty On Hand</th>
              <th className="px-3 py-2 font-black">Unit</th>
              <th className="px-3 py-2 font-black">Expiry</th>
              <th className="px-3 py-2 font-black">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-slate-950">
                  No items in this category
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const status = deriveStockStatus(item);
                const nearExpiry = isExpiringWithinDays(item, 30);
                const expired = status === 'Expired';

                return (
                  <tr
                    key={item.id}
                    className={`border-b border-slate-50 hover:bg-slate-50/60 ${
                      expired
                        ? 'bg-rose-50/50'
                        : nearExpiry
                          ? 'bg-amber-50/40'
                          : ''
                    }`}
                  >
                    <td className="px-3 py-2">
                      <p className="font-medium text-slate-900">{item.itemName}</p>
                      {nearExpiry && !expired && (
                        <p className="text-[9px] font-bold uppercase text-amber-600">
                          Expiring soon
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <p className="font-mono text-[10px] text-slate-800">{item.sku}</p>
                      {item.batchNumber && (
                        <p className="font-mono text-[9px] text-slate-800">{item.batchNumber}</p>
                      )}
                    </td>
                    <td className="px-3 py-2 text-slate-950">
                      <p>{item.department}</p>
                      <p className="text-[9px] text-slate-800">{item.location}</p>
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold tabular-nums text-slate-900">
                      {item.quantityOnHand}
                    </td>
                    <td className="px-3 py-2 text-slate-950">{item.unit}</td>
                    <td
                      className={`px-3 py-2 font-mono text-[10px] ${
                        expired
                          ? 'font-bold text-rose-600'
                          : nearExpiry
                            ? 'font-semibold text-amber-700'
                            : 'text-slate-800'
                      }`}
                    >
                      {item.expiryDate ?? '—'}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${STATUS_STYLES[status]}`}
                      >
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
