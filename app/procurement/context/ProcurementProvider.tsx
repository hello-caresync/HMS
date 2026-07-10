'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import {
  createPoFromBid,
  createRfqFromRequest,
  SEED_PURCHASE_ORDERS,
  SEED_PURCHASE_REQUESTS,
  SEED_RFQS,
  SEED_VENDOR_ANALYTICS,
} from '../lib/seedProcurement';
import type {
  ProcurementTab,
  PurchaseOrder,
  PurchaseRequest,
  RFQ,
  VendorAnalyticsRow,
  VendorBid,
} from '../types';
import { computeThreeWayMatch } from '../types';

type ProcurementContextValue = {
  activeTab: ProcurementTab;
  setActiveTab: (tab: ProcurementTab) => void;
  purchaseRequests: PurchaseRequest[];
  rfqs: RFQ[];
  purchaseOrders: PurchaseOrder[];
  vendorAnalytics: VendorAnalyticsRow[];
  selectedRfqId: string | null;
  setSelectedRfqId: (id: string | null) => void;
  selectedPoId: string | null;
  setSelectedPoId: (id: string | null) => void;
  approveAndConvertToRfq: (requestId: string) => { success: boolean; error?: string };
  acceptBidAndGeneratePo: (
    rfqId: string,
    vendorId: string,
  ) => { success: boolean; error?: string; poNumber?: string };
  updateGrnQuantity: (poId: string, qty: number) => void;
  updateInvoiceQuantity: (poId: string, qty: number) => void;
  getRfq: (id: string) => RFQ | undefined;
  getPo: (id: string) => PurchaseOrder | undefined;
};

const ProcurementContext = createContext<ProcurementContextValue | null>(null);

export function ProcurementProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<ProcurementTab>('requests');
  const [purchaseRequests, setPurchaseRequests] =
    useState<PurchaseRequest[]>(SEED_PURCHASE_REQUESTS);
  const [rfqs, setRfqs] = useState<RFQ[]>(SEED_RFQS);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(SEED_PURCHASE_ORDERS);
  const [vendorAnalytics] = useState<VendorAnalyticsRow[]>(SEED_VENDOR_ANALYTICS);
  const [selectedRfqId, setSelectedRfqId] = useState<string | null>(SEED_RFQS[0]?.id ?? null);
  const [selectedPoId, setSelectedPoId] = useState<string | null>(SEED_PURCHASE_ORDERS[1]?.id ?? null);

  const getRfq = useCallback((id: string) => rfqs.find((r) => r.id === id), [rfqs]);
  const getPo = useCallback((id: string) => purchaseOrders.find((p) => p.id === id), [purchaseOrders]);

  const approveAndConvertToRfq = useCallback(
    (requestId: string) => {
      const pr = purchaseRequests.find((r) => r.id === requestId);
      if (!pr) return { success: false, error: 'Request not found' };
      if (pr.status === 'Converted') {
        return { success: false, error: 'Already converted to RFQ' };
      }

      const rfq = createRfqFromRequest(pr);
      setRfqs((prev) => [rfq, ...prev]);
      setPurchaseRequests((prev) =>
        prev.map((r) =>
          r.id === requestId ? { ...r, status: 'Converted' as const } : r,
        ),
      );
      setSelectedRfqId(rfq.id);
      setActiveTab('rfqs');
      return { success: true };
    },
    [purchaseRequests],
  );

  const acceptBidAndGeneratePo = useCallback(
    (rfqId: string, vendorId: string) => {
      const rfq = rfqs.find((r) => r.id === rfqId);
      if (!rfq) return { success: false, error: 'RFQ not found' };
      if (rfq.status === 'Awarded') {
        return { success: false, error: 'RFQ already awarded' };
      }

      const bid = rfq.bids.find((b) => b.vendorId === vendorId);
      if (!bid) return { success: false, error: 'Bid not found' };

      const po = createPoFromBid(rfq, bid);
      setPurchaseOrders((prev) => [po, ...prev]);
      setRfqs((prev) =>
        prev.map((r) =>
          r.id === rfqId
            ? {
                ...r,
                status: 'Awarded' as const,
                acceptedVendorId: vendorId,
                purchaseOrderId: po.id,
              }
            : r,
        ),
      );
      setSelectedPoId(po.id);
      setActiveTab('orders');
      return { success: true, poNumber: po.poNumber };
    },
    [rfqs],
  );

  const recalcPoMatch = (po: PurchaseOrder): PurchaseOrder => {
    const matchStatus = computeThreeWayMatch(po.quantity, po.grnQuantity, po.invoiceQuantity);
    let status = po.status;
    if (matchStatus === 'Matched') status = 'Matched';
    else if (matchStatus === 'Mismatch') status = 'Mismatch';
    else if (po.grnQuantity > 0 && po.grnQuantity < po.quantity) status = 'Partially Received';
    else if (po.grnQuantity >= po.quantity) status = 'Received';
    return { ...po, matchStatus, status };
  };

  const updateGrnQuantity = useCallback((poId: string, qty: number) => {
    setPurchaseOrders((prev) =>
      prev.map((po) => {
        if (po.id !== poId) return po;
        return recalcPoMatch({ ...po, grnQuantity: Math.max(0, qty) });
      }),
    );
  }, []);

  const updateInvoiceQuantity = useCallback((poId: string, qty: number) => {
    setPurchaseOrders((prev) =>
      prev.map((po) => {
        if (po.id !== poId) return po;
        return recalcPoMatch({ ...po, invoiceQuantity: Math.max(0, qty) });
      }),
    );
  }, []);

  const value = useMemo(
    () => ({
      activeTab,
      setActiveTab,
      purchaseRequests,
      rfqs,
      purchaseOrders,
      vendorAnalytics,
      selectedRfqId,
      setSelectedRfqId,
      selectedPoId,
      setSelectedPoId,
      approveAndConvertToRfq,
      acceptBidAndGeneratePo,
      updateGrnQuantity,
      updateInvoiceQuantity,
      getRfq,
      getPo,
    }),
    [
      activeTab,
      purchaseRequests,
      rfqs,
      purchaseOrders,
      vendorAnalytics,
      selectedRfqId,
      selectedPoId,
      approveAndConvertToRfq,
      acceptBidAndGeneratePo,
      updateGrnQuantity,
      updateInvoiceQuantity,
      getRfq,
      getPo,
    ],
  );

  return <ProcurementContext.Provider value={value}>{children}</ProcurementContext.Provider>;
}

export function useProcurement(): ProcurementContextValue {
  const ctx = useContext(ProcurementContext);
  if (!ctx) throw new Error('useProcurement must be used within ProcurementProvider');
  return ctx;
}
