'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import {
  generateBedIds,
  generateContainerId,
  SEED_BED_CONTAINERS,
  SEED_BRANCHES,
} from '../../../lib/foundation';
import type {
  BedSetupDraft,
  FacilityBedContainer,
  HospitalBranchConfig,
} from '../../../lib/foundation/types';

type BedManagementContextValue = {
  branches: HospitalBranchConfig[];
  containers: FacilityBedContainer[];
  createBedContainer: (draft: BedSetupDraft) => FacilityBedContainer;
  getBranchName: (branchId: string) => string;
};

const BedManagementContext = createContext<BedManagementContextValue | null>(null);

export function BedManagementProvider({ children }: { children: React.ReactNode }) {
  const [branches] = useState<HospitalBranchConfig[]>(SEED_BRANCHES);
  const [containers, setContainers] = useState<FacilityBedContainer[]>(SEED_BED_CONTAINERS);

  const getBranchName = useCallback(
    (branchId: string) =>
      branches.find((b) => b.branchId === branchId)?.branchName ?? branchId,
    [branches],
  );

  const createBedContainer = useCallback((draft: BedSetupDraft): FacilityBedContainer => {
    const container: FacilityBedContainer = {
      id: generateContainerId(),
      branchId: draft.branchId,
      floorName: draft.floorName.trim(),
      wardCategory: draft.wardCategory,
      roomIdentifier: draft.roomIdentifier.trim().toUpperCase(),
      maxBedCount: draft.maxBedCount,
      generatedBedIds: generateBedIds(draft.roomIdentifier, draft.maxBedCount),
      createdAt: new Date().toISOString(),
    };

    setContainers((prev) => [container, ...prev]);
    return container;
  }, []);

  const value = useMemo(
    () => ({ branches, containers, createBedContainer, getBranchName }),
    [branches, containers, createBedContainer, getBranchName],
  );

  return (
    <BedManagementContext.Provider value={value}>{children}</BedManagementContext.Provider>
  );
}

export function useBedManagement(): BedManagementContextValue {
  const ctx = useContext(BedManagementContext);
  if (!ctx) {
    throw new Error('useBedManagement must be used within BedManagementProvider');
  }
  return ctx;
}
