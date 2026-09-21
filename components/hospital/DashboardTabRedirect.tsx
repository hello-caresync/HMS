'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const DASHBOARD_TAB_STORAGE_KEY = 'regal_dashboard_tab';

export function DashboardTabRedirect({ tab }: { tab: string }) {
  const router = useRouter();

  useEffect(() => {
    sessionStorage.setItem(DASHBOARD_TAB_STORAGE_KEY, tab);
    router.replace('/dashboard');
  }, [router, tab]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-xs font-bold text-slate-500">
      Opening {tab} workspace…
    </div>
  );
}
