'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { MOCK_HOSPITALS, MOCK_ORGANIZATION } from '@/lib/vendor/mock/data';
import type { HospitalPartner, VendorOrganization, VendorThemeMode } from '@/lib/vendor/types/domain';
import type { VendorLifecycleStage } from '@/lib/vendor/navigation';

type VendorAppState = {
  organization: VendorOrganization;
  hospitals: HospitalPartner[];
  activeHospitalId: string;
  theme: VendorThemeMode;
  sidebarCollapsed: boolean;
  workflowStage: VendorLifecycleStage;
  mfaEnabled: boolean;
  biometricEnabled: boolean;
  realtimeConnected: boolean;
  setActiveHospitalId: (id: string) => void;
  setTheme: (theme: VendorThemeMode) => void;
  toggleSidebar: () => void;
  setWorkflowStage: (stage: VendorLifecycleStage) => void;
  setMfaEnabled: (enabled: boolean) => void;
  setBiometricEnabled: (enabled: boolean) => void;
  setRealtimeConnected: (connected: boolean) => void;
  notificationUnreadCount: number;
  setNotificationUnreadCount: (count: number) => void;
};

export const useVendorAppStore = create<VendorAppState>()(
  persist(
    (set) => ({
      organization: MOCK_ORGANIZATION,
      hospitals: MOCK_HOSPITALS,
      activeHospitalId: 'hosp-1',
      theme: 'light',
      sidebarCollapsed: false,
      workflowStage: 'Issued',
      mfaEnabled: true,
      biometricEnabled: false,
      realtimeConnected: false,
      notificationUnreadCount: 8,
      setActiveHospitalId: (id) => set({ activeHospitalId: id }),
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setWorkflowStage: (stage) => set({ workflowStage: stage }),
      setMfaEnabled: (enabled) => set({ mfaEnabled: enabled }),
      setBiometricEnabled: (enabled) => set({ biometricEnabled: enabled }),
      setRealtimeConnected: (connected) => set({ realtimeConnected: connected }),
      setNotificationUnreadCount: (count) => set({ notificationUnreadCount: count }),
    }),
    {
      name: 'nexora-vendor-app',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        activeHospitalId: s.activeHospitalId,
        theme: s.theme,
        sidebarCollapsed: s.sidebarCollapsed,
        mfaEnabled: s.mfaEnabled,
        biometricEnabled: s.biometricEnabled,
      }),
    },
  ),
);

export function useActiveHospital() {
  return useVendorAppStore((s) => {
    const hospital = s.hospitals.find((h) => h.id === s.activeHospitalId) ?? s.hospitals[0]!;
    return hospital;
  });
}
