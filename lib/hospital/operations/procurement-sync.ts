import type { RealtimePostgresChangesPayload, SupabaseClient } from '@supabase/supabase-js';

/** Regal Hospital default vendor UUID shared with Vendor Portal V0. */
export const REGAL_VENDOR_ID = '11111111-1111-1111-1111-111111111111';

export type HospitalPurchaseOrder = {
  id: string;
  vendor_id: string;
  po_number: string;
  hospital_name: string;
  item_details?: string;
  item_name?: string;
  quantity_ordered?: number;
  total_amount: number;
  status: string;
  facility_code?: string;
  items?: unknown;
  created_at: string;
  updated_at?: string;
};

const PLACEHOLDER_ITEM = /^(—|-+|n\/a|null|undefined)$/i;

function nextPoNumber(): string {
  const suffix = String(Math.floor(1000 + Math.random() * 9000));
  return `RH-PO-2026-${suffix}`;
}

/** Normalize legacy PO numbers to institutional RH-PO-2026-XXXX format. */
export function formatHospitalPoNumber(raw: string | null | undefined): string {
  const value = String(raw ?? '').trim();
  if (!value) return nextPoNumber();
  if (/^RH-PO-2026-\d{4}$/i.test(value)) return value.toUpperCase();
  const trailingDigits = value.match(/(\d{4,})$/)?.[1]?.slice(-4);
  if (trailingDigits) return `RH-PO-2026-${trailingDigits.padStart(4, '0')}`;
  const compact = value.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase();
  return compact ? `RH-PO-2026-${compact.padStart(4, '0')}` : nextPoNumber();
}

function parseItemsJson(items: unknown): { name: string; quantity?: number }[] {
  if (!items) return [];
  if (typeof items === 'string') {
    try {
      return parseItemsJson(JSON.parse(items));
    } catch {
      return [];
    }
  }
  if (!Array.isArray(items)) return [];
  return items
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const row = entry as Record<string, unknown>;
      const name = String(row.item_name ?? row.name ?? row.title ?? '').trim();
      const quantity = row.quantity != null ? Number(row.quantity) : undefined;
      if (!name || PLACEHOLDER_ITEM.test(name)) return null;
      return { name, quantity: Number.isFinite(quantity) ? quantity : undefined };
    })
    .filter(Boolean) as { name: string; quantity?: number }[];
}

/** Resolve a clean item title + quantity for hospital PO tracker rows. */
export function resolveHospitalPoItems(order: Pick<HospitalPurchaseOrder, 'item_details' | 'item_name' | 'quantity_ordered' | 'items'>): string {
  const directName = String(order.item_name ?? '').trim();
  if (directName && !PLACEHOLDER_ITEM.test(directName)) {
    const qty = order.quantity_ordered;
    return qty != null && qty > 0 ? `${directName} × ${qty}` : directName;
  }

  const details = String(order.item_details ?? '').trim();
  if (details && !PLACEHOLDER_ITEM.test(details)) return details;

  const parsed = parseItemsJson(order.items);
  if (parsed.length > 0) {
    return parsed
      .map((item) => (item.quantity ? `${item.name} × ${item.quantity}` : item.name))
      .join(', ');
  }

  return order.quantity_ordered ? `General Medical Supplies × ${order.quantity_ordered}` : 'General Medical Supplies';
}

export function formatHospitalPoDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export { formatHospitalPoInr } from '@/lib/utils/currency';

export type HospitalPoStatusTone = {
  label: string;
  className: string;
  icon: 'issued' | 'accepted' | 'dispatched' | 'invoiced' | 'received' | 'default';
};

export function hospitalPoStatusTone(status: string): HospitalPoStatusTone {
  const normalized = status.toUpperCase();
  if (normalized === 'ISSUED') {
    return { label: 'Issued', className: 'bg-sky-100 text-sky-800 ring-sky-200', icon: 'issued' };
  }
  if (normalized === 'ACCEPTED') {
    return { label: 'Accepted', className: 'bg-amber-100 text-amber-800 ring-amber-200', icon: 'accepted' };
  }
  if (normalized === 'DISPATCHED') {
    return { label: 'Dispatched', className: 'bg-violet-100 text-violet-800 ring-violet-200', icon: 'dispatched' };
  }
  if (normalized === 'INVOICED') {
    return { label: 'Invoiced', className: 'bg-indigo-100 text-indigo-800 ring-indigo-200', icon: 'invoiced' };
  }
  if (normalized === 'GOODS_RECEIPT' || normalized === 'RECEIVED' || normalized === 'PAID') {
    return {
      label: normalized === 'GOODS_RECEIPT' ? 'Received' : normalized === 'PAID' ? 'Paid' : 'Received',
      className: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
      icon: 'received',
    };
  }
  return {
    label: normalized.replace(/_/g, ' '),
    className: 'bg-slate-100 text-slate-700 ring-slate-200',
    icon: 'default',
  };
}

function mapPoRow(row: Record<string, unknown>): HospitalPurchaseOrder {
  return {
    id: String(row.id ?? ''),
    vendor_id: String(row.vendor_id ?? REGAL_VENDOR_ID),
    po_number: formatHospitalPoNumber(String(row.po_number ?? '')),
    hospital_name: String(row.hospital_name ?? 'Regal Hospital'),
    item_details: row.item_details ? String(row.item_details) : undefined,
    item_name: row.item_name ? String(row.item_name) : undefined,
    quantity_ordered: row.quantity_ordered != null ? Number(row.quantity_ordered) : undefined,
    total_amount: Number(row.total_amount ?? 0),
    status: String(row.status ?? 'ISSUED').toUpperCase(),
    facility_code: row.facility_code ? String(row.facility_code) : undefined,
    items: row.items,
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: row.updated_at ? String(row.updated_at) : undefined,
  };
}

/** Issue a PO from Hospital Supply tab → Vendor Portal live feed. */
export async function createHospitalPurchaseOrder(
  supabase: SupabaseClient,
  input: {
    item_name: string;
    vendor_name?: string;
    quantity: number;
    unit_price: number;
    facility_code?: string;
  },
): Promise<{ ok: boolean; error?: string; order?: HospitalPurchaseOrder }> {
  const now = new Date().toISOString();
  const total = Math.round(input.quantity * input.unit_price * 100) / 100;
  const payload = {
    id: crypto.randomUUID(),
    vendor_id: REGAL_VENDOR_ID,
    po_number: nextPoNumber(),
    hospital_name: 'Regal Hospital',
    item_details: `${input.item_name.trim()} × ${input.quantity}`,
    item_name: input.item_name.trim(),
    quantity_ordered: input.quantity,
    items: [{ name: input.item_name.trim(), quantity: input.quantity }],
    total_amount: total,
    status: 'ISSUED',
    facility_code: input.facility_code ?? 'RH-BLR-01',
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase.from('purchase_orders').insert(payload).select('*').single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, order: mapPoRow((data ?? payload) as Record<string, unknown>) };
}

export async function loadHospitalPurchaseOrders(
  supabase: SupabaseClient,
  limit = 50,
): Promise<HospitalPurchaseOrder[]> {
  const { data, error } = await supabase
    .from('purchase_orders')
    .select('*')
    .eq('facility_code', 'RH-BLR-01')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data?.length) {
    const fallback = await supabase
      .from('purchase_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (fallback.error || !fallback.data?.length) return [];
    return fallback.data.map((row) => mapPoRow(row as Record<string, unknown>));
  }

  return data.map((row) => mapPoRow(row as Record<string, unknown>));
}

export function subscribeHospitalProcurement(
  supabase: SupabaseClient,
  onChange: () => void,
): () => void {
  const channel = supabase
    .channel('public:hospital-purchase_orders')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'purchase_orders' }, () => onChange())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments' }, () => onChange())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => onChange())
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export function mapHospitalPurchaseOrderRow(row: Record<string, unknown>): HospitalPurchaseOrder {
  return mapPoRow(row);
}

export type { RealtimePostgresChangesPayload };
