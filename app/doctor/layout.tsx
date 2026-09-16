'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import DoctorProviders from '@/components/doctor/DoctorProviders';

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30000,
            gcTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <DoctorProviders>
        <div className="min-h-screen w-full overscroll-none bg-slate-50 text-slate-800 antialiased selection:bg-teal-500 selection:text-white">
          {children}
        </div>
      </DoctorProviders>
    </QueryClientProvider>
  );
}
