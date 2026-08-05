'use client';

import { useOpdRealtime } from '@/lib/opd/useOpdRealtime';

/** Mounts OPD realtime listeners inside the patient app shell */
export function OpdRealtimeBridge() {
  useOpdRealtime();
  return null;
}
