'use client';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

import { SUPER_ADMIN_LOGIN_PATH } from '@/lib/auth/superAdminAuth';

export default function LegacyPlatformOpsRedirect() {
  useEffect(() => {
    window.location.replace(`${SUPER_ADMIN_LOGIN_PATH}/`);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
    </div>
  );
}
