'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { hospitalDeskLoginUrl } from '@/lib/auth/hospital-desk-session';

/**
 * Legacy `/login` shim — client redirect avoids Next.js dev Performance.measure
 * errors from instant server-side redirect() on this route.
 */
function LegacyLoginRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const redirectParam = searchParams.get('redirect') ?? searchParams.get('next');
    const destination = hospitalDeskLoginUrl(
      redirectParam && redirectParam.startsWith('/') ? redirectParam : undefined,
    );
    router.replace(destination);
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a2e47]">
      <div className="flex flex-col items-center gap-3 text-cyan-100">
        <Loader2 className="h-7 w-7 animate-spin text-cyan-300" aria-hidden />
        <p className="text-sm font-semibold tracking-wide">Redirecting to hospital login…</p>
      </div>
    </div>
  );
}

export default function LegacyLoginRedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0a2e47]">
          <Loader2 className="h-7 w-7 animate-spin text-cyan-300" aria-hidden />
        </div>
      }
    >
      <LegacyLoginRedirectInner />
    </Suspense>
  );
}
