'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { buildSeedState, SEED_DOCTORS } from './seed';
import { createOpdActions } from '@/lib/opd/opd-actions';
import { buildQrPayload, recommendAiSlot } from '@/lib/opd/scheduling-ai';
import { computeOpdAnalytics, computeWaitingHallOccupancy } from '@/lib/opd/analytics';
import type {
  AppointmentStatus,
  EcosystemAppointment,
  EcosystemNotification,
  EcosystemPrescription,
  EcosystemState,
  PrescriptionMedicine,
} from './types';

export const ECOSYSTEM_STORAGE_KEY = 'nexora-ecosystem-v0';

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function nextToken(appointments: EcosystemAppointment[]): string {
  const nums = appointments
    .map((a) => parseInt(a.token.replace(/\D/g, ''), 10))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 41) + 1;
  return `C-${String(next).padStart(3, '0')}`;
}

function syncStatusToDoctorAsync(appointmentId: string, status: AppointmentStatus) {
  void import('./doctor-sync').then((m) => m.syncStatusToDoctor(appointmentId, status));
}

function syncAppointmentToDoctorAsync(appt: EcosystemAppointment) {
  void import('./doctor-sync').then((m) => m.syncAppointmentToDoctor(appt));
}

function syncPrescriptionToDoctorAsync(rx: EcosystemPrescription) {
  void import('./doctor-sync').then((m) => m.syncPrescriptionToDoctor(rx));
}

type EcosystemActions = {
  reset: () => void;
  getPatient: (patientId: string) => EcosystemState['patients'][0] | undefined;
  getDoctor: (doctorId: string) => (typeof SEED_DOCTORS)[0] | undefined;
  bookAppointment: (input: {
    patientId: string;
    doctorId: string;
    date: string;
    time: string;
    reason: string;
    type: 'OPD' | 'Teleconsult';
    familyMemberId?: string;
    branchId?: string;
  }) => EcosystemAppointment;
  confirmAppointment: (appointmentId: string) => void;
  checkInAppointment: (appointmentId: string) => void;
  startConsultation: (appointmentId: string) => void;
  completeAppointment: (appointmentId: string) => void;
  cancelAppointment: (appointmentId: string) => void;
  rescheduleAppointment: (appointmentId: string, date: string, time: string) => void;
  createPrescription: (input: {
    patientId: string;
    doctorId: string;
    appointmentId: string;
    medicines: Omit<PrescriptionMedicine, 'id'>[];
    notes?: string;
  }) => EcosystemPrescription;
  createLabOrder: (input: {
    patientId: string;
    doctorId: string;
    appointmentId?: string;
    testName: string;
  }) => void;
  completeLabOrder: (labOrderId: string, resultSummary: string) => void;
  createRadiologyOrder: (input: {
    patientId: string;
    doctorId: string;
    appointmentId?: string;
    studyName: string;
  }) => void;
  completeRadiologyOrder: (orderId: string, findings: string) => void;
  addNotification: (n: Omit<EcosystemNotification, 'id' | 'createdAt' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (patientId: string) => void;
  updatePatientProfile: (patientId: string, patch: Partial<EcosystemState['patients'][0]>) => void;
} & ReturnType<typeof createOpdActions>;

export type EcosystemStore = EcosystemState & EcosystemActions;

export const useEcosystemStore = create<EcosystemStore>()(
  persist(
    (set, get) => ({
      ...buildSeedState(),

      reset: () => set(buildSeedState()),

      getPatient: (patientId) => get().patients.find((p) => p.id === patientId),

      getDoctor: (doctorId) => get().doctors.find((d) => d.id === doctorId),

      bookAppointment: (input) => {
        const patient = get().getPatient(input.patientId);
        const doctor = get().getDoctor(input.doctorId);
        if (!patient || !doctor) throw new Error('Patient or doctor not found');

        const familyMember = input.familyMemberId
          ? get().familyMembers.find((m) => m.id === input.familyMemberId && m.primaryPatientId === patient.id)
          : undefined;
        const branch = get().branches.find((b) => b.id === (input.branchId ?? doctor.branchId));

        const end = new Date(`${input.date}T${input.time}`);
        end.setMinutes(end.getMinutes() + 30);

        const appointment: EcosystemAppointment = {
          id: uid('appt'),
          patientId: patient.id,
          patientName: familyMember?.fullName ?? patient.fullName,
          patientMrn: familyMember?.mrn ?? patient.mrn,
          doctorId: doctor.id,
          doctorName: doctor.name,
          department: doctor.department,
          date: input.date,
          time: input.time,
          endTime: end.toTimeString().slice(0, 5),
          reason: input.reason,
          status: 'Requested',
          type: input.type,
          token: nextToken(get().appointments),
          location: input.type === 'Teleconsult' ? 'Nexora Telehealth Studio' : `OPD · ${doctor.roomNumber}`,
          roomNumber: doctor.roomNumber,
          branchId: branch?.id ?? doctor.branchId,
          branchName: branch?.name,
          estimatedCost: doctor.consultationFee,
          bookedByPatientId: familyMember ? patient.id : undefined,
          priorityTier: 'standard',
          qrPayload: '',
          aiRecommended: input.time === recommendAiSlot(doctor, input.date, get().appointments)?.slot,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        appointment.qrPayload = buildQrPayload(appointment.id, appointment.patientMrn);

        set((s) => ({
          appointments: [...s.appointments, appointment],
          hospitalQueue: [
            {
              id: `hq-${appointment.id}`,
              appointmentId: appointment.id,
              token: appointment.token,
              patientName: appointment.patientName,
              department: appointment.department,
              doctorName: appointment.doctorName,
              scheduledTime: `${appointment.date} ${appointment.time}`,
              status: appointment.status,
              roomNumber: appointment.roomNumber,
              priorityTier: appointment.priorityTier,
              createdAt: appointment.createdAt,
            },
            ...s.hospitalQueue,
          ],
          opdAnalytics: computeOpdAnalytics(
            [...get().appointments, appointment],
            get().doctors,
            computeWaitingHallOccupancy([...get().appointments, appointment]),
            get().opdDisplay.waitingHallCapacity,
          ),
        }));

        get().addNotification({
          patientId: patient.id,
          title: familyMember ? `Family Booking · ${familyMember.fullName}` : 'Appointment Requested',
          body: `Visit with ${doctor.name} on ${input.date} at ${input.time} · est. ₹${doctor.consultationFee}. Pending confirmation.`,
          category: 'appointment',
          relatedId: appointment.id,
        });

        get().scheduleAppointmentReminders(appointment.id, patient.id, input.date, input.time, doctor.name);

        void import('./doctor-sync').then((m) => m.syncAppointmentToDoctor(appointment));
        void import('./hospital-sync').then((m) => m.pushToHospitalQueue(appointment));

        return appointment;
      },

      confirmAppointment: (appointmentId) => {
        const appt = get().appointments.find((a) => a.id === appointmentId);
        if (!appt) return;

        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === appointmentId
              ? { ...a, status: 'Confirmed' as AppointmentStatus, updatedAt: new Date().toISOString() }
              : a,
          ),
          hospitalQueue: s.hospitalQueue.map((q) =>
            q.appointmentId === appointmentId ? { ...q, status: 'Confirmed' as AppointmentStatus } : q,
          ),
        }));

        get().addNotification({
          patientId: appt.patientId,
          title: 'Appointment Confirmed',
          body: `Your appointment with ${appt.doctorName} on ${appt.date} at ${appt.time} is confirmed. Token: ${appt.token}`,
          category: 'appointment',
          relatedId: appointmentId,
        });

        syncStatusToDoctorAsync(appointmentId, 'Confirmed');
        void import('./hospital-sync').then((m) => m.updateHospitalQueueStatus(appointmentId, 'Confirmed'));
      },

      checkInAppointment: (appointmentId) => {
        const appt = get().appointments.find((a) => a.id === appointmentId);
        const doctor = appt ? get().doctors.find((d) => d.id === appt.doctorId) : null;
        if (!appt || !doctor) return;

        const sequentialToken =
          appt.sequentialToken ??
          (() => {
            const prefix = doctor.tokenPrefix;
            const nums = get()
              .appointments.filter((a) => a.doctorId === doctor.id && a.sequentialToken?.startsWith(prefix))
              .map((a) => parseInt(a.sequentialToken?.split('-')[1] ?? '0', 10))
              .filter((n) => !Number.isNaN(n));
            const next = (nums.length ? Math.max(...nums) : 0) + 1;
            return `${prefix}-${String(next).padStart(3, '0')}`;
          })();

        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === appointmentId
              ? {
                  ...a,
                  status: 'Checked-In' as AppointmentStatus,
                  sequentialToken,
                  checkedInAt: new Date().toISOString(),
                  roomNumber: doctor.roomNumber,
                  updatedAt: new Date().toISOString(),
                }
              : a,
          ),
        }));
        syncStatusToDoctorAsync(appointmentId, 'Checked-In');
        get().refreshOpdMetrics();
      },

      startConsultation: (appointmentId) => {
        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === appointmentId
              ? { ...a, status: 'In Consultation' as AppointmentStatus, updatedAt: new Date().toISOString() }
              : a,
          ),
        }));
        syncStatusToDoctorAsync(appointmentId, 'In Consultation');
      },

      completeAppointment: (appointmentId) => {
        const appt = get().appointments.find((a) => a.id === appointmentId);
        if (!appt) return;

        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === appointmentId
              ? { ...a, status: 'Completed' as AppointmentStatus, updatedAt: new Date().toISOString() }
              : a,
          ),
          visits: [
            ...s.visits,
            {
              id: uid('visit'),
              patientId: appt.patientId,
              date: new Date().toISOString(),
              doctorName: appt.doctorName,
              department: appt.department,
              diagnosis: appt.reason,
              summary: `Consultation completed · ${appt.type}`,
              appointmentId: appt.id,
            },
          ],
        }));

        get().addNotification({
          patientId: appt.patientId,
          title: 'Consultation Completed',
          body: `Your visit with ${appt.doctorName} is complete. Prescription and reports will appear shortly.`,
          category: 'appointment',
          relatedId: appointmentId,
        });

        syncStatusToDoctorAsync(appointmentId, 'Completed');
      },

      cancelAppointment: (appointmentId) => {
        const appt = get().appointments.find((a) => a.id === appointmentId);
        if (!appt) return;

        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === appointmentId
              ? { ...a, status: 'Cancelled' as AppointmentStatus, updatedAt: new Date().toISOString() }
              : a,
          ),
          hospitalQueue: s.hospitalQueue.filter((q) => q.appointmentId !== appointmentId),
        }));

        get().addNotification({
          patientId: appt.patientId,
          title: 'Appointment Cancelled',
          body: `Your appointment with ${appt.doctorName} on ${appt.date} has been cancelled.`,
          category: 'appointment',
          relatedId: appointmentId,
        });

        syncStatusToDoctorAsync(appointmentId, 'Cancelled');
      },

      rescheduleAppointment: (appointmentId, date, time) => {
        const appt = get().appointments.find((a) => a.id === appointmentId);
        if (!appt) return;

        const end = new Date(`${date}T${time}`);
        end.setMinutes(end.getMinutes() + 30);

        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === appointmentId
              ? {
                  ...a,
                  date,
                  time,
                  endTime: end.toTimeString().slice(0, 5),
                  status: 'Requested' as AppointmentStatus,
                  updatedAt: new Date().toISOString(),
                }
              : a,
          ),
        }));

        get().addNotification({
          patientId: appt.patientId,
          title: 'Appointment Rescheduled',
          body: `Your appointment with ${appt.doctorName} is rescheduled to ${date} at ${time}. Awaiting confirmation.`,
          category: 'appointment',
          relatedId: appointmentId,
        });

        const updated = get().appointments.find((a) => a.id === appointmentId);
        if (updated) syncAppointmentToDoctorAsync(updated);
      },

      createPrescription: (input) => {
        const patient = get().getPatient(input.patientId);
        const doctor = get().getDoctor(input.doctorId);
        if (!patient || !doctor) throw new Error('Patient or doctor not found');

        const rx: EcosystemPrescription = {
          id: uid('rx'),
          patientId: patient.id,
          patientName: patient.fullName,
          doctorId: doctor.id,
          doctorName: doctor.name,
          appointmentId: input.appointmentId,
          medicines: input.medicines.map((m) => ({ ...m, id: uid('med') })),
          issuedAt: new Date().toISOString(),
          status: 'active',
          notes: input.notes,
        };

        set((s) => ({ prescriptions: [rx, ...s.prescriptions] }));

        get().addNotification({
          patientId: patient.id,
          title: 'Prescription Ready',
          body: `${doctor.name} issued a new prescription. View your medicines in Prescriptions.`,
          category: 'prescription',
          relatedId: rx.id,
        });

        syncPrescriptionToDoctorAsync(rx);
        return rx;
      },

      createLabOrder: (input) => {
        const patient = get().getPatient(input.patientId);
        const doctor = get().getDoctor(input.doctorId);
        if (!patient || !doctor) return;

        const order = {
          id: uid('lab'),
          patientId: patient.id,
          patientName: patient.fullName,
          doctorId: doctor.id,
          doctorName: doctor.name,
          appointmentId: input.appointmentId,
          testName: input.testName,
          status: 'ordered' as const,
          orderedAt: new Date().toISOString(),
        };

        set((s) => ({ labOrders: [order, ...s.labOrders] }));

        get().addNotification({
          patientId: patient.id,
          title: 'Lab Test Ordered',
          body: `${doctor.name} ordered ${input.testName}. Sample collection will be scheduled.`,
          category: 'lab',
          relatedId: order.id,
        });
      },

      completeLabOrder: (labOrderId, resultSummary) => {
        const order = get().labOrders.find((l) => l.id === labOrderId);
        if (!order) return;

        set((s) => ({
          labOrders: s.labOrders.map((l) =>
            l.id === labOrderId
              ? { ...l, status: 'ready' as const, completedAt: new Date().toISOString(), resultSummary }
              : l,
          ),
        }));

        get().addNotification({
          patientId: order.patientId,
          title: 'Lab Report Ready',
          body: `Your ${order.testName} results are available in Medical Records.`,
          category: 'lab',
          relatedId: labOrderId,
        });
      },

      createRadiologyOrder: (input) => {
        const patient = get().getPatient(input.patientId);
        const doctor = get().getDoctor(input.doctorId);
        if (!patient || !doctor) return;

        const order = {
          id: uid('rad'),
          patientId: patient.id,
          patientName: patient.fullName,
          doctorId: doctor.id,
          doctorName: doctor.name,
          appointmentId: input.appointmentId,
          studyName: input.studyName,
          status: 'ordered' as const,
          orderedAt: new Date().toISOString(),
        };

        set((s) => ({ radiologyOrders: [order, ...s.radiologyOrders] }));

        get().addNotification({
          patientId: patient.id,
          title: 'Radiology Study Ordered',
          body: `${doctor.name} ordered ${input.studyName}. Imaging will be scheduled.`,
          category: 'radiology',
          relatedId: order.id,
        });
      },

      completeRadiologyOrder: (orderId, findings) => {
        const order = get().radiologyOrders.find((r) => r.id === orderId);
        if (!order) return;

        set((s) => ({
          radiologyOrders: s.radiologyOrders.map((r) =>
            r.id === orderId
              ? { ...r, status: 'completed' as const, completedAt: new Date().toISOString(), findings }
              : r,
          ),
        }));

        get().addNotification({
          patientId: order.patientId,
          title: 'Radiology Report Ready',
          body: `Your ${order.studyName} report is available in Medical Records.`,
          category: 'radiology',
          relatedId: orderId,
        });
      },

      addNotification: (n) => {
        const notification: EcosystemNotification = {
          ...n,
          id: uid('notif'),
          read: false,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ notifications: [notification, ...s.notifications] }));
      },

      markNotificationRead: (id) => {
        set((s) => ({
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        }));
      },

      markAllNotificationsRead: (patientId) => {
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.patientId === patientId ? { ...n, read: true } : n,
          ),
        }));
      },

      updatePatientProfile: (patientId, patch) => {
        set((s) => ({
          patients: s.patients.map((p) => (p.id === patientId ? { ...p, ...patch } : p)),
        }));
      },

      ...createOpdActions(get, set),
    }),
    {
      name: ECOSYSTEM_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 3,
      migrate: (persisted, version) => {
        const seed = buildSeedState();
        const state = persisted as EcosystemState;
        if (version < 2) {
          state.opdDisplay = state.opdDisplay ?? seed.opdDisplay;
          state.opdAnalytics = state.opdAnalytics ?? computeOpdAnalytics(state.appointments ?? [], state.doctors ?? seed.doctors);
        }
        if (version < 3) {
          return {
            ...state,
            branches: state.branches ?? seed.branches,
            familyMembers: state.familyMembers ?? seed.familyMembers,
            opdDisplay: {
              ...seed.opdDisplay,
              ...state.opdDisplay,
              queuePaused: state.opdDisplay?.queuePaused ?? false,
              waitingHallCapacity: state.opdDisplay?.waitingHallCapacity ?? 80,
              waitingHallOccupancy: state.opdDisplay?.waitingHallOccupancy ?? 0,
            },
            opdAnalytics: {
              ...seed.opdAnalytics,
              ...state.opdAnalytics,
              noShowRatePct: state.opdAnalytics?.noShowRatePct ?? 0,
              avgSatisfactionRating: state.opdAnalytics?.avgSatisfactionRating ?? 4.6,
              waitingHallOccupancyPct: state.opdAnalytics?.waitingHallOccupancyPct ?? 0,
            },
            doctors: (state.doctors ?? seed.doctors).map((d, i) => ({
              ...seed.doctors[i % seed.doctors.length],
              ...d,
              branchId: d.branchId ?? seed.doctors.find((sd) => sd.id === d.id)?.branchId ?? 'branch-main',
            })),
          };
        }
        return state;
      },
    },
  ),
);

/** Subscribe to cross-tab ecosystem updates */
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === ECOSYSTEM_STORAGE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (parsed?.state) useEcosystemStore.setState(parsed.state);
      } catch {
        /* ignore */
      }
    }
  });
}
