'use client';

import { useMemo, useState } from 'react';
import { Barcode, FlaskConical, Search } from 'lucide-react';

import { LAB_STATUS_STYLES, SEED_LAB_ORDERS, type LabSamplePacket } from '../../../lib/clinical';
import LabOrdersGrid from './LabOrdersGrid';
import TechnicianResultsPanel from './TechnicianResultsPanel';

export default function LabSampleWorkbench() {
  const [orders, setOrders] = useState<LabSamplePacket[]>(SEED_LAB_ORDERS);
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<LabSamplePacket | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        o.trackingId.toLowerCase().includes(q) ||
        o.patientInitials.toLowerCase().includes(q) ||
        o.testName.toLowerCase().includes(q) ||
        o.patientReferenceId.toLowerCase().includes(q),
    );
  }, [orders, search]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of orders) {
      counts[o.status] = (counts[o.status] ?? 0) + 1;
    }
    return counts;
  }, [orders]);

  const handlePrintBarcode = (trackingId: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.trackingId === trackingId && o.status === 'Awaiting Collection'
          ? { ...o, status: 'Barcode Printed' as const, collectionTimestamp: new Date().toISOString() }
          : o,
      ),
    );
  };

  const handleOpenResults = (order: LabSamplePacket) => {
    setSelectedOrder(order);
    setPanelOpen(true);
  };

  const handleSaveResults = (trackingId: string, matrix: LabSamplePacket['resultMatrix']) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.trackingId === trackingId
          ? {
              ...o,
              resultMatrix: matrix,
              status: 'Awaiting Verification' as const,
            }
          : o,
      ),
    );
    setPanelOpen(false);
    setSelectedOrder(null);
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <header className="border-b-2 border-slate-200 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-sky-700" />
            <div>
              <h1 className="text-lg font-black text-slate-900">Laboratory Sample Processing</h1>
              <p className="text-xs text-slate-800">
                Phase 3 · Module 8 · Specimen intake → barcode → results
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(LAB_STATUS_STYLES) as LabSamplePacket['status'][]).map((status) => (
              <span
                key={status}
                className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ring-1 ${LAB_STATUS_STYLES[status]}`}
              >
                {status} · {statusCounts[status] ?? 0}
              </span>
            ))}
          </div>
        </div>
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-800" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Order ID, patient, test name…"
          className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
        />
      </div>

      <LabOrdersGrid
        orders={filtered}
        onPrintBarcode={handlePrintBarcode}
        onOpenResults={handleOpenResults}
      />

      <TechnicianResultsPanel
        open={panelOpen}
        order={selectedOrder}
        onClose={() => {
          setPanelOpen(false);
          setSelectedOrder(null);
        }}
        onSave={handleSaveResults}
      />

      <p className="flex items-center gap-1 text-[10px] text-slate-800">
        <Barcode className="h-3 w-3" />
        Barcode stickers route to specimen tracking · Results panel slides from right
      </p>
    </div>
  );
}
