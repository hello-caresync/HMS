'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Toaster } from 'sonner';

import { useSupabaseClinicalRealtime } from '@/lib/doctor/hooks/useSupabaseClinicalRealtime';

function RealtimeBridge() {
  useSupabaseClinicalRealtime();
  return null;
}

export default function DoctorProviders({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      <RealtimeBridge />
      {children}
      <Toaster richColors position="top-right" closeButton />
    </QueryClientProvider>
  );
}
