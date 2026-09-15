'use client';

import { useEffect, type ReactNode } from 'react';

import { useVendorRealtime } from '@/lib/vendor/hooks/useVendorRealtime';
import { fetchVendorPartnerHospitals } from '@/lib/vendor/hospitals';
import { useVendorAppStore } from '@/lib/vendor/store/vendor-app-store';
import { supabase } from '@/lib/supabaseClient';

export function VendorProviders({ children }: { children: ReactNode }) {
  const theme = useVendorAppStore((s) => s.theme);
  const setHospitals = useVendorAppStore((s) => s.setHospitals);
  useVendorRealtime();

  useEffect(() => {
    if (!supabase) return;
    void fetchVendorPartnerHospitals(supabase).then(setHospitals);
  }, [setHospitals]);

  return (
    <div className={theme === 'dark' ? 'dark' : ''} data-vendor-theme={theme}>
      {children}
    </div>
  );
}
