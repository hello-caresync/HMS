'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import {
  ALL_HOSPITALS_CODE,
  DEFAULT_HOSPITAL_CODE,
  resolveActiveHospitalId,
  VENDOR_HOSPITALS,
} from '@/lib/vendor/hospitals';
import { MOCK_ORGANIZATION } from '@/lib/vendor/mock/data';
import { isDemoMode } from '@/lib/shared/demo-mode';
import type { HospitalPartner, VendorOrganization, VendorThemeMode } from '@/lib/vendor/types/domain';

const EMPTY_VENDOR_ORG: VendorOrganization = {
  id: '',
  legalName: '',
  tradeName: '',
  gstin: '',
  pan: '',
  vendorRating: 0,
  scorecardGrade: 'C',
  primaryCategory: 'Medicines',
};
type VendorAppState = {
  organization: VendorOrganization;
  hospitals: HospitalPartner[];
  activeHospitalId: string;
  theme: VendorThemeMode;
  sidebarCollapsed: boolean;
  mfaEnabled: boolean;
  biometricEnabled: boolean;
  realtimeConnected: boolean;
  setHospitals: (hospitals: HospitalPartner[]) => void;
  setActiveHospitalId: (id: string) => void;
  setTheme: (theme: VendorThemeMode) => void;
  toggleSidebar: () => void;
  setMfaEnabled: (enabled: boolean) => void;
  setBiometricEnabled: (enabled: boolean) => void;
  setRealtimeConnected: (connected: boolean) => void;
  notificationUnreadCount: number;
  setNotificationUnreadCount: (count: number) => void;
};

export const useVendorAppStore = create<VendorAppState>()(
  persist(
    (set) => ({
      organization: isDemoMode() ? MOCK_ORGANIZATION : EMPTY_VENDOR_ORG,
      hospitals: VENDOR_HOSPITALS,
      activeHospitalId: DEFAULT_HOSPITAL_CODE,
      theme: 'light',
      sidebarCollapsed: false,
      mfaEnabled: true,
      biometricEnabled: false,
      realtimeConnected: false,
      notificationUnreadCount: 0,
      setHospitals: (hospitals) =>
        set((state) => ({
          hospitals,
          activeHospitalId: resolveActiveHospitalId(state.activeHospitalId, hospitals),
        })),
      setActiveHospitalId: (id) => set({ activeHospitalId: id }),
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
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
