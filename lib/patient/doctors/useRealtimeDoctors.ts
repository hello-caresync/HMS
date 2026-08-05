'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useEcosystemStore } from '@/lib/ecosystem/store';
import type { EcosystemDoctor } from '@/lib/ecosystem/types';
import {
  fallbackDoctorsFromSeed,
  mapSupabaseDoctor,
  type SupabaseDoctorRow,
} from '@/lib/patient/doctors/fetchDoctors';
import { getSupabaseBrowserClient } from '@/lib/supabase';

export type DoctorsDataSource = 'supabase' | 'local' | 'idle';

export function useRealtimeDoctors() {
  const [doctors, setDoctors] = useState<EcosystemDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<DoctorsDataSource>('idle');
  const [error, setError] = useState<string | null>(null);
  const fetchIdRef = useRef(0);

  const fetchDoctors = useCallback(async () => {
    const fetchId = ++fetchIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        const local = useEcosystemStore.getState().doctors.length
          ? useEcosystemStore.getState().doctors
          : fallbackDoctorsFromSeed();
        if (fetchId === fetchIdRef.current) {
          setDoctors(local);
          setSource('local');
        }
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('doctors')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;

      const rows = (data ?? []) as SupabaseDoctorRow[];
      const mapped =
        rows.length > 0 ? rows.map(mapSupabaseDoctor) : fallbackDoctorsFromSeed();

      if (fetchId === fetchIdRef.current) {
        setDoctors(mapped);
        setSource(rows.length > 0 ? 'supabase' : 'local');
        useEcosystemStore.setState({ doctors: mapped });
      }
    } catch (err) {
      const local = useEcosystemStore.getState().doctors.length
        ? useEcosystemStore.getState().doctors
        : fallbackDoctorsFromSeed();
      if (fetchId === fetchIdRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load doctors');
        setDoctors(local);
        setSource('local');
      }
    } finally {
      if (fetchId === fetchIdRef.current) setLoading(false);
    }
  }, []);

  const fetchRef = useRef(fetchDoctors);
  fetchRef.current = fetchDoctors;

  useEffect(() => {
    void fetchDoctors();
  }, [fetchDoctors]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel('doctors_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'doctors' },
        () => {
          void fetchRef.current();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  return {
    doctors,
    loading,
    source,
    error,
    refreshDoctors: fetchDoctors,
  };
}
