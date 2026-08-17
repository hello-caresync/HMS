/**
 * Nexora Vendor Portal · live Supabase data layer.
 * Shared with the Hospital Procurement App via purchase_orders, shipments, invoices.
 * No dummy seed fallbacks — empty arrays and zero counts when tables are empty.
 */

import { supabase } from '@/lib/supabaseClient';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { LifecycleCounts } from '@/lib/vendor/lifecycle';
import {
  ALL_HOSPITALS_CODE,
  DEFAULT_HOSPITAL_CODE,
  matchesHospitalFilter,
  resolveHospitalCode,
} from '@/lib/vendor/hospitals';
import {
  loadChannelMessages as loadUnifiedChannelMessages,
  sendVendorProcurementMessage,
  subscribeChannelMessages,
} from '@/lib/ecosystem/channel-messaging-service';

/** Shared vendor context used by both the hospital and vendor apps. */
export const DEFAULT_VENDOR_ID = '11111111-1111-1111-1111-111111111111';
export const VENDOR_ID = DEFAULT_VENDOR_ID;

export const GST_RATE = 0.18;

export type PoStatus =
  | 'ISSUED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'DISPATCHED'
  | 'GOODS_RECEIPT'
  | 'INVOICED'
  | 'PAID';

export type ShipmentStatus = 'IN_TRANSIT' | 'DELIVERED';

export type InvoiceStatus = 'SUBMITTED' | 'PAID';

export type PurchaseOrder = {
  id: string;
  po_number: string;
  hospital_name: string;
  hospital_code: string;
  total_amount: number;
  status: PoStatus | string;
  created_at: string;
  item_details?: string;
};

export type Shipment = {
  id: string;
  po_id: string;
  tracking_number: string;
  carrier_name: string;
  driver_contact: string | null;
  status: ShipmentStatus | string;
  created_at: string;
  po_number?: string;
  hospital_name?: string;
  hospital_code?: string;
  item_details?: string;
  total_amount?: number;
};

export type Invoice = {
  id: string;
  po_id: string | null;
  vendor_id: string;
  invoice_number: string;
  subtotal?: number;
  total_amount: number;
  tax_amount: number;
  status: InvoiceStatus | string;
  due_date?: string | null;
  created_at: string;
  hospital_name?: string;
  hospital_code?: string;
  po_number?: string;
  item_details?: string;
};

export type ChannelMessage = {
  id: string;
  vendor_id: string;
  hospital_code: string;
  sender_role: 'HOSPITAL' | 'VENDOR' | string;
  sender_name: string;
  message_text: string;
  created_at: string;
};

export type VendorProfile = {
  id: string;
  company_name: string;
  gstin?: string | null;
  email?: string | null;
  phone?: string | null;
  contact_person?: string | null;
};

export type LoadResult<T> = { rows: T[]; error?: string };
export type WriteResult = { ok: boolean; error?: string };

export type DashboardKpis = {
  pendingPos: number;
  activeShipments: number;
  invoicedTotal: number;
};

export const COMPLETED_PO_STATUSES: string[] = [
  'DISPATCHED',
  'GOODS_RECEIPT',
  'INVOICED',
  'PAID',
  'COMPLETED',
];

export const DISPATCHABLE_PO_STATUSES: string[] = ['ACCEPTED'];
export const INVOICEABLE_PO_STATUSES: string[] = ['ACCEPTED', 'DISPATCHED', 'GOODS_RECEIPT'];

const DAY_MS = 24 * 60 * 60 * 1000;
const VENDOR_REALTIME_CHANNEL = 'public:purchase_orders';
const VENDOR_DASHBOARD_CHANNEL = 'v0-dashboard';
const VENDOR_CHAT_CHANNEL = 'v0-chat';

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function nowIso(): string {
  return new Date().toISOString();
}

export type PortalFilterOptions = {
  hospitalCode?: string;
  limit?: number;
};

export { ALL_HOSPITALS_CODE };

function mapPurchaseOrderRow(row: Record<string, unknown>): PurchaseOrder {
  return {
    id: String(row.id ?? ''),
    po_number: String(row.po_number ?? row.id ?? 'PO'),
    hospital_name: String(row.hospital_name ?? 'Regal Hospital'),
    hospital_code: resolveHospitalCode(row),
    total_amount: Number(row.total_amount ?? row.total_cost ?? 0),
    status: String(row.status ?? 'ISSUED').toUpperCase(),
    created_at: String(row.created_at ?? nowIso()),
    item_details: row.item_details ? String(row.item_details) : undefined,
  };
}

function mapJoinedPurchaseOrder(po: Record<string, unknown> | null | undefined) {
  if (!po) return {};
  return {
    po_number: po.po_number ? String(po.po_number) : undefined,
    hospital_name: po.hospital_name ? String(po.hospital_name) : undefined,
    hospital_code: resolveHospitalCode(po),
    item_details: po.item_details ? String(po.item_details) : undefined,
    total_amount: po.total_amount != null ? Number(po.total_amount) : undefined,
  };
}

function mapShipmentRow(row: Record<string, unknown>): Shipment {
  const purchaseOrder = row.purchase_orders as Record<string, unknown> | Record<string, unknown>[] | null;
  const po = Array.isArray(purchaseOrder) ? purchaseOrder[0] : purchaseOrder;
  const joined = mapJoinedPurchaseOrder(po ?? null);

  return {
    id: String(row.id ?? ''),
    po_id: String(row.po_id ?? ''),
    tracking_number: String(row.tracking_number ?? ''),
    carrier_name: String(row.carrier_name ?? ''),
    driver_contact: row.driver_contact ? String(row.driver_contact) : null,
    status: String(row.status ?? 'IN_TRANSIT').toUpperCase(),
    created_at: String(row.created_at ?? nowIso()),
    ...joined,
  };
}

function mapInvoiceRow(row: Record<string, unknown>): Invoice {
  const purchaseOrder = row.purchase_orders as Record<string, unknown> | Record<string, unknown>[] | null;
  const po = Array.isArray(purchaseOrder) ? purchaseOrder[0] : purchaseOrder;
  const joined = mapJoinedPurchaseOrder(po ?? null);

  return {
    id: String(row.id ?? ''),
    po_id: row.po_id ? String(row.po_id) : null,
    vendor_id: String(row.vendor_id ?? VENDOR_ID),
    invoice_number: String(row.invoice_number ?? ''),
    subtotal: row.subtotal != null ? Number(row.subtotal) : undefined,
    total_amount: Number(row.total_amount ?? 0),
    tax_amount: Number(row.tax_amount ?? 0),
    status: String(row.status ?? 'SUBMITTED').toUpperCase(),
    due_date: row.due_date ? String(row.due_date) : null,
    created_at: String(row.created_at ?? nowIso()),
    hospital_name: joined.hospital_name,
    hospital_code: joined.hospital_code,
    po_number: joined.po_number,
    item_details: joined.item_details,
  };
}

function filterByHospitalCode<T extends { hospital_code?: string }>(
  rows: T[],
  hospitalCode: string,
): T[] {
  if (hospitalCode === ALL_HOSPITALS_CODE) return rows;
  return rows.filter((row) => matchesHospitalFilter(row.hospital_code, hospitalCode));
}

async function loadPurchaseOrderIdsForHospital(hospitalCode: string): Promise<string[]> {
  if (hospitalCode === ALL_HOSPITALS_CODE) return [];

  const { data, error } = await supabase
    .from('purchase_orders')
    .select('id, hospital_code, facility_code')
    .eq('vendor_id', VENDOR_ID)
    .or(`hospital_code.eq.${hospitalCode},facility_code.eq.${hospitalCode}`);

  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map((row) => String(row.id ?? '')).filter(Boolean);
}

function applyPurchaseOrderHospitalFilter<T extends { or: (filters: string) => T }>(
  query: T,
  hospitalCode: string,
): T {
  if (hospitalCode === ALL_HOSPITALS_CODE) return query;
  return query.or(`hospital_code.eq.${hospitalCode},facility_code.eq.${hospitalCode}`);
}

export function poItemDetails(order: Pick<PurchaseOrder, 'item_details'>): string {
  return order.item_details?.trim() || 'Medical supplies';
}

function isVendorPurchaseOrder(row: Record<string, unknown>): boolean {
  const vendorId = String(row.vendor_id ?? VENDOR_ID);
  return vendorId === VENDOR_ID;
}

export { formatInr } from '@/lib/utils/currency';

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function invoiceDueDate(invoice: Invoice): string {
  if (invoice.due_date) return formatDate(invoice.due_date);
  const created = new Date(invoice.created_at).getTime();
  if (Number.isNaN(created)) return '—';
  return formatDate(new Date(created + 30 * DAY_MS).toISOString());
}

export function shipmentEta(shipment: Shipment): string {
  const dispatched = new Date(shipment.created_at).getTime();
  if (Number.isNaN(dispatched)) return '—';
  return formatDate(new Date(dispatched + 3 * DAY_MS).toISOString());
}

export function computeInvoiceTotals(subtotal: number) {
  const base = Number.isFinite(subtotal) ? subtotal : 0;
  const tax_amount = Math.round(base * GST_RATE * 100) / 100;
  return { subtotal: base, tax_amount, total_amount: Math.round((base + tax_amount) * 100) / 100 };
}

export function nextInvoiceNumber(): string {
  return `INV-${Date.now()}`;
}

/* ── Reads ───────────────────────────────────────────────────────────────── */

export async function loadDashboardKpis(
  hospitalCode = ALL_HOSPITALS_CODE,
): Promise<{ kpis: DashboardKpis; error?: string }> {
  const empty: DashboardKpis = { pendingPos: 0, activeShipments: 0, invoicedTotal: 0 };
  try {
    if (hospitalCode === ALL_HOSPITALS_CODE) {
      const [pendingRes, activeRes, invoicesRes] = await Promise.all([
        supabase
          .from('purchase_orders')
          .select('*', { count: 'exact', head: true })
          .eq('vendor_id', VENDOR_ID)
          .eq('status', 'ISSUED'),
        supabase
          .from('shipments')
          .select('*', { count: 'exact', head: true })
          .eq('vendor_id', VENDOR_ID)
          .eq('status', 'IN_TRANSIT'),
        supabase.from('invoices').select('total_amount').eq('vendor_id', VENDOR_ID),
      ]);

      const errors = [pendingRes.error, activeRes.error, invoicesRes.error].filter(Boolean);
      const invoicedTotal = (invoicesRes.data ?? []).reduce(
        (sum: number, row: { total_amount?: number }) => sum + Number(row.total_amount ?? 0),
        0,
      );

      if (errors.length > 0) {
        return {
          kpis: {
            pendingPos: pendingRes.count ?? 0,
            activeShipments: activeRes.count ?? 0,
            invoicedTotal,
          },
          error: errors[0]?.message,
        };
      }

      return {
        kpis: {
          pendingPos: pendingRes.count ?? 0,
          activeShipments: activeRes.count ?? 0,
          invoicedTotal,
        },
      };
    }

    const poIds = await loadPurchaseOrderIdsForHospital(hospitalCode);

    const pendingQuery = applyPurchaseOrderHospitalFilter(
      supabase
        .from('purchase_orders')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', VENDOR_ID)
        .eq('status', 'ISSUED'),
      hospitalCode,
    );

    const [pendingRes, invoicesRes] = await Promise.all([
      pendingQuery,
      poIds.length > 0
        ? supabase
            .from('invoices')
            .select('total_amount')
            .eq('vendor_id', VENDOR_ID)
            .in('po_id', poIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    let activeShipments = 0;
    if (poIds.length > 0) {
      const activeRes = await supabase
        .from('shipments')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', VENDOR_ID)
        .eq('status', 'IN_TRANSIT')
        .in('po_id', poIds);
      if (activeRes.error) throw new Error(activeRes.error.message);
      activeShipments = activeRes.count ?? 0;
    }

    const errors = [pendingRes.error, invoicesRes.error].filter(Boolean);
    const invoicedTotal = (invoicesRes.data ?? []).reduce(
      (sum: number, row: { total_amount?: number }) => sum + Number(row.total_amount ?? 0),
      0,
    );

    if (errors.length > 0) {
      return {
        kpis: {
          pendingPos: pendingRes.count ?? 0,
          activeShipments,
          invoicedTotal,
        },
        error: errors[0]?.message,
      };
    }

    return {
      kpis: {
        pendingPos: pendingRes.count ?? 0,
        activeShipments,
        invoicedTotal,
      },
    };
  } catch (error) {
    return { kpis: empty, error: errorMessage(error, 'Could not load dashboard KPIs') };
  }
}

export async function loadLifecycleCounts(
  hospitalCode = ALL_HOSPITALS_CODE,
): Promise<{ counts: LifecycleCounts; error?: string }> {
  const empty: LifecycleCounts = {};

  async function countPurchaseOrders(status: string): Promise<number> {
    let query = supabase
      .from('purchase_orders')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', VENDOR_ID)
      .eq('status', status);
    query = applyPurchaseOrderHospitalFilter(query, hospitalCode);
    const { count, error } = await query;
    if (error) throw new Error(error.message);
    return count ?? 0;
  }

  async function countInvoices(status: string): Promise<number> {
    if (hospitalCode === ALL_HOSPITALS_CODE) {
      const { count, error } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', VENDOR_ID)
        .eq('status', status);
      if (error) throw new Error(error.message);
      return count ?? 0;
    }

    const poIds = await loadPurchaseOrderIdsForHospital(hospitalCode);
    if (poIds.length === 0) return 0;

    const { count, error } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', VENDOR_ID)
      .eq('status', status)
      .in('po_id', poIds);
    if (error) throw new Error(error.message);
    return count ?? 0;
  }

  try {
    const [issued, accepted, dispatched, goodsReceipt, invoiced, paid] = await Promise.all([
      countPurchaseOrders('ISSUED'),
      countPurchaseOrders('ACCEPTED'),
      countPurchaseOrders('DISPATCHED'),
      countPurchaseOrders('GOODS_RECEIPT'),
      countInvoices('SUBMITTED'),
      countInvoices('PAID'),
    ]);

    return {
      counts: {
        ISSUED: issued,
        ACCEPTED: accepted,
        DISPATCHED: dispatched,
        GOODS_RECEIPT: goodsReceipt,
        INVOICED: invoiced,
        PAID: paid,
      },
    };
  } catch (error) {
    return { counts: empty, error: errorMessage(error, 'Could not load lifecycle counts') };
  }
}

export async function loadPurchaseOrders(
  limit = 60,
  hospitalCode = ALL_HOSPITALS_CODE,
): Promise<LoadResult<PurchaseOrder>> {
  try {
    let query = supabase
      .from('purchase_orders')
      .select(
        'id, po_number, hospital_name, hospital_code, facility_code, total_amount, status, created_at, item_details',
      )
      .eq('vendor_id', VENDOR_ID)
      .order('created_at', { ascending: false })
      .limit(limit);

    query = applyPurchaseOrderHospitalFilter(query, hospitalCode);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    const rows = ((data ?? []) as Record<string, unknown>[]).map(mapPurchaseOrderRow);
    return { rows: filterByHospitalCode(rows, hospitalCode) };
  } catch (error) {
    return { rows: [], error: errorMessage(error, 'Could not reach purchase_orders') };
  }
}

export async function loadLatestPurchaseOrders(
  limit = 5,
  hospitalCode = ALL_HOSPITALS_CODE,
): Promise<LoadResult<PurchaseOrder>> {
  return loadPurchaseOrders(limit, hospitalCode);
}

export async function loadShipments(
  limit = 60,
  hospitalCode = ALL_HOSPITALS_CODE,
): Promise<LoadResult<Shipment>> {
  try {
    const selectWithJoin =
      'id, po_id, tracking_number, carrier_name, driver_contact, status, created_at, purchase_orders(po_number, hospital_name, hospital_code, facility_code, item_details, total_amount)';

    if (hospitalCode === ALL_HOSPITALS_CODE) {
      const { data, error } = await supabase
        .from('shipments')
        .select(selectWithJoin)
        .eq('vendor_id', VENDOR_ID)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw new Error(error.message);
      return { rows: ((data ?? []) as Record<string, unknown>[]).map(mapShipmentRow) };
    }

    const poIds = await loadPurchaseOrderIdsForHospital(hospitalCode);
    if (poIds.length === 0) return { rows: [] };

    const { data, error } = await supabase
      .from('shipments')
      .select(selectWithJoin)
      .eq('vendor_id', VENDOR_ID)
      .in('po_id', poIds)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    const rows = ((data ?? []) as Record<string, unknown>[]).map(mapShipmentRow);
    return { rows: filterByHospitalCode(rows, hospitalCode) };
  } catch (error) {
    return { rows: [], error: errorMessage(error, 'Could not reach shipments') };
  }
}

export async function loadInvoices(
  limit = 60,
  hospitalCode = ALL_HOSPITALS_CODE,
): Promise<LoadResult<Invoice>> {
  const invoiceSelect =
    'id, po_id, vendor_id, invoice_number, subtotal, total_amount, tax_amount, status, created_at';
  const selectWithJoin = `${invoiceSelect}, purchase_orders(po_number, hospital_name, hospital_code, facility_code, item_details)`;

  try {
    if (hospitalCode === ALL_HOSPITALS_CODE) {
      const { data, error } = await supabase
        .from('invoices')
        .select(selectWithJoin)
        .eq('vendor_id', VENDOR_ID)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        const fallback = await supabase
          .from('invoices')
          .select(invoiceSelect)
          .eq('vendor_id', VENDOR_ID)
          .order('created_at', { ascending: false })
          .limit(limit);
        if (fallback.error) throw new Error(fallback.error.message);
        return { rows: ((fallback.data ?? []) as Record<string, unknown>[]).map(mapInvoiceRow) };
      }

      return { rows: ((data ?? []) as Record<string, unknown>[]).map(mapInvoiceRow) };
    }

    const poIds = await loadPurchaseOrderIdsForHospital(hospitalCode);
    if (poIds.length === 0) return { rows: [] };

    const { data, error } = await supabase
      .from('invoices')
      .select(selectWithJoin)
      .eq('vendor_id', VENDOR_ID)
      .in('po_id', poIds)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      const fallback = await supabase
        .from('invoices')
        .select(invoiceSelect)
        .eq('vendor_id', VENDOR_ID)
        .in('po_id', poIds)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (fallback.error) throw new Error(fallback.error.message);
      const rows = ((fallback.data ?? []) as Record<string, unknown>[]).map(mapInvoiceRow);
      return { rows: filterByHospitalCode(rows, hospitalCode) };
    }

    const rows = ((data ?? []) as Record<string, unknown>[]).map(mapInvoiceRow);
    return { rows: filterByHospitalCode(rows, hospitalCode) };
  } catch (error) {
    return { rows: [], error: errorMessage(error, 'Could not reach invoices') };
  }
}

export async function loadChannelMessages(
  limit = 200,
  hospitalCode = ALL_HOSPITALS_CODE,
): Promise<LoadResult<ChannelMessage>> {
  try {
    const facilityCode = hospitalCode === ALL_HOSPITALS_CODE ? DEFAULT_HOSPITAL_CODE : hospitalCode;
    const result = await loadUnifiedChannelMessages(supabase, {
      channel_type: 'vendor_procurement',
      facility_code: facilityCode,
      vendor_id: VENDOR_ID,
      limit,
    });

    return {
      rows: result.rows.map((row) => ({
        id: row.id,
        vendor_id: String(row.vendor_id ?? VENDOR_ID),
        hospital_code: String(row.hospital_code ?? facilityCode),
        sender_role: String(row.sender_role).toUpperCase(),
        sender_name: row.sender_name,
        message_text: row.message,
        created_at: row.created_at,
      })),
      error: result.error,
    };
  } catch (error) {
    return { rows: [], error: errorMessage(error, 'Could not reach channel_messages') };
  }
}

export async function sendChannelMessage(
  messageText: string,
  selectedHospitalCode?: string,
): Promise<WriteResult> {
  const facilityCode =
    selectedHospitalCode && selectedHospitalCode !== ALL_HOSPITALS_CODE
      ? selectedHospitalCode
      : DEFAULT_HOSPITAL_CODE;

  const result = await sendVendorProcurementMessage(supabase, {
    message: messageText,
    sender_role: 'vendor',
    sender_name: 'MedSupply Dispatch',
    facility_code: facilityCode,
    vendor_id: VENDOR_ID,
  });

  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export async function loadVendorProfile(): Promise<{ profile: VendorProfile | null; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('vendors')
      .select('id, company_name, gstin, email, phone, contact_person')
      .eq('id', VENDOR_ID)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return { profile: null };

    const row = data as Record<string, unknown>;
    return {
      profile: {
        id: String(row.id ?? VENDOR_ID),
        company_name: String(row.company_name ?? row.name ?? 'MedSupply Dispatch'),
        gstin: row.gstin ? String(row.gstin) : null,
        email: row.email ? String(row.email) : row.contact_email ? String(row.contact_email) : null,
        phone: row.phone ? String(row.phone) : null,
        contact_person: row.contact_person ? String(row.contact_person) : null,
      },
    };
  } catch (error) {
    return { profile: null, error: errorMessage(error, 'Could not load vendor profile') };
  }
}

export type VendorProfileInput = {
  company_name: string;
  gstin?: string;
  email?: string;
  phone?: string;
};

export async function saveVendorProfile(input: VendorProfileInput): Promise<WriteResult> {
  try {
    const { error } = await supabase
      .from('vendors')
      .update({
        company_name: input.company_name.trim(),
        gstin: input.gstin?.trim() || null,
        email: input.email?.trim() || null,
        phone: input.phone?.trim() || null,
      })
      .eq('id', VENDOR_ID);
    if (error) throw new Error(error.message);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, 'Could not save vendor profile') };
  }
}

/* ── Writes ──────────────────────────────────────────────────────────────── */

export async function setPurchaseOrderStatus(ids: string[], status: PoStatus): Promise<WriteResult> {
  if (ids.length === 0) return { ok: false, error: 'No purchase orders selected.' };

  try {
    const timestamp = nowIso();
    for (const poId of ids) {
      const { error } = await supabase
        .from('purchase_orders')
        .update({ status, updated_at: timestamp })
        .eq('id', poId)
        .eq('vendor_id', VENDOR_ID);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, 'Status update failed') };
  }
}

export type DispatchInput = {
  po_id: string;
  carrier_name: string;
  tracking_number: string;
  driver_contact: string;
};

export async function dispatchShipment(input: DispatchInput): Promise<WriteResult> {
  try {
    const timestamp = nowIso();
    const { error: shipmentError } = await supabase.from('shipments').insert({
      po_id: input.po_id,
      vendor_id: VENDOR_ID,
      carrier_name: input.carrier_name,
      tracking_number: input.tracking_number,
      driver_contact: input.driver_contact,
      status: 'IN_TRANSIT',
      created_at: timestamp,
      updated_at: timestamp,
    });
    if (shipmentError) throw new Error(shipmentError.message);

    const { error: poError } = await supabase
      .from('purchase_orders')
      .update({ status: 'DISPATCHED', updated_at: timestamp })
      .eq('id', input.po_id)
      .eq('vendor_id', VENDOR_ID);
    if (poError) throw new Error(poError.message);

    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, 'Dispatch failed') };
  }
}

export async function markShipmentDelivered(id: string): Promise<WriteResult> {
  try {
    const { error } = await supabase
      .from('shipments')
      .update({ status: 'DELIVERED', updated_at: nowIso() })
      .eq('id', id)
      .eq('vendor_id', VENDOR_ID);
    if (error) throw new Error(error.message);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, 'Could not update shipment') };
  }
}

export type InvoiceInput = {
  po_id: string;
  invoice_number: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
};

export async function submitInvoice(input: InvoiceInput): Promise<WriteResult> {
  try {
    const timestamp = nowIso();
    const due = new Date();
    due.setDate(due.getDate() + 30);

    const baseRow = {
      po_id: input.po_id,
      vendor_id: VENDOR_ID,
      invoice_number: input.invoice_number,
      subtotal: input.subtotal,
      tax_amount: input.tax_amount,
      total_amount: input.total_amount,
      status: 'SUBMITTED',
      created_at: timestamp,
      updated_at: timestamp,
    };

    let invoiceError = (
      await supabase.from('invoices').insert({ ...baseRow, due_date: due.toISOString().slice(0, 10) })
    ).error;

    if (invoiceError && /due_date/i.test(invoiceError.message)) {
      invoiceError = (await supabase.from('invoices').insert(baseRow)).error;
    }

    if (invoiceError) throw new Error(invoiceError.message);

    const { error: poError } = await supabase
      .from('purchase_orders')
      .update({ status: 'INVOICED', updated_at: timestamp })
      .eq('id', input.po_id)
      .eq('vendor_id', VENDOR_ID);
    if (poError) throw new Error(poError.message);

    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, 'Invoice submission failed') };
  }
}

/* ── Realtime ────────────────────────────────────────────────────────────── */

export type VendorPortalRealtimeHandlers = {
  onPurchaseOrderInsert?: (row: PurchaseOrder) => void;
  onPurchaseOrderUpdate?: (row: PurchaseOrder) => void;
  onPurchaseOrderDelete?: (id: string) => void;
};

export type VendorPortalRealtimeOptions = {
  hospitalCode?: string;
};

export function subscribeVendorPortal(
  onChange: () => void,
  handlers?: VendorPortalRealtimeHandlers,
  options?: VendorPortalRealtimeOptions,
): () => void {
  const hospitalCode = options?.hospitalCode ?? ALL_HOSPITALS_CODE;

  try {
    const channel = supabase
      .channel(VENDOR_REALTIME_CHANNEL)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'purchase_orders' },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const raw = (payload.new ?? {}) as Record<string, unknown>;
          if (!isVendorPurchaseOrder(raw)) return;
          const row = mapPurchaseOrderRow(raw);
          if (!matchesHospitalFilter(row.hospital_code, hospitalCode)) return;
          handlers?.onPurchaseOrderInsert?.(row);
          onChange();
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'purchase_orders' },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const raw = (payload.new ?? {}) as Record<string, unknown>;
          if (!isVendorPurchaseOrder(raw)) return;
          const row = mapPurchaseOrderRow(raw);
          if (!matchesHospitalFilter(row.hospital_code, hospitalCode)) return;
          handlers?.onPurchaseOrderUpdate?.(row);
          onChange();
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'purchase_orders' },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const raw = (payload.old ?? {}) as Record<string, unknown>;
          const id = String(raw.id ?? '');
          if (id) handlers?.onPurchaseOrderDelete?.(id);
          onChange();
        },
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments' }, () => onChange())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => onChange())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_notifications' }, () =>
        onChange(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  } catch {
    return () => {};
  }
}

/** Dashboard-only realtime channel per V0 spec. */
export function subscribeDashboard(
  onChange: () => void,
  handlers?: VendorPortalRealtimeHandlers,
  options?: VendorPortalRealtimeOptions,
): () => void {
  const hospitalCode = options?.hospitalCode ?? ALL_HOSPITALS_CODE;

  try {
    const channel = supabase
      .channel(VENDOR_DASHBOARD_CHANNEL)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'purchase_orders' },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const raw = (payload.new ?? {}) as Record<string, unknown>;
          if (!isVendorPurchaseOrder(raw)) return;
          const row = mapPurchaseOrderRow(raw);
          if (!matchesHospitalFilter(row.hospital_code, hospitalCode)) return;
          handlers?.onPurchaseOrderInsert?.(row);
          onChange();
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'purchase_orders' },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const raw = (payload.new ?? {}) as Record<string, unknown>;
          if (!isVendorPurchaseOrder(raw)) return;
          const row = mapPurchaseOrderRow(raw);
          if (!matchesHospitalFilter(row.hospital_code, hospitalCode)) return;
          handlers?.onPurchaseOrderUpdate?.(row);
          onChange();
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'purchase_orders' },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const raw = (payload.old ?? {}) as Record<string, unknown>;
          const id = String(raw.id ?? '');
          if (id) handlers?.onPurchaseOrderDelete?.(id);
          onChange();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  } catch {
    return () => {};
  }
}

export function subscribeVendorChat(
  onInsert: (message: ChannelMessage) => void,
  options?: VendorPortalRealtimeOptions,
): () => void {
  const hospitalCode = options?.hospitalCode ?? ALL_HOSPITALS_CODE;

  return subscribeChannelMessages({
    channel_type: 'vendor_procurement',
    onInsert: (row) => {
      const mapped: ChannelMessage = {
        id: row.id,
        vendor_id: String(row.vendor_id ?? VENDOR_ID),
        hospital_code: String(row.hospital_code ?? DEFAULT_HOSPITAL_CODE),
        sender_role: String(row.sender_role).toUpperCase(),
        sender_name: row.sender_name,
        message_text: row.message,
        created_at: row.created_at,
      };
      if (!matchesHospitalFilter(mapped.hospital_code, hospitalCode)) return;
      onInsert(mapped);
    },
  });
}

export function poStatusTone(status: string): 'neutral' | 'success' | 'warning' | 'danger' | 'info' {
  const value = status.toUpperCase();
  if (value === 'ISSUED') return 'warning';
  if (value === 'ACCEPTED') return 'success';
  if (value === 'REJECTED') return 'danger';
  if (value === 'PAID') return 'success';
  if (value === 'DISPATCHED' || value === 'GOODS_RECEIPT' || value === 'INVOICED') return 'info';
  return 'neutral';
}

export function shipmentStatusTone(status: string): 'neutral' | 'success' | 'warning' | 'info' {
  const value = status.toUpperCase();
  if (value === 'DELIVERED') return 'success';
  if (value === 'IN_TRANSIT') return 'info';
  return 'neutral';
}

export function invoiceStatusTone(status: string): 'neutral' | 'success' | 'warning' {
  return status.toUpperCase() === 'PAID' ? 'success' : 'warning';
}
