'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type PatientProfileContext = {
  id: string;
  displayName: string;
  mrn: string;
  abdmHealthId?: string;
};

export type OfflinePatientAction = {
  id: string;
  type: 'vitals' | 'message' | 'refill' | 'check_in';
  payload: Record<string, unknown>;
  createdAt: string;
};

type PatientAppState = {
  activeProfile: PatientProfileContext;
  dependentProfiles: PatientProfileContext[];
  biometricEnabled: boolean;
  mfaVerified: boolean;
  offlineQueue: OfflinePatientAction[];
  setActiveProfile: (profile: PatientProfileContext) => void;
  switchProfile: (profileId: string) => void;
  setBiometricEnabled: (enabled: boolean) => void;
  setMfaVerified: (verified: boolean) => void;
  enqueueOffline: (action: Omit<OfflinePatientAction, 'id' | 'createdAt'>) => void;
  flushOfflineQueue: () => OfflinePatientAction[];
};

const DEFAULT_PROFILE: PatientProfileContext = {
  id: 'pat-1',
  displayName: 'Aishwarya D S',
  mrn: 'ID_NEX_9021',
  abdmHealthId: 'ABDM-XX-9021',
};

export const usePatientAppStore = create<PatientAppState>()(
  persist(
    (set, get) => ({
      activeProfile: DEFAULT_PROFILE,
      dependentProfiles: [
        DEFAULT_PROFILE,
        { id: 'dep-1', displayName: 'Family · Dependent', mrn: 'ID_NEX_DEP_01' },
      ],
      biometricEnabled: false,
      mfaVerified: false,
      offlineQueue: [],
      setActiveProfile: (profile) => set({ activeProfile: profile }),
      switchProfile: (profileId) => {
        const all = [get().activeProfile, ...get().dependentProfiles];
        const next = all.find((p) => p.id === profileId);
        if (next) set({ activeProfile: next });
      },
      setBiometricEnabled: (enabled) => set({ biometricEnabled: enabled }),
      setMfaVerified: (verified) => set({ mfaVerified: verified }),
      enqueueOffline: (action) =>
        set((state) => ({
          offlineQueue: [
            ...state.offlineQueue,
            {
              ...action,
              id: `off-${Date.now()}`,
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      flushOfflineQueue: () => {
        const q = get().offlineQueue;
        set({ offlineQueue: [] });
        return q;
      },
    }),
    {
      name: 'nexora-patient-app',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeProfile: state.activeProfile,
        dependentProfiles: state.dependentProfiles,
        biometricEnabled: state.biometricEnabled,
        offlineQueue: state.offlineQueue,
      }),
    },
  ),
);
