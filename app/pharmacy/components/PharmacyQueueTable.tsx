'use client';

import { usePharmacy } from '../context/PharmacyProvider';
import { STATUS_STYLES } from '../types';

function StatusBadge({ status }: { status: keyof typeof STATUS_STYLES }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

function medicationSummary(items: { brandName: string; genericName: string }[]): string {
  if (items.length === 0) return '—';
  const first = items[0];
  const extra = items.length > 1 ? ` +${items.length - 1} more` : '';
  return `${first.brandName} (${first.genericName})${extra}`;
}

export default function PharmacyQueueTable() {
  const { orders, activeOrderId, setActiveOrderId } = usePharmacy();

  const pending = orders.filter((o) => o.status !== 'Completed');

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b-2 border-slate-200 bg-slate-50/80 px-3 py-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
          EMR Dispatch Queue
        </p>
        <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800">
          {pending.length} active
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b-2 border-slate-200">
              <th className="px-3 py-2 font-black uppercase tracking-wider text-slate-950">
                Patient
              </th>
              <th className="px-3 py-2 font-black uppercase tracking-wider text-slate-950">
                UHID
              </th>
              <th className="hidden px-3 py-2 font-black uppercase tracking-wider text-slate-950 sm:table-cell">
                Prescribed Medication
              </th>
              <th className="px-3 py-2 font-black uppercase tracking-wider text-slate-950">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-10 text-center text-slate-950">
                  No incoming prescriptions
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const active = activeOrderId === order.id;
                return (
                  <tr
                    key={order.id}
                    onClick={() => setActiveOrderId(order.id)}
                    className={`cursor-pointer border-b border-slate-50 transition ${
                      active ? 'bg-teal-50 ring-1 ring-inset ring-teal-200' : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <td className="px-3 py-2">
                      <p className="font-medium text-slate-900">{order.patientName}</p>
                      <p className="text-[10px] text-slate-800">{order.prescribingDoctor}</p>
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px] text-slate-950">{order.uhid}</td>
                    <td className="hidden max-w-[180px] truncate px-3 py-2 text-slate-950 sm:table-cell">
                      {medicationSummary(order.lineItems)}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
