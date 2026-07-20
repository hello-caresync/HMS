'use client';

import { SecureVendorPlaceholder, inputClass, ModalOverlay } from './procurementUi';

export function CreatePrModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Create Purchase Request" onClose={onClose} wide>
      <select className={`${inputClass} mb-2`}><option>ICU</option><option>OT</option><option>Pharmacy</option><option>Emergency</option><option>Laboratory</option></select>
      <select className={`${inputClass} mb-2`}><option>Emergency</option><option>Critical</option><option>Normal</option></select>
      <input className={inputClass} placeholder="Items & quantities" defaultValue="Ceftriaxone 1g × 500 vials" />
      <input className={`${inputClass} mt-2`} type="date" defaultValue="2026-07-25" />
      <input className={`${inputClass} mt-2`} placeholder="Budget line" defaultValue="ICU Consumables FY26" />
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">Submit PR</button>
    </ModalOverlay>
  );
}

export function GeneratePoModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Generate Purchase Order" onClose={onClose} wide>
      <input className={inputClass} placeholder="PR Reference" defaultValue="PR-2026-5502" />
      <select className={`${inputClass} mt-2`}><option>MedSupply India Pvt Ltd</option><option>Apollo Pharma Distribution</option><option>Cipla Healthcare Logistics</option></select>
      <SecureVendorPlaceholder verified />
      <p className="mt-2 text-[10px] text-slate-600">Approved value: ₹4,85,000 · All 4 approval stages complete</p>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-violet-600 py-2 text-[10px] font-bold text-white">Generate PO & Send to Vendor</button>
    </ModalOverlay>
  );
}

export function ProcessRfqModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Process RFQ — Request for Quotation" onClose={onClose} wide>
      <input className={inputClass} placeholder="Item description" defaultValue="Norepinephrine 4mg/4mL × 200 ampoules" />
      <p className="mt-2 text-[9px] font-bold uppercase text-slate-500">Invite Vendors</p>
      {['MedSupply India Pvt Ltd', 'Apollo Pharma Distribution', 'Sun Pharma Wholesale'].map((v) => (
        <label key={v} className="mt-1 flex items-center gap-2 text-[10px]"><input type="checkbox" defaultChecked /> {v}</label>
      ))}
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">Publish RFQ</button>
    </ModalOverlay>
  );
}

export function UploadInvoiceModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Upload Vendor Invoice" onClose={onClose} wide>
      <SecureVendorPlaceholder verified />
      <input className={`${inputClass} mt-2`} placeholder="PO Reference" defaultValue="PO-2026-7798" />
      <input className={`${inputClass} mt-2`} placeholder="Invoice number" defaultValue="INV-MSI-8841" />
      <input className={`${inputClass} mt-2`} type="number" placeholder="Invoice amount (INR)" defaultValue="562000" />
      <div className="mt-2 rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-center text-[10px] text-slate-500">Drop invoice PDF or click to browse</div>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">Upload & Trigger 3-Way Match</button>
    </ModalOverlay>
  );
}

export function EmergencyPurchaseModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Initiate Emergency Purchase" onClose={onClose} critical wide>
      <p className="text-[11px] font-bold text-red-700">Emergency procurement — bypass standard approval for life-critical items only.</p>
      <select className={`${inputClass} mt-2`}><option>ICU — Vasopressors</option><option>ER — Crash Cart</option><option>OT — Blood Products</option></select>
      <input className={`${inputClass} mt-2`} placeholder="Justification" defaultValue="ICU norepinephrine stockout — patient on vasopressor support" />
      <SecureVendorPlaceholder verified />
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-red-600 py-2 text-[10px] font-bold text-white animate-pulse">Authorize Emergency PO</button>
    </ModalOverlay>
  );
}
