'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  ANALYTICS_BY_PERIOD,
  buildDoctorProfile,
  buildSeedAppointments,
  buildSeedConsultations,
  buildSeedOrders,
  SEED_ACTIVITIES,
  SEED_CHANNELS,
  SEED_MESSAGES,
  SEED_NOTIFICATIONS,
  SEED_PATIENTS,
} from './seed-data';
import type {
  ActivityItem,
  AnalyticsPeriod,
  Appointment,
  ChatChannel,
  ChatMessage,
  ClinicalOrder,
  Consultation,
  DoctorProfile,
  Notification,
  OrderType,
  Patient,
  PrescriptionItem,
} from './types';

const STORAGE_KEY = 'nexora_doctor_clinical_store';

export type DoctorClinicalState = {
  doctorId: string | null;
  patients: Patient[];
  appointments: Appointment[];
  consultations: Consultation[];
  orders: ClinicalOrder[];
  channels: ChatChannel[];
  messages: ChatMessage[];
  notifications: Notification[];
  activities: ActivityItem[];
  profile: DoctorProfile | null;
  activeConsultationId: string | null;
  selectedPatientId: string | null;
  theme: 'light' | 'dark';
  notificationPrefs: { email: boolean; push: boolean; sms: boolean };
};

type DoctorClinicalActions = {
  initializeForDoctor: (doctorId: string, fullName: string, email: string, specialization: string, licenseNumber: string) => void;
  reset: () => void;
  setSelectedPatient: (patientId: string | null) => void;
  setActiveConsultation: (consultationId: string | null) => void;
  startConsultation: (appointmentId: string) => string;
  updateConsultation: (id: string, patch: Partial<Consultation>) => void;
  completeConsultation: (id: string) => void;
  updateAppointmentStatus: (id: string, status: Appointment['status']) => void;
  rescheduleAppointment: (id: string, time: string, endTime: string) => void;
  cancelAppointment: (id: string) => void;
  addOrder: (order: Omit<ClinicalOrder, 'id' | 'orderedAt' | 'progress' | 'doctorId'>) => void;
  updateOrderStatus: (id: string, status: ClinicalOrder['status'], progress?: number) => void;
  sendMessage: (channelId: string, body: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  updateProfile: (patch: Partial<DoctorProfile>) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setNotificationPrefs: (prefs: Partial<DoctorClinicalState['notificationPrefs']>) => void;
  addActivity: (action: string, detail: string) => void;
  getAnalytics: (period: AnalyticsPeriod) => ReturnType<typeof ANALYTICS_BY_PERIOD.weekly> & {};
};

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const emptyState: DoctorClinicalState = {
  doctorId: null,
  patients: [],
  appointments: [],
  consultations: [],
  orders: [],
  channels: SEED_CHANNELS,
  messages: SEED_MESSAGES,
  notifications: SEED_NOTIFICATIONS,
  activities: SEED_ACTIVITIES,
  profile: null,
  activeConsultationId: null,
  selectedPatientId: null,
  theme: 'light',
  notificationPrefs: { email: true, push: true, sms: false },
};

export const useDoctorClinicalStore = create<DoctorClinicalState & DoctorClinicalActions>()(
  persist(
    (set, get) => ({
      ...emptyState,

      initializeForDoctor: (doctorId, fullName, email, specialization, licenseNumber) => {
        const current = get();
        if (current.doctorId === doctorId && current.patients.length > 0) return;
        set({
          doctorId,
          patients: SEED_PATIENTS,
          appointments: buildSeedAppointments(doctorId),
          consultations: buildSeedConsultations(),
          orders: buildSeedOrders(doctorId),
          channels: SEED_CHANNELS,
          messages: SEED_MESSAGES,
          notifications: SEED_NOTIFICATIONS,
          activities: SEED_ACTIVITIES,
          profile: buildDoctorProfile(doctorId, fullName, email, specialization, licenseNumber),
          activeConsultationId: 'con-1',
          selectedPatientId: 'pat-2',
        });
      },

      reset: () => set(emptyState),

      setSelectedPatient: (patientId) => set({ selectedPatientId: patientId }),

      setActiveConsultation: (consultationId) => set({ activeConsultationId: consultationId }),

      startConsultation: (appointmentId) => {
        const appt = get().appointments.find((a) => a.id === appointmentId);
        if (!appt) return '';
        const existing = get().consultations.find((c) => c.appointmentId === appointmentId);
        if (existing) {
          set({ activeConsultationId: existing.id, selectedPatientId: appt.patientId });
          get().updateAppointmentStatus(appointmentId, 'in-progress');
          return existing.id;
        }
        const id = uid('con');
        const consultation: Consultation = {
          id,
          appointmentId,
          patientId: appt.patientId,
          status: 'draft',
          subjective: '',
          objective: '',
          assessment: '',
          plan: '',
          diagnosis: '',
          treatmentPlan: '',
          prescription: [],
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({
          consultations: [...s.consultations, consultation],
          activeConsultationId: id,
          selectedPatientId: appt.patientId,
          appointments: s.appointments.map((a) =>
            a.id === appointmentId ? { ...a, status: 'in-progress' as const } : a,
          ),
        }));
        get().addActivity('Consultation started', `${appt.patientName} — ${appt.chiefComplaint}`);
        return id;
      },

      updateConsultation: (id, patch) => {
        set((s) => ({
          consultations: s.consultations.map((c) =>
            c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c,
          ),
        }));
      },

      completeConsultation: (id) => {
        const con = get().consultations.find((c) => c.id === id);
        if (!con) return;
        const appt = get().appointments.find((a) => a.id === con.appointmentId);
        const patient = get().patients.find((p) => p.id === con.patientId);
        set((s) => ({
          consultations: s.consultations.map((c) =>
            c.id === id ? { ...c, status: 'completed' as const, updatedAt: new Date().toISOString() } : c,
          ),
          appointments: s.appointments.map((a) =>
            a.id === con.appointmentId ? { ...a, status: 'completed' as const } : a,
          ),
        }));
        if (con.prescription.length > 0) {
          get().addOrder({
            type: 'prescription',
            patientId: con.patientId,
            patientName: patient?.fullName ?? 'Patient',
            title: con.prescription.map((p) => p.drug).join(', '),
            department: 'Pharmacy',
            status: 'pending',
          });
        }
        get().addActivity('Consultation completed', `${patient?.fullName ?? 'Patient'} — ${con.diagnosis || 'SOAP saved'}`);
        if (appt) {
          get().addActivity('EMR updated', `Encounter synced for ${appt.patientName}`);
        }
      },

      updateAppointmentStatus: (id, status) => {
        set((s) => ({
          appointments: s.appointments.map((a) => (a.id === id ? { ...a, status } : a)),
        }));
      },

      rescheduleAppointment: (id, time, endTime) => {
        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === id ? { ...a, time, endTime, status: 'scheduled' as const } : a,
          ),
        }));
        const appt = get().appointments.find((a) => a.id === id);
        if (appt) get().addActivity('Appointment rescheduled', appt.patientName);
      },

      cancelAppointment: (id) => {
        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === id ? { ...a, status: 'cancelled' as const } : a,
          ),
        }));
        const appt = get().appointments.find((a) => a.id === id);
        if (appt) get().addActivity('Appointment cancelled', appt.patientName);
      },

      addOrder: (order) => {
        const doctorId = get().doctorId ?? 'unknown';
        const newOrder: ClinicalOrder = {
          ...order,
          id: uid('ord'),
          orderedAt: new Date().toISOString(),
          progress: order.status === 'completed' ? 100 : 10,
          doctorId,
        };
        set((s) => ({ orders: [newOrder, ...s.orders] }));
        get().addActivity(`${order.type} order placed`, `${order.title} for ${order.patientName}`);
      },

      updateOrderStatus: (id, status, progress) => {
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id
              ? {
                  ...o,
                  status,
                  progress: progress ?? (status === 'completed' ? 100 : o.progress),
                  completedAt: status === 'completed' ? new Date().toISOString() : o.completedAt,
                }
              : o,
          ),
        }));
      },

      sendMessage: (channelId, body) => {
        const msg: ChatMessage = {
          id: uid('msg'),
          channelId,
          sender: 'You',
          body,
          at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isDoctor: true,
        };
        set((s) => ({
          messages: [...s.messages, msg],
          channels: s.channels.map((c) =>
            c.id === channelId ? { ...c, lastMessage: body, lastAt: msg.at } : c,
          ),
        }));
      },

      markNotificationRead: (id) => {
        set((s) => ({
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        }));
      },

      markAllNotificationsRead: () => {
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        }));
      },

      updateProfile: (patch) => {
        set((s) => ({
          profile: s.profile ? { ...s.profile, ...patch } : null,
        }));
      },

      setTheme: (theme) => set({ theme }),

      setNotificationPrefs: (prefs) => {
        set((s) => ({ notificationPrefs: { ...s.notificationPrefs, ...prefs } }));
      },

      addActivity: (action, detail) => {
        const item: ActivityItem = {
          id: uid('act'),
          action,
          detail,
          at: new Date().toISOString(),
        };
        set((s) => ({ activities: [item, ...s.activities].slice(0, 50) }));
      },

      getAnalytics: (period) => ANALYTICS_BY_PERIOD[period],
    }),
    { name: STORAGE_KEY, partialize: (s) => s },
  ),
);

/** Helpers for prescription builder */
export function addPrescriptionItem(consultationId: string, item: Omit<PrescriptionItem, 'id'>) {
  const store = useDoctorClinicalStore.getState();
  const con = store.consultations.find((c) => c.id === consultationId);
  if (!con) return;
  store.updateConsultation(consultationId, {
    prescription: [...con.prescription, { ...item, id: uid('rx') }],
  });
}

export function removePrescriptionItem(consultationId: string, itemId: string) {
  const store = useDoctorClinicalStore.getState();
  const con = store.consultations.find((c) => c.id === consultationId);
  if (!con) return;
  store.updateConsultation(consultationId, {
    prescription: con.prescription.filter((p) => p.id !== itemId),
  });
}

export function placeLabOrder(patientId: string, test: string) {
  const store = useDoctorClinicalStore.getState();
  const patient = store.patients.find((p) => p.id === patientId);
  if (!patient) return;
  store.addOrder({
    type: 'lab' as OrderType,
    patientId,
    patientName: patient.fullName,
    title: test,
    department: 'Pathology',
    status: 'pending',
  });
  store.updateConsultation(store.activeConsultationId ?? '', {});
}
