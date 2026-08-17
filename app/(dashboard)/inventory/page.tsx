'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { HospitalOpsShell } from '@/components/hospital-operations/HospitalOpsShell';
import { hospitalOpsClasses } from '@/lib/hospital/design-tokens';
import { postHospitalApi, getOpsSupabase } from '@/lib/hospital/operations/client-api';
import {
  createPurchaseOrder,
  fetchInventoryItems,
  scanLowStockAndCreatePo,
  summarizeInventory,
} from '@/lib/hospital/operations/procurement';
import type { InventoryItemRow } from '@/lib/hospital/operations/types';
import { useHospitalOpsRealtime } from '@/lib/hospital/operations/realtime';

export default function SupplyChainInventoryPage() {
  const [items, setItems] = useState<InventoryItemRow[]>([]);

  const load = useCallback(async () => {
    setItems(await fetchInventoryItems(getOpsSupabase()));
  }, []);

  useHospitalOpsRealtime(load);
  useEffect(() => {
    void load();
  }, [load]);

  const summary = summarizeInventory(items);

  const autoReorder = async () => {
    try {
      const result = await postHospitalApi(
        '/api/procurement/create-po',
        { action: 'auto_reorder', vendorId: 'VENDOR-REGAL-01', vendorName: 'Regal Medical Supplies' },
        () => scanLowStockAndCreatePo(getOpsSupabase(), 'VENDOR-REGAL-01', 'Regal Medical Supplies'),
      );
      toast.success(`Auto-reorder: ${result.lowStockCount ?? 0} PO(s) sent to Vendor App`);
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Auto-reorder failed');
    }
  };

  const createPoForItem = async (item: InventoryItemRow) => {
    try {
      await postHospitalApi(
        '/api/procurement/create-po',
        {
          vendorId: 'VENDOR-REGAL-01',
          vendorName: 'Regal Medical Supplies',
          itemDetails: `Restock ${item.item_name} (SKU ${item.sku ?? 'N/A'})`,
          totalCost: 5000,
          inventoryItemId: item.id,
          quantityOrdered: 50,
        },
        () =>
          createPurchaseOrder(getOpsSupabase(), {
            vendorId: 'VENDOR-REGAL-01',
            vendorName: 'Regal Medical Supplies',
            itemDetails: `Restock ${item.item_name}`,
            totalCost: 5000,
            inventoryItemId: item.id,
            quantityOrdered: 50,
          }),
      );
      toast.success('Purchase order created — vendor notified via system_events');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'PO creation failed');
    }
  };

  return (
    <HospitalOpsShell
      title="Supply Chain & Vendor Sync"
      subtitle="Low-stock triggers · PURCHASE_ORDER_CREATED events · GRN inventory increment"
      actions={
        <button type="button" className={hospitalOpsClasses.btnPrimary} onClick={() => void autoReorder()}>
          Scan & Auto-Reorder
        </button>
      }
    >
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className={`${hospitalOpsClasses.surface} p-4`}>
          <p className="text-[10px] font-black uppercase text-[#52796F]">SKU Count</p>
          <p className="text-2xl font-black">{summary.total}</p>
        </div>
        <div className={`${hospitalOpsClasses.surface} p-4`}>
          <p className="text-[10px] font-black uppercase text-[#52796F]">Low Stock</p>
          <p className="text-2xl font-black text-[#D4A373]">{summary.lowStock}</p>
        </div>
        <div className={`${hospitalOpsClasses.surface} p-4`}>
          <p className="text-[10px] font-black uppercase text-[#52796F]">Out of Stock</p>
          <p className="text-2xl font-black text-[#C94A29]">{summary.outOfStock}</p>
        </div>
      </div>

      <div className={`${hospitalOpsClasses.surface} overflow-x-auto`}>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#CAD2C5] text-[10px] font-black uppercase text-[#52796F]">
              <th className="py-2 px-3 text-left">Item</th>
              <th className="py-2 px-3 text-left">SKU</th>
              <th className="py-2 px-3 text-left">Stock</th>
              <th className="py-2 px-3 text-left">Reorder At</th>
              <th className="py-2 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[#84A98C]">
                  No inventory items — run hospital-operations-schema.sql in Supabase
                </td>
              </tr>
            ) : (
              items.map((item, index) => {
                const rowKey = item.id || item.sku || `item-${index}`;
                const low = item.quantity_in_stock <= item.reorder_level;
                return (
                  <tr key={rowKey} className="border-b border-[#CAD2C5]/50">
                    <td className="py-2.5 px-3 font-bold">{item.item_name}</td>
                    <td className="py-2.5 px-3 font-mono">{item.sku ?? '—'}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${low ? hospitalOpsClasses.badgeWarning : hospitalOpsClasses.badgeDefault}`}>
                        {item.quantity_in_stock}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">{item.reorder_level}</td>
                    <td className="py-2.5 px-3 text-right">
                      {low ? (
                        <button type="button" className={hospitalOpsClasses.btnPrimary} onClick={() => void createPoForItem(item)}>
                          Create PO
                        </button>
                      ) : (
                        <span className="text-[#84A98C]">OK</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </HospitalOpsShell>
  );
}
