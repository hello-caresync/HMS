'use client';

import { QrCode } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { VendorFeedbackBanner, useVendorFeedback } from '@/components/vendor/ui/useVendorFeedback';
import { VendorDataTable } from '@/components/vendor/ui/VendorDataTable';
import { VendorModuleHeader, VendorStatusPill } from '@/components/vendor/ui/VendorModuleHeader';
import { VendorModal } from '@/components/vendor/ui/VendorModal';
import { vendorFieldClass, vendorLabelClass, vendorUi } from '@/lib/vendor/ui-tokens';
import { vendorClasses } from '@/lib/vendor/theme';
import { supabase } from '@/lib/supabaseClient';
import { DEFAULT_VENDOR_ID } from '@/lib/vendor-supabase/constants';
import type { ProductRow, PurchaseOrderRow } from '@/lib/vendor-supabase/types';

const LOW_STOCK_THRESHOLD = 25;

function InventoryWorkspace() {
  const { feedback, showSuccess, showError } = useVendorFeedback();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [openPoCount, setOpenPoCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [manualSku, setManualSku] = useState('');
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [scanSubmitting, setScanSubmitting] = useState(false);

  const loadInventory = useCallback(async () => {
    setLoading(true);
    const [productsRes, poRes] = await Promise.all([
      supabase
        .from('products')
        .select('*')
        .eq('vendor_id', DEFAULT_VENDOR_ID)
        .order('name'),
      supabase
        .from('purchase_orders')
        .select('id, status')
        .eq('vendor_id', DEFAULT_VENDOR_ID)
        .in('status', ['ISSUED', 'ACCEPTED', 'PARTIAL']),
    ]);

    if (productsRes.error) {
      showError(productsRes.error.message);
      setProducts([]);
    } else {
      setProducts((productsRes.data as ProductRow[]) ?? []);
    }

    if (!poRes.error && poRes.data) {
      setOpenPoCount((poRes.data as PurchaseOrderRow[]).length);
    }

    setLoading(false);
  }, [showError]);

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  const kpis = useMemo(() => {
    const lowStock = products.filter((p) => p.available_stock < LOW_STOCK_THRESHOLD).length;
    const totalUnits = products.reduce((sum, p) => sum + Number(p.available_stock || 0), 0);
    return {
      skuCount: products.length,
      totalUnits,
      lowStock,
      reservedHint: openPoCount,
    };
  }, [products, openPoCount]);

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sku = manualSku.trim();
    if (!sku) return;

    const product = products.find((p) => p.sku.toLowerCase() === sku.toLowerCase());
    if (!product) {
      window.alert(`No product found for SKU ${sku}.`);
      return;
    }
    if (product.available_stock <= 0) {
      window.alert('Insufficient stock for dispatch.');
      return;
    }

    setScanSubmitting(true);
    const nextStock = product.available_stock - 1;
    const { error } = await supabase
      .from('products')
      .update({ available_stock: nextStock })
      .eq('id', product.id)
      .eq('vendor_id', DEFAULT_VENDOR_ID);

    setScanSubmitting(false);

    if (error) {
      showError(error.message);
      window.alert(`Error: ${error.message}`);
      return;
    }

    setLastScan(sku);
    showSuccess(`SKU ${sku} dispatched · stock now ${nextStock}.`);
    setManualSku('');
    setScannerOpen(false);
    await loadInventory();
  };

  return (
    <div className={vendorUi.page}>
      <VendorModuleHeader
        title="Inventory"
        description="Available & reserved stock, low-stock warnings, live product lines, and warehouse scanner."
      />
      <VendorFeedbackBanner feedback={feedback} />

      <section className={vendorUi.kpiGrid}>
        {[
          { label: 'Available SKUs', value: loading ? '…' : kpis.skuCount.toLocaleString('en-IN'), hint: 'Live sync' },
          { label: 'Units on hand', value: loading ? '…' : kpis.totalUnits.toLocaleString('en-IN'), hint: 'All warehouses' },
          { label: 'Low stock', value: loading ? '…' : String(kpis.lowStock), hint: `< ${LOW_STOCK_THRESHOLD} units` },
          { label: 'Open POs', value: loading ? '…' : String(kpis.reservedHint), hint: 'Reserved pipeline' },
        ].map((kpi) => (
          <div key={kpi.label} className={vendorClasses.cardMuted}>
            <p className="text-[10px] font-bold uppercase text-vendor-muted">{kpi.label}</p>
            <p className="mt-2 text-2xl font-black tabular-nums">{kpi.value}</p>
            <p className="text-xs text-vendor-muted">{kpi.hint}</p>
          </div>
        ))}
      </section>

      {loading ? (
        <p className="text-sm text-vendor-muted">Loading inventory…</p>
      ) : (
        <VendorDataTable<ProductRow>
          rows={products}
          rowKey={(p) => p.id}
          columns={[
            { key: 'sku', header: 'SKU', render: (p) => <span className="font-mono font-bold">{p.sku}</span> },
            { key: 'name', header: 'Product', render: (p) => p.name },
            { key: 'cat', header: 'Category', render: (p) => p.category },
            {
              key: 'stock',
              header: 'On hand',
              render: (p) => (
                <VendorStatusPill
                  label={String(p.available_stock)}
                  tone={p.available_stock < LOW_STOCK_THRESHOLD ? 'warning' : 'success'}
                />
              ),
            },
            { key: 'uom', header: 'UOM', render: (p) => p.unit_of_measure },
          ]}
        />
      )}

      <section className={`${vendorClasses.card} p-6 text-center`}>
        <QrCode className="mx-auto h-12 w-12 text-vendor-accent" aria-hidden />
        <p className="mt-2 text-sm font-bold">QR / barcode scanner</p>
        <p className="text-xs text-vendor-muted">Dispatch decrements live stock in Supabase</p>
        {lastScan ? <p className="mt-2 text-xs font-bold text-vendor-secondary">Last capture: {lastScan}</p> : null}
        <button type="button" onClick={() => setScannerOpen(true)} className={`mt-3 ${vendorClasses.btnPrimary}`}>
          Open scanner UI
        </button>
      </section>

      <VendorModal
        title="Scanner · stock & dispatch"
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        footer={
          <>
            <button type="button" onClick={() => setScannerOpen(false)} className={vendorClasses.btnGhost}>
              Close
            </button>
            <button
              type="submit"
              form="inv-scanner-form"
              disabled={scanSubmitting}
              className={vendorClasses.btnPrimary}
            >
              {scanSubmitting ? 'Updating…' : 'Confirm scan'}
            </button>
          </>
        }
      >
        <div className={vendorUi.scannerFrame}>
          <p className="text-xs font-bold">Camera preview (simulated)</p>
        </div>
        <form id="inv-scanner-form" onSubmit={(e) => void handleScanSubmit(e)} className="mt-4 space-y-2">
          <label className={vendorLabelClass} htmlFor="inv-sku">
            Manual SKU / barcode
          </label>
          <input
            id="inv-sku"
            className={vendorFieldClass}
            value={manualSku}
            onChange={(e) => setManualSku(e.target.value)}
            placeholder="NX-SKU-8842"
          />
        </form>
      </VendorModal>
    </div>
  );
}

export default InventoryWorkspace;
export { InventoryWorkspace };
