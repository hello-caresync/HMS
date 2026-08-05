'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { isDemoMode } from '@/lib/shared/demo-mode';
import {
  computeMetrics,
  DEFAULT_SETTINGS,
  SEED_ADMISSIONS,
  SEED_APPOINTMENTS,
  SEED_INVENTORY,
  SEED_INVOICES,
  SEED_NOTIFICATIONS,
  SEED_OPD,
  SEED_PATIENTS,
  SEED_POS,
  SEED_STAFF,
  SEED_VENDORS,
} from './seed-data';
import type {
  BillingInvoice,
  DashboardMetrics,
  HospitalAdmission,
  HospitalAppointment,
  HospitalNotification,
  HospitalPatient,
  HospitalSettings,
  HospitalStaff,
  InventoryItem,
  OpdVisit,
  PurchaseOrder,
  Vendor,
} from './types';
import type { EcosystemActivityItem } from '@/lib/ecosystem/ecosystem-hub';

const STORAGE_KEY = 'nexora_hospital_v0';

type HospitalState = {
  patients: HospitalPatient[];
  staff: HospitalStaff[];
  appointments: HospitalAppointment[];
  opdVisits: OpdVisit[];
  admissions: HospitalAdmission[];
  invoices: BillingInvoice[];
  inventory: InventoryItem[];
  vendors: Vendor[];
  purchaseOrders: PurchaseOrder[];
  notifications: HospitalNotification[];
  settings: HospitalSettings;
  hydrated: boolean;
  metrics: DashboardMetrics;
  realtimeConnected: boolean;
  activityFeed: EcosystemActivityItem[];
};

type HospitalActions = {
  hydrateFromSeed: () => void;
  setPatients: (rows: HospitalPatient[]) => void;
  setAppointments: (rows: HospitalAppointment[]) => void;
  setOpdVisits: (rows: OpdVisit[]) => void;
  setAdmissions: (rows: HospitalAdmission[]) => void;
  setInvoices: (rows: BillingInvoice[]) => void;
  setInventory: (rows: InventoryItem[]) => void;
  setVendors: (rows: Vendor[]) => void;
  setPurchaseOrders: (rows: PurchaseOrder[]) => void;
  setNotifications: (rows: HospitalNotification[]) => void;
  upsertPatient: (p: HospitalPatient) => void;
  upsertAppointment: (a: HospitalAppointment) => void;
  upsertOpdVisit: (v: OpdVisit) => void;
  upsertAdmission: (a: HospitalAdmission) => void;
  upsertInvoice: (i: BillingInvoice) => void;
  upsertInventoryItem: (i: InventoryItem) => void;
  upsertPurchaseOrder: (p: PurchaseOrder) => void;
  addNotification: (n: Omit<HospitalNotification, 'id' | 'createdAt' | 'readStatus'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  updateSettings: (patch: Partial<HospitalSettings>) => void;
  recomputeMetrics: () => void;
  setRealtimeConnected: (connected: boolean) => void;
  prependActivity: (item: EcosystemActivityItem) => void;
  setActivityFeed: (items: EcosystemActivityItem[]) => void;
};

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function withMetrics(state: Omit<HospitalState, 'metrics'>): HospitalState {
  return {
    ...state,
    metrics: computeMetrics(
      state.appointments,
      state.opdVisits,
      state.admissions,
      state.invoices,
      state.inventory,
      state.purchaseOrders,
      state.staff,
    ),
  };
}

const seedState = withMetrics({
  patients: [],
  staff: [],
  appointments: [],
  opdVisits: [],
  admissions: [],
  invoices: [],
  inventory: [],
  vendors: [],
  purchaseOrders: [],
  notifications: [],
  settings: DEFAULT_SETTINGS,
  hydrated: false,
  realtimeConnected: false,
  activityFeed: [],
});

export const useHospitalStore = create<HospitalState & HospitalActions>()(
  persist(
    (set, get) => ({
      ...seedState,

      hydrateFromSeed: () => {
        if (get().hydrated) return;
        const useDemo = isDemoMode();
        if (useDemo) {
          set(
            withMetrics({
              patients: SEED_PATIENTS,
              staff: SEED_STAFF,
              appointments: SEED_APPOINTMENTS,
              opdVisits: SEED_OPD,
              admissions: SEED_ADMISSIONS,
              invoices: SEED_INVOICES,
              inventory: SEED_INVENTORY,
              vendors: SEED_VENDORS,
              purchaseOrders: SEED_POS,
              notifications: SEED_NOTIFICATIONS,
              settings: DEFAULT_SETTINGS,
              hydrated: true,
              realtimeConnected: false,
              activityFeed: [],
            }),
          );
        } else {
          set(withMetrics({ ...seedState, hydrated: true }));
        }
      },

      setPatients: (rows) => set((s) => withMetrics({ ...s, patients: rows })),
      setAppointments: (rows) => set((s) => withMetrics({ ...s, appointments: rows })),
      setOpdVisits: (rows) => set((s) => withMetrics({ ...s, opdVisits: rows })),
      setAdmissions: (rows) => set((s) => withMetrics({ ...s, admissions: rows })),
      setInvoices: (rows) => set((s) => withMetrics({ ...s, invoices: rows })),
      setInventory: (rows) => set((s) => withMetrics({ ...s, inventory: rows })),
      setVendors: (rows) => set((s) => withMetrics({ ...s, vendors: rows })),
      setPurchaseOrders: (rows) => set((s) => withMetrics({ ...s, purchaseOrders: rows })),
      setNotifications: (rows) => set((s) => ({ ...s, notifications: rows })),

      upsertPatient: (p) =>
        set((s) => {
          const idx = s.patients.findIndex((x) => x.id === p.id);
          const patients = idx >= 0 ? s.patients.map((x, i) => (i === idx ? p : x)) : [p, ...s.patients];
          return withMetrics({ ...s, patients });
        }),

      upsertAppointment: (a) =>
        set((s) => {
          const idx = s.appointments.findIndex((x) => x.id === a.id);
          const appointments =
            idx >= 0 ? s.appointments.map((x, i) => (i === idx ? a : x)) : [a, ...s.appointments];
          return withMetrics({ ...s, appointments });
        }),

      upsertOpdVisit: (v) =>
        set((s) => {
          const idx = s.opdVisits.findIndex((x) => x.id === v.id);
          const opdVisits =
            idx >= 0 ? s.opdVisits.map((x, i) => (i === idx ? v : x)) : [v, ...s.opdVisits];
          return withMetrics({ ...s, opdVisits });
        }),

      upsertAdmission: (a) =>
        set((s) => {
          const idx = s.admissions.findIndex((x) => x.id === a.id);
          const admissions =
            idx >= 0 ? s.admissions.map((x, i) => (i === idx ? a : x)) : [a, ...s.admissions];
          return withMetrics({ ...s, admissions });
        }),

      upsertInvoice: (i) =>
        set((s) => {
          const idx = s.invoices.findIndex((x) => x.id === i.id);
          const invoices =
            idx >= 0 ? s.invoices.map((x, ix) => (ix === idx ? i : x)) : [i, ...s.invoices];
          return withMetrics({ ...s, invoices });
        }),

      upsertInventoryItem: (item) =>
        set((s) => {
          const idx = s.inventory.findIndex((x) => x.id === item.id);
          const inventory =
            idx >= 0 ? s.inventory.map((x, i) => (i === idx ? item : x)) : [item, ...s.inventory];
          return withMetrics({ ...s, inventory });
        }),

      upsertPurchaseOrder: (p) =>
        set((s) => {
          const idx = s.purchaseOrders.findIndex((x) => x.id === p.id);
          const purchaseOrders =
            idx >= 0 ? s.purchaseOrders.map((x, i) => (i === idx ? p : x)) : [p, ...s.purchaseOrders];
          return withMetrics({ ...s, purchaseOrders });
        }),

      addNotification: (input) =>
        set((s) => ({
          ...s,
          notifications: [
            {
              ...input,
              id: uid('hn'),
              readStatus: false,
              createdAt: new Date().toISOString(),
            },
            ...s.notifications,
          ],
        })),

      markNotificationRead: (id) =>
        set((s) => ({
          ...s,
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, readStatus: true } : n)),
        })),

      markAllNotificationsRead: () =>
        set((s) => ({
          ...s,
          notifications: s.notifications.map((n) => ({ ...n, readStatus: true })),
        })),

      updateSettings: (patch) =>
        set((s) => ({ ...s, settings: { ...s.settings, ...patch } })),

      recomputeMetrics: () => set((s) => withMetrics(s)),

      setRealtimeConnected: (connected) => set({ realtimeConnected: connected }),

      prependActivity: (item) =>
        set((s) => ({
          ...s,
          activityFeed: [item, ...s.activityFeed.filter((a) => a.id !== item.id)].slice(0, 50),
        })),

      setActivityFeed: (items) => set({ activityFeed: items }),
    }),
    { name: STORAGE_KEY, partialize: (s) => s },
  ),
);

export function inventoryStatus(qty: number, reorder: number): InventoryItem['status'] {
  if (qty <= 0) return 'Out of Stock';
  if (qty <= reorder) return 'Low Stock';
  return 'In Stock';
}
