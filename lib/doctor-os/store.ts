'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { OsTheme } from '@/lib/doctor-os/tokens';

type DoctorOsState = {
  theme: OsTheme;
  sidebarCollapsed: boolean;
  hospitalId: string;
  hospitalName: string;
  setTheme: (t: OsTheme) => void;
  toggleTheme: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  toggleSidebar: () => void;
  setHospital: (id: string, name: string) => void;
};

export const useDoctorOsStore = create<DoctorOsState>()(
  persist(
    (set) => ({
      theme: 'light',
      sidebarCollapsed: false,
      hospitalId: '00000000-0000-4000-a000-000000000001',
      hospitalName: 'Nexora General Hospital',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setHospital: (hospitalId, hospitalName) => set({ hospitalId, hospitalName }),
    }),
    { name: 'nexora-doctor-os' },
  ),
);

export function useOsColors() {
  const theme = useDoctorOsStore((s) => s.theme);
  return theme === 'dark'
    ? {
        bg: '#0C0C0E',
        surface: '#1C1C1E',
        surfaceElevated: '#2C2C2E',
        muted: '#3A3A3C',
        border: 'rgba(255,255,255,0.08)',
        text: '#F5F5F7',
        textSecondary: '#98989D',
        textTertiary: '#636366',
        accent: '#0A84FF',
        accentSoft: 'rgba(10,132,255,0.15)',
        success: '#30D158',
        warning: '#FF9F0A',
        critical: '#FF453A',
        glass: 'rgba(28,28,30,0.85)',
      }
    : {
        bg: '#F5F5F7',
        surface: '#FFFFFF',
        surfaceElevated: '#FFFFFF',
        muted: '#F0F0F3',
        border: 'rgba(0,0,0,0.06)',
        text: '#1D1D1F',
        textSecondary: '#6E6E73',
        textTertiary: '#AEAEB2',
        accent: '#0071E3',
        accentSoft: 'rgba(0,113,227,0.08)',
        success: '#34C759',
        warning: '#FF9500',
        critical: '#FF3B30',
        glass: 'rgba(255,255,255,0.72)',
      };
}
