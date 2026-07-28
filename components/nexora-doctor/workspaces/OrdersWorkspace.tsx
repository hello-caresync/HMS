'use client';

import { useMemo, useState } from 'react';

import { ui, statusColors, orderTypeLabels } from '@/components/nexora-doctor/ui/primitives';
import { EmptyState, FilterTabs, SearchBar, SectionHeader } from '@/components/nexora-doctor/ui/shared';
import { formatRelative, formatTime } from '@/lib/nexora-doctor/hooks';
import { useDoctorClinicalStore } from '@/lib/nexora-doctor/store';
import type { OrderType } from '@/lib/nexora-doctor/types';

const TYPE_FILTERS = [
  { id: 'all', label: 'All Orders' },
  { id: 'lab', label: 'Laboratory' },
  { id: 'radiology', label: 'Radiology' },
  { id: 'procedure', label: 'Procedures' },
  { id: 'admission', label: 'Admissions' },
  { id: 'surgery', label: 'Surgery' },
  { id: 'prescription', label: 'Prescriptions' },
];

const STATUS_FILTERS = [
  { id: 'all', label: 'All Status' },
  { id: 'pending', label: 'Pending' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
];

export function OrdersWorkspace() {
  const orders = useDoctorClinicalStore((s) => s.orders);
  const updateOrderStatus = useDoctorClinicalStore((s) => s.updateOrderStatus);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return orders.filter((o) => {
      const matchSearch = !q || o.title.toLowerCase().includes(q) || o.patientName.toLowerCase().includes(q);
      const matchType = typeFilter === 'all' || o.type === typeFilter;
      const matchStatus = statusFilter === 'all' || o.status === statusFilter;
      return matchSearch && matchType && matchStatus;
    });
  }, [orders, search, typeFilter, statusFilter]);

  return (
    <div className={ui.page}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={ui.pageTitle}>Orders</h1>
          <p className={ui.pageSubtitle}>Laboratory, radiology, procedures & more</p>
        </div>
        <SearchBar value={search} onChange={setSearch} placeholder="Search orders…" />
      </div>

      <div className="mb-4 space-y-3">
        <FilterTabs options={TYPE_FILTERS} value={typeFilter} onChange={setTypeFilter} />
        <FilterTabs options={STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No orders found" description="Adjust filters or place a new order from consultations." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className={ui.table}>
            <thead className="bg-slate-50">
              <tr>
                <th className={ui.th}>Order</th>
                <th className={ui.th}>Patient</th>
                <th className={ui.th}>Type</th>
                <th className={ui.th}>Department</th>
                <th className={ui.th}>Status</th>
                <th className={ui.th}>Progress</th>
                <th className={ui.th}>Ordered</th>
                <th className={ui.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/50">
                  <td className={ui.td}><p className="font-medium text-slate-900">{o.title}</p></td>
                  <td className={ui.td}>{o.patientName}</td>
                  <td className={ui.td}>{orderTypeLabels[o.type as OrderType] ?? o.type}</td>
                  <td className={ui.td}>{o.department}</td>
                  <td className={ui.td}><span className={`${ui.badge} ${statusColors[o.status]}`}>{o.status}</span></td>
                  <td className={ui.td}>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${o.progress}%` }} />
                      </div>
                      <span className="text-xs text-slate-500">{o.progress}%</span>
                    </div>
                  </td>
                  <td className={ui.td}>
                    <p className="text-xs">{formatRelative(o.orderedAt)}</p>
                    {o.completedAt && <p className="text-xs text-emerald-600">Done {formatTime(o.completedAt)}</p>}
                  </td>
                  <td className={ui.td}>
                    {o.status === 'pending' && (
                      <button type="button" onClick={() => updateOrderStatus(o.id, 'in-progress', 50)} className="text-xs font-medium text-teal-700 hover:underline">
                        Mark in progress
                      </button>
                    )}
                    {o.status === 'in-progress' && (
                      <button type="button" onClick={() => updateOrderStatus(o.id, 'completed', 100)} className="text-xs font-medium text-emerald-700 hover:underline">
                        Mark complete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
