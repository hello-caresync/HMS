'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import {
  getAlternativesForGeneric,
  SEED_PHARMACY_INVENTORY,
  SEED_PHARMACY_ORDERS,
} from '../lib/seedPharmacy';
import type {
  DispenseLineItem,
  LowStockAlert,
  PharmacyDispatchOrder,
  PharmacyInventoryItem,
  PharmacyToast,
} from '../types';
import { deriveOrderStatus } from '../types';

type PharmacyContextValue = {
  orders: PharmacyDispatchOrder[];
  inventory: PharmacyInventoryItem[];
  lowStockAlerts: LowStockAlert[];
  toasts: PharmacyToast[];
  activeOrderId: string | null;
  setActiveOrderId: (id: string | null) => void;
  getOrder: (orderId: string) => PharmacyDispatchOrder | undefined;
  getInventoryForLine: (line: DispenseLineItem) => PharmacyInventoryItem | undefined;
  getAlternatives: (genericName: string, excludeMedicineId?: string) => PharmacyInventoryItem[];
  verifyLineItem: (orderId: string, lineItemId: string) => boolean;
  applySubstitution: (orderId: string, lineItemId: string, newMedicineId: string) => void;
  finalizeAndDispense: (orderId: string) => { success: boolean; error?: string };
  dismissToast: (id: string) => void;
};

const PharmacyContext = createContext<PharmacyContextValue | null>(null);

const LOW_STOCK_TOAST =
  '[Alert] Inventory depleted below threshold. Low Stock card dispatched to Procurement dashboard.';

function pushToast(prev: PharmacyToast[], message: string, type: PharmacyToast['type']): PharmacyToast[] {
  return [
    {
      id: `toast-${Date.now().toString(36)}`,
      message,
      type,
      createdAt: new Date().toISOString(),
    },
    ...prev,
  ].slice(0, 5);
}

export function PharmacyProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<PharmacyDispatchOrder[]>(SEED_PHARMACY_ORDERS);
  const [inventory, setInventory] = useState<PharmacyInventoryItem[]>(SEED_PHARMACY_INVENTORY);
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([]);
  const [toasts, setToasts] = useState<PharmacyToast[]>([]);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  const getOrder = useCallback((orderId: string) => orders.find((o) => o.id === orderId), [orders]);

  const getInventoryForLine = useCallback(
    (line: DispenseLineItem) => inventory.find((i) => i.medicineId === line.medicineId),
    [inventory],
  );

  const getAlternatives = useCallback(
    (genericName: string, excludeMedicineId?: string) =>
      getAlternativesForGeneric(genericName, excludeMedicineId).map(
        (alt) => inventory.find((i) => i.medicineId === alt.medicineId) ?? alt,
      ),
    [inventory],
  );

  const updateOrderLines = useCallback(
    (orderId: string, updater: (lines: DispenseLineItem[]) => DispenseLineItem[]) => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;
          const lineItems = updater(o.lineItems);
          const status =
            o.status === 'Completed'
              ? 'Completed'
              : deriveOrderStatus(lineItems, false);
          return { ...o, lineItems, status };
        }),
      );
    },
    [],
  );

  const verifyLineItem = useCallback(
    (orderId: string, lineItemId: string): boolean => {
      const order = orders.find((o) => o.id === orderId);
      const line = order?.lineItems.find((l) => l.id === lineItemId);
      if (!line || line.verified) return false;

      const stock = inventory.find((i) => i.medicineId === line.medicineId);
      if (!stock || stock.stockCount < line.quantity) return false;

      updateOrderLines(orderId, (lines) =>
        lines.map((l) => (l.id === lineItemId ? { ...l, verified: true } : l)),
      );
      return true;
    },
    [orders, inventory, updateOrderLines],
  );

  const applySubstitution = useCallback(
    (orderId: string, lineItemId: string, newMedicineId: string) => {
      const alt = inventory.find((i) => i.medicineId === newMedicineId);
      if (!alt) return;

      updateOrderLines(orderId, (lines) =>
        lines.map((l) =>
          l.id === lineItemId
            ? {
                ...l,
                medicineId: alt.medicineId,
                brandName: alt.brandName,
                genericName: alt.genericName,
                verified: false,
              }
            : l,
        ),
      );
    },
    [inventory, updateOrderLines],
  );

  const finalizeAndDispense = useCallback(
    (orderId: string): { success: boolean; error?: string } => {
      const order = orders.find((o) => o.id === orderId);
      if (!order) return { success: false, error: 'Order not found' };
      if (order.status === 'Completed') return { success: false, error: 'Already dispensed' };

      const unverified = order.lineItems.filter((l) => !l.verified);
      if (unverified.length > 0) {
        return { success: false, error: 'Verify all line items before dispensing' };
      }

      const nextInventory = inventory.map((item) => ({ ...item }));
      const newLowStock: LowStockAlert[] = [];

      for (const line of order.lineItems) {
        const idx = nextInventory.findIndex((i) => i.medicineId === line.medicineId);
        if (idx === -1) return { success: false, error: `Stock record missing for ${line.brandName}` };

        const item = nextInventory[idx];
        if (item.stockCount < line.quantity) {
          return { success: false, error: `Insufficient stock for ${line.brandName}` };
        }

        item.stockCount -= line.quantity;

        if (item.stockCount < item.safetyThreshold) {
          const alreadyAlerted = lowStockAlerts.some((a) => a.medicineId === item.medicineId);
          if (!alreadyAlerted) {
            newLowStock.push({
              medicineId: item.medicineId,
              brandName: item.brandName,
              genericName: item.genericName,
              currentUnits: item.stockCount,
              safetyThreshold: item.safetyThreshold,
              unit: item.unit,
              dispatchedAt: new Date().toISOString(),
            });
          }
        }
      }

      setInventory(nextInventory);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: 'Completed' as const,
                dispensedAt: new Date().toISOString(),
              }
            : o,
        ),
      );

      if (newLowStock.length > 0) {
        setLowStockAlerts((prev) => [...newLowStock, ...prev]);
        setToasts((prev) => pushToast(prev, LOW_STOCK_TOAST, 'alert'));
      } else {
        setToasts((prev) =>
          pushToast(prev, `Prescription dispensed · ${order.patientName} · EMR updated`, 'success'),
        );
      }

      return { success: true };
    },
    [orders, inventory, lowStockAlerts],
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      orders,
      inventory,
      lowStockAlerts,
      toasts,
      activeOrderId,
      setActiveOrderId,
      getOrder,
      getInventoryForLine,
      getAlternatives,
      verifyLineItem,
      applySubstitution,
      finalizeAndDispense,
      dismissToast,
    }),
    [
      orders,
      inventory,
      lowStockAlerts,
      toasts,
      activeOrderId,
      getOrder,
      getInventoryForLine,
      getAlternatives,
      verifyLineItem,
      applySubstitution,
      finalizeAndDispense,
      dismissToast,
    ],
  );

  return <PharmacyContext.Provider value={value}>{children}</PharmacyContext.Provider>;
}

export function usePharmacy(): PharmacyContextValue {
  const ctx = useContext(PharmacyContext);
  if (!ctx) throw new Error('usePharmacy must be used within PharmacyProvider');
  return ctx;
}
