'use client';

import type { BillingPackage } from '../lib/billingMockData';
import { BILLING_PACKAGES } from '../lib/billingMockData';
import { SecureFinancialPlaceholder, inputClass, ModalOverlay } from './billingUi';
import { formatInr } from '../lib/billingMockData';

export function GenerateInvoiceModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Generate Invoice" onClose={onClose} wide>
      <input className={inputClass} placeholder="Patient UHID" defaultValue="NX-2026-000415" />
      <select className={`${inputClass} mt-2`}><option>OPD Consultation</option><option>IPD Consolidated</option><option>Emergency Quick Bill</option></select>
      <SecureFinancialPlaceholder verified />
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">Generate Invoice</button>
    </ModalOverlay>
  );
}

export function CollectPaymentModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Collect Payment" onClose={onClose} wide>
      <p className="text-[10px] font-semibold">INV-2026-44201 — Rahul Sharma · Balance ₹18,400</p>
      <input className={`${inputClass} mt-2`} type="number" placeholder="Amount" defaultValue="18400" />
      <select className={`${inputClass} mt-2`}><option>UPI</option><option>Card</option><option>Cash</option><option>Corporate Credit</option></select>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-emerald-600 py-2 text-[10px] font-bold text-white">Record Payment</button>
    </ModalOverlay>
  );
}

export function ApproveDiscountModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Approve Discount" onClose={onClose} wide>
      <input className={inputClass} placeholder="Invoice" defaultValue="INV-2026-44215" />
      <input className={`${inputClass} mt-2`} type="number" placeholder="Discount %" defaultValue="10" />
      <input className={`${inputClass} mt-2`} placeholder="Authorization reason" defaultValue="Senior citizen concession — policy SC-2026" />
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">Approve Discount</button>
    </ModalOverlay>
  );
}

export function ProcessRefundModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Process Refund" onClose={onClose} critical wide>
      <SecureFinancialPlaceholder verified />
      <input className={`${inputClass} mt-2`} placeholder="Receipt reference" defaultValue="RCP-2026-88105" />
      <input className={`${inputClass} mt-2`} type="number" placeholder="Refund amount" defaultValue="5000" />
      <p className="mt-2 text-[9px] text-red-600">Requires supervisor approval for refunds &gt; ₹5,000</p>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-red-600 py-2 text-[10px] font-bold text-white">Submit Refund Request</button>
    </ModalOverlay>
  );
}

export function UpdateChargeMasterModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Update Charge Master" onClose={onClose} wide>
      <input className={inputClass} placeholder="Service code" defaultValue="SRV-OT-SUT-3-0" />
      <input className={`${inputClass} mt-2`} placeholder="Description" defaultValue="Ethicon Vicryl Suture 3-0" />
      <input className={`${inputClass} mt-2`} type="number" placeholder="Rate (INR)" defaultValue="850" />
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">Update Charge</button>
    </ModalOverlay>
  );
}

export function DailyClosingModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Run Daily Closing" onClose={onClose} wide>
      <div className="space-y-1 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-2 text-[10px]">
        <div className="flex justify-between"><span>Cash collected</span><span className="font-bold">{formatInr(420000)}</span></div>
        <div className="flex justify-between"><span>Card / UPI</span><span className="font-bold">{formatInr(1280000)}</span></div>
        <div className="flex justify-between"><span>Corporate credit</span><span className="font-bold">{formatInr(142000)}</span></div>
        <div className="flex justify-between border-t border-slate-200 pt-1 font-bold"><span>Total</span><span>{formatInr(1842000)}</span></div>
      </div>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#0F172A] py-2 text-[10px] font-bold text-white">Finalize Daily Closing</button>
    </ModalOverlay>
  );
}

export function SelectPackageModal({ onClose, onSelect }: { onClose: () => void; onSelect: (pkg: BillingPackage) => void }) {
  return (
    <ModalOverlay title="Select Billing Package" onClose={onClose} wide>
      <p className="mb-2 text-[9px] text-slate-500">Apply pre-negotiated package rates to patient bill</p>
      <div className="max-h-64 space-y-2 overflow-y-auto">
        {BILLING_PACKAGES.map((pkg) => (
          <button
            key={pkg.id}
            type="button"
            onClick={() => { onSelect(pkg); onClose(); }}
            className="w-full rounded-md border border-[#E2E8F0] p-2 text-left hover:border-[#2563EB] hover:bg-blue-50/50"
          >
            <p className="text-[10px] font-bold text-[#0F172A]">{pkg.name}</p>
            <p className="mt-0.5 text-[8px] text-slate-500">{pkg.includes}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#2563EB]">{formatInr(pkg.price)}</span>
              <span className="text-[8px] font-bold text-emerald-600">Save {formatInr(pkg.savings)}</span>
            </div>
          </button>
        ))}
      </div>
    </ModalOverlay>
  );
}
