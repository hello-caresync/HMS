import type { SupabaseClient } from '@supabase/supabase-js';

import { emitSystemEvent } from './events';
import type { InventoryItemRow } from './types';

export async function fetchInventoryItems(
  supabase: SupabaseClient,
): Promise<InventoryItemRow[]> {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .order('item_name', { ascending: true });

  if (error) {
    console.warn('[fetchInventoryItems]', error.message);
    return [];
  }
  return (data ?? []) as InventoryItemRow[];
}

export async function createPurchaseOrder(
  supabase: SupabaseClient,
  input: {
    vendorId: string;
    vendorName: string;
    itemDetails: string;
    totalCost: number;
    inventoryItemId?: string;
    quantityOrdered?: number;
  },
) {
  const poId = `PO-${Date.now()}`;

  const { error: poError } = await supabase.from('purchase_orders').insert({
    id: poId,
    vendor_id: input.vendorId,
    vendor_name: input.vendorName,
    item_details: input.itemDetails,
    status: 'Issued',
    total_cost: input.totalCost,
    inventory_item_id: input.inventoryItemId ?? null,
    quantity_ordered: input.quantityOrdered ?? null,
  });

  if (poError) throw new Error(poError.message);

  await emitSystemEvent(
    supabase,
    'PURCHASE_ORDER_CREATED',
    {
      message: `PO issued to ${input.vendorName}: ${input.itemDetails}`,
      purchaseOrderId: poId,
      vendorId: input.vendorId,
      vendorName: input.vendorName,
      relatedId: poId,
    },
    { severity: 'info', targetRoles: ['vendor', 'hospital'] },
  );

  await supabase.from('notifications').insert({
    title: 'New Purchase Order',
    body: input.itemDetails,
    category: 'purchase_order',
    severity: 'info',
    related_id: poId,
  });

  return { success: true, purchaseOrderId: poId };
}

export async function verifyGoodsReceipt(
  supabase: SupabaseClient,
  input: {
    purchaseOrderId: string;
    inventoryItemId: string;
    quantityReceived: number;
    verifiedBy?: string;
  },
) {
  const { data: item, error: itemError } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('id', input.inventoryItemId)
    .single();

  if (itemError || !item) throw new Error(itemError?.message || 'Inventory item not found');

  const newQty = Number(item.quantity_in_stock ?? 0) + input.quantityReceived;

  await supabase
    .from('inventory_items')
    .update({ quantity_in_stock: newQty, updated_at: new Date().toISOString() })
    .eq('id', input.inventoryItemId);

  await supabase.from('goods_receipt_notes').insert({
    purchase_order_id: input.purchaseOrderId,
    inventory_item_id: input.inventoryItemId,
    quantity_received: input.quantityReceived,
    verified_by: input.verifiedBy ?? 'Hospital Store',
  });

  await supabase
    .from('purchase_orders')
    .update({ status: 'Delivered', updated_at: new Date().toISOString() })
    .eq('id', input.purchaseOrderId);

  return { success: true, newQuantity: newQty };
}

export async function scanLowStockAndCreatePo(
  supabase: SupabaseClient,
  vendorId = 'VENDOR-DEFAULT',
  vendorName = 'Regal Medical Supplies',
) {
  const items = await fetchInventoryItems(supabase);
  const lowStock = items.filter(
    (item) => Number(item.quantity_in_stock) <= Number(item.reorder_level ?? 10),
  );

  const orders = [];
  for (const item of lowStock) {
    await emitSystemEvent(
      supabase,
      'LOW_STOCK_ALERT',
      {
        message: `Auto-reorder triggered: ${item.item_name}`,
        itemId: item.id,
        quantity: item.quantity_in_stock,
        relatedId: item.id,
      },
      { severity: 'warning', targetRoles: ['hospital', 'vendor'] },
    );

    const result = await createPurchaseOrder(supabase, {
      vendorId,
      vendorName,
      itemDetails: `Restock ${item.item_name} (SKU ${item.sku ?? 'N/A'}) — current ${item.quantity_in_stock}, reorder ${item.reorder_level}`,
      totalCost: Number(item.unit_price ?? 0) * 50,
      inventoryItemId: item.id,
      quantityOrdered: 50,
    });
    orders.push(result);
  }

  return { lowStockCount: lowStock.length, orders };
}

export function summarizeInventory(items: InventoryItemRow[]) {
  return {
    total: items.length,
    lowStock: items.filter((i) => i.quantity_in_stock <= i.reorder_level).length,
    outOfStock: items.filter((i) => i.quantity_in_stock <= 0).length,
  };
}
