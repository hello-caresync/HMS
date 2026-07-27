'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';

import { getDevSessionHeaders } from '@/lib/doctor/auth/dev-auth';

/** SSE fallback when Supabase realtime is not configured */
export function useSseClinicalRealtime() {
  const qc = useQueryClient();

  useEffect(() => {
    const headers = getDevSessionHeaders();
    const token = headers.Authorization?.replace('Bearer ', '');
    const doctorId = headers['x-doctor-id'];
    if (!token && !doctorId) return;

    const qs = new URLSearchParams();
    if (token) qs.set('access_token', token);
    if (doctorId) qs.set('doctor_id', doctorId);
    const url = `/api/realtime/stream?${qs.toString()}`;

    const es = new EventSource(url);

    es.addEventListener('update', () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['opd', 'queue'] });
      qc.invalidateQueries({ queryKey: ['calendar'] });
      qc.invalidateQueries({ queryKey: ['doctor-schedule'] });
      toast.message('Live update', { description: 'Schedule or notifications changed' });
    });

    es.onerror = () => {
      es.close();
    };

    return () => es.close();
  }, [qc]);
}
