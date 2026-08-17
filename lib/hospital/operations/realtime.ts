'use client';

import { useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';
import type { SidebarBadgeCounts } from './types';

export function useHospitalOpsRealtime(onRefresh: () => void) {
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    const measureLatency = async () => {
      const start = performance.now();
      const { error } = await supabase.from('appointments').select('id').limit(1);
      if (!mounted) return;
      setLatencyMs(error ? null : Math.round(performance.now() - start));
    };

    void measureLatency();
    const latencyTimer = window.setInterval(() => void measureLatency(), 15000);

    const channel = supabase
      .channel('hospital-ops-hub')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => onRefresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emergency_triages' }, () =>
        onRefresh(),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prescriptions' }, () => onRefresh())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_events' }, () =>
        onRefresh(),
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_notifications' }, () =>
        onRefresh(),
      )
      .subscribe((status) => {
        if (mounted) setConnected(status === 'SUBSCRIBED');
      });

    return () => {
      mounted = false;
      window.clearInterval(latencyTimer);
      void supabase.removeChannel(channel);
    };
  }, [onRefresh]);

  return { latencyMs, connected };
}

export async function fetchSidebarBadgeCounts(): Promise<SidebarBadgeCounts> {
  const supabase = createClient();

  const [apptRes, triageRes, bedRes, rxRes, invRes] = await Promise.all([
    supabase.from('appointments').select('id', { count: 'exact', head: true }).in('status', [
      'BOOKED',
      'SCHEDULED',
      'CHECKED_IN',
      'IN_CONSULTATION',
    ]),
    supabase
      .from('emergency_triages')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('hospital_beds')
      .select('id', { count: 'exact', head: true })
      .eq('is_occupied', true),
    supabase.from('prescriptions').select('id', { count: 'exact', head: true }).neq('status', 'DISPENSED'),
    supabase.from('inventory_items').select('id', { count: 'exact', head: true }),
  ]);

  const lowStockRes = await supabase.from('inventory_items').select('quantity_in_stock, reorder_level');

  let lowStock = 0;
  for (const row of lowStockRes.data ?? []) {
    if (Number(row.quantity_in_stock) <= Number(row.reorder_level ?? 10)) lowStock += 1;
  }

  return {
    opd: apptRes.count ?? 0,
    emergency: triageRes.count ?? 0,
    ipd: bedRes.count ?? 0,
    pharmacy: rxRes.count ?? 0,
    inventory: lowStock || invRes.count || 0,
  };
}
