'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { EntityEmptyState } from '@/components/nexora-hospital/ui/EntityEmptyState';
import { Badge, Modal, ui } from '@/components/nexora-hospital/ui/primitives';
import { createPurchaseOrder, receiveDelivery } from '@/lib/nexora-hospital/services/hospital-db';
import { useHospitalStore } from '@/lib/nexora-hospital/store';

export function VendorsWorkspace() {
  const vendors = useHospitalStore((s) => s.vendors);
  const purchaseOrders = useHospitalStore((s) => s.purchaseOrders);
  const [showPo, setShowPo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ vendorId: '', itemDetails: '', totalCost: 10000 });

  return (
    <div className={ui.pageInner}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={ui.pageTitle}>Vendors</h1>
          <p className={ui.pageSubtitle}>Purchase orders · deliveries · Vendor app sync</p>
        </div>
        <button type="button" className={ui.btnPrimary} onClick={() => setShowPo(true)}>
          Generate PO
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={ui.card}>
          <h2 className={ui.sectionTitle}>Vendor Directory</h2>
          <ul className="mt-4 space-y-3">
            {vendors.length === 0 ? (
              <li><EntityEmptyState preset="vendors" onAction={() => setShowPo(true)} /></li>
            ) : (
            vendors.map((v) => (
              <li key={v.id} className="rounded-xl border border-[#B2EBF2] bg-white p-4">
                <p className="text-base font-bold text-[#0A2E36]">{v.companyName}</p>
                <p className="mt-1 text-sm text-[#0A2E36]">
                  {v.contactPerson} · <span className="font-medium">{v.email}</span>
                </p>
                <p className="mt-1 text-sm font-bold text-[#007B8A]">★ {v.rating.toFixed(1)}</p>
              </li>
            ))
            )}
          </ul>
        </section>

        <section className={`${ui.card} overflow-x-auto`}>
          <h2 className={ui.sectionTitle}>Purchase Orders</h2>
          <table className={`${ui.table} mt-4`}>
            <thead>
              <tr>
                <th className={ui.th}>Vendor</th>
                <th className={ui.th}>Items</th>
                <th className={ui.th}>Cost</th>
                <th className={ui.th}>Status</th>
                <th className={ui.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className={ui.td}>
                    <EntityEmptyState preset="purchaseOrders" onAction={() => setShowPo(true)} />
                  </td>
                </tr>
              ) : (
              purchaseOrders.map((po) => (
                <tr key={po.id}>
                  <td className={ui.td}>{po.vendorName}</td>
                  <td className={ui.td}>{po.itemDetails}</td>
                  <td className={ui.td}>₹{po.totalCost.toLocaleString('en-IN')}</td>
                  <td className={ui.td}>
                    <Badge status={po.status} />
                  </td>
                  <td className={ui.td}>
                    {po.status === 'Issued' && (
                      <button type="button" className={ui.link} onClick={() => toast.success('PO approved · sent to Vendor app')}>
                        Approve
                      </button>
                    )}
                    {po.status !== 'Delivered' && (
                      <button
                        type="button"
                        className={`${ui.link} ml-3`}
                        onClick={() => void receiveDelivery(po.id).then(() => toast.success('Delivery received'))}
                      >
                        Receive
                      </button>
                    )}
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </section>
      </div>

      <Modal open={showPo} title="Generate Purchase Order" onClose={() => setShowPo(false)}>
        <div className="space-y-3">
          <select className={ui.select} value={form.vendorId} onChange={(e) => setForm({ ...form, vendorId: e.target.value })}>
            <option value="">Select vendor</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.companyName}
              </option>
            ))}
          </select>
          <input
            className={ui.input}
            placeholder="Item details"
            value={form.itemDetails}
            onChange={(e) => setForm({ ...form, itemDetails: e.target.value })}
          />
          <input
            className={ui.input}
            type="number"
            placeholder="Total cost"
            value={form.totalCost}
            onChange={(e) => setForm({ ...form, totalCost: Number(e.target.value) })}
          />
          <button
            type="button"
            disabled={busy || !form.vendorId || !form.itemDetails}
            className={ui.btnPrimary}
            onClick={() => {
              const v = vendors.find((x) => x.id === form.vendorId);
              if (!v) return;
              void (async () => {
                setBusy(true);
                await createPurchaseOrder({
                  vendorId: v.id,
                  vendorName: v.companyName,
                  itemDetails: form.itemDetails,
                  totalCost: form.totalCost,
                });
                setBusy(false);
                toast.success('PO issued to vendor');
                setShowPo(false);
              })();
            }}
          >
            {busy ? 'Issuing…' : 'Issue PO'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
