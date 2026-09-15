'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Loader2, ShieldOff } from 'lucide-react';

import { readStaffCredentialsAccess } from '@/lib/auth/staff-credentials-access';

export default function StaffCredentialsLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<'checking' | 'allowed' | 'denied'>('checking');

  useEffect(() => {
    const access = readStaffCredentialsAccess();
    if (access.allowed) {
      setState('allowed');
      return;
    }
    setState('denied');
    const timer = window.setTimeout(() => {
      router.replace('/dashboard?unauthorized=staff-credentials');
    }, 2800);
    return () => window.clearTimeout(timer);
  }, [router]);

  if (state === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1220]">
        <Loader2 className="h-7 w-7 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (state === 'denied') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1220] p-6">
        <div className="max-w-md rounded-2xl border border-rose-500/30 bg-slate-900/90 p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-400">
            <ShieldOff className="h-7 w-7" />
          </div>
          <h1 className="text-lg font-black text-white">Access Restricted</h1>
          <p className="mt-2 text-sm text-slate-400">
            Staff credential provisioning is limited to hospital administrators. Your role does not
            have vault access.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-200">
            <AlertTriangle className="h-4 w-4" />
            Redirecting to dashboard...
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
