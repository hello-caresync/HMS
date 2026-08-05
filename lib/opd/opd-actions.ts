'use client';

import { computeOpdAnalytics, computeWaitingHallOccupancy } from '@/lib/opd/analytics';
import { broadcastOpdEvent } from '@/lib/opd/realtime';
import {
  buildQrPayload,
  computeDelayStatus,
  computeWaitEstimate,
  generateSequentialToken,
  parseQrPayload,
  priorityWeight,
  recommendAiSlot,
} from '@/lib/opd/scheduling-ai';
import type { VoiceLanguage } from '@/lib/opd/design-tokens';
import type {
  EcosystemAppointment,
  EcosystemDoctor,
  EcosystemState,
  QueuePriority,
} from '@/lib/ecosystem/types';

type Set = (partial: Partial<EcosystemState> | ((s: EcosystemState) => Partial<EcosystemState>)) => void;
type StoreGet = () => EcosystemState & {
  addNotification: (n: Omit<import('@/lib/ecosystem/types').EcosystemNotification, 'id' | 'createdAt' | 'read'>) => void;
  getPatient: (id: string) => import('@/lib/ecosystem/types').EcosystemPatient | undefined;
  getDoctor: (id: string) => EcosystemDoctor | undefined;
};

function refreshAnalytics(get: StoreGet, set: Set) {
  const s = get();
  const occupancy = computeWaitingHallOccupancy(s.appointments);
  set({
    opdAnalytics: computeOpdAnalytics(
      s.appointments,
      s.doctors,
      occupancy,
      s.opdDisplay.waitingHallCapacity,
    ),
    opdDisplay: { ...s.opdDisplay, waitingHallOccupancy: occupancy },
  });
}

function enrichAppointment(appt: EcosystemAppointment, doctor: EcosystemDoctor, all: EcosystemAppointment[]): EcosystemAppointment {
  const wait = computeWaitEstimate(appt, doctor, all);
  return {
    ...appt,
    roomNumber: doctor.roomNumber,
    estimatedWaitMinutes: wait,
    delayStatus: computeDelayStatus(appt, wait, all),
    qrPayload: appt.qrPayload ?? buildQrPayload(appt.id, appt.patientMrn),
  };
}

export function createOpdActions(get: StoreGet, set: Set) {
  return {
    getAiRecommendedSlot: (doctorId: string, date: string) => {
      const doctor = get().doctors.find((d) => d.id === doctorId);
      if (!doctor) return null;
      return recommendAiSlot(doctor, date, get().appointments);
    },

    registerWalkIn: (input: {
      patientName: string;
      phone: string;
      doctorId: string;
      reason: string;
      priorityTier?: QueuePriority;
    }) => {
      const doctor = get().doctors.find((d) => d.id === input.doctorId);
      if (!doctor) throw new Error('Doctor not found');

      const now = new Date();
      const date = now.toISOString().slice(0, 10);
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(Math.ceil(now.getMinutes() / 30) * 30).padStart(2, '0')}`;
      const end = new Date(`${date}T${time}`);
      end.setMinutes(end.getMinutes() + 30);

      const id = `walkin-${Date.now()}`;
      const sequentialToken = generateSequentialToken(doctor.tokenPrefix, get().appointments, doctor.id);

      const appt: EcosystemAppointment = {
        id,
        patientId: `walkin-pat-${Date.now()}`,
        patientName: input.patientName,
        patientMrn: `WALK-${Date.now().toString().slice(-4)}`,
        doctorId: doctor.id,
        doctorName: doctor.name,
        department: doctor.department,
        date,
        time,
        endTime: end.toTimeString().slice(0, 5),
        reason: input.reason,
        status: 'Checked-In',
        type: 'OPD',
        token: sequentialToken.split('-')[1] ?? '001',
        location: `OPD · ${doctor.roomNumber}`,
        roomNumber: doctor.roomNumber,
        sequentialToken,
        checkedInAt: new Date().toISOString(),
        qrPayload: buildQrPayload(id, `WALK-${Date.now().toString().slice(-4)}`),
        priorityTier: input.priorityTier ?? 'standard',
        branchId: doctor.branchId,
        estimatedCost: doctor.consultationFee,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const enriched = enrichAppointment(appt, doctor, [...get().appointments, appt]);

      set((s) => ({
        appointments: [...s.appointments, enriched],
        hospitalQueue: [
          {
            id: `hq-${id}`,
            appointmentId: id,
            token: enriched.token,
            sequentialToken: enriched.sequentialToken,
            patientName: enriched.patientName,
            department: enriched.department,
            doctorName: enriched.doctorName,
            scheduledTime: `${date} ${time}`,
            status: 'Checked-In',
            roomNumber: doctor.roomNumber,
            createdAt: enriched.createdAt,
          },
          ...s.hospitalQueue,
        ],
      }));

      refreshAnalytics(get, set);
      broadcastOpdEvent({ type: 'OPD_QUEUE_UPDATED', payload: { doctorId: doctor.id } });
      broadcastOpdEvent({
        type: 'OPD_CHECKIN',
        payload: { appointmentId: id, sequentialToken: sequentialToken },
      });

      return enriched;
    },

    qrCheckIn: (qrRaw: string) => {
      const parsed = parseQrPayload(qrRaw);
      if (!parsed) throw new Error('Invalid QR code');

      const appt = get().appointments.find((a) => a.id === parsed.appointmentId);
      if (!appt) throw new Error('Appointment not found');
      if (appt.patientMrn !== parsed.mrn) throw new Error('QR does not match patient record');

      const doctor = get().doctors.find((d) => d.id === appt.doctorId);
      if (!doctor) throw new Error('Doctor not found');

      const sequentialToken =
        appt.sequentialToken ?? generateSequentialToken(doctor.tokenPrefix, get().appointments, doctor.id);

      set((s) => ({
        appointments: s.appointments.map((a) =>
          a.id === appt.id
            ? enrichAppointment(
                {
                  ...a,
                  status: 'Checked-In',
                  sequentialToken,
                  checkedInAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
                doctor,
                s.appointments,
              )
            : a,
        ),
      }));

      get().addNotification({
        patientId: appt.patientId,
        title: 'Checked In Successfully',
        body: `Token ${sequentialToken} · ${doctor.roomNumber} · estimated wait updated live.`,
        category: 'appointment',
        relatedId: appt.id,
      });

      refreshAnalytics(get, set);
      broadcastOpdEvent({
        type: 'OPD_CHECKIN',
        payload: { appointmentId: appt.id, sequentialToken },
      });

      return get().appointments.find((a) => a.id === appt.id)!;
    },

    callNextPatient: (doctorId: string) => {
      if (get().opdDisplay.queuePaused) return null;

      const doctor = get().doctors.find((d) => d.id === doctorId);
      if (!doctor) return null;

      const queue = get()
        .appointments.filter(
          (a) =>
            a.doctorId === doctorId &&
            a.date === new Date().toISOString().slice(0, 10) &&
            (a.status === 'Checked-In' || a.status === 'Confirmed') &&
            !a.skipped,
        )
        .sort((a, b) => {
          const pw = priorityWeight(a.priorityTier) - priorityWeight(b.priorityTier);
          if (pw !== 0) return pw;
          if (a.isEmergency && !b.isEmergency) return -1;
          if (!a.isEmergency && b.isEmergency) return 1;
          return parseTime(a.time) - parseTime(b.time);
        });

      const next = queue[0];
      if (!next) return null;

      const now = new Date().toISOString();

      set((s) => ({
        appointments: s.appointments.map((a) =>
          a.id === next.id
            ? { ...a, status: 'In Consultation' as const, calledAt: now, updatedAt: now }
            : a,
        ),
        opdDisplay: {
          ...s.opdDisplay,
          calledPatientName: next.patientName,
          calledToken: next.token,
          sequentialToken: next.sequentialToken ?? next.token,
          roomNumber: doctor.roomNumber,
          doctorName: doctor.name,
          department: doctor.department,
          lastCalledAt: now,
        },
      }));

      get().addNotification({
        patientId: next.patientId,
        title: 'You are being called',
        body: `Please proceed to ${doctor.roomNumber}. Dr. ${doctor.name.split(' ').slice(-1)[0]} is ready.`,
        category: 'appointment',
        relatedId: next.id,
      });

      broadcastOpdEvent({
        type: 'OPD_PATIENT_CALLED',
        payload: {
          appointmentId: next.id,
          patientName: next.patientName,
          token: next.token,
          sequentialToken: next.sequentialToken ?? next.token,
          roomNumber: doctor.roomNumber,
          doctorName: doctor.name,
          department: doctor.department,
          language: get().opdDisplay.voiceLanguage,
        },
      });

      refreshAnalytics(get, set);
      syncStatusToDoctorAsync(next.id, 'In Consultation');
      return next;
    },

    skipPatient: (appointmentId: string) => {
      set((s) => ({
        appointments: s.appointments.map((a) =>
          a.id === appointmentId ? { ...a, skipped: true, updatedAt: new Date().toISOString() } : a,
        ),
      }));
      refreshAnalytics(get, set);
      broadcastOpdEvent({ type: 'OPD_QUEUE_UPDATED', payload: { doctorId: get().appointments.find((a) => a.id === appointmentId)?.doctorId ?? '' } });
    },

    recallPatient: (appointmentId: string) => {
      const appt = get().appointments.find((a) => a.id === appointmentId);
      const doctor = appt ? get().doctors.find((d) => d.id === appt.doctorId) : null;
      if (!appt || !doctor) return;

      set((s) => ({
        appointments: s.appointments.map((a) =>
          a.id === appointmentId ? { ...a, skipped: false, status: 'Checked-In' as const } : a,
        ),
        opdDisplay: {
          ...s.opdDisplay,
          calledPatientName: appt.patientName,
          calledToken: appt.token,
          sequentialToken: appt.sequentialToken ?? appt.token,
          roomNumber: doctor.roomNumber,
          doctorName: doctor.name,
          department: doctor.department,
          lastCalledAt: new Date().toISOString(),
        },
      }));

      broadcastOpdEvent({
        type: 'OPD_PATIENT_CALLED',
        payload: {
          appointmentId: appt.id,
          patientName: appt.patientName,
          token: appt.token,
          sequentialToken: appt.sequentialToken ?? appt.token,
          roomNumber: doctor.roomNumber,
          doctorName: doctor.name,
          department: doctor.department,
          language: get().opdDisplay.voiceLanguage,
        },
      });
    },

    markEmergency: (appointmentId: string) => {
      set((s) => ({
        appointments: s.appointments.map((a) =>
          a.id === appointmentId
            ? {
                ...a,
                isEmergency: true,
                priorityTier: 'emergency' as const,
                delayStatus: 'urgent' as const,
                updatedAt: new Date().toISOString(),
              }
            : a,
        ),
      }));
      refreshAnalytics(get, set);
      broadcastOpdEvent({ type: 'OPD_QUEUE_UPDATED', payload: { doctorId: get().appointments.find((a) => a.id === appointmentId)?.doctorId ?? '' } });
    },

    setPriorityTier: (appointmentId: string, tier: QueuePriority) => {
      set((s) => ({
        appointments: s.appointments.map((a) =>
          a.id === appointmentId ? { ...a, priorityTier: tier, updatedAt: new Date().toISOString() } : a,
        ),
        hospitalQueue: s.hospitalQueue.map((q) =>
          q.appointmentId === appointmentId ? { ...q, priorityTier: tier } : q,
        ),
      }));
      refreshAnalytics(get, set);
      broadcastOpdEvent({ type: 'OPD_QUEUE_UPDATED', payload: { doctorId: get().appointments.find((a) => a.id === appointmentId)?.doctorId ?? '' } });
    },

    pauseQueue: (paused: boolean) => {
      set((s) => ({ opdDisplay: { ...s.opdDisplay, queuePaused: paused } }));
      broadcastOpdEvent({ type: 'OPD_QUEUE_PAUSED', payload: { paused } });
    },

    reassignSlot: (appointmentId: string, date: string, time: string) => {
      const appt = get().appointments.find((a) => a.id === appointmentId);
      if (!appt) throw new Error('Appointment not found');
      const end = new Date(`${date}T${time}`);
      end.setMinutes(end.getMinutes() + 30);
      set((s) => ({
        appointments: s.appointments.map((a) =>
          a.id === appointmentId
            ? { ...a, date, time, endTime: end.toTimeString().slice(0, 5), updatedAt: new Date().toISOString() }
            : a,
        ),
        hospitalQueue: s.hospitalQueue.map((q) =>
          q.appointmentId === appointmentId ? { ...q, scheduledTime: `${date} ${time}` } : q,
        ),
      }));
      get().addNotification({
        patientId: appt.patientId,
        title: 'Appointment Rescheduled',
        body: `Your visit has been moved to ${date} at ${time} by reception.`,
        category: 'appointment',
        relatedId: appointmentId,
      });
      refreshAnalytics(get, set);
    },

    mergeDepartmentQueues: (department: string) => {
      const today = new Date().toISOString().slice(0, 10);
      const deptAppts = get().appointments.filter(
        (a) => a.department === department && a.date === today && ['Checked-In', 'Confirmed'].includes(a.status),
      );
      deptAppts.sort((a, b) => parseTime(a.time) - parseTime(b.time));
      set((s) => ({
        hospitalQueue: [
          ...deptAppts.map((a, i) => ({
            id: `hq-merged-${a.id}`,
            appointmentId: a.id,
            token: a.token,
            sequentialToken: a.sequentialToken,
            patientName: a.patientName,
            department: a.department,
            doctorName: a.doctorName,
            scheduledTime: `${a.date} ${a.time}`,
            status: a.status,
            roomNumber: a.roomNumber,
            priorityTier: a.priorityTier,
            createdAt: a.createdAt,
          })),
          ...s.hospitalQueue.filter((q) => !deptAppts.some((a) => a.id === q.appointmentId)),
        ],
      }));
      broadcastOpdEvent({ type: 'OPD_QUEUE_UPDATED', payload: { doctorId: '' } });
    },

    markNoShow: (appointmentId: string) => {
      const appt = get().appointments.find((a) => a.id === appointmentId);
      if (!appt) return;
      set((s) => ({
        appointments: s.appointments.map((a) =>
          a.id === appointmentId
            ? { ...a, status: 'No-Show' as const, noShowMarkedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
            : a,
        ),
      }));
      get().addNotification({
        patientId: appt.patientId,
        title: 'Missed Appointment',
        body: `You were marked no-show for ${appt.date} at ${appt.time}. Rebook from the Patient App.`,
        category: 'appointment',
        relatedId: appointmentId,
      });
      refreshAnalytics(get, set);
    },

    submitSatisfactionRating: (appointmentId: string, rating: number) => {
      const clamped = Math.min(5, Math.max(1, Math.round(rating)));
      set((s) => ({
        appointments: s.appointments.map((a) =>
          a.id === appointmentId ? { ...a, satisfactionRating: clamped, updatedAt: new Date().toISOString() } : a,
        ),
      }));
      refreshAnalytics(get, set);
    },

    scheduleAppointmentReminders: (appointmentId: string, patientId: string, date: string, time: string, doctorName: string) => {
      get().addNotification({
        patientId,
        title: '24-Hour Visit Reminder',
        body: `Reminder: OPD visit with ${doctorName} tomorrow at ${time}. Digital pass ready in Appointments.`,
        category: 'appointment',
        relatedId: appointmentId,
      });
      get().addNotification({
        patientId,
        title: '1-Hour Pre-Visit Alert',
        body: `Your appointment with ${doctorName} is in 1 hour (${time}). Please check in on arrival.`,
        category: 'appointment',
        relatedId: appointmentId,
      });
    },

    scheduleFollowUp: (input: {
      patientId: string;
      doctorId: string;
      days: number;
      reason?: string;
      sourceAppointmentId?: string;
    }) => {
      const patient = get().getPatient(input.patientId);
      const doctor = get().getDoctor(input.doctorId);
      if (!patient || !doctor) throw new Error('Patient or doctor not found');

      const followDate = new Date();
      followDate.setDate(followDate.getDate() + input.days);
      const date = followDate.toISOString().slice(0, 10);
      const slot = doctor.slots[0] ?? '10:00';
      const end = new Date(`${date}T${slot}`);
      end.setMinutes(end.getMinutes() + 30);

      const id = `followup-${Date.now()}`;
      const appt: EcosystemAppointment = {
        id,
        patientId: patient.id,
        patientName: patient.fullName,
        patientMrn: patient.mrn,
        doctorId: doctor.id,
        doctorName: doctor.name,
        department: doctor.department,
        date,
        time: slot,
        endTime: end.toTimeString().slice(0, 5),
        reason: input.reason ?? `Follow-up review · ${input.days} days`,
        status: 'Confirmed',
        type: 'OPD',
        token: nextToken(get().appointments),
        location: `OPD · ${doctor.roomNumber}`,
        roomNumber: doctor.roomNumber,
        followUpDays: input.days,
        qrPayload: buildQrPayload(id, patient.mrn),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      set((s) => ({ appointments: [...s.appointments, appt] }));

      get().addNotification({
        patientId: patient.id,
        title: 'Follow-up Scheduled',
        body: `Review with ${doctor.name} on ${date} at ${slot} · auto-booked from consultation.`,
        category: 'follow-up',
        relatedId: id,
      });

      broadcastOpdEvent({
        type: 'OPD_FOLLOWUP_SCHEDULED',
        payload: { patientId: patient.id, appointmentId: id, days: input.days },
      });

      refreshAnalytics(get, set);
      return appt;
    },

    setVoiceLanguage: (language: VoiceLanguage) => {
      set((s) => ({ opdDisplay: { ...s.opdDisplay, voiceLanguage: language } }));
    },

    refreshOpdMetrics: () => refreshAnalytics(get, set),
  };
}

function parseTime(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

function nextToken(appointments: EcosystemAppointment[]): string {
  const nums = appointments.map((a) => parseInt(a.token.replace(/\D/g, ''), 10)).filter((n) => !Number.isNaN(n));
  return `C-${String((nums.length ? Math.max(...nums) : 41) + 1).padStart(3, '0')}`;
}

function syncStatusToDoctorAsync(appointmentId: string, status: import('@/lib/ecosystem/types').AppointmentStatus) {
  void import('@/lib/ecosystem/doctor-sync').then((m) => m.syncStatusToDoctor(appointmentId, status));
}

export type OpdActions = ReturnType<typeof createOpdActions>;
