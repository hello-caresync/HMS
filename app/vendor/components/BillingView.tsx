'use client';
import React from 'react';

interface BillingViewProps {
  invoicesList: any[];
}

export default function BillingView({ invoicesList }: BillingViewProps) {
  return (
    <div className="space-y-4 animate-fadeIn">
      {invoicesList.map((inv) => (
        <div key={inv.invoiceId} className="bg-[#EBF1F1] border border-[#CBD6D6] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-start border-b border-[#CBD6D6] pb-3">
            <div>
              <span className="text-xs font-mono font-black text-white bg-slate-950 px-2 py-0.5 rounded">{inv.invoiceId}</span>
              <div className="text-xs text-slate-800 font-bold mt-1.5">Linked PO: <span className="text-slate-900 font-mono">{inv.poReference}</span></div>
            </div>
            <span className="text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded">{inv.reviewStatus}</span>
          </div>
          <div className="bg-white border border-[#CBD6D6] rounded-xl p-4 space-y-2 text-xs font-bold text-slate-800">
            <div className="flex justify-between"><span>Base Taxable Valuation:</span><span className="text-slate-900 font-mono">₹{inv.amountBeforeTax}</span></div>
            <div className="flex justify-between text-slate-800"><span>Central GST (CGST 9%):</span><span className="text-slate-800 font-mono">₹{inv.cgst}</span></div>
            <div className="flex justify-between text-slate-800"><span>State GST (SGST 9%):</span><span className="text-slate-800 font-mono">₹{inv.sgst}</span></div>
            <div className="flex justify-between border-t border-dashed border-slate-200 pt-2.5 text-slate-950 text-sm font-black">
              <span>Net Payable Balance:</span><span className="font-mono text-[#4A5D5E] text-base">₹{inv.totalPayable}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}