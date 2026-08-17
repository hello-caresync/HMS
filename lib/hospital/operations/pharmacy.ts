import type { SupabaseClient } from '@supabase/supabase-js';

import { emitSystemEvent } from './events';
import type { PrescriptionRow } from './types';

export async function fetchPendingPrescriptions(
  supabase: SupabaseClient,
): Promise<PrescriptionRow[]> {
  const { data, error } = await supabase
    .from('prescriptions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(40);

  if (error) {
    console.warn('[fetchPendingPrescriptions]', error.message);
    return [];
  }

  return ((data ?? []) as PrescriptionRow[]).filter(
    (rx) => !rx.status || !String(rx.status).toUpperCase().includes('DISPENSED'),
  );
}

export async function dispensePrescription(
  supabase: SupabaseClient,
  input: {
    prescriptionId: string;
    inventoryItemId: string;
    quantity: number;
    dispensedBy?: string;
  },
) {
  const { prescriptionId, inventoryItemId, quantity } = input;
  if (!prescriptionId || !inventoryItemId) {
    throw new Error('prescriptionId and inventoryItemId are required');
  }

  const { data: item, error: itemError } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('id', inventoryItemId)
    .single();

  if (itemError || !item) throw new Error(itemError?.message || 'Inventory item not found');

  const stock = Number(item.quantity_in_stock ?? 0);
  if (stock < quantity) {
    throw new Error(`Insufficient stock: ${stock} available, ${quantity} requested`);
  }

  if (item.expiry_date) {
    const expiry = new Date(String(item.expiry_date));
    if (expiry.getTime() < Date.now()) {
      throw new Error(`Batch ${item.batch_number ?? 'N/A'} expired on ${item.expiry_date}`);
    }
  }

  const newQty = stock - quantity;
  const { error: stockError } = await supabase
    .from('inventory_items')
    .update({ quantity_in_stock: newQty, updated_at: new Date().toISOString() })
    .eq('id', inventoryItemId);

  if (stockError) throw new Error(stockError.message);

  const { data: rx, error: rxError } = await supabase
    .from('prescriptions')
    .update({ status: 'DISPENSED', updated_at: new Date().toISOString() })
    .eq('id', prescriptionId)
    .select('*')
    .single();

  if (rxError) throw new Error(rxError.message);

  await emitSystemEvent(
    supabase,
    'PRESCRIPTION_DISPENSED',
    {
      message: `Prescription dispensed for ${rx.patient_name ?? 'patient'}`,
      prescriptionId,
      inventoryItemId,
      quantity,
      relatedId: prescriptionId,
    },
    { severity: 'info', targetRoles: ['patient', 'hospital'] },
  );

  await supabase.from('notifications').insert({
    title: 'Prescription Ready',
    body: `Your medication has been dispensed from central pharmacy.`,
    category: 'pharmacy',
    severity: 'info',
    related_id: prescriptionId,
    patient_id: rx.patient_id ?? null,
  });

  if (newQty <= Number(item.reorder_level ?? 10)) {
    await emitSystemEvent(
      supabase,
      'LOW_STOCK_ALERT',
      {
        message: `Low stock: ${item.item_name} (${newQty} remaining)`,
        itemId: inventoryItemId,
        quantity: newQty,
        relatedId: inventoryItemId,
      },
      { severity: 'warning', targetRoles: ['hospital', 'vendor'] },
    );
  }

  return { success: true, prescription: rx, remainingStock: newQty };
}
