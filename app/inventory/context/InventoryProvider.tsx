'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { SEED_INVENTORY, SEED_TRANSFERS } from '../lib/seedInventory';
import type {
  AuditRecord,
  InternalTransfer,
  InventoryCategory,
  InventoryItem,
  InventoryMetrics,
} from '../types';
import {
  deriveStockStatus,
  generateTransferId,
  isExpiringWithinDays,
} from '../types';

type TransferPayload = {
  itemId: string;
  batchNumber: string;
  sourceLocation: string;
  targetDepartment: string;
  quantity: number;
};

type InventoryContextValue = {
  items: InventoryItem[];
  transfers: InternalTransfer[];
  metrics: InventoryMetrics;
  categoryFilter: InventoryCategory;
  setCategoryFilter: (c: InventoryCategory) => void;
  filteredItems: InventoryItem[];
  getItem: (id: string) => InventoryItem | undefined;
  getAvailableBatchQty: (itemId: string, batchNumber: string) => number;
  initiateTransfer: (payload: TransferPayload) => { success: boolean; error?: string };
  submitAudit: (
    itemId: string,
    countedQuantity: number,
  ) => { success: boolean; error?: string; record?: AuditRecord };
  auditHistory: AuditRecord[];
};

const InventoryContext = createContext<InventoryContextValue | null>(null);

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<InventoryItem[]>(SEED_INVENTORY);
  const [transfers, setTransfers] = useState<InternalTransfer[]>(SEED_TRANSFERS);
  const [categoryFilter, setCategoryFilter] = useState<InventoryCategory>('Medicine Stock');
  const [auditHistory, setAuditHistory] = useState<AuditRecord[]>([]);

  const filteredItems = useMemo(
    () => items.filter((i) => i.category === categoryFilter),
    [items, categoryFilter],
  );

  const metrics = useMemo<InventoryMetrics>(() => {
    const expiring = items.filter((i) => isExpiringWithinDays(i, 30)).length;
    const capitalValue = items
      .filter((i) => i.category === 'Capital Equipment')
      .reduce((s, i) => s + (i.equipmentValue ?? 0) * i.quantityOnHand, 0);
    const pending = transfers.filter((t) => t.status === 'Pending').length;

    return {
      totalSkuCount: items.length,
      expiringNext30Days: expiring,
      capitalEquipmentValue: capitalValue,
      pendingTransfers: pending,
    };
  }, [items, transfers]);

  const getItem = useCallback((id: string) => items.find((i) => i.id === id), [items]);

  const getAvailableBatchQty = useCallback(
    (itemId: string, batchNumber: string) => {
      const item = items.find((i) => i.id === itemId && i.batchNumber === batchNumber);
      return item?.quantityOnHand ?? 0;
    },
    [items],
  );

  const initiateTransfer = useCallback(
    (payload: TransferPayload) => {
      const item = items.find(
        (i) => i.id === payload.itemId && i.batchNumber === payload.batchNumber,
      );
      if (!item) return { success: false, error: 'Item / batch not found' };
      if (item.location !== payload.sourceLocation) {
        return { success: false, error: 'Batch not available at selected source location' };
      }
      if (payload.quantity <= 0) {
        return { success: false, error: 'Transfer quantity must be greater than zero' };
      }
      if (payload.quantity > item.quantityOnHand) {
        return {
          success: false,
          error: `Requested ${payload.quantity} exceeds available batch count (${item.quantityOnHand})`,
        };
      }

      const transfer: InternalTransfer = {
        id: generateTransferId(),
        itemId: item.id,
        itemName: item.itemName,
        batchNumber: payload.batchNumber,
        sourceLocation: payload.sourceLocation,
        targetDepartment: payload.targetDepartment,
        quantity: payload.quantity,
        status: 'Pending',
        createdAt: new Date().toISOString(),
      };

      setTransfers((prev) => [transfer, ...prev]);
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, quantityOnHand: i.quantityOnHand - payload.quantity } : i,
        ),
      );

      return { success: true };
    },
    [items],
  );

  const submitAudit = useCallback(
    (itemId: string, countedQuantity: number) => {
      const item = items.find((i) => i.id === itemId);
      if (!item) return { success: false, error: 'Item not found' };
      if (countedQuantity < 0) return { success: false, error: 'Counted quantity cannot be negative' };

      const variance = countedQuantity - item.quantityOnHand;
      const record: AuditRecord = {
        itemId,
        expectedQuantity: item.quantityOnHand,
        countedQuantity,
        variance,
        auditedAt: new Date().toISOString(),
      };

      setAuditHistory((prev) => [record, ...prev].slice(0, 20));
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, quantityOnHand: countedQuantity } : i)),
      );

      return { success: true, record };
    },
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      transfers,
      metrics,
      categoryFilter,
      setCategoryFilter,
      filteredItems,
      getItem,
      getAvailableBatchQty,
      initiateTransfer,
      submitAudit,
      auditHistory,
    }),
    [
      items,
      transfers,
      metrics,
      categoryFilter,
      filteredItems,
      getItem,
      getAvailableBatchQty,
      initiateTransfer,
      submitAudit,
      auditHistory,
    ],
  );

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}

export function useInventory(): InventoryContextValue {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error('useInventory must be used within InventoryProvider');
  return ctx;
}
