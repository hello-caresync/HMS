'use client';

import { Truck } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { LiveRouteMap } from '@/components/vendor/ui/LiveRouteMap';
import { VendorFeedbackBanner, useVendorFeedback } from '@/components/vendor/ui/useVendorFeedback';
import { VendorModuleHeader, VendorStatusPill } from '@/components/vendor/ui/VendorModuleHeader';
import { vendorFieldClass, vendorLabelClass, VendorModal } from '@/components/vendor/ui/VendorModal';
import { vendorClasses } from '@/lib/vendor/theme';
import { supabase } from '@/lib/supabaseClient';
import { MOCK_SHIPMENTS } from '@/lib/vendor/mock/data';
import { DEFAULT_VENDOR_ID } from '@/lib/vendor-supabase/constants';
import type { PurchaseOrderRow } from '@/lib/vendor-supabase/types';

type ShipmentForm = {
  po_id: string;
  carrier_name: string;
  tracking_number: string;
  driver_contact: string;
};

const emptyShipment: ShipmentForm = {
  po_id: '',
  carrier_name: '',
  tracking_number: '',
  driver_contact: '',
};

type PodForm = {
  shipmentId: string;
  signerName: string;
  notes: string;
  fileName: string;
};

function DeliveriesWorkspace() {
  const { feedback, showSuccess, showError } = useVendorFeedback();
  const [podCaptured, setPodCaptured] = useState<Record<string, boolean>>({});
  const [shipmentOpen, setShipmentOpen] = useState(false);
  const [podOpen, setPodOpen] = useState(false);
  const [podForm, setPodForm] = useState<PodForm>({ shipmentId: '', signerName: '', notes: '', fileName: '' });
  const [form, setForm] = useState<ShipmentForm>(emptyShipment);
  const [orders, setOrders] = useState<PurchaseOrderRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadOrders = useCallback(async () => {
    const { data } = await supabase
      .from('purchase_orders')
      .select('id, po_number, status')
      .eq('vendor_id', DEFAULT_VENDOR_ID)
      .in('status', ['ACCEPTED', 'PARTIAL'])
      .order('created_at', { ascending: false });
    setOrders((data as PurchaseOrderRow[]) ?? []);
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const openShipment = () => {
    setForm({ ...emptyShipment, po_id: orders[0]?.id ?? '' });
    setShipmentOpen(true);
  };

  const openPod = (shipmentId: string) => {
    setPodForm({ shipmentId, signerName: '', notes: '', fileName: '' });
    setPodOpen(true);
  };

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.po_id) {
      window.alert('Select a purchase order.');
      return;
    }
    setIsSubmitting(true);
    const { error } = await supabase.from('shipments').insert([
      {
        po_id: form.po_id,
        tracking_number: form.tracking_number.trim(),
        carrier_name: form.carrier_name.trim(),
        driver_contact: form.driver_contact.trim(),
        status: 'DISPATCHED',
        dispatched_at: new Date().toISOString(),
      },
    ]);
    setIsSubmitting(false);
    if (error) {
      showError(error.message);
      return;
    }
    showSuccess('Shipment created and marked DISPATCHED.');
    setShipmentOpen(false);
    setForm(emptyShipment);
  };

  const handlePodSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!podForm.signerName.trim()) {
      window.alert('Enter recipient name or capture signature label.');
      return;
    }
    setPodCaptured((p) => ({ ...p, [podForm.shipmentId]: true }));
    showSuccess(`Proof of delivery saved${podForm.fileName ? ` · ${podForm.fileName}` : ''}.`);
    setPodOpen(false);
  };

  return (
    <div className="space-y-6">
      <VendorModuleHeader
        title="Deliveries & Logistics"
        description="Dispatch feed, live route tracking, proof of delivery, fleet allocation."
        actions={
          <button type="button" onClick={openShipment} className={vendorClasses.btnSecondary}>
            Create shipment
          </button>
        }
      />

      <VendorFeedbackBanner feedback={feedback} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {MOCK_SHIPMENTS.map((sh, index) => (
          <article key={sh.id} className={`${vendorClasses.card} p-5`}>
            <div className="flex items-center justify-between">
              <p className="font-mono text-sm font-black">{sh.trackingId}</p>
              <VendorStatusPill label={sh.status} tone={sh.status === 'In Transit' ? 'info' : 'neutral'} />
            </div>
            <p className="mt-2 text-xs text-vendor-muted">
              PO {sh.poId} · ETA {sh.eta}
            </p>
            <p className="mt-1 flex items-center gap-1 text-xs font-bold">
              <Truck className="h-3.5 w-3.5" aria-hidden />
              {sh.driverName ?? 'R. Kumar'} · {sh.vehicleId ?? 'KA-01-AB-4421'}
            </p>

            <div className="mt-4">
              <LiveRouteMap
                progressPct={index === 0 ? 68 : 42}
                driverName={sh.driverName ?? 'R. Kumar'}
                origin="MedSupply Warehouse · BLR"
                destination="Nexora City Hospital"
              />
            </div>

            <button
              type="button"
              onClick={() => openPod(sh.id)}
              className={`mt-3 ${vendorClasses.btnGhost}`}
            >
              {podCaptured[sh.id] || sh.podCaptured ? 'PoD captured ✓' : 'Upload PoD · signature / photo'}
            </button>
          </article>
        ))}
      </div>

      <VendorModal
        title="Create shipment"
        open={shipmentOpen}
        onClose={() => setShipmentOpen(false)}
        footer={
          <>
            <button type="button" onClick={() => setShipmentOpen(false)} className={vendorClasses.btnGhost}>
              Cancel
            </button>
            <button
              type="submit"
              form="create-shipment-form"
              disabled={isSubmitting}
              className={vendorClasses.btnSecondary}
            >
              {isSubmitting ? 'Creating…' : 'Dispatch shipment'}
            </button>
          </>
        }
      >
        <form id="create-shipment-form" onSubmit={(e) => void handleCreateShipment(e)} className="space-y-3">
          <label className={vendorLabelClass}>
            Purchase order
            <select
              required
              value={form.po_id}
              onChange={(e) => setForm((f) => ({ ...f, po_id: e.target.value }))}
              className={vendorFieldClass}
            >
              <option value="">Select PO…</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.po_number}
                </option>
              ))}
            </select>
          </label>
          <label className={vendorLabelClass}>
            Carrier name
            <input
              required
              value={form.carrier_name}
              onChange={(e) => setForm((f) => ({ ...f, carrier_name: e.target.value }))}
              className={vendorFieldClass}
            />
          </label>
          <label className={vendorLabelClass}>
            Tracking number
            <input
              required
              value={form.tracking_number}
              onChange={(e) => setForm((f) => ({ ...f, tracking_number: e.target.value }))}
              className={vendorFieldClass}
            />
          </label>
          <label className={vendorLabelClass}>
            Driver contact
            <input
              required
              value={form.driver_contact}
              onChange={(e) => setForm((f) => ({ ...f, driver_contact: e.target.value }))}
              className={vendorFieldClass}
            />
          </label>
        </form>
      </VendorModal>

      <VendorModal
        title="Proof of delivery"
        open={podOpen}
        onClose={() => setPodOpen(false)}
        footer={
          <>
            <button type="button" onClick={() => setPodOpen(false)} className={vendorClasses.btnGhost}>
              Cancel
            </button>
            <button type="submit" form="pod-form" className={vendorClasses.btnPrimary}>
              Save PoD
            </button>
          </>
        }
      >
        <form id="pod-form" onSubmit={handlePodSubmit} className="space-y-3">
          <div className="rounded-xl border border-vendor-accent/30 bg-vendor-cream p-4 text-center">
            <p className="text-xs font-bold text-vendor-muted">Signature canvas (simulated)</p>
            <div className="mt-2 h-24 rounded-lg border border-dashed border-vendor-accent/40 bg-white font-serif text-3xl italic text-vendor-charcoal">
              {podForm.signerName || 'Sign here'}
            </div>
          </div>
          <label className={vendorLabelClass}>
            Recipient / signatory name
            <input
              required
              value={podForm.signerName}
              onChange={(e) => setPodForm((f) => ({ ...f, signerName: e.target.value }))}
              className={vendorFieldClass}
            />
          </label>
          <label className={vendorLabelClass}>
            Delivery notes
            <textarea
              rows={2}
              value={podForm.notes}
              onChange={(e) => setPodForm((f) => ({ ...f, notes: e.target.value }))}
              className={vendorFieldClass}
            />
          </label>
          <label className={vendorLabelClass}>
            Photo / PDF attachment
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) =>
                setPodForm((f) => ({ ...f, fileName: e.target.files?.[0]?.name ?? '' }))
              }
              className={vendorFieldClass}
            />
          </label>
        </form>
      </VendorModal>
    </div>
  );
}

export default DeliveriesWorkspace;
export { DeliveriesWorkspace };
