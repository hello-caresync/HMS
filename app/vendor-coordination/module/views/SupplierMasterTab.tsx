'use client';

import { useState } from 'react';
import { BookOpen, FileText, Scale } from 'lucide-react';

import {
  MOCK_CATALOGUE,
  MOCK_CONTRACT_ALERTS,
  MOCK_QUOTATION_ROUTES,
  MOCK_VENDOR_PROFILES,
  formatInr,
} from '../lib/vendorCoordinationMockData';
import {
  CategoryPill,
  SecureSupplierPlaceholder,
  StarRating,
  VrmPanel,
} from '../components/vendorCoordinationUi';

type SupplierMasterTabProps = {
  onOpenVendorDrawer: (vendorName: string, category: string, rating: number) => void;
};

export default function SupplierMasterTab({ onOpenVendorDrawer }: SupplierMasterTabProps) {
  const [selectedRfq, setSelectedRfq] = useState(MOCK_QUOTATION_ROUTES[0].id);
  const rfq = MOCK_QUOTATION_ROUTES.find((q) => q.id === selectedRfq) ?? MOCK_QUOTATION_ROUTES[0];

  return (
    <div className="grid grid-cols-1 gap-2 xl:grid-cols-[2fr_3fr]">
      <div className="space-y-2">
        <VrmPanel title="Profiles & Catalogues Vault" subtitle="Ratings · supply categories · contracts · MOQ · alternatives" icon={BookOpen} secure>
          <SecureSupplierPlaceholder verified />
          <table className="mt-2 w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Vendor', 'Category', 'Rating', 'Score', 'Catalogue', 'Contract', 'Docs'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_VENDOR_PROFILES.map((v) => (
                <tr key={v.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                  <td className="px-1.5 py-1">
                    <button type="button" onClick={() => onOpenVendorDrawer(v.vendorName, v.category, v.rating)} className="max-w-[100px] truncate text-[9px] font-semibold text-[#2563EB] hover:underline" title={v.vendorName}>
                      {v.vendorName}
                    </button>
                  </td>
                  <td className="px-1.5 py-1"><CategoryPill category={v.category} /></td>
                  <td className="px-1.5 py-1"><StarRating rating={v.rating} /></td>
                  <td className="px-1.5 py-1 text-[9px] font-bold tabular-nums text-[#2563EB]">{v.performanceScore}</td>
                  <td className="px-1.5 py-1 text-[8px] tabular-nums">{v.catalogueItems}</td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-500">{v.contractExpiry}</td>
                  <td className="px-1.5 py-1 text-[8px] italic text-emerald-600">[Supplier Documents Verified/Masked for Security]</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="mb-1 mt-3 text-[8px] font-bold uppercase text-slate-500">Unified Catalogue — MOQ & Alternatives</p>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Product', 'Vendor', 'MOQ', 'RC Price', 'Alternative'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_CATALOGUE.map((c) => (
                <tr key={c.id} className="border-b border-slate-50">
                  <td className="max-w-[100px] truncate px-1.5 py-1 text-[8px] font-semibold" title={c.productName}>{c.productName}</td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-600">{c.vendorName}</td>
                  <td className="px-1.5 py-1 text-[9px] tabular-nums">{c.moq} {c.unit}</td>
                  <td className="px-1.5 py-1 text-[9px] font-bold tabular-nums">{formatInr(c.rateContractPrice)}</td>
                  <td className="max-w-[90px] truncate px-1.5 py-1 text-[7px] text-slate-500" title={c.alternative}>{c.alternative ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </VrmPanel>
      </div>

      <div className="space-y-2">
        <VrmPanel
          title="RFQ — Quotation Comparison Analytics"
          subtitle="Price vs delivery speed vs quality scoring"
          icon={Scale}
          headerRight={
            <select value={selectedRfq} onChange={(e) => setSelectedRfq(e.target.value)} className="rounded border border-[#E2E8F0] px-1.5 py-0.5 text-[9px] focus:border-[#2563EB] focus:outline-none">
              {MOCK_QUOTATION_ROUTES.map((q) => (
                <option key={q.id} value={q.id}>{q.rfqNumber}</option>
              ))}
            </select>
          }
        >
          <p className="mb-2 text-[10px] font-semibold">{rfq.itemDescription}</p>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { vendor: rfq.vendorA, price: rfq.priceA, delivery: rfq.deliveryA, quality: rfq.qualityA, label: 'Vendor A' },
              { vendor: rfq.vendorB, price: rfq.priceB, delivery: rfq.deliveryB, quality: rfq.qualityB, label: 'Vendor B' },
            ].map(({ vendor, price, delivery, quality, label }) => {
              const isRec = vendor === rfq.recommended;
              return (
                <div key={label} className={`rounded-md border p-2 ${isRec ? 'border-emerald-400 bg-emerald-50/50 ring-1 ring-emerald-200' : 'border-[#E2E8F0]'}`}>
                  <p className="text-[8px] font-bold uppercase text-slate-500">{label}</p>
                  <p className="text-[9px] font-semibold">{vendor}</p>
                  <p className="text-sm font-bold tabular-nums text-[#0F172A]">{formatInr(price)}</p>
                  <p className="text-[8px] text-violet-600">{delivery} days · Quality {quality}/5</p>
                  {isRec && <span className="mt-1 inline-block rounded bg-emerald-600 px-1 py-0.5 text-[7px] font-bold uppercase text-white">Recommended</span>}
                </div>
              );
            })}
          </div>
        </VrmPanel>

        <VrmPanel title="Contract & Agreement Renewal Alerts" subtitle="Rate contracts · AMC · annual supply agreements" icon={FileText}>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Vendor', 'Contract', 'Expiry', 'Days Left', 'Annual Value'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_CONTRACT_ALERTS.map((c) => (
                <tr key={c.id} className={`border-b border-slate-50 ${c.daysRemaining <= 30 ? 'bg-amber-50/40' : ''}`}>
                  <td className="px-1.5 py-1 text-[9px] font-semibold">{c.vendorName}</td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-600">{c.contractType}</td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-500">{c.expiryDate}</td>
                  <td className={`px-1.5 py-1 text-[9px] font-bold tabular-nums ${c.daysRemaining <= 30 ? 'text-red-600' : 'text-amber-700'}`}>{c.daysRemaining}d</td>
                  <td className="px-1.5 py-1 text-[9px] font-bold tabular-nums">{formatInr(c.annualValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </VrmPanel>
      </div>
    </div>
  );
}
