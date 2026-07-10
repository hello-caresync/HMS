'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import { generatePharmacyId, SEED_PHARMACY_CATALOG } from '../../../lib/foundation';
import type {
  CreatePharmacyEntryDraft,
  PharmacyMasterEntry,
} from '../../../lib/foundation/types';

type PharmacyCatalogContextValue = {
  entries: PharmacyMasterEntry[];
  searchQuery: string;
  filteredEntries: PharmacyMasterEntry[];
  drawerOpen: boolean;
  setSearchQuery: (query: string) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  addEntry: (draft: CreatePharmacyEntryDraft) => void;
  toggleEntryActive: (id: string) => void;
};

const PharmacyCatalogContext = createContext<PharmacyCatalogContextValue | null>(null);

export function PharmacyCatalogProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<PharmacyMasterEntry[]>(SEED_PHARMACY_CATALOG);
  const [searchQuery, setSearchQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.drugName.toLowerCase().includes(q) ||
        e.genericFormula.toLowerCase().includes(q) ||
        e.manufacturer.toLowerCase().includes(q) ||
        e.hsnCode.toLowerCase().includes(q) ||
        e.packagingUnit.toLowerCase().includes(q),
    );
  }, [entries, searchQuery]);

  const addEntry = useCallback((draft: CreatePharmacyEntryDraft) => {
    const entry: PharmacyMasterEntry = {
      id: generatePharmacyId(),
      ...draft,
    };
    setEntries((prev) => [entry, ...prev]);
    setDrawerOpen(false);
  }, []);

  const toggleEntryActive = useCallback((id: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isActive: !e.isActive } : e)),
    );
  }, []);

  const value = useMemo(
    () => ({
      entries,
      searchQuery,
      filteredEntries,
      drawerOpen,
      setSearchQuery,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      addEntry,
      toggleEntryActive,
    }),
    [entries, searchQuery, filteredEntries, drawerOpen, addEntry, toggleEntryActive],
  );

  return (
    <PharmacyCatalogContext.Provider value={value}>{children}</PharmacyCatalogContext.Provider>
  );
}

export function usePharmacyCatalog(): PharmacyCatalogContextValue {
  const ctx = useContext(PharmacyCatalogContext);
  if (!ctx) {
    throw new Error('usePharmacyCatalog must be used within PharmacyCatalogProvider');
  }
  return ctx;
}
