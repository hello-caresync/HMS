'use client';

import { useEffect, useRef, useState } from 'react';

import { createClient } from '@/lib/supabase/client';
import { countActiveEmergencyTriages } from '@/lib/hospital/operations/emergency-triage-sync';
import type { SidebarBadgeCounts } from './types';

export function useHospitalOpsRealtime(onRefresh: () => void) {
  const [connected, setConnected] = useState(false);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    const channel = supabase
      .channel('hospital-ops-hub')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () =>
        onRefreshRef.current(),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emergency_triage' }, () =>
        onRefreshRef.current(),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prescriptions' }, () =>
        onRefreshRef.current(),
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_events' }, () =>
        onRefreshRef.current(),
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_notifications' }, () =>
        onRefreshRef.current(),
      )
      .subscribe((status: string) => {
        if (mounted) setConnected(status === 'SUBSCRIBED');
      });

    return () => {
      mounted = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  return { latencyMs: null as number | null, connected };
}

export async function fetchSidebarBadgeCounts(): Promise<SidebarBadgeCounts> {
  const supabase = createClient();

  const [apptRes, bedRes, rxRes, invRes] = await Promise.all([
    supabase.from('appointments').select('id', { count: 'exact', head: true }).in('status', [
      'BOOKED',
      'SCHEDULED',
      'CHECKED_IN',
      'IN_CONSULTATION',
    ]),
    supabase
      .from('hospital_beds')
      .select('id', { count: 'exact', head: true })
      .eq('is_occupied', true),
    supabase.from('prescriptions').select('id', { count: 'exact', head: true }).neq('status', 'DISPENSED'),
    supabase.from('inventory_items').select('id', { count: 'exact', head: true }),
  ]);

  const emergencyCount = await countActiveEmergencyTriages(supabase);

  const lowStockRes = await supabase.from('inventory_items').select('quantity_in_stock, reorder_level');

  let lowStock = 0;
  for (const row of lowStockRes.data ?? []) {
    if (Number(row.quantity_in_stock) <= Number(row.reorder_level ?? 10)) lowStock += 1;
  }

  return {
    opd: apptRes.count ?? 0,
    emergency: emergencyCount,
    ipd: bedRes.count ?? 0,
    pharmacy: rxRes.count ?? 0,
    inventory: lowStock || invRes.count || 0,
  };
}
