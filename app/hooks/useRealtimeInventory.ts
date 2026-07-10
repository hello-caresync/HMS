'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  ensureInventorySeed,
  INVENTORY_UPDATE_EVENT,
  INVENTORY_STORAGE_KEY,
  InventoryLedgerEntry,
  normalizeInventoryLedger,
  readInventoryLedger,
} from '../lib/inventoryBus';

export function useRealtimeInventory() {
  const [inventory, setInventory] = useState<InventoryLedgerEntry[]>([]);
  const [isReady, setIsReady] = useState(false);

  const refresh = useCallback(() => {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem(INVENTORY_STORAGE_KEY);
    if (!stored) {
      setInventory(ensureInventorySeed());
      return;
    }

    try {
      setInventory(normalizeInventoryLedger(JSON.parse(stored)));
    } catch {
      setInventory(ensureInventorySeed());
    }
  }, []);

  useEffect(() => {
    refresh();
    setIsReady(true);

    const onStorage = (event: StorageEvent) => {
      if (event.key === INVENTORY_STORAGE_KEY || event.key === null) {
        refresh();
      }
    };

    const onInventoryUpdate = () => refresh();

    window.addEventListener('storage', onStorage);
    window.addEventListener(INVENTORY_UPDATE_EVENT, onInventoryUpdate);
    const poller = window.setInterval(refresh, 1000);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(INVENTORY_UPDATE_EVENT, onInventoryUpdate);
      window.clearInterval(poller);
    };
  }, [refresh]);

  return { inventory, isReady, refresh, readSnapshot: readInventoryLedger };
}
