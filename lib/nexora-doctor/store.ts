'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  buildDoctorProfile,
  buildSeedAppointments,
  buildSeedConsultations,
  SEED_ACTIVITIES,
  SEED_NOTIFICATIONS,
  SEED_PATIENTS,
} from './seed-data';
import type {
  ActivityItem,
  Appointment,
  Consultation,
  DoctorProfile,
  DoctorPrescription,
  Notification,
  Patient,
  PrescriptionItem,
} from './types';

const STORAGE_KEY = 'nexora_doctor_clinical_store';

export type DoctorClinicalState = {
  doctorId: string | null;
  patients: Patient[];
  appointments: Appointment[];
  consultations: Consultation[];
  prescriptions: DoctorPrescription[];
  notifications: Notification[];
  activities: ActivityItem[];
  profile: DoctorProfile | null;
  activeConsultationId: string | null;
  selectedPatientId: string | null;
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
  confirmAppointment: (appointmentId: string) => void;
  updateAppointmentStatus: (id: string, status: Appointment['status']) => void;
  rescheduleAppointment: (id: string, time: string, endTime: string) => void;
  cancelAppointment: (id: string) => void;
  addPrescription: (rx: Omit<DoctorPrescription, 'id' | 'issuedAt' | 'doctorId'>) => string;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  updateProfile: (patch: Partial<DoctorProfile>) => void;
  setNotificationPrefs: (prefs: Partial<DoctorClinicalState['notificationPrefs']>) => void;
  addActivity: (action: string, detail: string) => void;
};

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const emptyState: DoctorClinicalState = {
  doctorId: null,
  patients: [],
  appointments: [],
  consultations: [],
  prescriptions: [],
  notifications: SEED_NOTIFICATIONS,
  activities: SEED_ACTIVITIES,
  profile: null,
  activeConsultationId: null,
  selectedPatientId: null,
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
          prescriptions: [],
          notifications: SEED_NOTIFICATIONS,
          activities: SEED_ACTIVITIES,
          profile: buildDoctorProfile(doctorId, fullName, email, specialization, licenseNumber),
          activeConsultationId: null,
          selectedPatientId: SEED_PATIENTS[0]?.id ?? null,
        });
      },

      reset: () => set(emptyState),

      setSelectedPatient: (patientId) => set({ selectedPatientId: patientId }),

      setActiveConsultation: (consultationId) => set({ activeConsultationId: consultationId }),

      startConsultation: (appointmentId) => {
        const appt = get().appointments.find((a) => a.id === appointmentId);
        if (!appt) return '';
        const existing = get().consultations.find((c) => c.appointmentId === appointmentId);
        const patient = get().patients.find((p) => p.id === appt.patientId);
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
          subjective: appt.chiefComplaint,
          objective: '',
          assessment: '',
          plan: '',
          diagnosis: '',
          treatmentPlan: '',
          prescription: [],
          vitals: patient?.vitals,
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
          const doctorId = get().doctorId ?? 'unknown';
          const rx: DoctorPrescription = {
            id: uid('rx'),
            patientId: con.patientId,
            patientName: patient?.fullName ?? 'Patient',
            appointmentId: con.appointmentId,
            medicines: con.prescription,
            notes: con.treatmentPlan,
            status: 'sent',
            issuedAt: new Date().toISOString(),
            doctorId,
          };
          set((s) => ({ prescriptions: [rx, ...s.prescriptions] }));
        }

        get().addActivity(
          'Consultation completed',
          `${patient?.fullName ?? 'Patient'} — ${con.diagnosis || 'Clinical notes saved'}`,
        );
      },

      confirmAppointment: (appointmentId) => {
        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === appointmentId ? { ...a, status: 'waiting' as const } : a,
          ),
        }));
        const appt = get().appointments.find((a) => a.id === appointmentId);
        if (appt) {
          get().addActivity('Appointment confirmed', appt.patientName);
        }
      },

      updateAppointmentStatus: (id, status) => {
        set((s) => ({
          appointments: s.appointments.map((a) => (a.id === id ? { ...a, status } : a)),
        }));
        void import('./ecosystem-bridge').then((m) => m.syncDoctorStatusToEco(id, status));
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
        void import('./ecosystem-bridge').then((m) => m.doctorCancelAppointment(id));
      },

      addPrescription: (input) => {
        const doctorId = get().doctorId ?? 'unknown';
        const rx: DoctorPrescription = {
          ...input,
          id: uid('rx'),
          doctorId,
          issuedAt: new Date().toISOString(),
        };
        set((s) => ({ prescriptions: [rx, ...s.prescriptions] }));
        get().addActivity('Prescription sent', `${input.patientName} — ${input.medicines.length} medicine(s)`);
        void import('./ecosystem-bridge').then((m) =>
          m.doctorSendPrescription({
            patientId: input.patientId,
            appointmentId: input.appointmentId,
            medicines: input.medicines,
            notes: input.notes,
          }),
        );
        return rx.id;
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
