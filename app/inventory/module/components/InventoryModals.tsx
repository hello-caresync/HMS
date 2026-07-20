'use client';

import { SecureIdentityPlaceholder, inputClass, ModalOverlay } from './inventoryUi';

export function RegisterItemModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Register New Item — Item Master" onClose={onClose} wide>
      <input className={inputClass} placeholder="Item code" defaultValue="MED-NEW-001" />
      <input className={`${inputClass} mt-2`} placeholder="Item name" defaultValue="Ceftriaxone 1g Injection" />
      <select className={`${inputClass} mt-2`}>
        <option>Medicine</option>
        <option>Surgical Consumable</option>
        <option>Implant</option>
        <option>Medical Equipment</option>
      </select>
      <select className={`${inputClass} mt-2`}>
        <option>Ambient</option>
        <option>Cold Chain 2-8°C</option>
        <option>Controlled Room</option>
      </select>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">
        Register Item
      </button>
    </ModalOverlay>
  );
}

export function CreatePurchaseRequestModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Create Purchase Request" onClose={onClose} wide>
      <select className={`${inputClass} mb-2`}>
        <option>ICU</option>
        <option>OT</option>
        <option>Pharmacy</option>
        <option>Laboratory</option>
        <option>Emergency</option>
      </select>
      <select className={`${inputClass} mb-2`}>
        <option>Emergency</option>
        <option>High</option>
        <option>Normal</option>
      </select>
      <input className={inputClass} placeholder="Items & quantities" defaultValue="Ceftriaxone 1g × 500 vials" />
      <SecureIdentityPlaceholder verified />
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">
        Submit PR
      </button>
    </ModalOverlay>
  );
}

export function GeneratePoModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Generate Purchase Order" onClose={onClose} wide>
      <input className={inputClass} placeholder="PR Reference" defaultValue="PR-2026-4410" />
      <select className={`${inputClass} mt-2`}>
        <option>MedSupply India Pvt Ltd</option>
        <option>Apollo Pharma Distribution</option>
        <option>Cipla Healthcare Logistics</option>
      </select>
      <p className="mt-2 text-[10px] text-slate-600">Total value: ₹4,28,000 · Items: Azithromycin + Insulin Glargine</p>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-emerald-600 py-2 text-[10px] font-bold text-white">
        Generate & Send PO
      </button>
    </ModalOverlay>
  );
}

export function LogGrnModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Log Goods Receipt Note (GRN)" onClose={onClose} wide>
      <SecureIdentityPlaceholder verified />
      <input className={`${inputClass} mt-2`} placeholder="PO Reference" defaultValue="PO-2026-7792" />
      <input className={`${inputClass} mt-2`} placeholder="Batch number" defaultValue="GLV-7720-B" />
      <input className={`${inputClass} mt-2`} type="date" defaultValue="2028-03-01" />
      <div className="mt-2 grid grid-cols-2 gap-2">
        <input className={inputClass} type="number" placeholder="Qty ordered" defaultValue="2000" />
        <input className={inputClass} type="number" placeholder="Qty received" defaultValue="1980" />
      </div>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">
        Log GRN & Trigger QC
      </button>
    </ModalOverlay>
  );
}

export function IssueStockModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Issue Stock to Department" onClose={onClose} wide>
      <select className={`${inputClass} mb-2`}>
        <option>ICU Store</option>
        <option>OT Store</option>
        <option>Emergency Store</option>
      </select>
      <input className={inputClass} placeholder="Item code / batch" defaultValue="MED-NOR-004 · NOR-8841-A" />
      <input className={`${inputClass} mt-2`} type="number" placeholder="Quantity" defaultValue="24" />
      <SecureIdentityPlaceholder verified />
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">
        Confirm Issue
      </button>
    </ModalOverlay>
  );
}

export function TransferStockModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Transfer Stock Between Stores" onClose={onClose} wide>
      <select className={`${inputClass} mb-2`}>
        <option>Main Store → Pharmacy Store</option>
        <option>Main Store → ICU Store</option>
        <option>OT Store → Emergency Store</option>
      </select>
      <input className={inputClass} placeholder="Item & batch" defaultValue="Amoxicillin 500mg · AMX-8841-A" />
      <input className={`${inputClass} mt-2`} type="number" placeholder="Quantity" defaultValue="200" />
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-violet-600 py-2 text-[10px] font-bold text-white">
        Initiate Transfer — In Transit
      </button>
    </ModalOverlay>
  );
}
