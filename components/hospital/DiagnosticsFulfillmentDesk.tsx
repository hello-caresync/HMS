'use client';

import { useCallback, useEffect, useState } from 'react';
import { FlaskConical, Loader2, ScanLine } from 'lucide-react';
import { toast } from 'sonner';

import { fulfillLabOrder } from '@/lib/clinical/lab-orders-service';
import { fulfillRadiologyOrder } from '@/lib/clinical/radiology-orders-service';
import { supabase } from '@/lib/supabaseClient';
import { portalSurfaces } from '@/lib/shared/portal-surfaces';

type PendingOrder = {
  id: string;
  kind: 'lab' | 'radiology';
  patient_name?: string;
  label: string;
  status: string;
};

export function DiagnosticsFulfillmentDesk() {
  const hospitalSurface = portalSurfaces.hospital;
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    const [labs, radiology] = await Promise.all([
      supabase
        .from('lab_orders')
        .select('id, patient_name, test_name, status')
        .neq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('radiology_orders')
        .select('id, patient_name, study_name, status')
        .neq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    const merged: PendingOrder[] = [
      ...(labs.data ?? []).map((row: Record<string, unknown>) => {
        const r = row;
        return {
          id: String(r.id ?? ''),
          kind: 'lab' as const,
          patient_name: r.patient_name ? String(r.patient_name) : undefined,
          label: String(r.test_name ?? 'Lab test'),
          status: String(r.status ?? 'ordered'),
        };
      }),
      ...(radiology.data ?? []).map((row: Record<string, unknown>) => {
        const r = row;
        return {
          id: String(r.id ?? ''),
          kind: 'radiology' as const,
          patient_name: r.patient_name ? String(r.patient_name) : undefined,
          label: String(r.study_name ?? 'Imaging study'),
          status: String(r.status ?? 'ordered'),
        };
      }),
    ];
    setOrders(merged);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
    const channel = supabase
      .channel('hospital-diagnostics-desk')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lab_orders' }, () => void reload())
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'radiology_orders' },
        () => void reload(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [reload]);

  const fulfill = async (order: PendingOrder) => {
    setBusyId(order.id);
    try {
      const summary =
        order.kind === 'lab'
          ? 'Results verified and released to patient app.'
          : 'Radiology report finalized and released to patient app.';
      const result =
        order.kind === 'lab'
          ? await fulfillLabOrder(supabase, order.id, summary)
          : await fulfillRadiologyOrder(supabase, order.id, summary);
      if (!result.ok) throw new Error(result.error);
      toast.success(`${order.label} marked complete`);
      void reload();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not fulfill order');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${hospitalSurface.card}`}>
      <div className="mb-3 flex items-center gap-2">
        <FlaskConical className="h-4 w-4 text-[#20639B]" />
        <h4 className="text-sm font-black text-slate-900">Diagnostics Fulfillment</h4>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 py-6 text-xs font-bold text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading orders...
        </div>
      ) : orders.length === 0 ? (
        <p className="py-4 text-xs font-semibold text-slate-500">No pending lab or radiology orders.</p>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => (
            <div
              key={`${order.kind}-${order.id}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-[#FAFBFD] p-3 text-xs"
            >
              <div>
                <p className="font-bold text-slate-900">
                  {order.kind === 'lab' ? (
                    <FlaskConical className="mr-1 inline h-3.5 w-3.5 text-cyan-700" />
                  ) : (
                    <ScanLine className="mr-1 inline h-3.5 w-3.5 text-indigo-700" />
                  )}
                  {order.label}
                </p>
                <p className="text-slate-500">{order.patient_name ?? 'Patient'} · {order.status}</p>
              </div>
              <button
                type="button"
                disabled={busyId === order.id}
                onClick={() => void fulfill(order)}
                className={`rounded-lg px-3 py-1.5 text-[10px] font-black text-white disabled:opacity-50 ${hospitalSurface.btnPrimary}`}
              >
                {busyId === order.id ? 'Saving...' : 'Release result'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
