'use client';

import { useEffect, useMemo, useState } from 'react';

import { fetchEcosystemActivity } from '@/lib/ecosystem/ecosystem-hub';
import { fetchHospitalMetricsFromDb } from '@/lib/shared/services/metrics/hospital-metrics.service';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { fetchHospitalData } from './services/hospital-db';
import { fetchHospitalProfile } from './services/hospital-profile';
import { useHospitalStore } from './store';

export function useHospitalInit() {
  useEffect(() => {
    useHospitalStore.getState().hydrateFromSeed();
    void (async () => {
      await fetchHospitalProfile();
      await fetchHospitalData();
      await fetchEcosystemActivity();
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        const staff = useHospitalStore.getState().staff;
        const metrics = await fetchHospitalMetricsFromDb(supabase, staff);
        useHospitalStore.setState({ metrics });
      } else {
        useHospitalStore.getState().recomputeMetrics();
      }
    })();
  }, []);
}

export function useHospitalSetupRequired() {
  const [required, setRequired] = useState<boolean | null>(null);
  useEffect(() => {
    void fetchHospitalProfile().then(({ setupRequired }) => setRequired(setupRequired));
  }, []);
  return required;
}

export function useHospitalMetrics() {
  return useHospitalStore((s) => s.metrics);
}

export function useUnreadHospitalNotifications() {
  const notifications = useHospitalStore((s) => s.notifications);
  return useMemo(() => notifications.filter((n) => !n.readStatus).length, [notifications]);
}
