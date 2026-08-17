'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Package,
  Plus,
  RefreshCw,
  Send,
  Truck,
} from 'lucide-react';

import { formatINR } from '@/lib/utils/currency';
import { REGAL_VENDOR_ID } from '@/lib/hospital/operations/procurement-sync';

export interface InventoryItem {
  id?: string;
  item_code: string;
  sku?: string;
  name: string;
  category: string;
  unit: string;
  in_stock: number;
  quantity_in_stock?: number;
  reorder_level: number;
  unit_price: number;
  vendor_name: string;
  facility_code?: string;
  hospital_code?: string;
  hospital_id?: string;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  facility_code: string;
  hospital_code: string;
  hospital_id: string;
  vendor_name: string;
  item_name: string;
  item_code: string;
  quantity_ordered: number;
  unit_price: number;
  total_amount: number;
  status: string;
  items?: unknown[];
  item_details?: string;
  created_at: string;
  updated_at?: string;
}

interface SupplyChainWorkspaceProps {
  supabase: SupabaseClient;
  facilityCode?: string;
  hospitalId?: string;
  autoOpenPurchaseOrder?: boolean;
  onIntentHandled?: () => void;
}

const HOSPITAL_ID = '11111111-1111-1111-1111-111111111111';

function mapInventoryRow(row: Record<string, unknown>): InventoryItem {
  const stock = Number(row.quantity_in_stock ?? row.in_stock ?? 0);
  return {
    id: row.id ? String(row.id) : undefined,
    item_code: String(row.item_code ?? row.sku ?? ''),
    sku: row.sku ? String(row.sku) : undefined,
    name: String(row.item_name ?? row.name ?? 'Item'),
    category: String(row.category ?? 'Medicine'),
    unit: String(row.unit ?? 'units'),
    in_stock: stock,
    quantity_in_stock: stock,
    reorder_level: Number(row.reorder_level ?? 10),
    unit_price: Number(row.unit_price ?? 0),
    vendor_name: String(row.vendor_name ?? 'Apex Pharma Distributors'),
    facility_code: row.facility_code ? String(row.facility_code) : undefined,
    hospital_code: row.hospital_code ? String(row.hospital_code) : undefined,
    hospital_id: row.hospital_id ? String(row.hospital_id) : undefined,
  };
}

function mapPurchaseOrderRow(row: Record<string, unknown>): PurchaseOrder {
  return {
    id: String(row.id ?? ''),
    po_number: String(row.po_number ?? ''),
    facility_code: String(row.facility_code ?? row.hospital_code ?? 'RH-BLR-01'),
    hospital_code: String(row.hospital_code ?? row.facility_code ?? 'RH-BLR-01'),
    hospital_id: String(row.hospital_id ?? HOSPITAL_ID),
    vendor_name: String(row.vendor_name ?? 'Apex Pharma Distributors'),
    item_name: String(row.item_name ?? ''),
    item_code: String(row.item_code ?? ''),
    quantity_ordered: Number(row.quantity_ordered ?? 0),
    unit_price: Number(row.unit_price ?? 0),
    total_amount: Number(row.total_amount ?? 0),
    status: String(row.status ?? 'issued'),
    items: Array.isArray(row.items) ? row.items : undefined,
    item_details: row.item_details ? String(row.item_details) : undefined,
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: row.updated_at ? String(row.updated_at) : undefined,
  };
}

function resolveItemLabel(po: PurchaseOrder): string {
  if (po.item_name?.trim()) {
    return po.quantity_ordered ? `${po.item_name} × ${po.quantity_ordered}` : po.item_name;
  }
  if (po.item_details?.trim() && po.item_details !== '—') return po.item_details;
  if (Array.isArray(po.items) && po.items.length > 0) {
    return po.items
      .map((entry) => {
        if (!entry || typeof entry !== 'object') return null;
        const row = entry as Record<string, unknown>;
        const name = String(row.item_name ?? row.name ?? 'Supply');
        const qty = row.quantity != null ? Number(row.quantity) : 1;
        return `${name} × ${qty}`;
      })
      .filter(Boolean)
      .join(', ');
  }
  return 'General Medical Supplies';
}

function nextPoNumber(): string {
  return `RH-PO-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;
}

function renderStatusBadge(status: string) {
  switch (status?.toLowerCase()) {
    case 'issued':
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[11px] font-bold text-sky-700">
          <Clock className="h-3 w-3" /> Issued
        </span>
      );
    case 'accepted':
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
          <CheckCircle2 className="h-3 w-3" /> Accepted
        </span>
      );
    case 'dispatched':
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-[11px] font-bold text-purple-700">
          <Truck className="h-3 w-3" /> Dispatched
        </span>
      );
    case 'invoiced':
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700">
          <FileText className="h-3 w-3" /> Invoiced
        </span>
      );
    case 'paid':
    case 'received':
    case 'goods_receipt':
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
          <CreditCard className="h-3 w-3" /> {status.replace(/_/g, ' ')}
        </span>
      );
    default:
      return (
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold capitalize text-slate-600">
          {status}
        </span>
      );
  }
}

export default function SupplyChainWorkspace({
  supabase,
  facilityCode = 'RH-BLR-01',
  hospitalId = HOSPITAL_ID,
  autoOpenPurchaseOrder = false,
  onIntentHandled,
}: SupplyChainWorkspaceProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showAddInventory, setShowAddInventory] = useState(false);
  const [showDispatchPO, setShowDispatchPO] = useState(false);

  const [inventoryForm, setInventoryForm] = useState({
    name: '',
    item_code: '',
    category: 'Medicine',
    unit: 'units',
    in_stock: 50,
    reorder_level: 15,
    unit_price: 20,
    vendor_name: 'Apex Pharma Distributors',
  });

  const [poForm, setPoForm] = useState({
    itemName: '',
    itemCode: '',
    category: 'Medicine',
    vendorName: 'Apex Pharma Distributors',
    quantity: 50,
    unitPrice: 20,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const [invRes, poRes] = await Promise.all([
        supabase
          .from('inventory_items')
          .select('*')
          .eq('facility_code', facilityCode)
          .order('created_at', { ascending: false }),
        supabase
          .from('purchase_orders')
          .select('*')
          .eq('facility_code', facilityCode)
          .order('created_at', { ascending: false }),
      ]);

      if (invRes.error) throw invRes.error;
      if (poRes.error) throw poRes.error;

      let inventoryRows = invRes.data ?? [];
      let purchaseOrderRows = poRes.data ?? [];

      if (inventoryRows.length === 0) {
        const fallback = await supabase
          .from('inventory_items')
          .select('*')
          .order('created_at', { ascending: false });
        if (!fallback.error && fallback.data?.length) inventoryRows = fallback.data;
      }

      if (purchaseOrderRows.length === 0) {
        const fallback = await supabase
          .from('purchase_orders')
          .select('*')
          .order('created_at', { ascending: false });
        if (!fallback.error && fallback.data?.length) purchaseOrderRows = fallback.data;
      }

      setInventory(inventoryRows.map((row) => mapInventoryRow(row as Record<string, unknown>)));
      setPurchaseOrders(purchaseOrderRows.map((row) => mapPurchaseOrderRow(row as Record<string, unknown>)));
    } catch (err: unknown) {
      console.error('Data sync error:', err);
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to load ledger records.',
      });
      setInventory([]);
      setPurchaseOrders([]);
    } finally {
      setLoading(false);
    }
  }, [facilityCode, supabase]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    const channel = supabase
      .channel(`supply_chain_realtime_${facilityCode}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'purchase_orders' }, () => {
        void fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, () => {
        void fetchData();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [facilityCode, fetchData, supabase]);

  useEffect(() => {
    if (autoOpenPurchaseOrder) {
      setShowDispatchPO(true);
      onIntentHandled?.();
    }
  }, [autoOpenPurchaseOrder, onIntentHandled]);

  const handleCreateInventoryItem = async (event: FormEvent) => {
    event.preventDefault();
    if (!inventoryForm.name.trim()) return;

    setSubmitting(true);
    setFeedback(null);
    try {
      const code = inventoryForm.item_code.trim() || `MED-${Date.now().toString().slice(-4)}`;

      const { error } = await supabase.from('inventory_items').insert({
        sku: code,
        item_code: code,
        item_name: inventoryForm.name.trim(),
        name: inventoryForm.name.trim(),
        category: inventoryForm.category,
        unit: inventoryForm.unit || 'units',
        in_stock: Number(inventoryForm.in_stock),
        quantity_in_stock: Number(inventoryForm.in_stock),
        reorder_level: Number(inventoryForm.reorder_level),
        unit_price: Number(inventoryForm.unit_price),
        vendor_name: inventoryForm.vendor_name.trim() || 'Apex Pharma Distributors',
        hospital_code: facilityCode,
        facility_code: facilityCode,
        hospital_id: hospitalId,
      });

      if (error) throw error;

      setFeedback({ type: 'success', message: `Added "${inventoryForm.name}" to hospital inventory.` });
      setShowAddInventory(false);
      setInventoryForm({
        name: '',
        item_code: '',
        category: 'Medicine',
        unit: 'units',
        in_stock: 50,
        reorder_level: 15,
        unit_price: 20,
        vendor_name: 'Apex Pharma Distributors',
      });
      await fetchData();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to save inventory item.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openPODialog = (item?: InventoryItem) => {
    if (item) {
      setPoForm({
        itemName: item.name,
        itemCode: item.item_code || item.sku || 'MED-001',
        category: item.category || 'Medicine',
        vendorName: item.vendor_name || 'Apex Pharma Distributors',
        quantity: Math.max(item.reorder_level * 2, 20),
        unitPrice: item.unit_price || 20,
      });
    } else {
      setPoForm({
        itemName: '',
        itemCode: `MED-${Date.now().toString().slice(-4)}`,
        category: 'Medicine',
        vendorName: 'Apex Pharma Distributors',
        quantity: 50,
        unitPrice: 25,
      });
    }
    setShowDispatchPO(true);
  };

  const handleDispatchPO = async (event: FormEvent) => {
    event.preventDefault();
    if (!poForm.itemName.trim() || poForm.quantity <= 0) return;

    setSubmitting(true);
    setFeedback(null);
    try {
      const generatedPo = nextPoNumber();
      const totalCost = Number(poForm.quantity) * Number(poForm.unitPrice);
      const itemName = poForm.itemName.trim();
      const now = new Date().toISOString();

      const { error: insertError } = await supabase.from('purchase_orders').insert({
        po_number: generatedPo,
        hospital_code: facilityCode,
        facility_code: facilityCode,
        hospital_id: hospitalId,
        hospital_name: 'Regal Hospital',
        vendor_id: REGAL_VENDOR_ID,
        vendor_name: poForm.vendorName.trim(),
        item_name: itemName,
        item_code: poForm.itemCode || 'MED-GEN',
        quantity_ordered: Number(poForm.quantity),
        unit_price: Number(poForm.unitPrice),
        total_amount: totalCost,
        item_details: `${itemName} × ${poForm.quantity}`,
        status: 'ISSUED',
        items: [
          {
            item_name: itemName,
            item_code: poForm.itemCode,
            quantity: Number(poForm.quantity),
            unit_price: Number(poForm.unitPrice),
            total: totalCost,
          },
        ],
        created_at: now,
        updated_at: now,
      });

      if (insertError) throw insertError;

      await supabase.from('channel_messages').insert({
        hospital_id: hospitalId,
        facility_code: facilityCode,
        channel_type: 'vendor',
        sender_role: 'hospital',
        sender_id: 'RH-ADMIN',
        sender_name: 'Regal Hospital Procurement Desk',
        recipient_type: 'vendor',
        recipient_id: 'VENDOR-01',
        message: `PO Dispatched: ${generatedPo} • ${poForm.quantity}x ${itemName} (Total: ${formatINR(totalCost)})`,
      });

      setFeedback({ type: 'success', message: `Dispatched ${generatedPo} to ${poForm.vendorName}.` });
      setShowDispatchPO(false);
      await fetchData();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to dispatch purchase order.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const lowStockCount = inventory.filter(
    (item) => (item.in_stock ?? item.quantity_in_stock ?? 0) <= item.reorder_level,
  ).length;

  return (
    <div className="space-y-6">
      {feedback ? (
        <div
          className={`flex items-center justify-between rounded-xl border p-3.5 text-xs font-semibold transition-all ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          <span>{feedback.message}</span>
          <button type="button" onClick={() => setFeedback(null)} className="text-xs underline">
            Dismiss
          </button>
        </div>
      ) : null}

      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
        <div>
          <h2 className="text-base font-bold text-slate-800">Supply Chain & Vendor POs</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Hospital inventory monitoring and real-time vendor procurement ledger
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddInventory(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Inventory Item
          </button>
          <button
            type="button"
            onClick={() => openPODialog()}
            className="flex items-center gap-1.5 rounded-xl bg-[#00A896] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#009181]"
          >
            <Send className="h-3.5 w-3.5" />
            Dispatch Purchase Order
          </button>
          <button
            type="button"
            onClick={() => void fetchData()}
            title="Refresh"
            className="rounded-xl border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-6 py-4">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-[#00A896]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Inventory Monitor</h3>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
              lowStockCount > 0
                ? 'border border-amber-200 bg-amber-50 text-amber-800'
                : 'bg-emerald-50 text-emerald-800'
            }`}
          >
            {lowStockCount > 0
              ? `${lowStockCount} items at or below reorder threshold`
              : 'All stocks optimal'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/40 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3">Item Code</th>
                <th className="px-6 py-3">Item Name</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Stock Level</th>
                <th className="px-6 py-3">Reorder At</th>
                <th className="px-6 py-3">Unit Price</th>
                <th className="px-6 py-3">Vendor</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    Loading inventory from Supabase…
                  </td>
                </tr>
              ) : inventory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    No inventory records found. Click &quot;Add Inventory Item&quot; to register hospital stock.
                  </td>
                </tr>
              ) : (
                inventory.map((item) => {
                  const stock = item.in_stock ?? item.quantity_in_stock ?? 0;
                  const isLow = stock <= item.reorder_level;
                  return (
                    <tr key={item.id || item.item_code} className="transition-colors hover:bg-slate-50/60">
                      <td className="px-6 py-3.5 font-mono text-[11px] font-bold text-slate-500">
                        {item.item_code || item.sku || '—'}
                      </td>
                      <td className="px-6 py-3.5 font-bold text-slate-800">{item.name}</td>
                      <td className="px-6 py-3.5">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 font-bold text-amber-700">
                            <AlertTriangle className="h-3 w-3" /> {stock} (Low)
                          </span>
                        ) : (
                          <span className="font-semibold text-slate-700">{stock}</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 font-medium text-slate-500">{item.reorder_level}</td>
                      <td className="px-6 py-3.5 font-semibold text-slate-800">
                        {formatINR(item.unit_price)}
                      </td>
                      <td className="max-w-[180px] truncate px-6 py-3.5 text-slate-600">{item.vendor_name}</td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => openPODialog(item)}
                          className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-bold text-slate-700 transition-all hover:border-[#00A896] hover:bg-[#00A896] hover:text-white"
                        >
                          Raise PO
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-6 py-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Live Vendor PO Tracker</h3>
            <p className="text-[11px] font-medium text-slate-500">
              Bi-directional sync • vendor accept/dispatch updates in real time
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">{purchaseOrders.length} orders</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/40 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3">PO Number</th>
                <th className="px-6 py-3">Items</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    Loading purchase orders…
                  </td>
                </tr>
              ) : purchaseOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No purchase orders issued yet. Click &apos;Dispatch Purchase Order&apos; above to create a
                    new order.
                  </td>
                </tr>
              ) : (
                purchaseOrders.map((po) => (
                  <tr key={po.id || po.po_number} className="transition-colors hover:bg-slate-50/60">
                    <td className="px-6 py-3.5 font-mono text-xs font-bold text-[#0F3E5D]">{po.po_number}</td>
                    <td className="px-6 py-3.5 font-medium text-slate-800">{resolveItemLabel(po)}</td>
                    <td className="px-6 py-3.5 font-bold text-slate-900">
                      {formatINR(Number(po.total_amount || 0))}
                    </td>
                    <td className="px-6 py-3.5">{renderStatusBadge(po.status)}</td>
                    <td className="whitespace-nowrap px-6 py-3.5 text-[11px] text-slate-400">
                      {new Date(po.updated_at ?? po.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddInventory ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800">Add Hospital Stock</h3>
              <button type="button" onClick={() => setShowAddInventory(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            <form onSubmit={(event) => void handleCreateInventoryItem(event)} className="space-y-3 text-xs">
              <div>
                <label className="mb-1 block font-bold text-slate-700">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paracetamol 650mg"
                  value={inventoryForm.name}
                  onChange={(event) => setInventoryForm({ ...inventoryForm, name: event.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Item Code</label>
                  <input
                    type="text"
                    placeholder="e.g. MED-9438"
                    value={inventoryForm.item_code}
                    onChange={(event) => setInventoryForm({ ...inventoryForm, item_code: event.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Category</label>
                  <select
                    value={inventoryForm.category}
                    onChange={(event) => setInventoryForm({ ...inventoryForm, category: event.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2"
                  >
                    <option value="Medicine">Medicine</option>
                    <option value="Consumable">Consumable</option>
                    <option value="Surgical">Surgical</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Stock</label>
                  <input
                    type="number"
                    min={0}
                    value={inventoryForm.in_stock}
                    onChange={(event) =>
                      setInventoryForm({ ...inventoryForm, in_stock: Number(event.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Reorder At</label>
                  <input
                    type="number"
                    min={1}
                    value={inventoryForm.reorder_level}
                    onChange={(event) =>
                      setInventoryForm({ ...inventoryForm, reorder_level: Number(event.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Price ({'\u20B9'})</label>
                  <input
                    type="number"
                    min={0}
                    value={inventoryForm.unit_price}
                    onChange={(event) =>
                      setInventoryForm({ ...inventoryForm, unit_price: Number(event.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block font-bold text-slate-700">Vendor</label>
                <input
                  type="text"
                  value={inventoryForm.vendor_name}
                  onChange={(event) => setInventoryForm({ ...inventoryForm, vendor_name: event.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button type="button" onClick={() => setShowAddInventory(false)} className="rounded-xl border border-slate-200 px-4 py-2">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#0F3E5D] px-5 py-2 font-bold text-white disabled:opacity-50"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showDispatchPO ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800">Dispatch Purchase Order</h3>
              <button type="button" onClick={() => setShowDispatchPO(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            <form onSubmit={(event) => void handleDispatchPO(event)} className="space-y-3 text-xs">
              <div>
                <label className="mb-1 block font-bold text-slate-700">Item Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paracetamol 650 mg"
                  value={poForm.itemName}
                  onChange={(event) => setPoForm({ ...poForm, itemName: event.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Vendor</label>
                  <input
                    type="text"
                    required
                    value={poForm.vendorName}
                    onChange={(event) => setPoForm({ ...poForm, vendorName: event.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Item Code</label>
                  <input
                    type="text"
                    value={poForm.itemCode}
                    onChange={(event) => setPoForm({ ...poForm, itemCode: event.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={poForm.quantity}
                    onChange={(event) => setPoForm({ ...poForm, quantity: Number(event.target.value) })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Unit Price ({'\u20B9'})</label>
                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    required
                    value={poForm.unitPrice}
                    onChange={(event) => setPoForm({ ...poForm, unitPrice: Number(event.target.value) })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>
              <div className="flex justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold">
                <span className="text-slate-600">Calculated Total:</span>
                <span className="text-sm font-black text-[#00A896]">
                  {formatINR(poForm.quantity * poForm.unitPrice)}
                </span>
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button type="button" onClick={() => setShowDispatchPO(false)} className="rounded-xl border border-slate-200 px-4 py-2">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 rounded-xl bg-[#00A896] px-5 py-2 font-bold text-white disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  Dispatch PO
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
