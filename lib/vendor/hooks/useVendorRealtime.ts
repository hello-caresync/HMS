'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useVendorAppStore } from '@/lib/vendor/store/vendor-app-store';

/** Supabase realtime for Vendor ↔ Hospital PO sync */
export function useVendorRealtime() {
  const setConnected = useVendorAppStore((s) => s.setRealtimeConnected);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setConnected(false);
      return;
    }

    const bump = () => {
      setConnected(true);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vendor:realtime-refresh'));
      }
    };

    const poChannel = supabase
      .channel('vendor-purchase-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'purchase_orders' },
        (payload: RealtimePostgresChangesPayload<any>) => {
          const row = (payload.new ?? payload.old) as { status?: string; vendor_name?: string } | null;
          if (payload.eventType === 'INSERT') {
            toast.info('New purchase order', {
              description: 'Issued from Hospital Operations Console',
            });
          } else if (row?.status) {
            toast.info('PO status updated', { description: row.status });
          }
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(bump, 300);
        },
      )
      .subscribe((status: string) => {
        setConnected(status === 'SUBSCRIBED');
      });

    const invChannel = supabase
      .channel('vendor-invoices')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'invoices' },
        () => {
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(bump, 300);
        },
      )
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setConnected(false);
      void supabase.removeChannel(poChannel);
      void supabase.removeChannel(invChannel);
    };
  }, [setConnected]);
}
