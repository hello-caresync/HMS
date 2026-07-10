'use client';

import { useState } from 'react';
import { FileSearch, Upload } from 'lucide-react';

import { useRadiology } from '../context/RadiologyProvider';
import type { RadiologyOrder } from '../types';
import { MODALITIES, STATUS_STYLES } from '../types';
import InterpretationPanel from './InterpretationPanel';
import UploadScanModal from './UploadScanModal';

export default function RadiologyQueueTable() {
  const { filteredOrders, modalityFilter, setModalityFilter } = useRadiology();
  const [uploadOrder, setUploadOrder] = useState<RadiologyOrder | null>(null);
  const [interpretOrder, setInterpretOrder] = useState<RadiologyOrder | null>(null);

  return (
    <>
      {/* Modality filter tabs */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        <ModalityButton
          label="All"
          active={modalityFilter === 'All'}
          onClick={() => setModalityFilter('All')}
        />
        {MODALITIES.map((m) => (
          <ModalityButton
            key={m}
            label={m}
            active={modalityFilter === m}
            onClick={() => setModalityFilter(m)}
          />
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-100/80">
              <th className="px-3 py-2 font-black uppercase tracking-wider text-slate-950">Patient</th>
              <th className="px-3 py-2 font-black uppercase tracking-wider text-slate-950">UHID</th>
              <th className="px-3 py-2 font-black uppercase tracking-wider text-slate-950">Ordering Doctor</th>
              <th className="px-3 py-2 font-black uppercase tracking-wider text-slate-950">Scan Details</th>
              <th className="px-3 py-2 font-black uppercase tracking-wider text-slate-950">Status</th>
              <th className="px-3 py-2 text-right font-black uppercase tracking-wider text-slate-950">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-slate-950">
                  No orders for this modality
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-100/50">
                  <td className="px-3 py-2 font-bold text-slate-900">{order.patientName}</td>
                  <td className="px-3 py-2 font-mono text-[11px] text-slate-950">{order.uhid}</td>
                  <td className="px-3 py-2 text-slate-950">{order.orderingDoctor}</td>
                  <td className="max-w-[200px] truncate px-3 py-2 text-slate-950" title={order.scanDetails}>
                    <span className="mr-1 rounded bg-slate-100 px-1 py-0.5 text-[9px] font-semibold text-slate-800">
                      {order.modality}
                    </span>
                    {order.scanDetails}
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-3 py-2 text-right">
                    {order.status === 'Pending Capture' && (
                      <button
                        type="button"
                        onClick={() => setUploadOrder(order)}
                        className="inline-flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-slate-700"
                      >
                        <Upload className="h-3 w-3" />
                        Upload Scan
                      </button>
                    )}
                    {(order.status === 'Ready for Interpretation' ||
                      order.status === 'In Interpretation') && (
                      <button
                        type="button"
                        onClick={() => setInterpretOrder(order)}
                        className="inline-flex items-center gap-1 rounded bg-cyan-700 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-cyan-600"
                      >
                        <FileSearch className="h-3 w-3" />
                        Interpret
                      </button>
                    )}
                    {order.status === 'Completed' && (
                      <button
                        type="button"
                        onClick={() => setInterpretOrder(order)}
                        className="text-[10px] font-semibold text-slate-800 hover:text-slate-900"
                      >
                        View Report
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {interpretOrder && (
        <div className="mt-4">
          <InterpretationPanel
            order={interpretOrder}
            onFinalized={() => setInterpretOrder(null)}
          />
        </div>
      )}

      <UploadScanModal
        order={uploadOrder}
        open={uploadOrder !== null}
        onClose={() => setUploadOrder(null)}
      />
    </>
  );
}

function ModalityButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${
        active
          ? 'bg-slate-900 text-white shadow-sm'
          : 'bg-white text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  );
}

function StatusBadge({ status }: { status: RadiologyOrder['status'] }) {
  return (
    <span
      className={`inline-flex rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ring-1 ring-inset ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}
