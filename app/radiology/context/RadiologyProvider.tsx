'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { SEED_RADIOLOGY_ORDERS } from '../lib/seedRadiology';
import type { RadiologyModality, RadiologyOrder } from '../types';

type FinalizedReport = {
  order: RadiologyOrder;
  emrPayload: string;
};

type RadiologyContextValue = {
  orders: RadiologyOrder[];
  modalityFilter: RadiologyModality | 'All';
  setModalityFilter: (m: RadiologyModality | 'All') => void;
  filteredOrders: RadiologyOrder[];
  uploadScan: (orderId: string, fileName: string) => void;
  saveFindings: (orderId: string, findings: string) => void;
  finalizeReport: (orderId: string, findings: string, radiologistName?: string) => FinalizedReport | null;
  getOrder: (orderId: string) => RadiologyOrder | undefined;
  lastFinalized: FinalizedReport | null;
};

const RadiologyContext = createContext<RadiologyContextValue | null>(null);

export function RadiologyProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<RadiologyOrder[]>(SEED_RADIOLOGY_ORDERS);
  const [modalityFilter, setModalityFilter] = useState<RadiologyModality | 'All'>('All');
  const [lastFinalized, setLastFinalized] = useState<FinalizedReport | null>(null);

  const filteredOrders = useMemo(
    () =>
      modalityFilter === 'All'
        ? orders
        : orders.filter((o) => o.modality === modalityFilter),
    [orders, modalityFilter],
  );

  const uploadScan = useCallback((orderId: string, fileName: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'Ready for Interpretation' as const,
              uploadedFileName: fileName,
              uploadedAt: new Date().toISOString(),
            }
          : o,
      ),
    );
  }, []);

  const saveFindings = useCallback((orderId: string, findings: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, status: 'In Interpretation' as const, findings, impression: findings }
          : o,
      ),
    );
  }, []);

  const finalizeReport = useCallback(
    (orderId: string, findings: string, radiologistName = 'Dr. Radiologist'): FinalizedReport | null => {
      const order = orders.find((o) => o.id === orderId);
      if (!order || order.status === 'Completed') return null;

      const finalized: RadiologyOrder = {
        ...order,
        status: 'Completed',
        findings,
        impression: findings,
        finalizedAt: new Date().toISOString(),
        finalizedBy: radiologistName,
        emrAppended: true,
      };

      const emrPayload = [
        '--- RADIOLOGY REPORT (PDF BLOCK) ---',
        `Patient: ${finalized.patientName} (${finalized.uhid})`,
        `Modality: ${finalized.modality}`,
        `Study: ${finalized.scanDetails}`,
        `File: ${finalized.uploadedFileName ?? 'N/A'}`,
        '',
        'IMPRESSION / FINDINGS:',
        findings,
        '',
        `Signed: ${radiologistName} · ${finalized.finalizedAt}`,
        'Appended to Patient EMR ✓',
      ].join('\n');

      setOrders((prev) => prev.map((o) => (o.id === orderId ? finalized : o)));
      const report: FinalizedReport = { order: finalized, emrPayload };
      setLastFinalized(report);
      return report;
    },
    [orders],
  );

  const getOrder = useCallback((orderId: string) => orders.find((o) => o.id === orderId), [orders]);

  const value = useMemo(
    () => ({
      orders,
      modalityFilter,
      setModalityFilter,
      filteredOrders,
      uploadScan,
      saveFindings,
      finalizeReport,
      getOrder,
      lastFinalized,
    }),
    [
      orders,
      modalityFilter,
      filteredOrders,
      uploadScan,
      saveFindings,
      finalizeReport,
      getOrder,
      lastFinalized,
    ],
  );

  return <RadiologyContext.Provider value={value}>{children}</RadiologyContext.Provider>;
}

export function useRadiology(): RadiologyContextValue {
  const ctx = useContext(RadiologyContext);
  if (!ctx) throw new Error('useRadiology must be used within RadiologyProvider');
  return ctx;
}
