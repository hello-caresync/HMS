'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { HospitalOpsShell } from '@/components/hospital-operations/HospitalOpsShell';
import { hospitalOpsClasses } from '@/lib/hospital/design-tokens';
import { getOpsSupabase } from '@/lib/hospital/operations/client-api';
import { useHospitalOpsRealtime } from '@/lib/hospital/operations/realtime';

type LabOrderRow = {
  id: string;
  patient_id?: string;
  doctor_id?: string;
  test_names?: string[] | string;
  status?: string;
  created_at?: string;
};

const STATUSES = ['ORDERED', 'COLLECTED', 'IN_PROGRESS', 'COMPLETED'] as const;

export default function DiagnosticsLabPage() {
  const [orders, setOrders] = useState<LabOrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = getOpsSupabase();
      const { data, error } = await supabase
        .from('lab_orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setOrders((data ?? []) as LabOrderRow[]);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load lab orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useHospitalOpsRealtime(load);
  useEffect(() => {
    void load();
  }, [load]);

  const updateStatus = async (orderId: string, status: string) => {
    try {
      const supabase = getOpsSupabase();
      const { error } = await supabase.from('lab_orders').update({ status }).eq('id', orderId);
      if (error) throw error;
      toast.success(`Order marked ${status.replace('_', ' ').toLowerCase()}`);
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Status update failed');
    }
  };

  const pending = orders.filter((o) => o.status !== 'COMPLETED').length;

  return (
    <HospitalOpsShell
      title="Diagnostics & Pathology Lab"
      subtitle="Ingest doctor lab orders · track sample collection · release results"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className={`${hospitalOpsClasses.surface} p-4`}>
          <p className="text-[10px] font-black uppercase text-[#52796F]">Total Orders</p>
          <p className="text-2xl font-black">{orders.length}</p>
        </div>
        <div className={`${hospitalOpsClasses.surface} p-4`}>
          <p className="text-[10px] font-black uppercase text-[#52796F]">Pending</p>
          <p className="text-2xl font-black text-[#D4A373]">{pending}</p>
        </div>
      </div>

      <div className={`${hospitalOpsClasses.surface} overflow-x-auto`}>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#CAD2C5] text-[10px] font-black uppercase text-[#52796F]">
              <th className="py-2 px-3 text-left">Order ID</th>
              <th className="py-2 px-3 text-left">Tests</th>
              <th className="py-2 px-3 text-left">Status</th>
              <th className="py-2 px-3 text-left">Ordered</th>
              <th className="py-2 px-3 text-right">Advance</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[#84A98C] font-semibold">
                  Loading lab orders…
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[#84A98C] font-semibold">
                  No lab orders — doctors can order tests from the consultation workspace
                </td>
              </tr>
            ) : (
              orders.map((order, index) => {
                const tests = Array.isArray(order.test_names)
                  ? order.test_names.join(', ')
                  : String(order.test_names ?? '—');
                const status = order.status ?? 'ORDERED';
                const currentIdx = STATUSES.indexOf(status as (typeof STATUSES)[number]);
                const nextStatus = STATUSES[Math.min(currentIdx + 1, STATUSES.length - 1)];
                const rowKey = order.id || `lab-${index}`;

                return (
                  <tr key={rowKey} className="border-b border-[#CAD2C5]/50">
                    <td className="py-2.5 px-3 font-mono text-[10px]">{order.id.slice(0, 8)}…</td>
                    <td className="py-2.5 px-3 font-bold max-w-[240px] truncate">{tests}</td>
                    <td className="py-2.5 px-3">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-black ${hospitalOpsClasses.badgeDefault}`}>
                        {status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#52796F]">
                      {order.created_at ? new Date(order.created_at).toLocaleString() : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {status !== 'COMPLETED' ? (
                        <button
                          type="button"
                          className={hospitalOpsClasses.btnPrimary}
                          onClick={() => void updateStatus(order.id, nextStatus)}
                        >
                          → {nextStatus.replace('_', ' ')}
                        </button>
                      ) : (
                        <span className="text-[#84A98C]">Done</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </HospitalOpsShell>
  );
}
