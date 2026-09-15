import type { SupabaseClient } from '@supabase/supabase-js';

import {
  fetchVendorPurchaseOrders,
  formatPurchaseOrderStatus,
  mapPurchaseOrderRow,
  PROCUREMENT_PO_TABLE,
  updatePurchaseOrderStatus,
  type PurchaseOrderRow,
} from '@/lib/hospital/procurement';
import type { LifecycleCounts } from '@/lib/vendor/lifecycle';
import { formatVendorHospitalName } from '@/lib/vendor/shipments';
import { supabase as defaultSupabase } from '@/lib/supabaseClient';
import { computeInvoiceTotals as portalComputeInvoiceTotals } from '@/lib/vendor/v0/portal-service';

export const VENDOR_GST_RATE = 0.18;
export const VENDOR_INVOICE_TABLES = ['vendor_invoices', 'invoices'] as const;

export type VendorPaymentStatus = 'AWAITING_SETTLEMENT' | 'PAID' | 'PENDING' | 'SETTLED';

export type VendorInvoiceRow = {
  id: string;
  vendor_id?: string;
  po_id: string;
  po_number: string;
  hospital_id?: string;
  hospital_name: string;
  item_description: string;
  invoice_number: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  payment_status: VendorPaymentStatus;
  due_date?: string;
  created_at: string;
};

export type BillablePurchaseOrder = PurchaseOrderRow & {
  hospital_id?: string;
  hospital_name: string;
};

export type VendorBillingMetrics = {
  awaitingSettlementTotal: number;
  readyForInvoicingCount: number;
  invoiceCount: number;
};

export type CreateVendorInvoiceInput = {
  po_id: string;
  invoice_number: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  hospital_name?: string;
  item_description?: string;
  po_number?: string;
  due_date?: string;
};

export const BILLABLE_PO_STATUSES = [
  'ACCEPTED',
  'DISPATCHED',
  'IN TRANSIT',
  'IN_TRANSIT',
  'DELIVERED',
] as const;

const BILLABLE_PO_STATUS_SET = new Set<string>(BILLABLE_PO_STATUSES);

export function normalizeBillablePoStatus(status?: string | null): string {
  return String(status ?? '')
    .trim()
    .toUpperCase()
    .replace(/_/g, ' ');
}

export function isBillablePurchaseOrderStatus(status?: string | null): boolean {
  const normalized = normalizeBillablePoStatus(status);
  const formatted = formatPurchaseOrderStatus(status);
  if (formatted === 'INVOICED' || formatted === 'CANCELLED') return false;
  if (formatted === 'ACCEPTED' || formatted === 'DISPATCHED' || formatted === 'DELIVERED') {
    return true;
  }
  if (normalized === 'IN TRANSIT' || normalized === 'IN_TRANSIT') return true;
  return BILLABLE_PO_STATUS_SET.has(normalized);
}

export function defaultInvoiceDueDate(): string {
  const due = new Date();
  due.setDate(due.getDate() + 30);
  return due.toISOString().slice(0, 10);
}

export type VendorBillingIdentity = {
  id?: string;
  email?: string;
  company_name?: string;
};

/** Partner hospital nodes — never exclude legacy UUID / code mismatches. */
export function isPartnerHospitalOrder(_hospitalId?: string | null): boolean {
  return true;
}

function rowMatchesVendorForBilling(
  row: Record<string, unknown>,
  vendor: VendorBillingIdentity,
): boolean {
  const vendorId = String(vendor.id ?? '').trim();
  const vendorEmail = String(vendor.email ?? '').trim().toLowerCase();
  const vendorName = String(vendor.company_name ?? '').trim().toLowerCase();
  const hasVendorIdentity = Boolean(vendorId || vendorEmail || vendorName);

  if (!hasVendorIdentity) return true;

  const rowVendorId = String(row.vendor_id ?? '').trim();
  if (vendorId && rowVendorId && rowVendorId === vendorId) return true;

  const rowVendorName = String(row.vendor_name ?? row.vendor ?? '')
    .trim()
    .toLowerCase();
  if (vendorName && rowVendorName && rowVendorName === vendorName) return true;

  if (vendorEmail) {
    for (const key of ['vendor_email', 'email', 'rep_email'] as const) {
      const candidate = String(row[key] ?? '')
        .trim()
        .toLowerCase();
      if (candidate && candidate === vendorEmail) return true;
    }
  }

  // Include orphan PO rows without vendor_id for the active vendor session.
  if (!rowVendorId) return true;

  return false;
}

function missingColumn(message: string | null | undefined): string | null {
  const text = String(message ?? '');
  return (
    text.match(/Could not find the '([^']+)' column/i)?.[1] ??
    text.match(/column (?:[\w]+\.)?([a-zA-Z0-9_]+) does not exist/i)?.[1] ??
    null
  );
}

function isMissingColumnError(message: string | null | undefined): boolean {
  const text = String(message ?? '');
  return Boolean(missingColumn(text)) || /schema cache|could not find the/i.test(text);
}

export function computeVendorInvoiceTotals(subtotal: number) {
  return portalComputeInvoiceTotals(subtotal);
}

export function generateVendorInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const suffix = String(Date.now()).slice(-4);
  return `INV-${year}-${suffix}`;
}

export function normalizePaymentStatus(raw?: string | null): VendorPaymentStatus {
  const value = String(raw ?? '')
    .trim()
    .toUpperCase()
    .replace(/_/g, ' ');
  if (value === 'PAID' || value === 'SETTLED') return 'PAID';
  if (value === 'SUBMITTED' || value === 'PENDING' || value === 'AWAITING SETTLEMENT') {
    return 'AWAITING_SETTLEMENT';
  }
  return 'AWAITING_SETTLEMENT';
}

export function isAwaitingSettlementStatus(status?: string | null): boolean {
  return normalizePaymentStatus(status) === 'AWAITING_SETTLEMENT';
}

export function paymentStatusLabel(status?: string | null): string {
  return isAwaitingSettlementStatus(status) ? 'Awaiting Settlement' : 'Paid & Settled';
}

export function paymentStatusBadgeClass(status?: string | null): string {
  return isAwaitingSettlementStatus(status)
    ? 'bg-amber-100 text-amber-800 border border-amber-200'
    : 'bg-emerald-100 text-emerald-800 border border-emerald-200';
}

function mapVendorInvoiceRow(row: Record<string, unknown>): VendorInvoiceRow {
  const paymentStatus = normalizePaymentStatus(
    String(row.payment_status ?? row.status ?? 'AWAITING_SETTLEMENT'),
  );
  return {
    id: String(row.id ?? ''),
    vendor_id: row.vendor_id ? String(row.vendor_id) : undefined,
    po_id: String(row.po_id ?? row.purchase_order_id ?? ''),
    po_number: String(row.po_number ?? ''),
    hospital_id: row.hospital_id ? String(row.hospital_id) : undefined,
    hospital_name: String(row.hospital_name ?? formatVendorHospitalName(row.hospital_id as string)),
    item_description: String(row.item_description ?? row.item_details ?? 'Medical Supplies'),
    invoice_number: String(row.invoice_number ?? row.invoice_code ?? `INV-${row.id ?? 'PENDING'}`),
    subtotal: Number(row.subtotal ?? row.base_amount ?? 0),
    tax_amount: Number(row.tax_amount ?? row.gst_amount ?? 0),
    total_amount: Number(row.total_amount ?? row.gross_amount ?? 0),
    payment_status: paymentStatus,
    due_date: row.due_date ? String(row.due_date) : undefined,
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

async function queryVendorInvoices(
  client: SupabaseClient,
  _vendorId?: string,
): Promise<{ rows: Record<string, unknown>[]; error: unknown | null; table?: string }> {
  for (const table of VENDOR_INVOICE_TABLES) {
    const query = client.from(table).select('*').order('created_at', { ascending: false });
    const result = await query;
    if (!result.error) {
      return { rows: (result.data ?? []) as Record<string, unknown>[], error: null, table };
    }
    if (!/relation|does not exist|schema cache/i.test(result.error.message)) {
      return { rows: [], error: result.error, table };
    }
  }
  return { rows: [], error: null };
}

export async function fetchVendorInvoices(
  vendor: VendorBillingIdentity,
  client: SupabaseClient = defaultSupabase,
): Promise<VendorInvoiceRow[]> {
  if (!client) return [];

  const { rows, error } = await queryVendorInvoices(client);
  if (error) return [];

  const invoices = rows.map(mapVendorInvoiceRow);
  const vendorId = String(vendor.id ?? '').trim();
  if (!vendorId) return invoices;

  return invoices.filter(
    (invoice) => !invoice.vendor_id || invoice.vendor_id === vendorId,
  );
}

async function fetchInvoicedPurchaseOrderKeys(
  client: SupabaseClient,
): Promise<{ ids: Set<string>; numbers: Set<string> }> {
  const ids = new Set<string>();
  const numbers = new Set<string>();

  for (const table of VENDOR_INVOICE_TABLES) {
    const result = await client.from(table).select('po_id, po_number');
    if (result.error) continue;
    for (const row of (result.data ?? []) as Record<string, unknown>[]) {
      const poId = String(row.po_id ?? '').trim();
      const poNumber = String(row.po_number ?? '').trim();
      if (poId) ids.add(poId);
      if (poNumber) numbers.add(poNumber);
    }
  }

  return { ids, numbers: numbers };
}

async function queryAllPurchaseOrderRows(
  client: SupabaseClient,
): Promise<Record<string, unknown>[]> {
  const select =
    'id, po_number, item_description, quantity, total_amount, status, hospital_id, vendor_id, vendor_name, vendor_email, email, rep_email, created_at';

  let result = await client.from(PROCUREMENT_PO_TABLE).select(select).order('created_at', { ascending: false });

  if (result.error && /column/i.test(result.error.message)) {
    result = await client.from(PROCUREMENT_PO_TABLE).select('*').order('created_at', { ascending: false });
  }

  if (result.error) return [];
  return (result.data ?? []) as Record<string, unknown>[];
}

function mapBillablePurchaseOrderRow(row: Record<string, unknown>): BillablePurchaseOrder {
  const mapped = mapPurchaseOrderRow(row);
  const hospitalId = row.hospital_id ? String(row.hospital_id) : undefined;
  return {
    ...mapped,
    hospital_id: hospitalId,
    hospital_name: formatVendorHospitalName(hospitalId),
  };
}

function dedupeBillableOrders(orders: BillablePurchaseOrder[]): BillablePurchaseOrder[] {
  const seen = new Set<string>();
  const deduped: BillablePurchaseOrder[] = [];

  for (const order of orders) {
    const key = order.id || order.po_number;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(order);
  }

  return deduped.sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')));
}

/** Load billable POs with inclusive status, vendor, and hospital matching. */
export async function fetchBillablePurchaseOrdersDirect(
  vendor: VendorBillingIdentity = {},
  client: SupabaseClient = defaultSupabase,
): Promise<BillablePurchaseOrder[]> {
  if (!client) return [];

  const [{ ids: invoicedPoIds, numbers: invoicedPoNumbers }, rows] = await Promise.all([
    fetchInvoicedPurchaseOrderKeys(client),
    queryAllPurchaseOrderRows(client),
  ]);

  const billable = rows
    .filter((row) => isPartnerHospitalOrder(row.hospital_id ? String(row.hospital_id) : undefined))
    .filter((row) => rowMatchesVendorForBilling(row, vendor))
    .map(mapBillablePurchaseOrderRow)
    .filter((order) => isBillablePurchaseOrderStatus(order.status))
    .filter((order) => !invoicedPoIds.has(order.id) && !invoicedPoNumbers.has(order.po_number));

  return dedupeBillableOrders(billable);
}

export async function fetchBillablePurchaseOrders(
  vendor: VendorBillingIdentity = {},
  client: SupabaseClient = defaultSupabase,
): Promise<BillablePurchaseOrder[]> {
  return fetchBillablePurchaseOrdersDirect(vendor, client);
}

export function mergeBillablePurchaseOrders(
  ...lists: BillablePurchaseOrder[][]
): BillablePurchaseOrder[] {
  return dedupeBillableOrders(lists.flat());
}

export async function fetchVendorBillingSnapshot(
  vendor: { id?: string; email?: string; company_name?: string },
  client: SupabaseClient = defaultSupabase,
): Promise<{
  invoices: VendorInvoiceRow[];
  billableOrders: BillablePurchaseOrder[];
  metrics: VendorBillingMetrics;
}> {
  const [invoices, billableOrders] = await Promise.all([
    fetchVendorInvoices(vendor, client),
    fetchBillablePurchaseOrders(vendor, client),
  ]);

  const awaitingSettlementTotal = invoices
    .filter((invoice) => isAwaitingSettlementStatus(invoice.payment_status))
    .reduce((sum, invoice) => sum + invoice.total_amount, 0);

  return {
    invoices,
    billableOrders,
    metrics: {
      awaitingSettlementTotal,
      readyForInvoicingCount: billableOrders.length,
      invoiceCount: invoices.length,
    },
  };
}

async function insertVendorInvoiceRow(
  client: SupabaseClient,
  table: string,
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; row?: Record<string, unknown>; error?: string }> {
  const patch = { ...payload };
  let result = await client.from(table).insert(patch).select('*').maybeSingle();

  let guard = 0;
  while (result.error && guard < 8) {
    guard += 1;
    if (!isMissingColumnError(result.error.message)) {
      return { ok: false, error: result.error.message };
    }
    const column = missingColumn(result.error.message);
    if (column && column in patch) {
      delete patch[column];
    } else {
      return { ok: false, error: result.error.message };
    }
    result = await client.from(table).insert(patch).select('*').maybeSingle();
  }

  if (result.error) {
    return { ok: false, error: result.error.message };
  }

  return { ok: true, row: result.data ? (result.data as Record<string, unknown>) : undefined };
}

export async function createVendorInvoice(
  input: CreateVendorInvoiceInput,
  vendor: { id?: string; email?: string; company_name?: string },
  order: BillablePurchaseOrder,
  client: SupabaseClient = defaultSupabase,
): Promise<{ ok: boolean; invoice?: VendorInvoiceRow; error?: string }> {
  if (!client || !input.po_id) {
    return { ok: false, error: 'Missing purchase order' };
  }

  const vendorId = String(vendor.id ?? order.vendor_id ?? '').trim();
  const dueDate = input.due_date?.trim() || defaultInvoiceDueDate();
  const timestamp = new Date().toISOString();

  const basePayload: Record<string, unknown> = {
    vendor_id: vendorId || null,
    po_id: input.po_id,
    po_number: input.po_number ?? order.po_number,
    hospital_id: order.hospital_id ?? null,
    hospital_name: input.hospital_name ?? order.hospital_name,
    item_description: input.item_description ?? order.item_description,
    invoice_number: input.invoice_number,
    subtotal: input.subtotal,
    tax_amount: input.tax_amount,
    gst_amount: input.tax_amount,
    total_amount: input.total_amount,
    gross_amount: input.total_amount,
    payment_status: 'AWAITING_SETTLEMENT',
    status: 'SUBMITTED',
    due_date: dueDate,
    created_at: timestamp,
    updated_at: timestamp,
  };

  let inserted: Record<string, unknown> | undefined;
  let lastError = 'Could not create vendor invoice';

  for (const table of VENDOR_INVOICE_TABLES) {
    const result = await insertVendorInvoiceRow(client, table, basePayload);
    if (result.ok && result.row) {
      inserted = result.row;
      break;
    }
    if (result.error && !/relation|does not exist|schema cache/i.test(result.error)) {
      lastError = result.error;
    }
  }

  if (!inserted) {
    return { ok: false, error: lastError };
  }

  const poUpdate = await updatePurchaseOrderStatus(client, input.po_id, 'INVOICED');
  if (!poUpdate.ok) {
    return {
      ok: true,
      invoice: mapVendorInvoiceRow(inserted),
      error: poUpdate.error || 'Invoice saved, but purchase order could not be marked INVOICED',
    };
  }

  return { ok: true, invoice: mapVendorInvoiceRow(inserted) };
}

export async function fetchVendorPortalLifecycleCounts(
  vendor: { id?: string; email?: string; company_name?: string },
  client: SupabaseClient = defaultSupabase,
): Promise<{ counts: LifecycleCounts; error?: string }> {
  if (!client) return { counts: {} };

  try {
    const [orders, invoices] = await Promise.all([
      fetchVendorPurchaseOrders(client, {
        id: vendor.id,
        email: vendor.email,
        company_name: vendor.company_name,
      }),
      fetchVendorInvoices(vendor, client),
    ]);

    const counts: LifecycleCounts = {
      ISSUED: orders.filter((order) => {
        const status = formatPurchaseOrderStatus(order.status);
        return status === 'ISSUED' || status === 'PENDING DISPATCH';
      }).length,
      ACCEPTED: orders.filter((order) => formatPurchaseOrderStatus(order.status) === 'ACCEPTED').length,
      DISPATCHED: orders.filter((order) => formatPurchaseOrderStatus(order.status) === 'DISPATCHED').length,
      GOODS_RECEIPT: orders.filter((order) => formatPurchaseOrderStatus(order.status) === 'DELIVERED').length,
      INVOICED: invoices.filter((invoice) => isAwaitingSettlementStatus(invoice.payment_status)).length,
      PAID: invoices.filter((invoice) => normalizePaymentStatus(invoice.payment_status) === 'PAID').length,
    };

    return { counts };
  } catch (error) {
    return {
      counts: {},
      error: error instanceof Error ? error.message : 'Could not load lifecycle counts',
    };
  }
}

export function buildVendorInvoiceReceiptHtml(invoice: VendorInvoiceRow): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${invoice.invoice_number}</title>
<style>body{font-family:Arial,sans-serif;padding:32px;color:#111}h1{font-size:20px}table{width:100%;border-collapse:collapse;margin-top:16px}td,th{border:1px solid #ddd;padding:8px;text-align:left}</style>
</head><body>
<h1>Tax Invoice ${invoice.invoice_number}</h1>
<p>Date: ${new Date(invoice.created_at).toLocaleDateString('en-IN')}</p>
<p>Reference PO: ${invoice.po_number}</p>
<p>Hospital: ${invoice.hospital_name}</p>
<p>Item: ${invoice.item_description}</p>
<table>
<tr><th>Description</th><th>Amount (INR)</th></tr>
<tr><td>Base Amount</td><td>${invoice.subtotal.toFixed(2)}</td></tr>
<tr><td>GST @ 18%</td><td>${invoice.tax_amount.toFixed(2)}</td></tr>
<tr><th>Total</th><th>${invoice.total_amount.toFixed(2)}</th></tr>
</table>
<p>Payment Status: ${paymentStatusLabel(invoice.payment_status)}</p>
</body></html>`;
}

export function downloadVendorInvoiceReceipt(invoice: VendorInvoiceRow): void {
  const html = buildVendorInvoiceReceiptHtml(invoice);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${invoice.invoice_number}.html`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export { PROCUREMENT_PO_TABLE };
