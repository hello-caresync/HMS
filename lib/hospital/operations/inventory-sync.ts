import type { SupabaseClient } from '@supabase/supabase-js';

export const REGAL_FACILITY_CODE = 'RH-BLR-01';

export type InventoryCategory = 'Medicine' | 'Consumable' | 'Surgical';

export type HospitalInventoryItem = {
  id: string;
  item_name: string;
  category: string;
  quantity_in_stock: number;
  reorder_level: number;
  unit_price: number;
  vendor_name?: string;
  item_code?: string;
  facility_code?: string;
  created_at?: string;
  updated_at?: string;
};

export type CreateInventoryInput = {
  item_name: string;
  category: InventoryCategory | string;
  quantity_in_stock: number;
  reorder_level: number;
  unit_price: number;
  vendor_name?: string;
};

function mapInventoryRow(row: Record<string, unknown>): HospitalInventoryItem {
  return {
    id: String(row.id ?? ''),
    item_name: String(row.item_name ?? 'Item'),
    category: String(row.category ?? 'Medicine'),
    quantity_in_stock: Number(row.quantity_in_stock ?? 0),
    reorder_level: Number(row.reorder_level ?? 10),
    unit_price: Number(row.unit_price ?? 0),
    vendor_name: row.vendor_name ? String(row.vendor_name) : undefined,
    item_code: row.item_code ? String(row.item_code) : undefined,
    facility_code: row.facility_code ? String(row.facility_code) : REGAL_FACILITY_CODE,
    created_at: row.created_at ? String(row.created_at) : undefined,
    updated_at: row.updated_at ? String(row.updated_at) : undefined,
  };
}

function nextItemCode(): string {
  return `INV-${String(Math.floor(1000 + Math.random() * 9000))}`;
}

/** Live inventory from inventory_items — no seed fallbacks. */
export async function loadHospitalInventoryLive(
  supabase: SupabaseClient,
  limit = 200,
): Promise<HospitalInventoryItem[]> {
  const primary = await supabase
    .from('inventory_items')
    .select('*')
    .eq('facility_code', REGAL_FACILITY_CODE)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (!primary.error && primary.data?.length) {
    return primary.data.map((row) => mapInventoryRow(row as Record<string, unknown>));
  }

  const fallback = await supabase
    .from('inventory_items')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (fallback.error || !fallback.data?.length) return [];
  return fallback.data.map((row) => mapInventoryRow(row as Record<string, unknown>));
}

export async function createHospitalInventoryItem(
  supabase: SupabaseClient,
  input: CreateInventoryInput,
): Promise<{ ok: boolean; error?: string; item?: HospitalInventoryItem }> {
  const now = new Date().toISOString();
  const payload = {
    id: crypto.randomUUID(),
    item_name: input.item_name.trim(),
    category: input.category,
    quantity_in_stock: input.quantity_in_stock,
    reorder_level: input.reorder_level,
    unit_price: input.unit_price,
    vendor_name: input.vendor_name?.trim() || 'MedSupply Dispatch Pvt Ltd',
    item_code: nextItemCode(),
    facility_code: REGAL_FACILITY_CODE,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase.from('inventory_items').insert(payload).select('*').single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, item: mapInventoryRow((data ?? payload) as Record<string, unknown>) };
}

export function inventoryItemToHospitalRow(item: HospitalInventoryItem): Record<string, unknown> {
  return {
    id: item.id,
    item_name: item.item_name,
    category: item.category,
    quantity_in_stock: item.quantity_in_stock,
    reorder_level: item.reorder_level,
    unit_price: item.unit_price,
    vendor_name: item.vendor_name,
    item_code: item.item_code,
  };
}

export function subscribeHospitalInventory(
  supabase: SupabaseClient,
  onChange: () => void,
): () => void {
  const channel = supabase
    .channel('public:hospital-inventory_items')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, () => onChange())
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
