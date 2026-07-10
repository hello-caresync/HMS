'use client';

import { useMemo, useState } from 'react';
import { ClipboardCheck } from 'lucide-react';

import { useInventory } from '../context/InventoryProvider';
import { computeVariance } from '../types';

export default function StockAuditSheet() {
  const { items, submitAudit, auditHistory } = useInventory();
  const [itemId, setItemId] = useState('');
  const [counted, setCounted] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lastVariance, setLastVariance] = useState<number | null>(null);

  const selected = items.find((i) => i.id === itemId);
  const countedNum = counted === '' ? null : parseInt(counted, 10);
  const variance =
    selected && countedNum !== null && !Number.isNaN(countedNum)
      ? computeVariance(selected.quantityOnHand, countedNum)
      : null;

  const auditItems = useMemo(() => [...items].sort((a, b) => a.itemName.localeCompare(b.itemName)), [items]);

  const handleSubmit = () => {
    if (!itemId || countedNum === null || Number.isNaN(countedNum)) {
      setError('Select item and enter counted quantity');
      return;
    }
    const result = submitAudit(itemId, countedNum);
    if (!result.success) {
      setError(result.error ?? 'Audit failed');
      return;
    }
    setLastVariance(result.record?.variance ?? null);
    setCounted('');
    setError(null);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b-2 border-slate-200 bg-[#0a0e14] px-3 py-2">
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-800">
          <ClipboardCheck className="h-3.5 w-3.5" />
          Stock Audit Sheet
        </p>
        <p className="text-xs font-bold text-white">Physical Count Verification</p>
      </div>

      <div className="grid gap-3 p-3 lg:grid-cols-2">
        <div className="space-y-2">
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase text-slate-800">
              Select Item
            </label>
            <select
              value={itemId}
              onChange={(e) => {
                setItemId(e.target.value);
                setCounted('');
                setError(null);
                setLastVariance(null);
              }}
              className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">Choose SKU to audit…</option>
              {auditItems.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.itemName} ({i.sku})
                </option>
              ))}
            </select>
          </div>

          {selected && (
            <>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2">
                <p className="text-[10px] font-bold uppercase text-slate-800">
                  System Expected Quantity
                </p>
                <p className="font-mono text-xl font-bold tabular-nums text-slate-900">
                  {selected.quantityOnHand}{' '}
                  <span className="text-sm font-normal text-slate-800">{selected.unit}</span>
                </p>
                <p className="text-[9px] text-slate-800">
                  {selected.location} · {selected.department}
                </p>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase text-slate-800">
                  Physically Counted Quantity
                </label>
                <input
                  type="number"
                  min={0}
                  value={counted}
                  onChange={(e) => {
                    setCounted(e.target.value);
                    setError(null);
                  }}
                  className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 font-mono text-sm tabular-nums focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Enter count"
                />
              </div>

              {variance !== null && (
                <div
                  className={`rounded-md border px-2.5 py-2 ${
                    variance === 0
                      ? 'border-emerald-200 bg-emerald-50'
                      : variance < 0
                        ? 'border-rose-300 bg-rose-50'
                        : 'border-amber-300 bg-amber-50'
                  }`}
                >
                  <p className="text-[10px] font-bold uppercase text-slate-800">Variance</p>
                  <p className="font-mono text-sm tabular-nums text-slate-900">
                    Expected: <strong>{selected.quantityOnHand}</strong> · Found:{' '}
                    <strong>{countedNum}</strong> · Variance:{' '}
                    <strong
                      className={
                        variance === 0
                          ? 'text-emerald-700'
                          : variance < 0
                            ? 'text-rose-700'
                            : 'text-amber-700'
                      }
                    >
                      {variance >= 0 ? '+' : ''}
                      {variance}
                    </strong>
                  </p>
                </div>
              )}

              {error && <p className="text-[10px] font-medium text-rose-600">{error}</p>}

              {lastVariance !== null && (
                <p className="text-[10px] font-medium text-emerald-600">
                  Audit recorded · system quantity updated
                </p>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!counted || countedNum === null}
                className="w-full rounded-lg bg-slate-800 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700 disabled:opacity-40"
              >
                Record Audit Count
              </button>
            </>
          )}
        </div>

        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase text-slate-800">Recent Audits</p>
          <div className="max-h-48 overflow-y-auto rounded-md border-2 border-slate-200">
            {auditHistory.length === 0 ? (
              <p className="px-2 py-4 text-center text-[10px] text-slate-800">No audits yet</p>
            ) : (
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b-2 border-slate-200 bg-slate-100 text-slate-800">
                    <th className="px-2 py-1 text-left font-black">Item</th>
                    <th className="px-2 py-1 text-right font-black">Exp</th>
                    <th className="px-2 py-1 text-right font-black">Found</th>
                    <th className="px-2 py-1 text-right font-black">Var</th>
                  </tr>
                </thead>
                <tbody>
                  {auditHistory.map((a, i) => {
                    const item = items.find((it) => it.id === a.itemId);
                    return (
                      <tr key={i} className="border-b border-slate-50">
                        <td className="max-w-[120px] truncate px-2 py-1 text-slate-900">
                          {item?.itemName ?? a.itemId}
                        </td>
                        <td className="px-2 py-1 text-right font-mono tabular-nums">
                          {a.expectedQuantity}
                        </td>
                        <td className="px-2 py-1 text-right font-mono tabular-nums">
                          {a.countedQuantity}
                        </td>
                        <td
                          className={`px-2 py-1 text-right font-mono font-bold tabular-nums ${
                            a.variance === 0
                              ? 'text-emerald-600'
                              : a.variance < 0
                                ? 'text-rose-600'
                                : 'text-amber-600'
                          }`}
                        >
                          {a.variance >= 0 ? '+' : ''}
                          {a.variance}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
