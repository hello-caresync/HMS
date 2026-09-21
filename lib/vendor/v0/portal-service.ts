/**
 * Regal Vendor Portal · live Supabase data layer.
 * Shared with the Hospital Procurement App via purchase_orders, shipments, invoices.
 * No dummy seed fallbacks — empty arrays and zero counts when tables are empty.
 */

import { PROCUREMENT_PO_TABLE } from '@/lib/hospital/procurement';
import { supabase } from '@/lib/supabaseClient';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { LifecycleCounts } from '@/lib/vendor/lifecycle';
import {
  ALL_HOSPITALS_CODE,
  DEFAULT_HOSPITAL_CODE,
  hospitalNameForCode,
  matchesHospitalFilter,
} from '@/lib/vendor/hospitals';
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
  facility_code?: string;
  facility_name?: string;
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
  facility_code?: string;
  facility_name?: string;
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

type PoHospitalFields = {
  facility_code?: string | null;
  hospital_code?: string | null;
  hospital_name?: string | null;
  facility_name?: string | null;
};

/** Facility / network code for procurement rows that may omit legacy columns. */
export function resolvePoFacilityCode(order: PoHospitalFields): string {
  return (
    (order.facility_code && String(order.facility_code).trim()) ||
    (order.hospital_code && String(order.hospital_code).trim()) ||
    DEFAULT_HOSPITAL_CODE
  );
}

/** Display name for hospital / facility with safe procurement-table fallbacks. */
export function resolvePoHospitalName(order: PoHospitalFields): string {
  return (
    (order.hospital_name && String(order.hospital_name).trim()) ||
    (order.facility_name && String(order.facility_name).trim()) ||
    hospitalNameForCode(resolvePoFacilityCode(order)) ||
    'Regal Hospital'
  );
}

function mapPurchaseOrderRow(row: Record<string, unknown>): PurchaseOrder {
  const facilityCode = row.facility_code ? String(row.facility_code) : undefined;
  const hospitalCode = resolvePoFacilityCode({
    facility_code: facilityCode,
    hospital_code: row.hospital_code
      ? String(row.hospital_code)
      : row.hospital_id
        ? String(row.hospital_id)
        : null,
  });

  return {
    id: String(row.id ?? ''),
    po_number: String(row.po_number ?? row.id ?? 'PO'),
    hospital_name: resolvePoHospitalName({
      hospital_name: row.hospital_name ? String(row.hospital_name) : null,
      facility_name: row.facility_name ? String(row.facility_name) : null,
      facility_code: facilityCode,
      hospital_code: hospitalCode,
    }),
    hospital_code: hospitalCode,
    facility_code: facilityCode,
    facility_name: row.facility_name ? String(row.facility_name) : undefined,
    total_amount: Number(row.total_amount ?? row.total_cost ?? 0),
    status: String(row.status ?? 'ISSUED').toUpperCase(),
    created_at: String(row.created_at ?? nowIso()),
    item_details: row.item_details
      ? String(row.item_details)
      : row.item_description
        ? String(row.item_description)
        : undefined,
  };
}

function mapJoinedPurchaseOrder(po: Record<string, unknown> | null | undefined) {
  if (!po) return {};
  const facilityCode = po.facility_code ? String(po.facility_code) : undefined;
  const hospitalCode = resolvePoFacilityCode({
    facility_code: facilityCode,
    hospital_code: po.hospital_code ? String(po.hospital_code) : String(po.hospital_id ?? ''),
  });
  return {
    po_number: po.po_number ? String(po.po_number) : undefined,
    hospital_name: resolvePoHospitalName({
      hospital_name: po.hospital_name ? String(po.hospital_name) : null,
      facility_name: po.facility_name ? String(po.facility_name) : null,
      facility_code: facilityCode,
      hospital_code: hospitalCode,
    }),
    hospital_code: hospitalCode,
    facility_code: facilityCode,
    facility_name: po.facility_name ? String(po.facility_name) : undefined,
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

const PO_SELECT =
  'id, po_number, hospital_name, hospital_code, facility_code, hospital_id, total_amount, total_cost, status, created_at, item_details, item_description, vendor_id';

const PROCUREMENT_PO_SELECT =
  'id, po_number, hospital_id, total_amount, total_cost, status, created_at, item_details, item_description, vendor_id';

const PENDING_PO_STATUSES = ['ISSUED', 'issued', 'pending_dispatch', 'pending', 'open', 'OPEN'];

async function countPendingPurchaseOrders(hospitalCode: string): Promise<number> {
  let procurementQuery = supabase
    .from(PROCUREMENT_PO_TABLE)
    .select('*', { count: 'exact', head: true })
    .eq('vendor_id', VENDOR_ID)
    .in('status', PENDING_PO_STATUSES);

  if (hospitalCode !== ALL_HOSPITALS_CODE) {
    procurementQuery = procurementQuery.in('hospital_id', [
      hospitalCode,
      DEFAULT_HOSPITAL_CODE,
      'ROOT-HQ',
      'HOSP-01',
    ]);
  }

  const procurementRes = await procurementQuery;
  if (!procurementRes.error) {
    return procurementRes.count ?? 0;
  }

  let legacyQuery = supabase
    .from('purchase_orders')
    .select('*', { count: 'exact', head: true })
    .eq('vendor_id', VENDOR_ID)
    .eq('status', 'ISSUED');
  legacyQuery = applyPurchaseOrderHospitalFilter(legacyQuery, hospitalCode);
  const legacyRes = await legacyQuery;
  if (legacyRes.error) throw new Error(legacyRes.error.message);
  return legacyRes.count ?? 0;
}

async function queryPurchaseOrders(
  table: string,
  limit: number,
  hospitalCode: string,
): Promise<PurchaseOrder[]> {
  const buildQuery = (select: string) => {
    let query = supabase
      .from(table)
      .select(select)
      .eq('vendor_id', VENDOR_ID)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (table === 'purchase_orders') {
      query = applyPurchaseOrderHospitalFilter(query, hospitalCode);
    } else if (hospitalCode !== ALL_HOSPITALS_CODE) {
      query = query.in('hospital_id', [hospitalCode, DEFAULT_HOSPITAL_CODE, 'ROOT-HQ', 'HOSP-01']);
    }

    return query;
  };

  const select =
    table === PROCUREMENT_PO_TABLE ? PROCUREMENT_PO_SELECT : PO_SELECT;

  let { data, error } = await buildQuery(select);

  if (error && table === PROCUREMENT_PO_TABLE && /column|does not exist/i.test(error.message)) {
    console.warn('[portal-service] Retrying procurement PO fetch with select(*):', error.message);
    ({ data, error } = await buildQuery('*'));
  }

  if (error) throw new Error(error.message);
  const rows = ((data ?? []) as Record<string, unknown>[]).map(mapPurchaseOrderRow);
  return filterByHospitalCode(rows, hospitalCode);
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
      const [pendingPos, activeRes, invoicesRes] = await Promise.all([
        countPendingPurchaseOrders(hospitalCode),
        supabase
          .from('shipments')
          .select('*', { count: 'exact', head: true })
          .eq('vendor_id', VENDOR_ID)
          .eq('status', 'IN_TRANSIT'),
        supabase.from('invoices').select('total_amount').eq('vendor_id', VENDOR_ID),
      ]);

      const errors = [activeRes.error, invoicesRes.error].filter(Boolean);
      const invoicedTotal = (invoicesRes.data ?? []).reduce(
        (sum: number, row: { total_amount?: number }) => sum + Number(row.total_amount ?? 0),
        0,
      );

      if (errors.length > 0) {
        return {
          kpis: {
            pendingPos,
            activeShipments: activeRes.count ?? 0,
            invoicedTotal,
          },
          error: errors[0]?.message,
        };
      }

      return {
        kpis: {
          pendingPos,
          activeShipments: activeRes.count ?? 0,
          invoicedTotal,
        },
      };
    }

    const poIds = await loadPurchaseOrderIdsForHospital(hospitalCode);

    const [pendingPos, invoicesRes] = await Promise.all([
      countPendingPurchaseOrders(hospitalCode),
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

    const errors = [invoicesRes.error].filter(Boolean);
    const invoicedTotal = (invoicesRes.data ?? []).reduce(
      (sum: number, row: { total_amount?: number }) => sum + Number(row.total_amount ?? 0),
      0,
    );

    if (errors.length > 0) {
      return {
        kpis: {
          pendingPos,
          activeShipments,
          invoicedTotal,
        },
        error: errors[0]?.message,
      };
    }

    return {
      kpis: {
        pendingPos,
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
    const procurementRows = await queryPurchaseOrders(PROCUREMENT_PO_TABLE, limit, hospitalCode);
    return { rows: procurementRows };
  } catch (procurementError) {
    try {
      const legacyRows = await queryPurchaseOrders('purchase_orders', limit, hospitalCode);
      return { rows: legacyRows };
    } catch (error) {
      return {
        rows: [],
        error: errorMessage(
          procurementError ?? error,
          'Could not reach purchase orders',
        ),
      };
    }
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendor_invoices' }, () => onChange())
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
