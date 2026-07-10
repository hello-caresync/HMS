'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { createActiveShift, INITIAL_CLOSED_SHIFT, SEED_TRANSACTIONS } from '../lib/seedPayments';
import type {
  CashierShift,
  CollectionCounters,
  LedgerTransaction,
} from '../types';
import { computeCounters, computeExpectedCash } from '../types';

type PaymentsContextValue = {
  shift: CashierShift;
  transactions: LedgerTransaction[];
  counters: CollectionCounters;
  expectedCash: number;
  openShift: (openingFloat: number) => { success: boolean; error?: string };
  closeShift: (actualDrawerCash: number) => { success: boolean; error?: string; discrepancy?: number };
  initiateRefund: (transactionId: string, reason: string) => { success: boolean; error?: string };
  getTransaction: (id: string) => LedgerTransaction | undefined;
};

const PaymentsContext = createContext<PaymentsContextValue | null>(null);

export function PaymentsProvider({ children }: { children: React.ReactNode }) {
  const [shift, setShift] = useState<CashierShift>(INITIAL_CLOSED_SHIFT);
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);

  const counters = useMemo(() => computeCounters(transactions), [transactions]);

  const expectedCash = useMemo(() => {
    if (shift.status !== 'Active' || shift.openingFloat == null) return 0;
    return computeExpectedCash(shift.openingFloat, transactions);
  }, [shift, transactions]);

  const openShift = useCallback(
    (openingFloat: number) => {
      if (shift.status === 'Active') {
        return { success: false, error: 'A shift is already active. Close it before opening a new one.' };
      }
      if (openingFloat < 0) {
        return { success: false, error: 'Opening float cannot be negative.' };
      }

      const newShift = createActiveShift(openingFloat);
      setShift(newShift);
      setTransactions([...SEED_TRANSACTIONS].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      ));
      return { success: true };
    },
    [shift.status],
  );

  const closeShift = useCallback(
    (actualDrawerCash: number) => {
      if (shift.status !== 'Active') {
        return { success: false, error: 'No active shift to close.' };
      }
      if (shift.openingFloat == null) {
        return { success: false, error: 'Shift has no opening float recorded.' };
      }

      const expected = computeExpectedCash(shift.openingFloat, transactions);
      const discrepancy = Math.round((actualDrawerCash - expected) * 100) / 100;

      setShift({
        ...shift,
        status: 'Closed',
        closingExpectedCash: expected,
        closingActualCash: actualDrawerCash,
        closingDiscrepancy: discrepancy,
        closedAt: new Date().toISOString(),
      });

      return { success: true, discrepancy };
    },
    [shift, transactions],
  );

  const initiateRefund = useCallback(
    (transactionId: string, reason: string) => {
      if (shift.status !== 'Active') {
        return { success: false, error: 'Cannot process refunds while shift is closed.' };
      }
      if (!reason.trim()) {
        return { success: false, error: 'Refund reason is required.' };
      }

      const tx = transactions.find((t) => t.id === transactionId);
      if (!tx) return { success: false, error: 'Transaction not found.' };
      if (tx.status === 'Refunded') {
        return { success: false, error: 'Transaction already refunded.' };
      }

      setTransactions((prev) =>
        prev.map((t) =>
          t.id === transactionId
            ? {
                ...t,
                status: 'Refunded' as const,
                refundReason: reason.trim(),
                refundedAt: new Date().toISOString(),
              }
            : t,
        ),
      );

      return { success: true };
    },
    [shift.status, transactions],
  );

  const getTransaction = useCallback(
    (id: string) => transactions.find((t) => t.id === id),
    [transactions],
  );

  const value = useMemo(
    () => ({
      shift,
      transactions,
      counters,
      expectedCash,
      openShift,
      closeShift,
      initiateRefund,
      getTransaction,
    }),
    [shift, transactions, counters, expectedCash, openShift, closeShift, initiateRefund, getTransaction],
  );

  return <PaymentsContext.Provider value={value}>{children}</PaymentsContext.Provider>;
}

export function usePayments(): PaymentsContextValue {
  const ctx = useContext(PaymentsContext);
  if (!ctx) throw new Error('usePayments must be used within PaymentsProvider');
  return ctx;
}
