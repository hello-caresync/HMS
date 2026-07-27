'use client';

import { useEffect, useRef } from 'react';

import { useVendorAppStore } from '@/lib/vendor/store/vendor-app-store';

/** Mock realtime channel — production: replace with WebSocket or EventSource. */
export function useVendorRealtime() {
  const setConnected = useVendorAppStore((s) => s.setRealtimeConnected);
  const tickRef = useRef(0);

  useEffect(() => {
    setConnected(true);
    const interval = window.setInterval(() => {
      tickRef.current += 1;
      setConnected(true);
    }, 25000);
    return () => {
      window.clearInterval(interval);
      setConnected(false);
    };
  }, [setConnected]);
}
