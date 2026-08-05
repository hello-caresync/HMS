'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { EntityEmptyState } from '@/components/nexora-hospital/ui/EntityEmptyState';
import { Badge, ui } from '@/components/nexora-hospital/ui/primitives';
import { autoGeneratePoForLowStock, updateInventoryQuantity } from '@/lib/nexora-hospital/services/hospital-db';
import { useHospitalStore } from '@/lib/nexora-hospital/store';

type ModalTab = 'add' | 'issue';

export function InventoryWorkspace() {
  const inventory = useHospitalStore((s) => s.inventory);
  const [adjustId, setAdjustId] = useState<string | null>(null);
  const [modalTab, setModalTab] = useState<ModalTab>('add');
  const [quantity, setQuantity] = useState('50');
  const [busy, setBusy] = useState(false);

  const selectedItem = inventory.find((i) => i.id === adjustId);

  const openModal = (id: string, tab: ModalTab) => {
    setAdjustId(id);
    setModalTab(tab);
    setQuantity(tab === 'issue' ? '10' : '50');
  };

  const closeModal = () => {
    setAdjustId(null);
    setQuantity('50');
  };

  const handleSave = () => {
    if (!adjustId) return;
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      toast.error('Enter a valid quantity');
      return;
    }
    void (async () => {
      setBusy(true);
      const delta = modalTab === 'issue' ? -qty : qty;
      await updateInventoryQuantity(adjustId, delta);
      setBusy(false);
      toast.success(modalTab === 'issue' ? 'Item issued to department' : 'Stock updated successfully');
      closeModal();
    })();
  };

  return (
    <div className={ui.pageInner}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={ui.pageTitle}>Inventory</h1>
          <p className={ui.pageSubtitle}>Medicines & consumables · auto-reorder to Vendor app</p>
        </div>
        <button
          type="button"
          className={ui.btnPrimary}
          disabled={busy}
          onClick={() => {
            void (async () => {
              setBusy(true);
              const po = await autoGeneratePoForLowStock();
              setBusy(false);
              if (po) toast.success('Purchase request sent to vendor');
              else toast.info('No low-stock items or vendors configured');
            })();
          }}
        >
          {busy ? 'Generating…' : 'Trigger Purchase Request'}
        </button>
      </div>

      {inventory.length === 0 ? (
        <EntityEmptyState preset="inventory" />
      ) : (
      <div className={`${ui.card} overflow-x-auto`}>
        <table className={ui.table}>
          <thead>
            <tr>
              <th className={ui.th}>SKU</th>
              <th className={ui.th}>Item</th>
              <th className={ui.th}>Category</th>
              <th className={ui.th}>Stock</th>
              <th className={ui.th}>Unit Price</th>
              <th className={ui.th}>Status</th>
              <th className={ui.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => (
              <tr key={item.id}>
                <td className={ui.td}>{item.sku ?? '—'}</td>
                <td className={ui.td}>{item.itemName}</td>
                <td className={ui.td}>{item.category}</td>
                <td className={ui.td}>{item.quantityInStock}</td>
                <td className={ui.td}>₹{item.unitPrice}</td>
                <td className={ui.td}>
                  <Badge status={item.status} />
                </td>
                <td className={ui.td}>
                  <button type="button" className={ui.link} onClick={() => openModal(item.id, 'add')}>
                    Update Qty
                  </button>
                  <button type="button" className={`${ui.link} ml-3`} onClick={() => openModal(item.id, 'issue')}>
                    Issue
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {adjustId && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <button type="button" className="absolute inset-0" onClick={closeModal} aria-label="Close modal" />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-[#B2EBF2] bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-[#0A2E36]">Update Inventory Stock</h2>
            <p className="mt-1 text-sm text-[#005F6B]">{selectedItem.itemName}</p>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setModalTab('add')}
                className={modalTab === 'add' ? ui.tabActive : ui.tabInactive}
              >
                Add Stock
              </button>
              <button
                type="button"
                onClick={() => setModalTab('issue')}
                className={modalTab === 'issue' ? ui.tabActive : ui.tabInactive}
              >
                Issue Item
              </button>
            </div>

            <label className="mt-4 block">
              <span className={ui.label}>Quantity</span>
              <input
                className={`${ui.input} mt-1`}
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </label>

            <div className="mt-6 flex gap-3">
              <button type="button" className={`${ui.btnPrimary} flex-1`} disabled={busy} onClick={handleSave}>
                {busy ? 'Saving…' : 'Save'}
              </button>
              <button type="button" className={`${ui.btnSecondary} flex-1`} onClick={closeModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
