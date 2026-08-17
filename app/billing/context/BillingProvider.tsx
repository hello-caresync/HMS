'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { formatINR } from '@/lib/utils/currency';

import { computeInvoiceTotals, validateSplitTotal } from '../lib/calculations';
import {
  createDraftInvoice,
  PATIENT_LOOKUP,
  SEED_CLAIMS_AWAITING,
  SEED_CLAIMS_COUNT,
  SEED_DEPARTMENT_REVENUE,
  SEED_DOCTOR_REVENUE,
  SEED_PENDING_BILLS_COUNT,
  SEED_PENDING_BILLS_TOTAL,
  SEED_PENDING_INVOICES,
  SEED_TODAYS_COLLECTION,
  SEED_TOTAL_GST,
} from '../lib/seedBilling';
import type {
  BillingType,
  DepartmentRevenueRow,
  DoctorRevenueRow,
  FinancialMetrics,
  InvoiceLineItem,
  PatientInvoice,
  PaymentAttempt,
  PaymentMethod,
  SplitPaymentLine,
  TransactionStatus,
} from '../types';
import { generatePaymentId } from '../types';

type SubmitPaymentPayload = {
  splitEnabled: boolean;
  splits: SplitPaymentLine[];
  primaryMethod: PaymentMethod;
  singleAmount: number;
  tpaPreAuthorized: boolean;
  tpaReference?: string;
};

type BillingContextValue = {
  patientLookup: typeof PATIENT_LOOKUP;
  currentInvoice: PatientInvoice | null;
  ledgerInvoices: PatientInvoice[];
  doctorRevenue: DoctorRevenueRow[];
  departmentRevenue: DepartmentRevenueRow[];
  metrics: FinancialMetrics;
  selectPatient: (patientId: string) => void;
  setBillingType: (type: BillingType) => void;
  setDiscount: (amount: number) => void;
  updateLineItem: (lineId: string, patch: Partial<InvoiceLineItem>) => void;
  getTotals: () => ReturnType<typeof computeInvoiceTotals>;
  submitPayment: (payload: SubmitPaymentPayload) => {
    success: boolean;
    error?: string;
    transactionStatus?: TransactionStatus;
  };
  resetInvoice: () => void;
};

const BillingContext = createContext<BillingContextValue | null>(null);

export function BillingProvider({ children }: { children: React.ReactNode }) {
  const [currentInvoice, setCurrentInvoice] = useState<PatientInvoice | null>(() =>
    createDraftInvoice(PATIENT_LOOKUP[0]?.patientId ?? ''),
  );
  const [ledgerInvoices, setLedgerInvoices] = useState<PatientInvoice[]>(SEED_PENDING_INVOICES);
  const [todaysCollection, setTodaysCollection] = useState(SEED_TODAYS_COLLECTION);
  const [pendingBillsTotal, setPendingBillsTotal] = useState(SEED_PENDING_BILLS_TOTAL);
  const [pendingBillsCount, setPendingBillsCount] = useState(SEED_PENDING_BILLS_COUNT);
  const [claimsAwaiting, setClaimsAwaiting] = useState(SEED_CLAIMS_AWAITING);
  const [claimsCount, setClaimsCount] = useState(SEED_CLAIMS_COUNT);
  const [totalGstCollected, setTotalGstCollected] = useState(SEED_TOTAL_GST);
  const [doctorRevenue, setDoctorRevenue] = useState(SEED_DOCTOR_REVENUE);
  const [departmentRevenue, setDepartmentRevenue] = useState(SEED_DEPARTMENT_REVENUE);

  const getTotals = useCallback(() => {
    if (!currentInvoice) {
      return { subtotal: 0, totalTax: 0, discount: 0, grandTotal: 0 };
    }
    return computeInvoiceTotals(currentInvoice.lineItems, currentInvoice.discount);
  }, [currentInvoice]);

  const selectPatient = useCallback((patientId: string) => {
    const draft = createDraftInvoice(patientId);
    if (draft) setCurrentInvoice(draft);
  }, []);

  const setBillingType = useCallback((type: BillingType) => {
    setCurrentInvoice((prev) => (prev ? { ...prev, billingType: type } : prev));
  }, []);

  const setDiscount = useCallback((amount: number) => {
    setCurrentInvoice((prev) => (prev ? { ...prev, discount: Math.max(0, amount) } : prev));
  }, []);

  const updateLineItem = useCallback((lineId: string, patch: Partial<InvoiceLineItem>) => {
    setCurrentInvoice((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        lineItems: prev.lineItems.map((l) => (l.id === lineId ? { ...l, ...patch } : l)),
      };
    });
  }, []);

  const submitPayment = useCallback(
    (payload: SubmitPaymentPayload) => {
      if (!currentInvoice) return { success: false, error: 'No active invoice' };

      const totals = computeInvoiceTotals(currentInvoice.lineItems, currentInvoice.discount);
      const { grandTotal } = totals;

      let paymentAmount = payload.singleAmount;
      let splits = payload.splits;

      if (payload.splitEnabled) {
        const activeSplits = payload.splits.filter((s) => s.amount > 0);
        const validation = validateSplitTotal(activeSplits, grandTotal);
        if (!validation.valid) {
          return {
            success: false,
            error: `Split total ₹${validation.splitSum.toLocaleString('en-IN')} must equal Grand Total ₹${grandTotal.toLocaleString('en-IN')} (Δ ₹${Math.abs(validation.difference).toFixed(2)})`,
          };
        }
        splits = activeSplits;
        paymentAmount = validation.splitSum;
      } else if (Math.abs(paymentAmount - grandTotal) > 0.01) {
        return {
          success: false,
          error: `Payment amount must match Grand Total ${formatINR(grandTotal)}`,
        };
      }

      const needsTpa =
        (currentInvoice.billingType === 'Insurance' || currentInvoice.billingType === 'Corporate') &&
        payload.tpaPreAuthorized;

      const transactionStatus: TransactionStatus = needsTpa ? 'Authorized' : 'Captured';
      const invoiceStatus = needsTpa ? 'Claim Pending' : 'Settled';

      const payment: PaymentAttempt = {
        id: generatePaymentId(),
        splitEnabled: payload.splitEnabled,
        splits: payload.splitEnabled ? splits : [{ method: payload.primaryMethod, amount: grandTotal }],
        primaryMethod: payload.primaryMethod,
        tpaPreAuthorized: payload.tpaPreAuthorized,
        tpaReference: payload.tpaReference,
        status: transactionStatus,
        capturedAt: new Date().toISOString(),
      };

      const settled: PatientInvoice = {
        ...currentInvoice,
        status: invoiceStatus,
        payment,
        settledAt: new Date().toISOString(),
      };

      setLedgerInvoices((prev) => [settled, ...prev]);

      if (invoiceStatus === 'Settled') {
        setTodaysCollection((v) => v + grandTotal);
        setTotalGstCollected((v) => v + totals.totalTax);
        setPendingBillsCount((c) => Math.max(0, c - 1));
        setPendingBillsTotal((v) => Math.max(0, v - grandTotal));
      } else {
        setClaimsAwaiting((v) => v + grandTotal);
        setClaimsCount((c) => c + 1);
      }

      setDepartmentRevenue((prev) =>
        prev.map((row) => {
          const match = currentInvoice.lineItems.find((l) => l.department === row.department);
          if (!match) return row;
          const lineTax =
            Math.round(match.basePrice * match.quantity * (match.gstPercent / 100) * 100) / 100;
          const lineNet =
            Math.round((match.basePrice * match.quantity + lineTax) * 100) / 100;
          return {
            ...row,
            itemCount: row.itemCount + 1,
            revenue: row.revenue + lineNet,
            gstCollected: row.gstCollected + lineTax,
          };
        }),
      );

      setDoctorRevenue((prev) => {
        const idx = prev.findIndex((d) => d.department === 'General Medicine');
        if (idx === -1) return prev;
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          consultations: copy[idx].consultations + 1,
          revenue: copy[idx].revenue + grandTotal,
        };
        return copy;
      });

      setCurrentInvoice(createDraftInvoice(currentInvoice.patientId, currentInvoice.billingType));

      return { success: true, transactionStatus };
    },
    [currentInvoice],
  );

  const resetInvoice = useCallback(() => {
    if (currentInvoice) {
      setCurrentInvoice(createDraftInvoice(currentInvoice.patientId, currentInvoice.billingType));
    }
  }, [currentInvoice]);

  const metrics = useMemo<FinancialMetrics>(
    () => ({
      todaysCollection: todaysCollection,
      pendingBills: pendingBillsTotal,
      pendingBillCount: pendingBillsCount,
      claimsAwaitingSettlement: claimsAwaiting,
      claimsCount,
      totalGstCollected,
    }),
    [
      todaysCollection,
      pendingBillsTotal,
      pendingBillsCount,
      claimsAwaiting,
      claimsCount,
      totalGstCollected,
    ],
  );

  const value = useMemo(
    () => ({
      patientLookup: PATIENT_LOOKUP,
      currentInvoice,
      ledgerInvoices,
      doctorRevenue,
      departmentRevenue,
      metrics,
      selectPatient,
      setBillingType,
      setDiscount,
      updateLineItem,
      getTotals,
      submitPayment,
      resetInvoice,
    }),
    [
      currentInvoice,
      ledgerInvoices,
      doctorRevenue,
      departmentRevenue,
      metrics,
      selectPatient,
      setBillingType,
      setDiscount,
      updateLineItem,
      getTotals,
      submitPayment,
      resetInvoice,
    ],
  );

  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>;
}

export function useBilling(): BillingContextValue {
  const ctx = useContext(BillingContext);
  if (!ctx) throw new Error('useBilling must be used within BillingProvider');
  return ctx;
}
