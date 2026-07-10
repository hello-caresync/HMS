'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  SEED_COMPLIANCE,
  SEED_PAYMENT_LEDGER,
  SEED_PERFORMANCE,
  SEED_TRACKED_POS,
  VENDOR_OPTIONS,
} from '../lib/seedVendorHub';
import type {
  PaymentLedgerRow,
  TrackedPO,
  VendorComplianceRecord,
  VendorHubTab,
  VendorPerformanceRow,
} from '../types';

type VendorHubContextValue = {
  activeTab: VendorHubTab;
  setActiveTab: (tab: VendorHubTab) => void;
  trackedPOs: TrackedPO[];
  performance: VendorPerformanceRow[];
  compliance: VendorComplianceRecord[];
  paymentLedger: PaymentLedgerRow[];
  vendorOptions: typeof VENDOR_OPTIONS;
  selectedVendorId: string;
  setSelectedVendorId: (id: string) => void;
  filteredPayments: PaymentLedgerRow[];
  livePulse: boolean;
  lastLiveUpdate: string;
};

const VendorHubContext = createContext<VendorHubContextValue | null>(null);

function advanceInTransit(pos: TrackedPO[]): TrackedPO[] {
  const now = new Date().toISOString();
  let updated = false;

  const next = pos.map((po) => {
    if (po.deliveryStatus !== 'In-Transit') return po;
    const bump = Math.min(95, po.transitProgress + Math.floor(Math.random() * 8) + 3);
    if (bump === po.transitProgress) return po;
    updated = true;

    if (bump >= 90) {
      return {
        ...po,
        deliveryStatus: 'At Loading Dock' as const,
        transitProgress: 88,
        lastUpdated: now,
      };
    }
    return { ...po, transitProgress: bump, lastUpdated: now };
  });

  return updated ? next : pos;
}

export function VendorHubProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<VendorHubTab>('tracking');
  const [trackedPOs, setTrackedPOs] = useState<TrackedPO[]>(SEED_TRACKED_POS);
  const [performance] = useState<VendorPerformanceRow[]>(SEED_PERFORMANCE);
  const [compliance] = useState<VendorComplianceRecord[]>(SEED_COMPLIANCE);
  const [paymentLedger, setPaymentLedger] = useState<PaymentLedgerRow[]>(SEED_PAYMENT_LEDGER);
  const [selectedVendorId, setSelectedVendorId] = useState(VENDOR_OPTIONS[0].id);
  const [livePulse, setLivePulse] = useState(false);
  const [lastLiveUpdate, setLastLiveUpdate] = useState(new Date().toISOString());

  const simulateLiveUpdates = useCallback(() => {
    setTrackedPOs((prev) => advanceInTransit(prev));
    setPaymentLedger((prev) => {
      const idx = prev.findIndex((p) => p.paymentStage === 'Processing Gateway');
      if (idx === -1) return prev;
      if (Math.random() > 0.6) {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          paymentStage: 'Settled',
          updatedAt: new Date().toISOString(),
        };
        return copy;
      }
      return prev.map((p, i) =>
        i === idx ? { ...p, updatedAt: new Date().toISOString() } : p,
      );
    });
    setLastLiveUpdate(new Date().toISOString());
    setLivePulse(true);
    window.setTimeout(() => setLivePulse(false), 1200);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(simulateLiveUpdates, 9000);
    return () => window.clearInterval(interval);
  }, [simulateLiveUpdates]);

  const filteredPayments = useMemo(
    () => paymentLedger.filter((p) => p.vendorId === selectedVendorId),
    [paymentLedger, selectedVendorId],
  );

  const value = useMemo(
    () => ({
      activeTab,
      setActiveTab,
      trackedPOs,
      performance,
      compliance,
      paymentLedger,
      vendorOptions: VENDOR_OPTIONS,
      selectedVendorId,
      setSelectedVendorId,
      filteredPayments,
      livePulse,
      lastLiveUpdate,
    }),
    [
      activeTab,
      trackedPOs,
      performance,
      compliance,
      paymentLedger,
      selectedVendorId,
      filteredPayments,
      livePulse,
      lastLiveUpdate,
    ],
  );

  return <VendorHubContext.Provider value={value}>{children}</VendorHubContext.Provider>;
}

export function useVendorHub(): VendorHubContextValue {
  const ctx = useContext(VendorHubContext);
  if (!ctx) throw new Error('useVendorHub must be used within VendorHubProvider');
  return ctx;
}
