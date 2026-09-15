import type { SupabaseClient } from '@supabase/supabase-js';

import { isUuidValue } from '@/lib/hospital/hospital-node';
import {
  fetchVendorPurchaseOrders,
  formatPurchaseOrderStatus,
  mapPurchaseOrderRow,
  PROCUREMENT_PO_TABLE,
  updatePurchaseOrderStatus,
  VENDOR_PORTAL_PO_SELECT,
  type PurchaseOrderRow,
} from '@/lib/hospital/procurement';
import {
  LEGACY_SEED_HOSPITAL_ID,
  REGAL_FACILITY_CODE,
  REGAL_HOSPITAL_CODE,
  REGAL_HOSPITAL_NAME,
} from '@/lib/regal/constants';
import { supabase as defaultSupabase } from '@/lib/supabaseClient';

export type VendorDeliveryOrder = PurchaseOrderRow & {
  hospital_id?: string;
  tracking_number?: string;
  carrier_name?: string;
  driver_contact?: string;
};

export type DispatchOrderInput = {
  po_id: string;
  carrier_name?: string;
  tracking_number?: string;
  driver_contact?: string;
};

const DELIVERY_STATUSES = new Set(['ACCEPTED', 'DISPATCHED', 'IN TRANSIT', 'IN_TRANSIT', 'INVOICED', 'DELIVERED']);

const HOSPITAL_NAME_MAP: Record<string, string> = {
  'a0000000-0000-0000-0000-000000000001': REGAL_HOSPITAL_NAME,
  [LEGACY_SEED_HOSPITAL_ID]: REGAL_HOSPITAL_NAME,
  [REGAL_HOSPITAL_CODE]: 'Regal Multispeciality Hospital',
  [REGAL_FACILITY_CODE]: REGAL_HOSPITAL_NAME,
};

const HOSPITAL_NODE_MAP: Record<string, string> = {
  'a0000000-0000-0000-0000-000000000001': REGAL_FACILITY_CODE,
  [LEGACY_SEED_HOSPITAL_ID]: REGAL_FACILITY_CODE,
  [REGAL_HOSPITAL_CODE]: REGAL_HOSPITAL_CODE,
  [REGAL_FACILITY_CODE]: REGAL_FACILITY_CODE,
};

export function normalizeDeliveryStatus(status?: string | null): string {
  return String(formatPurchaseOrderStatus(status)).toUpperCase();
}

export function isDeliveryLifecycleOrder(status?: string | null): boolean {
  const normalized = normalizeDeliveryStatus(status);
  if (DELIVERY_STATUSES.has(normalized)) return true;
  const raw = String(status ?? '')
    .trim()
    .toUpperCase()
    .replace(/_/g, ' ');
  return DELIVERY_STATUSES.has(raw);
}

function rawDeliveryStatus(status?: string | null): string {
  return String(status ?? '')
    .trim()
    .toUpperCase()
    .replace(/_/g, ' ');
}

export function isInTransitDelivery(status?: string | null): boolean {
  const normalized = normalizeDeliveryStatus(status);
  const raw = rawDeliveryStatus(status);
  return (
    normalized === 'DISPATCHED' ||
    normalized === 'INVOICED' ||
    raw === 'IN TRANSIT' ||
    raw === 'IN_TRANSIT'
  );
}

/** Consignment already dispatched or confirmed en route — no further transit action needed. */
export function isEnRouteDelivery(status?: string | null): boolean {
  return isInTransitDelivery(status);
}

export function isReadyToDispatchDelivery(status?: string | null): boolean {
  return normalizeDeliveryStatus(status) === 'ACCEPTED';
}

export function isDeliveredDelivery(status?: string | null): boolean {
  return normalizeDeliveryStatus(status) === 'DELIVERED';
}

export function deliveryStatusLabel(status?: string | null): string {
  if (isReadyToDispatchDelivery(status)) return 'Ready to Dispatch';
  if (isInTransitDelivery(status)) return 'In Transit';
  if (isDeliveredDelivery(status)) return 'Delivered';
  return normalizeDeliveryStatus(status);
}

export function deliveryStatusBadgeClass(status?: string | null): string {
  if (isReadyToDispatchDelivery(status)) {
    return 'bg-amber-100 text-amber-800 border border-amber-200';
  }
  if (isInTransitDelivery(status)) {
    return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
  }
  if (isDeliveredDelivery(status)) {
    return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
  }
  return 'bg-slate-100 text-slate-700 border border-slate-200';
}

export function formatVendorHospitalName(hospitalId?: string | null): string {
  if (!hospitalId) return REGAL_HOSPITAL_NAME;

  const key = hospitalId.trim();
  if (HOSPITAL_NAME_MAP[key]) return HOSPITAL_NAME_MAP[key];

  const upper = key.toUpperCase();
  if (upper === REGAL_HOSPITAL_CODE) return 'Regal Multispeciality Hospital';
  if (upper === REGAL_FACILITY_CODE) return REGAL_HOSPITAL_NAME;

  return REGAL_HOSPITAL_NAME;
}

export function formatVendorHospitalNode(hospitalId?: string | null): string {
  if (!hospitalId) return REGAL_FACILITY_CODE;

  const key = hospitalId.trim();
  if (HOSPITAL_NODE_MAP[key]) return HOSPITAL_NODE_MAP[key];

  const upper = key.toUpperCase();
  if (upper === REGAL_HOSPITAL_CODE) return REGAL_HOSPITAL_CODE;
  if (upper === REGAL_FACILITY_CODE) return REGAL_FACILITY_CODE;
  if (isUuidValue(key)) return REGAL_FACILITY_CODE;

  return key;
}

function mapDeliveryOrder(row: Record<string, unknown>): VendorDeliveryOrder {
  return {
    ...mapPurchaseOrderRow(row),
    hospital_id: row.hospital_id ? String(row.hospital_id) : undefined,
    tracking_number: row.tracking_number ? String(row.tracking_number) : undefined,
    carrier_name: row.carrier_name ? String(row.carrier_name) : undefined,
    driver_contact: row.driver_contact ? String(row.driver_contact) : undefined,
  };
}

function rowMatchesVendor(
  row: Record<string, unknown>,
  vendorId: string,
  vendorEmail: string,
  vendorName: string,
): boolean {
  const rowVendorId = String(row.vendor_id ?? '').trim();
  if (vendorId && rowVendorId && rowVendorId === vendorId) return true;

  const normalizedName = vendorName.trim().toLowerCase();
  const rowVendorName = String(row.vendor_name ?? row.vendor ?? '').trim().toLowerCase();
  if (normalizedName && rowVendorName && rowVendorName === normalizedName) return true;

  const normalizedEmail = vendorEmail.trim().toLowerCase();
  if (normalizedEmail) {
    for (const key of ['vendor_email', 'email', 'rep_email'] as const) {
      const candidate = String(row[key] ?? '').trim().toLowerCase();
      if (candidate && candidate === normalizedEmail) return true;
    }
  }

  return false;
}

async function queryDeliveryPurchaseOrders(
  client: SupabaseClient,
  vendorId: string,
): Promise<{ rows: Record<string, unknown>[]; error: unknown | null }> {
  const order = { ascending: false } as const;

  if (vendorId && isUuidValue(vendorId)) {
    const byId = await client
      .from(PROCUREMENT_PO_TABLE)
      .select(VENDOR_PORTAL_PO_SELECT)
      .eq('vendor_id', vendorId)
      .order('created_at', order);

    if (!byId.error && Array.isArray(byId.data)) {
      return { rows: byId.data as Record<string, unknown>[], error: null };
    }
    if (byId.error && !/column/i.test(byId.error.message)) {
      return { rows: [], error: byId.error };
    }
  }

  let result = await client
    .from(PROCUREMENT_PO_TABLE)
    .select(VENDOR_PORTAL_PO_SELECT)
    .order('created_at', order);

  if (result.error && /column/i.test(result.error.message)) {
    result = await client.from(PROCUREMENT_PO_TABLE).select('*').order('created_at', order);
  }

  if (result.error) {
    return { rows: [], error: result.error };
  }

  return { rows: (result.data ?? []) as Record<string, unknown>[], error: null };
}

export async function fetchVendorDeliveryOrders(
  vendor: { id?: string; email?: string; company_name?: string },
  client: SupabaseClient = defaultSupabase,
): Promise<VendorDeliveryOrder[]> {
  if (!client) return [];

  let mapped: VendorDeliveryOrder[] = [];
  const vendorId = String(vendor.id ?? '').trim();
  const vendorEmail = String(vendor.email ?? '').trim().toLowerCase();
  const vendorName = String(vendor.company_name ?? '').trim();

  if (vendorId || vendorEmail || vendorName) {
    const fetched = await fetchVendorPurchaseOrders(client, {
      id: vendorId || undefined,
      email: vendorEmail || undefined,
      company_name: vendorName || undefined,
    });
    if (fetched.length > 0) {
      mapped = fetched.map((order) => ({ ...order }));
    } else {
      const { rows, error } = await queryDeliveryPurchaseOrders(client, vendorId);
      if (!error) {
        mapped = rows
          .filter((row) => rowMatchesVendor(row, vendorId, vendorEmail, vendorName))
          .map(mapDeliveryOrder);
      }
    }
  } else {
    const { rows, error } = await queryDeliveryPurchaseOrders(client, '');
    if (!error) mapped = rows.map(mapDeliveryOrder);
  }

  return mapped
    .filter((order) => isDeliveryLifecycleOrder(order.status))
    .sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')));
}

export async function dispatchVendorPurchaseOrder(
  input: DispatchOrderInput,
  client: SupabaseClient = defaultSupabase,
): Promise<{ ok: boolean; error?: string }> {
  if (!client || !input.po_id) {
    return { ok: false, error: 'Missing purchase order' };
  }

  const result = await updatePurchaseOrderStatus(client, input.po_id, 'DISPATCHED');
  if (!result.ok) {
    return result;
  }

  const tracking = input.tracking_number?.trim();
  const carrier = input.carrier_name?.trim();
  const driver = input.driver_contact?.trim();

  if (tracking || carrier || driver) {
    const patch: Record<string, string> = { updated_at: new Date().toISOString() };
    if (tracking) patch.tracking_number = tracking;
    if (carrier) patch.carrier_name = carrier;
    if (driver) patch.driver_contact = driver;

    const { error } = await client.from(PROCUREMENT_PO_TABLE).update(patch).eq('id', input.po_id);
    if (error && !/column|does not exist/i.test(error.message)) {
      return { ok: true, error: `Dispatched, but tracking fields could not be saved: ${error.message}` };
    }

    try {
      await client.from('shipments').insert({
        po_id: input.po_id,
        carrier_name: carrier || 'Direct Dispatch',
        tracking_number: tracking || `TRK-${Date.now()}`,
        driver_contact: driver || null,
        status: 'IN_TRANSIT',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch {
      // Optional shipments table — PO status is the source of truth.
    }
  }

  return { ok: true };
}

export async function markVendorOrderInTransit(
  orderId: string,
  client: SupabaseClient = defaultSupabase,
): Promise<{ ok: boolean; error?: string }> {
  if (!client || !orderId) return { ok: false, error: 'Missing purchase order' };
  return updatePurchaseOrderStatus(client, orderId, 'DISPATCHED');
}
