'use client';

import React, { useMemo, useState } from 'react';

import { useRealtimeInventory } from '../../hooks/useRealtimeInventory';

export type InventoryHolding = {
  id: string;
  medicineName: string;
  batchCode: string;
  unitsOnHand: number;
  reorderThreshold: number;
  expiryDate: string;
  department: string;
  unit: string;
};

export type MovementLogEntry = {
  id: string;
  timestamp: string;
  medicineName: string;
  batchCode: string;
  delta: number;
  reason: string;
};

type InventoryPanelView = 'holdings' | 'movements';

const SEARCH_INPUT_CLASS =
  'w-full border border-[#49769F]/30 rounded-xl px-4 py-3 text-xs font-semibold bg-white text-[#001D39] focus:outline-none focus:border-[#0A4174] focus:ring-1 focus:ring-[#0A4174] placeholder:text-[#49769F]/60';

const CARD_CLASS =
  'rounded-2xl border border-[#49769F]/20 bg-white p-6 shadow-xs';

const ALERT_CLASS =
  'rounded-2xl border p-5 shadow-xs';

function parseExpiryFromBatch(expiryBatch?: string): string {
  if (!expiryBatch) return '2028-12-31';

  const match = expiryBatch.match(/Exp:\s*([A-Za-z]+)\s*(\d{4})/i);
  if (!match) return '2028-12-31';

  const monthMap: Record<string, string> = {
    jan: '01',
    feb: '02',
    mar: '03',
    apr: '04',
    may: '05',
    jun: '06',
    jul: '07',
    aug: '08',
    sep: '09',
    oct: '10',
    nov: '11',
    dec: '12',
  };

  const month = monthMap[match[1].slice(0, 3).toLowerCase()] ?? '12';
  return `${match[2]}-${month}-28`;
}

function extractBatchCode(expiryBatch?: string, fallbackId?: string): string {
  if (!expiryBatch) return `B-${fallbackId ?? 'UNK'}`;
  const match = expiryBatch.match(/^([A-Z0-9-]+)/i);
  return match?.[1] ?? `B-${fallbackId ?? 'UNK'}`;
}

function isExpired(expiryDate: string): boolean {
  const expiry = new Date(`${expiryDate}T23:59:59`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return expiry.getTime() < today.getTime();
}

function isNearExpiry(expiryDate: string, withinDays = 90): boolean {
  if (isExpired(expiryDate)) return false;
  const expiry = new Date(`${expiryDate}T23:59:59`);
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + withinDays);
  return expiry.getTime() <= horizon.getTime();
}

const SEED_MOVEMENT_HISTORY: MovementLogEntry[] = [
  {
    id: 'MOV-001',
    timestamp: '2026-07-08 09:14',
    medicineName: 'Telmisartan 40mg Baseline Tablets',
    batchCode: 'B-TEL26',
    delta: -30,
    reason: 'Outpatient prescription dispense',
  },
  {
    id: 'MOV-002',
    timestamp: '2026-07-07 16:42',
    medicineName: 'Dolo 650mg Antipyretic Tablets',
    batchCode: 'B-DOL25',
    delta: 1200,
    reason: 'Inbound dock receipt — PO HOS-PO-442',
  },
  {
    id: 'MOV-003',
    timestamp: '2026-07-06 11:05',
    medicineName: 'Amoxicillin 500mg Antibiotic Capsules',
    batchCode: 'B-AMX24',
    delta: -240,
    reason: 'Ward stock transfer — ICU',
  },
  {
    id: 'MOV-004',
    timestamp: '2026-06-20 08:30',
    medicineName: 'Legacy Cough Syrup Formula',
    batchCode: 'B-LEG22',
    delta: -85,
    reason: 'Expired batch quarantine write-off',
  },
];

const LEGACY_EXPIRED_HOLDING: InventoryHolding = {
  id: 'LEG-CSYR',
  medicineName: 'Legacy Cough Syrup Formula',
  batchCode: 'B-LEG22',
  unitsOnHand: 85,
  reorderThreshold: 50,
  expiryDate: '2025-11-30',
  department: 'Central Pharmacy',
  unit: 'bottles',
};

export default function HospitalInventoryDashboard() {
  const { inventory } = useRealtimeInventory();
  const [panelView, setPanelView] = useState<InventoryPanelView>('holdings');
  const [holdingsSearch, setHoldingsSearch] = useState('');

  const inventoryHoldings = useMemo<InventoryHolding[]>(() => {
    const mapped = inventory.map((entry) => ({
      id: entry.hospitalSku,
      medicineName: entry.name,
      batchCode: extractBatchCode(entry.expiryBatch, entry.ledgerId),
      unitsOnHand: entry.unitsAvailable,
      reorderThreshold: entry.reorderThreshold,
      expiryDate: parseExpiryFromBatch(entry.expiryBatch),
      department: entry.department,
      unit: entry.unit,
    }));

    return [...mapped, LEGACY_EXPIRED_HOLDING];
  }, [inventory]);

  const movementHistory = useMemo(() => SEED_MOVEMENT_HISTORY, []);

  const filteredHoldings = useMemo(() => {
    const query = holdingsSearch.trim().toLowerCase();
    if (!query) return inventoryHoldings;

    return inventoryHoldings.filter(
      (holding) =>
        holding.medicineName.toLowerCase().includes(query) ||
        holding.batchCode.toLowerCase().includes(query),
    );
  }, [inventoryHoldings, holdingsSearch]);

  const lowStockCount = useMemo(
    () =>
      inventoryHoldings.filter(
        (holding) => holding.unitsOnHand <= holding.reorderThreshold,
      ).length,
    [inventoryHoldings],
  );

  const nearExpiryCount = useMemo(
    () =>
      inventoryHoldings.filter((holding) => isNearExpiry(holding.expiryDate)).length,
    [inventoryHoldings],
  );

  const expiredUnitsTotal = useMemo(
    () =>
      inventoryHoldings
        .filter((holding) => isExpired(holding.expiryDate))
        .reduce((sum, holding) => sum + holding.unitsOnHand, 0),
    [inventoryHoldings],
  );

  const expiredBatchCount = useMemo(
    () =>
      inventoryHoldings.filter((holding) => isExpired(holding.expiryDate)).length,
    [inventoryHoldings],
  );

  return (
    <div className="mt-8 space-y-6">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-wider text-[#49769F]">
          Inventory operations
        </p>
        <h2 className="mt-1 text-2xl font-black tracking-tight text-[#001D39]">
          Hospital Warehouse Control Tower
        </h2>
        <p className="mt-2 max-w-2xl text-xs font-medium text-[#49769F]">
          Live holdings ledger synchronized with prescription dispense events and inbound
          procurement receipts.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article
          className={`${ALERT_CLASS} border-[#0A4174]/30 bg-[#BDD8E9]/40`}
        >
          <p className="font-mono text-[10px] uppercase tracking-wider text-[#0A4174]">
            Low stock alert
          </p>
          <p className="mt-2 font-mono text-2xl font-black text-[#001D39]">
            {lowStockCount}
          </p>
          <p className="mt-1 text-xs font-medium text-[#49769F]">
            SKUs at or below reorder threshold
          </p>
        </article>

        <article
          className={`${ALERT_CLASS} border-[#49769F]/30 bg-white`}
        >
          <p className="font-mono text-[10px] uppercase tracking-wider text-[#49769F]">
            Near expiry watch
          </p>
          <p className="mt-2 font-mono text-2xl font-black text-[#0A4174]">
            {nearExpiryCount}
          </p>
          <p className="mt-1 text-xs font-medium text-[#49769F]">
            Batches expiring within 90 days
          </p>
        </article>

        <article
          className={`${ALERT_CLASS} border-[#001D39]/20 bg-[#001D39] text-white`}
        >
          <p className="font-mono text-[10px] uppercase tracking-wider text-[#BDD8E9]">
            Expired units quarantine
          </p>
          <p className="mt-2 font-mono text-2xl font-black text-[#BDD8E9]">
            {expiredUnitsTotal.toLocaleString('en-IN')}
          </p>
          <p className="mt-1 text-xs font-medium text-[#49769F]">
            {expiredBatchCount} batch(es) with expiry prior to today — removal required
          </p>
        </article>
      </section>

      <section className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setPanelView('holdings')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            panelView === 'holdings'
              ? 'bg-[#0A4174] text-white'
              : 'border border-[#49769F]/30 bg-white text-[#001D39] hover:bg-[#BDD8E9]/40'
          }`}
        >
          Warehouse holdings
        </button>
        <button
          type="button"
          onClick={() => setPanelView('movements')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            panelView === 'movements'
              ? 'bg-[#0A4174] text-white'
              : 'border border-[#49769F]/30 bg-white text-[#001D39] hover:bg-[#BDD8E9]/40'
          }`}
        >
          Movement history
        </button>
      </section>

      {panelView === 'holdings' ? (
        <section className={CARD_CLASS}>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-[#49769F]">
                Warehouse holdings
              </p>
              <h3 className="mt-1 text-lg font-black text-[#001D39]">
                On-hand stock registry
              </h3>
            </div>
            <p className="font-mono text-[10px] font-black text-[#49769F]">
              {filteredHoldings.length} record(s)
            </p>
          </div>

          <label className="mb-4 block">
            <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-[#49769F]">
              Quick filter — medicine name or batch code
            </span>
            <input
              type="text"
              value={holdingsSearch}
              onChange={(event) => setHoldingsSearch(event.target.value)}
              placeholder="Search e.g. Telmisartan or B-TEL26…"
              className={SEARCH_INPUT_CLASS}
            />
          </label>

          <div className="overflow-x-auto rounded-xl border border-[#49769F]/20">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-[#BDD8E9]/50 font-mono text-[10px] uppercase tracking-wider text-[#49769F]">
                <tr>
                  <th className="px-4 py-3">Medicine</th>
                  <th className="px-4 py-3">Batch</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Units</th>
                  <th className="px-4 py-3">Expiry</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredHoldings.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center font-bold text-[#49769F]"
                    >
                      No holdings match &ldquo;{holdingsSearch.trim()}&rdquo;
                    </td>
                  </tr>
                ) : (
                  filteredHoldings.map((holding) => {
                    const expired = isExpired(holding.expiryDate);
                    const low = holding.unitsOnHand <= holding.reorderThreshold;

                    return (
                      <tr
                        key={holding.id}
                        className="border-t border-[#49769F]/10 text-[#001D39]"
                      >
                        <td className="px-4 py-3 font-bold">{holding.medicineName}</td>
                        <td className="px-4 py-3 font-mono font-black text-[#0A4174]">
                          {holding.batchCode}
                        </td>
                        <td className="px-4 py-3 text-[#49769F]">{holding.department}</td>
                        <td className="px-4 py-3 font-mono font-black">
                          {holding.unitsOnHand.toLocaleString('en-IN')}{' '}
                          <span className="text-[#49769F]">{holding.unit}</span>
                        </td>
                        <td className="px-4 py-3 font-mono">{holding.expiryDate}</td>
                        <td className="px-4 py-3">
                          {expired ? (
                            <span className="rounded-md border border-[#001D39]/20 bg-[#001D39] px-2 py-0.5 font-mono text-[10px] font-black uppercase text-[#BDD8E9]">
                              Expired
                            </span>
                          ) : low ? (
                            <span className="rounded-md border border-[#0A4174]/20 bg-[#BDD8E9] px-2 py-0.5 font-mono text-[10px] font-black uppercase text-[#0A4174]">
                              Low stock
                            </span>
                          ) : (
                            <span className="rounded-md border border-[#49769F]/20 px-2 py-0.5 font-mono text-[10px] font-black uppercase text-[#49769F]">
                              Stable
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className={CARD_CLASS}>
          <p className="font-mono text-[10px] uppercase tracking-wider text-[#49769F]">
            Movement history
          </p>
          <h3 className="mt-1 text-lg font-black text-[#001D39]">Stock ledger pipeline</h3>

          <div className="mt-4 space-y-3">
            {movementHistory.map((entry) => (
              <article
                key={entry.id}
                className="rounded-xl border border-[#49769F]/15 bg-[#BDD8E9]/20 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-mono text-[10px] font-black text-[#49769F]">
                    {entry.timestamp}
                  </p>
                  <p
                    className={`font-mono text-sm font-black ${
                      entry.delta >= 0 ? 'text-[#0A4174]' : 'text-[#001D39]'
                    }`}
                  >
                    {entry.delta >= 0 ? '+' : ''}
                    {entry.delta.toLocaleString('en-IN')} units
                  </p>
                </div>
                <p className="mt-1 text-sm font-semibold text-[#001D39]">
                  {entry.medicineName}
                </p>
                <p className="mt-0.5 font-mono text-[10px] text-[#49769F]">
                  Batch {entry.batchCode} · {entry.reason}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
