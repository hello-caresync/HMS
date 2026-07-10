'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { getTestByCode, SEED_LAB_ORDERS } from '../lib/seedLab';
import type { LabOrder, LabResultValue } from '../types';
import { evaluateResult, generateBarcode } from '../types';

type LabContextValue = {
  orders: LabOrder[];
  pendingCollection: LabOrder[];
  awaitingResults: LabOrder[];
  pendingApproval: LabOrder[];
  collectSample: (orderId: string) => string;
  updateResult: (orderId: string, testCode: string, value: number | null) => void;
  submitForApproval: (orderId: string) => void;
  approveReport: (orderId: string, pathologistName?: string) => void;
  getOrder: (orderId: string) => LabOrder | undefined;
};

const LabContext = createContext<LabContextValue | null>(null);

export function LabProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<LabOrder[]>(SEED_LAB_ORDERS);

  const pendingCollection = useMemo(
    () => orders.filter((o) => o.status === 'pending_collection'),
    [orders],
  );
  const awaitingResults = useMemo(
    () => orders.filter((o) => o.status === 'awaiting_results'),
    [orders],
  );
  const pendingApproval = useMemo(
    () => orders.filter((o) => o.status === 'pending_approval'),
    [orders],
  );

  const collectSample = useCallback((orderId: string): string => {
    const barcode = generateBarcode();
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'awaiting_results' as const,
              barcode,
              collectedAt: new Date().toISOString(),
            }
          : o,
      ),
    );
    return barcode;
  }, []);

  const updateResult = useCallback((orderId: string, testCode: string, value: number | null) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const test = getTestByCode(testCode);
        const evaluation = test ? evaluateResult(test, value) : { isCritical: false, alertLevel: 'normal' as const };
        const existing = o.results.filter((r) => r.testCode !== testCode);
        const updated: LabResultValue = {
          testCode,
          value,
          isCritical: evaluation.isCritical,
          alertLevel: evaluation.alertLevel,
        };
        return { ...o, results: [...existing, updated] };
      }),
    );
  }, []);

  const submitForApproval = useCallback((orderId: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, status: 'pending_approval' as const, submittedAt: new Date().toISOString() }
          : o,
      ),
    );
  }, []);

  const approveReport = useCallback((orderId: string, pathologistName = 'Dr. Pathologist') => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'approved' as const,
              approvedAt: new Date().toISOString(),
              approvedBy: pathologistName,
            }
          : o,
      ),
    );
  }, []);

  const getOrder = useCallback((orderId: string) => orders.find((o) => o.id === orderId), [orders]);

  const value = useMemo(
    () => ({
      orders,
      pendingCollection,
      awaitingResults,
      pendingApproval,
      collectSample,
      updateResult,
      submitForApproval,
      approveReport,
      getOrder,
    }),
    [
      orders,
      pendingCollection,
      awaitingResults,
      pendingApproval,
      collectSample,
      updateResult,
      submitForApproval,
      approveReport,
      getOrder,
    ],
  );

  return <LabContext.Provider value={value}>{children}</LabContext.Provider>;
}

export function useLab(): LabContextValue {
  const ctx = useContext(LabContext);
  if (!ctx) throw new Error('useLab must be used within LabProvider');
  return ctx;
}
