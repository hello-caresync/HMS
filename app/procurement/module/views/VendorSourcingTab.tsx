'use client';

import { useState } from 'react';
import { Building2, Gavel, Scale } from 'lucide-react';

import { MOCK_QUOTATIONS, MOCK_TENDERS, MOCK_VENDORS, formatCr, formatInr } from '../lib/procurementMockData';
import {
  ProcPanel,
  RfqPill,
  SecureVendorPlaceholder,
  StarRating,
  TenderPill,
} from '../components/procurementUi';

export default function VendorSourcingTab() {
  const [selectedRfq, setSelectedRfq] = useState(MOCK_QUOTATIONS[0].id);
  const rfq = MOCK_QUOTATIONS.find((q) => q.id === selectedRfq) ?? MOCK_QUOTATIONS[0];

  return (
    <div className="grid grid-cols-1 gap-2 xl:grid-cols-[2fr_3fr]">
      <div className="space-y-2">
        <ProcPanel title="Supplier & Catalogue Directory" subtitle="Vendor profiles · ratings · rate contracts · AMC tracking" icon={Building2} secure>
          <SecureVendorPlaceholder verified />
          <table className="mt-2 w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Vendor', 'Category', 'Rating', 'Catalogue', 'Contracts', 'Rate Contract', 'Docs'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_VENDORS.map((v) => (
                <tr key={v.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                  <td className="max-w-[100px] truncate px-1.5 py-1 text-[9px] font-semibold text-[#0F172A]" title={v.vendorName}>{v.vendorName}</td>
                  <td className="max-w-[80px] truncate px-1.5 py-1 text-[7px] text-slate-500" title={v.category}>{v.category}</td>
                  <td className="px-1.5 py-1"><StarRating rating={v.rating} /></td>
                  <td className="px-1.5 py-1 text-[9px] tabular-nums">{v.catalogueItems}</td>
                  <td className="px-1.5 py-1 text-[9px] font-bold tabular-nums text-[#2563EB]">{v.activeContracts}</td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-500">{v.rateContractExpiry}</td>
                  <td className="px-1.5 py-1 text-[8px] italic text-emerald-600">[Vendor Document Verified/Masked for Security]</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="mb-1 mt-3 text-[8px] font-bold uppercase text-slate-500">Annual Supply / AMC Contracts</p>
          <ul className="space-y-1">
            {MOCK_VENDORS.filter((v) => v.amcContract).map((v) => (
              <li key={v.id} className="flex items-center justify-between rounded border border-[#E2E8F0] px-2 py-1 text-[8px]">
                <span className="font-semibold">{v.vendorName}</span>
                <span className="text-slate-500">{v.amcContract}</span>
              </li>
            ))}
          </ul>
        </ProcPanel>
      </div>

      <div className="space-y-2">
        <ProcPanel
          title="RFQ — Quotation Comparison Matrix"
          subtitle="Price vs delivery speed · side-by-side vendor evaluation"
          icon={Scale}
          headerRight={
            <select
              value={selectedRfq}
              onChange={(e) => setSelectedRfq(e.target.value)}
              className="rounded border border-[#E2E8F0] px-1.5 py-0.5 text-[9px] focus:border-[#2563EB] focus:outline-none"
            >
              {MOCK_QUOTATIONS.map((q) => (
                <option key={q.id} value={q.id}>{q.rfqNumber}</option>
              ))}
            </select>
          }
        >
          <p className="mb-2 text-[10px] font-semibold text-[#0F172A]">{rfq.itemDescription}</p>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { vendor: rfq.vendorA, price: rfq.priceA, days: rfq.deliveryDaysA, label: 'Vendor A' },
              { vendor: rfq.vendorB, price: rfq.priceB, days: rfq.deliveryDaysB, label: 'Vendor B' },
              { vendor: rfq.vendorC, price: rfq.priceC, days: rfq.deliveryDaysC, label: 'Vendor C' },
            ].map(({ vendor, price, days, label }) => {
              const isRecommended = vendor === rfq.recommended;
              const isLowestPrice = price === Math.min(rfq.priceA, rfq.priceB, rfq.priceC);
              const isFastest = days === Math.min(rfq.deliveryDaysA, rfq.deliveryDaysB, rfq.deliveryDaysC);
              return (
                <div key={label} className={`rounded-md border p-2 ${isRecommended ? 'border-emerald-400 bg-emerald-50/50 ring-1 ring-emerald-200' : 'border-[#E2E8F0]'}`}>
                  <p className="text-[8px] font-bold uppercase text-slate-500">{label}</p>
                  <p className="mt-1 text-[9px] font-semibold text-[#0F172A]">{vendor}</p>
                  <p className={`mt-1 text-sm font-bold tabular-nums ${isLowestPrice ? 'text-emerald-600' : 'text-[#0F172A]'}`}>{formatInr(price)}</p>
                  <p className={`text-[9px] tabular-nums ${isFastest ? 'font-bold text-violet-600' : 'text-slate-500'}`}>{days} days delivery</p>
                  {isRecommended && <span className="mt-1 inline-block rounded bg-emerald-600 px-1 py-0.5 text-[7px] font-bold uppercase text-white">Recommended</span>}
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <RfqPill status={rfq.rfqStatus} />
            <span className="text-[8px] text-slate-500">RFQ {rfq.rfqNumber}</span>
          </div>
        </ProcPanel>

        <ProcPanel title="Tender Management — Capital Budget Selection" subtitle="Published · evaluation · award workflows" icon={Gavel}>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Tender ID', 'Title', 'Budget', 'Bids', 'Status', 'Closing', 'Leading Vendor'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_TENDERS.map((t) => (
                <tr key={t.id} className={`border-b border-slate-50 ${t.status === 'Evaluation' ? 'bg-violet-50/30' : ''}`}>
                  <td className="px-1.5 py-1 font-mono text-[8px] font-bold text-[#2563EB]">{t.tenderId}</td>
                  <td className="max-w-[140px] truncate px-1.5 py-1 text-[9px] font-semibold" title={t.title}>{t.title}</td>
                  <td className="px-1.5 py-1 text-[9px] font-bold tabular-nums">{formatCr(t.capitalBudget)}</td>
                  <td className="px-1.5 py-1 text-[9px] tabular-nums">{t.bidsReceived}</td>
                  <td className="px-1.5 py-1"><TenderPill status={t.status} /></td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-500">{t.closingDate}</td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-600">{t.leadingVendor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ProcPanel>
      </div>
    </div>
  );
}
