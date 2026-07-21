'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getSupabaseBrowserClient } from '@/lib/supabase';

/** Subscribes to Supabase Realtime for ER alerts and STAT lab orders. */
export function useSupabaseClinicalRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel('doctor-clinical-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'emergency_alerts' },
        (payload) => {
          toast.error('Emergency alert', {
            description: String((payload.new as { title?: string }).title ?? 'New ER case'),
          });
          queryClient.invalidateQueries({ queryKey: ['emergency'] });
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'lab_orders' },
        (payload) => {
          const row = payload.new as { urgency?: string };
          if (row.urgency === 'STAT') {
            toast.warning('STAT lab order', { description: 'New STAT lab order received' });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['emergency'] });
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
