'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { HospitalOpsShell } from '@/components/hospital-operations/HospitalOpsShell';
import { hospitalOpsClasses } from '@/lib/hospital/design-tokens';
import { postHospitalApi, getOpsSupabase } from '@/lib/hospital/operations/client-api';
import { fetchInventoryItems } from '@/lib/hospital/operations/procurement';
import {
  dispensePrescription,
  fetchPendingPrescriptions,
} from '@/lib/hospital/operations/pharmacy';
import type { InventoryItemRow, PrescriptionRow } from '@/lib/hospital/operations/types';
import { useHospitalOpsRealtime } from '@/lib/hospital/operations/realtime';

export default function CentralPharmacyPage() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionRow[]>([]);
  const [inventory, setInventory] = useState<InventoryItemRow[]>([]);
  const [selectedRx, setSelectedRx] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

  const load = useCallback(async () => {
    const supabase = getOpsSupabase();
    const [rx, inv] = await Promise.all([
      fetchPendingPrescriptions(supabase),
      fetchInventoryItems(supabase),
    ]);
    setPrescriptions(rx);
    setInventory(inv);
  }, []);

  useHospitalOpsRealtime(load);
  useEffect(() => {
    void load();
  }, [load]);

  const dispense = async () => {
    if (!selectedRx || !selectedItem) {
      toast.error('Select prescription and inventory item');
      return;
    }
    try {
      await postHospitalApi(
        '/api/pharmacy/dispense',
        { prescriptionId: selectedRx, inventoryItemId: selectedItem, quantity: qty },
        () =>
          dispensePrescription(getOpsSupabase(), {
            prescriptionId: selectedRx,
            inventoryItemId: selectedItem,
            quantity: qty,
          }),
      );
      toast.success('Prescription dispensed — patient notified');
      setSelectedRx(null);
      setSelectedItem(null);
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Dispense failed');
    }
  };

  return (
    <HospitalOpsShell
      title="Central Pharmacy Workstation"
      subtitle="Ingest Doctor App prescriptions · validate stock · batch/expiry check · decrement inventory"
      actions={
        <button type="button" className={hospitalOpsClasses.btnPrimary} onClick={() => void dispense()}>
          Dispense Selected
        </button>
      }
    >
      <div className="grid lg:grid-cols-2 gap-4">
        <div className={`${hospitalOpsClasses.surface} p-4`}>
          <h2 className="text-sm font-black mb-3">Pending Prescriptions</h2>
          <div className="space-y-2 max-h-[480px] overflow-y-auto">
            {prescriptions.length === 0 ? (
              <p className="text-xs text-[#84A98C]">No pending prescriptions</p>
            ) : (
              prescriptions.map((rx, index) => {
                const rxKey = rx.id || `rx-${index}`;
                const meds = Array.isArray(rx.medications) ? rx.medications : [];
                return (
                  <button
                    key={rxKey}
                    type="button"
                    onClick={() => setSelectedRx(rx.id)}
                    className={`w-full text-left rounded-lg border p-3 transition ${
                      selectedRx === rx.id ? 'border-[#52796F] bg-[#F7F5EF]' : 'border-[#CAD2C5]'
                    }`}
                  >
                    <p className="text-sm font-black">{rx.patient_name ?? 'Patient'}</p>
                    <p className="text-[10px] text-[#52796F]">{rx.doctor_name ?? 'Doctor'}</p>
                    <p className="text-xs mt-1">{meds.length} medication(s)</p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className={`${hospitalOpsClasses.surface} p-4 space-y-3`}>
          <h2 className="text-sm font-black">Inventory (Stock Validation)</h2>
          <div className="space-y-2 max-h-[360px] overflow-y-auto">
            {inventory.map((item, index) => {
              const itemKey = item.id || item.sku || `inv-${index}`;
              const low = item.quantity_in_stock <= item.reorder_level;
              return (
                <button
                  key={itemKey}
                  type="button"
                  onClick={() => setSelectedItem(item.id)}
                  className={`w-full text-left rounded-lg border p-3 ${
                    selectedItem === item.id ? 'border-[#52796F] bg-[#F7F5EF]' : 'border-[#CAD2C5]'
                  }`}
                >
                  <div className="flex justify-between gap-2">
                    <p className="text-xs font-black">{item.item_name}</p>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${low ? hospitalOpsClasses.badgeWarning : hospitalOpsClasses.badgeDefault}`}>
                      {item.quantity_in_stock} in stock
                    </span>
                  </div>
                  <p className="text-[10px] text-[#52796F] mt-1">
                    Batch {item.batch_number ?? '—'} · Exp {item.expiry_date ?? '—'}
                  </p>
                </button>
              );
            })}
          </div>
          <label className="text-[10px] font-black uppercase text-[#52796F]">Dispense Qty</label>
          <input
            type="number"
            min={1}
            className={hospitalOpsClasses.input}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value) || 1)}
          />
        </div>
      </div>
    </HospitalOpsShell>
  );
}
