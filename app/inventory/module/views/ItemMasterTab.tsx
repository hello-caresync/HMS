'use client';

import { useState } from 'react';
import { AlertTriangle, Layers, Search, Warehouse } from 'lucide-react';

import {
  MOCK_BATCH_EXPIRY,
  MOCK_ITEM_MASTER,
  MOCK_RECALL_IMPACTS,
  MOCK_STORE_ALLOCATIONS,
} from '../lib/inventoryMockData';
import {
  BarcodePill,
  CategoryPill,
  CriticalityPill,
  InvPanel,
  RecallAlertBanner,
  StockStatusPill,
} from '../components/inventoryUi';

export default function ItemMasterTab() {
  const [recallBatch, setRecallBatch] = useState('RAN-3300-G');
  const recallActive = MOCK_BATCH_EXPIRY.filter((b) => b.recallActive).length;
  const impacts = MOCK_RECALL_IMPACTS.filter((r) => r.batchNumber === recallBatch);
  const fefoSorted = [...MOCK_BATCH_EXPIRY].sort((a, b) => a.fefoRank - b.fefoRank || a.daysToExpiry - b.daysToExpiry);

  return (
    <div className="space-y-2">
      <RecallAlertBanner count={recallActive} />

      <InvPanel title="Item Master & Stock Monitoring Directory" subtitle="Medicines · consumables · implants · equipment · barcode · storage · criticality" icon={Layers}>
        <table className="w-full min-w-[920px] text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['Code', 'Item Name', 'Category', 'Barcode', 'Storage', 'Criticality', 'Stock', 'Reorder', 'Status'].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_ITEM_MASTER.map((item) => (
              <tr key={item.id} className={`border-b border-slate-50 hover:bg-slate-50/80 ${item.status === 'Out of Stock' ? 'bg-red-50/40' : item.status === 'Low Stock' ? 'bg-amber-50/30' : ''}`}>
                <td className="px-1.5 py-1 font-mono text-[8px] font-bold text-[#2563EB]">{item.itemCode}</td>
                <td className="max-w-[120px] truncate px-1.5 py-1 text-[9px] font-semibold text-[#0F172A]" title={item.itemName}>{item.itemName}</td>
                <td className="px-1.5 py-1"><CategoryPill category={item.category} /></td>
                <td className="px-1.5 py-1"><BarcodePill status={item.barcodeStatus} /></td>
                <td className="px-1.5 py-1 text-[7px] text-slate-600">{item.storage}</td>
                <td className="px-1.5 py-1"><CriticalityPill level={item.criticality} /></td>
                <td className={`px-1.5 py-1 text-[9px] font-bold tabular-nums ${item.currentStock === 0 ? 'text-red-600' : item.currentStock < item.reorderLevel ? 'text-amber-600' : 'text-emerald-700'}`}>
                  {item.currentStock} {item.unit}
                </td>
                <td className="px-1.5 py-1 text-[8px] tabular-nums text-slate-500">{item.reorderLevel}</td>
                <td className="px-1.5 py-1"><StockStatusPill status={item.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </InvPanel>

      <InvPanel title="Spatial Store Allocation Dashboard" subtitle="Main · Pharmacy · ICU · OT · ER · Lab · Departmental holdings" icon={Warehouse}>
        <table className="w-full min-w-[780px] text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['Store', 'Item', 'Code', 'Available', 'Reserved', 'In Transit', 'Unit'].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_STORE_ALLOCATIONS.map((s) => (
              <tr key={s.id} className={`border-b border-slate-50 ${s.inTransit > 0 ? 'bg-violet-50/30' : ''}`}>
                <td className="px-1.5 py-1 text-[9px] font-semibold text-[#0F172A]">{s.store}</td>
                <td className="max-w-[110px] truncate px-1.5 py-1 text-[8px] text-slate-600" title={s.itemName}>{s.itemName}</td>
                <td className="px-1.5 py-1 font-mono text-[7px] text-slate-500">{s.itemCode}</td>
                <td className="px-1.5 py-1 text-[9px] font-bold tabular-nums text-emerald-700">{s.available}</td>
                <td className="px-1.5 py-1 text-[9px] font-bold tabular-nums text-indigo-600">{s.reserved}</td>
                <td className="px-1.5 py-1 text-[9px] font-bold tabular-nums text-violet-600">{s.inTransit || '—'}</td>
                <td className="px-1.5 py-1 text-[8px] text-slate-500">{s.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </InvPanel>

      <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
        <InvPanel title="Batch, Expiry & FEFO Tracking" subtitle="30/60-day alerts · first expire first out sorting">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Item', 'Batch', 'Qty', 'Expiry', 'Days', 'FEFO', 'Store', 'Alert'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fefoSorted.map((b) => (
                <tr key={b.id} className={`border-b border-slate-50 ${b.recallActive ? 'bg-red-50/60 ring-1 ring-inset ring-red-200' : b.daysToExpiry <= 30 ? 'bg-amber-50/40' : ''}`}>
                  <td className="max-w-[90px] truncate px-1.5 py-1 text-[8px] font-semibold" title={b.itemName}>{b.itemName}</td>
                  <td className="px-1.5 py-1 font-mono text-[7px] text-slate-600">{b.batchNumber}</td>
                  <td className="px-1.5 py-1 text-[9px] tabular-nums">{b.quantity}</td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-500">{b.expiryDate}</td>
                  <td className={`px-1.5 py-1 text-[9px] font-bold tabular-nums ${b.daysToExpiry <= 7 ? 'text-red-600 animate-pulse' : b.daysToExpiry <= 30 ? 'text-amber-700' : 'text-slate-600'}`}>
                    {b.daysToExpiry}d
                  </td>
                  <td className="px-1.5 py-1 text-center text-[9px] font-bold text-[#2563EB]">{b.fefoRank}</td>
                  <td className="px-1.5 py-1 text-[7px] text-slate-500">{b.store}</td>
                  <td className="px-1.5 py-1">
                    {b.recallActive && <span className="rounded bg-red-600 px-1 py-0.5 text-[7px] font-bold uppercase text-white">Recall</span>}
                    {!b.recallActive && b.daysToExpiry <= 30 && <span className="rounded bg-amber-100 px-1 py-0.5 text-[7px] font-bold uppercase text-amber-800">Expiring</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </InvPanel>

        <InvPanel
          title="Manufacturer Recall Simulation Engine"
          subtitle="Input recalled batch → identify affected distribution histories"
          icon={AlertTriangle}
          critical={impacts.length > 0}
          headerRight={
            <div className="flex items-center gap-1">
              <Search className="h-3 w-3 text-slate-400" />
              <input
                type="text"
                value={recallBatch}
                onChange={(e) => setRecallBatch(e.target.value.toUpperCase())}
                className="w-28 rounded border border-[#E2E8F0] px-1.5 py-0.5 font-mono text-[9px] focus:border-[#2563EB] focus:outline-none"
                placeholder="Batch #"
              />
            </div>
          }
        >
          {impacts.length === 0 ? (
            <p className="py-4 text-center text-[10px] text-slate-500">No distribution records found for batch &quot;{recallBatch}&quot;</p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                  {['Batch', 'Item', 'Department', 'Qty Issued', 'Date', 'Patient Ref'].map((h) => (
                    <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {impacts.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 bg-red-50/30">
                    <td className="px-1.5 py-1 font-mono text-[8px] font-bold text-red-700">{r.batchNumber}</td>
                    <td className="px-1.5 py-1 text-[8px] text-slate-600">{r.itemName}</td>
                    <td className="px-1.5 py-1 text-[9px] font-semibold">{r.department}</td>
                    <td className="px-1.5 py-1 text-[9px] font-bold tabular-nums">{r.quantityIssued}</td>
                    <td className="px-1.5 py-1 text-[8px] text-slate-500">{r.issuedDate}</td>
                    <td className="px-1.5 py-1 text-[8px] italic text-slate-500">{r.patientRef}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="mt-2 text-[8px] text-slate-400">Try batch: RAN-3300-G · Total affected units: {impacts.reduce((s, r) => s + r.quantityIssued, 0)}</p>
        </InvPanel>
      </div>
    </div>
  );
}
