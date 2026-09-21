'use client';

import { useSearchParams } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

import { getAdminRedirectPath } from '@/lib/admin/auth';

import CommandCenterPanel from './CommandCenterPanel';
import LoginPortalPanel from './LoginPortalPanel';

function SystemStatusPill() {
  return (
    <div className="flex items-center gap-2 rounded-full border border-[rgba(16,185,129,0.25)] bg-[rgba(16,185,129,0.10)] px-3.5 py-1.5 text-[10px] font-semibold tracking-[0.12em] sm:text-[11px]" aria-live="polite">
      <ShieldCheck className="h-3.5 w-3.5 text-[#10B981]" aria-hidden="true" />
      <span className="relative flex h-2 w-2" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10B981] opacity-50" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#10B981]" />
      </span>
      <span className="text-[#10B981]">SYSTEM OPERATIONAL</span>
    </div>
  );
}

export default function RegalAdminLogin() {
  const searchParams = useSearchParams();
  const reducedMotion = useReducedMotion();
  const redirectUrl = getAdminRedirectPath(searchParams.get('redirect'));

  return (
    <main className="relative flex h-[100svh] max-h-[100svh] min-h-[100svh] w-full flex-col overflow-hidden lg:flex-row">
      <div className="absolute right-0 top-0 z-30 p-[clamp(0.75rem,1.5vh,1.5rem)] sm:p-4 lg:p-5">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
          <SystemStatusPill />
        </motion.div>
      </div>

      <div
        className="pointer-events-none absolute inset-y-0 left-[55%] z-20 hidden w-24 -translate-x-1/2 lg:block"
        aria-hidden="true"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.18), rgba(139,92,246,0.12), transparent)',
          filter: 'blur(28px)',
        }}
      />

      <CommandCenterPanel reducedMotion={!!reducedMotion} />
      <LoginPortalPanel redirectUrl={redirectUrl} />
    </main>
  );
}
