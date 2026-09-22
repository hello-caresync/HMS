'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldOff } from 'lucide-react';

import { readStaffCredentialsAccess } from '@/lib/auth/staff-credentials-access';

/** Alias route — canonical vault is `/dashboard/staff-credentials` (admin-only). */
export default function HospitalStaffCredentialsAliasPage() {
  const router = useRouter();

  useEffect(() => {
    const access = readStaffCredentialsAccess();
    if (access.allowed) {
      router.replace('/dashboard/staff-credentials');
      return;
    }
    router.replace('/dashboard?unauthorized=staff-credentials');
  }, [router]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-8 text-center">
      <ShieldOff className="h-8 w-8 text-rose-500" />
      <p className="text-sm font-semibold text-slate-700">Verifying administrator privileges…</p>
      <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
    </div>
  );
}
