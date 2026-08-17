'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { ALL_HOSPITALS_CODE, VENDOR_HOSPITALS } from '@/lib/vendor/hospitals';
import { MOCK_ORGANIZATION } from '@/lib/vendor/mock/data';
import type { HospitalPartner, VendorOrganization, VendorThemeMode } from '@/lib/vendor/types/domain';
import type { LifecycleStage } from '@/lib/vendor/lifecycle';

type VendorAppState = {
  organization: VendorOrganization;
  hospitals: HospitalPartner[];
  activeHospitalId: string;
  theme: VendorThemeMode;
  sidebarCollapsed: boolean;
  workflowStage: LifecycleStage;
  mfaEnabled: boolean;
  biometricEnabled: boolean;
  realtimeConnected: boolean;
  setActiveHospitalId: (id: string) => void;
  setTheme: (theme: VendorThemeMode) => void;
  toggleSidebar: () => void;
  setWorkflowStage: (stage: LifecycleStage) => void;
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
      hospitals: VENDOR_HOSPITALS,
      activeHospitalId: ALL_HOSPITALS_CODE,
      theme: 'light',
      sidebarCollapsed: false,
      workflowStage: 'ALL',
      mfaEnabled: true,
      biometricEnabled: false,
      realtimeConnected: false,
      notificationUnreadCount: 0,
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
    const hospital =
      s.hospitals.find((h) => h.id === s.activeHospitalId) ??
      s.hospitals.find((h) => h.id === ALL_HOSPITALS_CODE) ??
      s.hospitals[0]!;
    return hospital;
  });
}

export function useActiveHospitalCode(): string {
  return useActiveHospital().networkCode;
}
