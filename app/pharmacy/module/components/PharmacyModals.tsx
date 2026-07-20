'use client';

import { SecureIdentityPlaceholder, inputClass, ModalOverlay } from './pharmacyUi';

export function DispenseMedicineModal({ onClose, onPrintLabel }: { onClose: () => void; onPrintLabel: () => void }) {
  return (
    <ModalOverlay title="Dispense Medicine" onClose={onClose} wide>
      <SecureIdentityPlaceholder verified />
      <input className={`${inputClass} mt-2`} placeholder="Prescription / RX number" defaultValue="RX-2026-11848" />
      <p className="mt-2 text-[10px] text-slate-600">ER Bundle — Adrenaline · NS 500mL · Hydrocortisone 100mg IV</p>
      <div className="mt-2 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-2">
        <p className="text-[8px] font-bold uppercase text-slate-500">FEFO Batch Selection</p>
        <p className="mt-1 font-mono text-[9px] text-emerald-700">ADR-7720-A · Exp 2026-09-15 · Qty 24</p>
      </div>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={onClose} className="flex-1 rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">
          Confirm Dispense
        </button>
        <button type="button" onClick={onPrintLabel} className="flex-1 rounded-md border border-[#E2E8F0] bg-white py-2 text-[10px] font-bold text-[#0F172A] hover:bg-slate-50">
          Print Label
        </button>
      </div>
    </ModalOverlay>
  );
}

export function SearchDrugModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Search Drug — Formulary Lookup" onClose={onClose} wide>
      <input className={inputClass} placeholder="Brand / generic / ATC code" defaultValue="Azithromycin" />
      <div className="mt-2 max-h-40 overflow-y-auto rounded-md border border-[#E2E8F0]">
        {[
          { name: 'Azithromycin 500mg Tab', stock: 'Out of Stock', alt: 'Doxycycline 100mg' },
          { name: 'Azithromycin 250mg Susp', stock: 'Available — 120 bottles', alt: 'Clarithromycin 125mg' },
        ].map((d) => (
          <div key={d.name} className="border-b border-slate-50 px-2 py-1.5 last:border-0">
            <p className="text-[10px] font-semibold">{d.name}</p>
            <p className="text-[8px] text-slate-500">Stock: {d.stock} · Alt: {d.alt}</p>
          </div>
        ))}
      </div>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">
        Select Drug
      </button>
    </ModalOverlay>
  );
}

export function PurchaseRequestModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Create Purchase Request" onClose={onClose} wide>
      <select className={`${inputClass} mb-2`}>
        <option>MedSupply India Pvt Ltd</option>
        <option>Apollo Pharma Distribution</option>
        <option>Cipla Healthcare Logistics</option>
      </select>
      <input className={inputClass} placeholder="Medicine & quantity" defaultValue="Azithromycin 500mg × 5000 tabs" />
      <input className={`${inputClass} mt-2`} type="number" placeholder="Estimated value (INR)" defaultValue="185000" />
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">
        Submit PR for Approval
      </button>
    </ModalOverlay>
  );
}

export function ReceiveStockModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Receive Stock — GRN Entry" onClose={onClose} wide>
      <input className={inputClass} placeholder="PO Reference" defaultValue="PO-2026-4415" />
      <input className={`${inputClass} mt-2`} placeholder="GRN Number" defaultValue="GRN-2026-8824" />
      <select className={`${inputClass} mt-2`}>
        <option>Pending QC</option>
        <option>Verified</option>
      </select>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-emerald-600 py-2 text-[10px] font-bold text-white">
        Log Goods Receipt
      </button>
    </ModalOverlay>
  );
}

export function TransferStockModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Transfer Stock Between Stores" onClose={onClose} wide>
      <select className={`${inputClass} mb-2`}>
        <option>Main Pharmacy → IPD Satellite</option>
        <option>Main Pharmacy → ER Crash Cart</option>
        <option>Cold Chain Store → Main Pharmacy</option>
      </select>
      <input className={inputClass} placeholder="Medicine & batch" defaultValue="Insulin Glargine — INS-5521-E" />
      <input className={`${inputClass} mt-2`} type="number" placeholder="Quantity" defaultValue="6" />
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">
        Initiate Transfer
      </button>
    </ModalOverlay>
  );
}

export function PrintInvoiceModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Print Pharmacy Invoice" onClose={onClose} wide>
      <SecureIdentityPlaceholder verified />
      <p className="mt-2 text-[10px] font-semibold">RX-2026-11835 — Vikram Patel</p>
      <div className="mt-2 space-y-1 rounded-md border border-[#E2E8F0] p-2 text-[9px]">
        <div className="flex justify-between"><span>Atorvastatin 20mg × 30</span><span>₹360</span></div>
        <div className="flex justify-between"><span>Metformin 500mg × 60</span><span>₹240</span></div>
        <div className="flex justify-between border-t border-slate-100 pt-1 font-bold"><span>Total</span><span>₹600</span></div>
      </div>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">
        Print Invoice
      </button>
    </ModalOverlay>
  );
}

export function PrintLabelModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Print Drug Label" onClose={onClose}>
      <div className="rounded-md border-2 border-dashed border-slate-300 bg-white p-4 text-center">
        <p className="text-[11px] font-bold text-[#0F172A]">Hydrocortisone 100mg IV</p>
        <p className="mt-1 text-[9px] text-slate-600">RX-2026-11848 · Meera Krishnan</p>
        <p className="mt-1 font-mono text-[8px] text-slate-500">Batch HYD-8841 · Exp 2027-01-20</p>
        <p className="mt-2 text-[8px] font-bold uppercase text-red-600">For Hospital Use Only</p>
      </div>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">
        Print Label
      </button>
    </ModalOverlay>
  );
}
