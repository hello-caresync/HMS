'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from './context/AuthProvider';
import { APP_ROUTES } from './lib/routes';

/** Root entry — route authenticated staff to Command Center, others to login. */
export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    router.replace(isAuthenticated ? APP_ROUTES.dashboard : APP_ROUTES.login);
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F5EF] text-[#52796F]">
      <p className="text-sm font-bold">Loading hospital gateway…</p>
    </div>
  );
}
