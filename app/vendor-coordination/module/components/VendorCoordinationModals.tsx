'use client';

import { SecureSupplierPlaceholder, inputClass, ModalOverlay } from './vendorCoordinationUi';

export function AddVendorModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Add New Vendor — Registration" onClose={onClose} wide>
      <input className={inputClass} placeholder="Vendor legal name" defaultValue="BioMed Solutions India" />
      <select className={`${inputClass} mt-2`}><option>Equipment</option><option>Medicines</option><option>Surgical Items</option><option>Implants</option></select>
      <input className={`${inputClass} mt-2`} placeholder="Primary contact" defaultValue="Rajesh Mehta — Procurement Lead" />
      <SecureSupplierPlaceholder />
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">Submit Registration</button>
    </ModalOverlay>
  );
}

export function ProcessApprovalModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Process Vendor Approval" onClose={onClose} wide>
      <p className="text-[10px] font-semibold">BioMed Solutions India — VON-2026-881</p>
      <SecureSupplierPlaceholder verified />
      <select className={`${inputClass} mt-2`}><option>Approve — Advance to Activated</option><option>Return — Request additional documents</option><option>Reject — Quality review failed</option></select>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-emerald-600 py-2 text-[10px] font-bold text-white">Confirm Decision</button>
    </ModalOverlay>
  );
}

export function OpenChatModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Vendor Communication — Secure Chat" onClose={onClose} wide>
      <p className="text-[10px] text-slate-600">PO-2026-7788 · MedSupply India Pvt Ltd</p>
      <div className="mt-2 max-h-40 space-y-2 overflow-y-auto rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-2">
        <div className="rounded bg-white px-2 py-1 text-[9px]"><span className="font-bold">Hospital:</span> PO-7788 delivery ETA required — ICU critical stock</div>
        <div className="rounded bg-blue-50 px-2 py-1 text-[9px]"><span className="font-bold">Vendor:</span> Dispatch confirmed · TRK-MSI-6633 · ETA 2026-07-19</div>
      </div>
      <input className={`${inputClass} mt-2`} placeholder="Type message…" />
      <button type="button" onClick={onClose} className="mt-2 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">Send Message</button>
    </ModalOverlay>
  );
}

export function IssueRfqModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Issue RFQ to Vendors" onClose={onClose} wide>
      <input className={inputClass} placeholder="Item description" defaultValue="Norepinephrine 4mg/4mL × 200 ampoules" />
      {['MedSupply India', 'Apollo Pharma', 'Cipla Healthcare'].map((v) => (
        <label key={v} className="mt-1 flex items-center gap-2 text-[10px]"><input type="checkbox" defaultChecked /> {v}</label>
      ))}
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">Send RFQ</button>
    </ModalOverlay>
  );
}

export function DispatchPoModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Dispatch Purchase Order" onClose={onClose} wide>
      <input className={inputClass} placeholder="PO Number" defaultValue="PO-2026-7805" />
      <select className={`${inputClass} mt-2`}><option>MedSupply India Pvt Ltd</option><option>Apollo Pharma Distribution</option></select>
      <SecureSupplierPlaceholder verified />
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-violet-600 py-2 text-[10px] font-bold text-white">Dispatch PO to Vendor Portal</button>
    </ModalOverlay>
  );
}

export function TrackShipmentModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Track Shipment" onClose={onClose} wide>
      <input className={inputClass} placeholder="Tracking reference" defaultValue="TRK-MSI-6633" />
      <div className="mt-2 space-y-1">
        {['Order Confirmed', 'Packed', 'Dispatched', 'In Transit', 'Delivered'].map((s, i) => (
          <div key={s} className={`flex items-center gap-2 rounded px-2 py-1 text-[9px] ${i <= 3 ? 'bg-violet-50 font-semibold text-violet-800' : 'text-slate-400'}`}>
            <span className={`h-2 w-2 rounded-full ${i <= 3 ? 'bg-violet-500' : 'bg-slate-300'}`} />
            {s}
          </div>
        ))}
      </div>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">Close</button>
    </ModalOverlay>
  );
}

export function LogComplaintModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Log Vendor Complaint" onClose={onClose} critical wide>
      <select className={`${inputClass} mb-2`}><option>Late Delivery</option><option>Quality Issue</option><option>Invoice Discrepancy</option><option>License Non-Compliance</option></select>
      <select className={inputClass}><option>MedSupply India Pvt Ltd</option><option>Apollo Pharma Distribution</option></select>
      <textarea className={`${inputClass} mt-2 min-h-[60px]`} placeholder="Complaint details" defaultValue="PO-7788 — 24hr SLA breached · ICU stockout risk" />
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-red-600 py-2 text-[10px] font-bold text-white">Log Complaint</button>
    </ModalOverlay>
  );
}
