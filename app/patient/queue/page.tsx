'use client';

import { Suspense } from 'react';

import LiveQueueContent from './LiveQueueContent';

function QueueFallback() {
  return (
    <div className="mx-auto max-w-xl p-6">
      <div className="flex h-64 animate-pulse items-center justify-center rounded-3xl border border-[#E2D2C8] bg-white/80">
        <p className="text-sm font-bold text-[#8E7692]">Loading queue tracker…</p>
      </div>
    </div>
  );
}

export default function LiveQueuePage() {
  return (
    <Suspense fallback={<QueueFallback />}>
      <LiveQueueContent />
    </Suspense>
  );
}
