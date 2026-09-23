'use client';

import { useEffect } from 'react';

export default function PlatformRootRedirect() {
  useEffect(() => {
    window.location.replace('/super-vault-access/');
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1e2433] text-sm font-semibold text-slate-300">
      Redirecting to Super Vault Access...
    </div>
  );
}