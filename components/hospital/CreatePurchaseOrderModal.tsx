'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

import {
  allocatePurchaseOrderNumber,
  createPurchaseOrder,
  DELIVERY_WINDOWS,
  fetchRegisteredVendors,
  formatVendorOptionLabel,
  PO_DEFAULT_STATUS,
  type HospitalVendor,
  type PurchaseOrderRow,
} from '@/lib/hospital/procurement';
import { EMPTY_PO_FORM } from '@/lib/hospital/po-form';
import { HOSPITAL_TENANT_ID } from '@/lib/regal/constants';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export { EMPTY_PO_FORM };

function poFormFromVendor(vendor: HospitalVendor) {
  return {
    vendorId: String(vendor.id ?? ''),
    vendorName: vendor.company_name || '',
    vendorEmail: vendor.email || '',
    category: 'General Supplies',
  };
}

type CreatePurchaseOrderModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (order: PurchaseOrderRow) => void;
  hospitalId: string;
  hospitalName: string;
  /** Primary vendor list from parent procurement view. */
  registeredSuppliers?: HospitalVendor[];
  /** Alias for registeredSuppliers — same data, either prop may be supplied. */
  vendors?: HospitalVendor[];
  initialVendorId?: string;
  onRegisterSupplier?: () => void;
};

export function CreatePurchaseOrderModal({
  isOpen,
  onClose,
  onSuccess,
  hospitalId,
  hospitalName,
  registeredSuppliers = [],
  vendors = [],
  initialVendorId,
  onRegisterSupplier,
}: CreatePurchaseOrderModalProps) {
  const nodeId = hospitalId || HOSPITAL_TENANT_ID;
  const [loading, setLoading] = useState(false);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [liveVendors, setLiveVendors] = useState<HospitalVendor[]>([]);
  const [poForm, setPoForm] = useState(EMPTY_PO_FORM);

  const loadLiveVendors = useCallback(async () => {
    if (!supabase || !isOpen) return;

    setLoadingVendors(true);
    try {
      const rows = await fetchRegisteredVendors(supabase, nodeId);
      setLiveVendors(rows);
    } catch (err: unknown) {
      console.error('Could not load registered vendors for PO modal:', err);
      toast.error('Could not load registered suppliers');
      setLiveVendors([]);
    } finally {
      setLoadingVendors(false);
    }
  }, [isOpen, nodeId]);

  const supplierOptions = useMemo(() => {
    const merged = [...liveVendors, ...registeredSuppliers, ...vendors];
    const seen = new Set<string>();
    return merged.filter((vendor) => {
      const key = vendor.id || `${vendor.company_name}:${vendor.email}`;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return Boolean(vendor.company_name.trim());
    });
  }, [liveVendors, registeredSuppliers, vendors]);

  useEffect(() => {
    if (!isOpen) {
      setPoForm(EMPTY_PO_FORM);
      setLiveVendors([]);
      return;
    }
    void loadLiveVendors();
  }, [isOpen, loadLiveVendors]);

  useEffect(() => {
    if (!isOpen || supplierOptions.length === 0) return;

    const preselected =
      initialVendorId && initialVendorId !== 'ALL'
        ? supplierOptions.find((vendor) => String(vendor.id) === String(initialVendorId))
        : null;

    setPoForm((prev) => {
      if (prev.vendorId) return prev;
      return {
        ...EMPTY_PO_FORM,
        ...(preselected ? poFormFromVendor(preselected) : {}),
      };
    });
  }, [initialVendorId, isOpen, supplierOptions]);

  const poTotal = useMemo(
    () =>
      parseFloat(
        (
          (parseInt(String(poForm.quantity || 1).trim(), 10) || 1) *
          (parseFloat(String(poForm.unitPrice || 0).trim()) || 0)
        ).toFixed(2),
      ),
    [poForm.quantity, poForm.unitPrice],
  );

  const handlePoVendorSelect = (selectedId: string) => {
    const selectedVendor = supplierOptions.find(
      (vendor) => String(vendor.id) === String(selectedId),
    );

    if (selectedVendor) {
      setPoForm((prev) => ({
        ...prev,
        ...poFormFromVendor(selectedVendor),
      }));
      return;
    }

    setPoForm((prev) => ({
      ...prev,
      vendorId: '',
      vendorName: '',
      vendorEmail: '',
      category: 'General Supplies',
    }));
  };

  const handleIssuePurchaseOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase || loading) return;

    if (!poForm.vendorId || !poForm.vendorName.trim()) {
      toast.error('Please choose an authorized supplier from the list');
      return;
    }
    if (!poForm.itemName.trim()) {
      toast.error('Enter the item name');
      return;
    }

    const rawUnitPrice = parseFloat(String(poForm.unitPrice).trim()) || 0;
    const rawQuantity = parseInt(String(poForm.quantity).trim(), 10) || 1;
    if (rawUnitPrice <= 0) {
      toast.error('Please enter a valid unit price greater than 0');
      return;
    }

    const computedTotal = parseFloat((rawUnitPrice * rawQuantity).toFixed(2));

    setLoading(true);
    try {
      const poNumber = await allocatePurchaseOrderNumber(supabase, nodeId);

      const result = await createPurchaseOrder(supabase, nodeId, hospitalName || 'Regal Hospital', {
        vendorName: poForm.vendorName.trim(),
        vendorId: poForm.vendorId,
        vendorEmail: poForm.vendorEmail?.trim().toLowerCase() || undefined,
        category: poForm.category,
        itemName: poForm.itemName.trim(),
        skuDescription: poForm.skuDescription.trim(),
        quantity: rawQuantity,
        unitPrice: rawUnitPrice,
        deliveryWindow: poForm.deliveryWindow,
        status: PO_DEFAULT_STATUS,
        poNumber,
      });

      if (!result.ok || !result.order) {
        throw new Error(result.error || 'Failed to dispatch purchase order');
      }

      const displayTotal = result.order.total_amount || computedTotal;
      toast.success(`Purchase order ${result.order.po_number} created successfully · ₹${displayTotal.toFixed(2)}`);
      onSuccess?.(result.order);
      setPoForm(EMPTY_PO_FORM);
      setLiveVendors([]);
      onClose();
    } catch (err: unknown) {
      console.error('PO submission failure:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to dispatch purchase order');
    } finally {
      setLoading(false);
    }
  };

  const selectedVendor = useMemo(
    () => supplierOptions.find((vendor) => String(vendor.id) === String(poForm.vendorId)),
    [poForm.vendorId, supplierOptions],
  );

  if (!isOpen) return null;

  const vendorSelectDisabled = loading || loadingVendors || supplierOptions.length === 0;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <form
        onSubmit={(event) => void handleIssuePurchaseOrder(event)}
        className="w-full max-w-lg space-y-3 rounded-3xl border border-slate-200 bg-white p-6 text-xs shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900">Create Purchase Order</h3>
          <button type="button" disabled={loading} onClick={onClose} className="text-slate-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 space-y-1.5 text-left">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Vendor / Supplier <span className="text-rose-500">*</span>
            </label>
            {loadingVendors ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading suppliers…
              </span>
            ) : supplierOptions.length > 0 ? (
              <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400">
                {supplierOptions.length} Active{' '}
                {supplierOptions.length === 1 ? 'Supplier' : 'Suppliers'}
              </span>
            ) : null}
          </div>

          <select
            required
            value={poForm.vendorId || ''}
            onChange={(event) => handlePoVendorSelect(event.target.value)}
            disabled={vendorSelectDisabled}
            className="w-full cursor-pointer rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-medium text-gray-900 outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 disabled:cursor-not-allowed disabled:bg-gray-100"
          >
            <option value="" disabled>
              {loadingVendors
                ? 'Loading registered vendors...'
                : supplierOptions.length === 0
                  ? 'No registered suppliers available...'
                  : 'Select a registered vendor...'}
            </option>
            {supplierOptions.map((vendor) => (
              <option key={vendor.id} value={String(vendor.id)}>
                {formatVendorOptionLabel(vendor)}
              </option>
            ))}
          </select>

          {supplierOptions.length === 0 && !loadingVendors ? (
            <button
              type="button"
              onClick={onRegisterSupplier}
              className="text-[11px] font-bold text-teal-700 hover:text-teal-800"
            >
              + Register a supplier to continue
            </button>
          ) : null}

          {poForm.vendorName ? (
            <div className="mt-2 flex items-center justify-between rounded-xl border border-teal-100 bg-teal-50/70 p-2.5 text-xs">
              <div>
                <p className="font-bold text-teal-900">{poForm.vendorName}</p>
                <p className="font-mono text-[11px] text-teal-700">
                  {poForm.vendorEmail || 'No official portal email linked'}
                </p>
                {selectedVendor?.gstin ? (
                  <p className="mt-0.5 font-mono text-[10px] text-teal-600">
                    GSTIN: {selectedVendor.gstin}
                  </p>
                ) : null}
                {selectedVendor?.phone ? (
                  <p className="font-mono text-[10px] text-teal-600">{selectedVendor.phone}</p>
                ) : null}
              </div>
              <span className="rounded-md bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800">
                {poForm.category}
              </span>
            </div>
          ) : null}
        </div>

        <label className="block font-bold uppercase text-slate-600">
          Category
          <input
            readOnly
            disabled={loading}
            value={poForm.category}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-medium normal-case"
          />
        </label>
        <label className="block font-bold uppercase text-slate-600">
          Item name
          <input
            required
            disabled={loading}
            value={poForm.itemName}
            onChange={(event) => setPoForm((prev) => ({ ...prev, itemName: event.target.value }))}
            placeholder="Item name"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-medium normal-case"
          />
        </label>
        <label className="block font-bold uppercase text-slate-600">
          Detailed SKU description
          <textarea
            disabled={loading}
            value={poForm.skuDescription}
            onChange={(event) => setPoForm((prev) => ({ ...prev, skuDescription: event.target.value }))}
            placeholder="Strength, pack size, manufacturer"
            rows={2}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-medium normal-case"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block font-bold uppercase text-slate-600">
            Quantity
            <input
              required
              type="number"
              min={1}
              disabled={loading}
              value={poForm.quantity}
              onChange={(event) =>
                setPoForm((prev) => ({ ...prev, quantity: Math.max(1, Number(event.target.value) || 1) }))
              }
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono font-medium normal-case"
            />
          </label>
          <label className="block font-bold uppercase text-slate-600">
            Unit price (₹)
            <input
              required
              type="number"
              min={0}
              step="0.01"
              placeholder="0.00"
              disabled={loading}
              value={poForm.unitPrice}
              onChange={(event) => setPoForm((prev) => ({ ...prev, unitPrice: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono font-medium normal-case"
            />
          </label>
        </div>
        <label className="block font-bold uppercase text-slate-600">
          Delivery window
          <select
            disabled={loading}
            value={poForm.deliveryWindow}
            onChange={(event) => setPoForm((prev) => ({ ...prev, deliveryWindow: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-medium normal-case"
          >
            {DELIVERY_WINDOWS.map((window) => (
              <option key={window} value={window}>
                {window}
              </option>
            ))}
          </select>
        </label>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono font-bold">
          Total: ₹{poTotal.toFixed(2)}
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || loadingVendors || supplierOptions.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-teal-600 to-cyan-600 px-5 py-2 text-xs font-semibold text-white disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Dispatching...
              </>
            ) : (
              'Issue Purchase Order'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
