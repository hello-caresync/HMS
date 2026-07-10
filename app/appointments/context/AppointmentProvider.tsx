'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  APPOINTMENT_TODAY,
  buildInitialQueue,
  nextTokenNumber,
  SEED_APPOINTMENTS,
  SEED_BLOCKED_SLOTS,
  SEED_COMMUNICATION_LOGS,
  SEED_DEPARTMENTS,
  SEED_DOCTORS,
} from '../lib/seedAppointments';
import type {
  Appointment,
  AppointmentAnalytics,
  AppointmentStatus,
  AppointmentType,
  BlockedSlot,
  BookingChannel,
  CommunicationLog,
  DeliveryStatus,
  MockNotification,
  NotificationChannel,
  QueueEntry,
} from '../types';
import {
  computeLiveWaitMinutes,
  deriveQueueStatus,
  estimateWaitMinutes,
  generateAppointmentId,
} from '../types';

type NewAppointmentInput = {
  doctorId: string;
  patientName: string;
  uhid: string;
  phone: string;
  date: string;
  startTime: string;
  bookingChannel: BookingChannel;
  appointmentType?: AppointmentType;
  checkInNow?: boolean;
};

type TokenCheckInInput = {
  patientName: string;
  uhid: string;
  phone: string;
  departmentId: string;
  doctorId: string;
  appointmentType: AppointmentType;
};

type AppointmentContextValue = {
  departments: typeof SEED_DEPARTMENTS;
  doctors: typeof SEED_DOCTORS;
  blockedSlots: BlockedSlot[];
  appointments: Appointment[];
  queue: QueueEntry[];
  communicationLogs: CommunicationLog[];
  notifications: MockNotification[];
  selectedDepartmentId: string;
  setSelectedDepartmentId: (id: string) => void;
  selectedDoctorId: string;
  setSelectedDoctorId: (id: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  analytics: AppointmentAnalytics;
  bookAppointment: (input: NewAppointmentInput) => Appointment;
  cancelAppointment: (id: string) => void;
  rescheduleAppointment: (id: string, startTime: string, date?: string) => void;
  checkInPatient: (appointmentId: string) => void;
  generateTokenCheckIn: (input: TokenCheckInInput) => Appointment;
  callNextPatient: (doctorId: string) => void;
  dismissNotification: (id: string) => void;
  getDoctorAppointments: (doctorId: string, date: string) => Appointment[];
  getDoctorQueue: (doctorId: string) => QueueEntry[];
  getDepartmentDoctors: (departmentId: string) => typeof SEED_DOCTORS;
};

const AppointmentContext = createContext<AppointmentContextValue | null>(null);

function buildNotification(
  channel: NotificationChannel,
  message: string,
): MockNotification {
  return {
    id: `ntf-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    channel,
    message,
    timestamp: new Date().toISOString(),
  };
}

function buildCommLog(
  channel: NotificationChannel,
  patientName: string,
  message: string,
  deliveryStatus: DeliveryStatus = 'Delivered',
  slotTime?: string,
): CommunicationLog {
  return {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    channel,
    patientName,
    message,
    slotTime,
    deliveryStatus,
    timestamp: new Date().toISOString(),
  };
}

function syncQueueFromAppointments(appointments: Appointment[]): QueueEntry[] {
  const checkedIn = appointments.filter(
    (a) => a.checkedIn && a.tokenNumber && a.status !== 'Cancelled' && a.status !== 'No-Show',
  );

  const byDoctor = new Map<string, Appointment[]>();
  checkedIn.forEach((a) => {
    const list = byDoctor.get(a.doctorId) ?? [];
    list.push(a);
    byDoctor.set(a.doctorId, list);
  });

  const queue: QueueEntry[] = [];
  byDoctor.forEach((list) => {
    const sorted = [...list].sort((a, b) => {
      const ta = parseInt(a.tokenNumber!.split('-')[1] ?? '0', 10);
      const tb = parseInt(b.tokenNumber!.split('-')[1] ?? '0', 10);
      return ta - tb;
    });
    sorted.forEach((a, idx) => {
      const dept = SEED_DEPARTMENTS.find((d) => d.id === a.departmentId);
      const position = idx + 1;
      const checkedInAt = a.id.startsWith('apt-new')
        ? new Date().toISOString()
        : new Date(Date.now() - position * 8 * 60_000).toISOString();
      const waitDurationMinutes = computeLiveWaitMinutes(checkedInAt, position);
      const baseStatus =
        a.status === 'In-Consultation' ? ('In-Consultation' as const) : ('Waiting' as const);
      const entry: QueueEntry = {
        id: `q-${a.id}`,
        appointmentId: a.id,
        tokenNumber: a.tokenNumber!,
        patientName: a.patientName,
        uhid: a.uhid,
        doctorId: a.doctorId,
        doctorName: a.doctorName,
        departmentId: a.departmentId,
        assignedRoom: a.assignedRoom ?? dept?.roomLabel ?? '—',
        status: baseStatus,
        position,
        waitDurationMinutes,
        checkedInAt,
      };
      entry.status = deriveQueueStatus(entry);
      queue.push(entry);
    });
  });

  return queue;
}

export function AppointmentProvider({ children }: { children: React.ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>(SEED_APPOINTMENTS);
  const [queue, setQueue] = useState<QueueEntry[]>(() => buildInitialQueue(SEED_APPOINTMENTS));
  const [communicationLogs, setCommunicationLogs] =
    useState<CommunicationLog[]>(SEED_COMMUNICATION_LOGS);
  const [notifications, setNotifications] = useState<MockNotification[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(SEED_DEPARTMENTS[0].id);
  const [selectedDoctorId, setSelectedDoctorId] = useState(SEED_DOCTORS[0].id);
  const [selectedDate, setSelectedDate] = useState(APPOINTMENT_TODAY);

  const pushNotification = useCallback((channel: NotificationChannel, message: string) => {
    const n = buildNotification(channel, message);
    setNotifications((prev) => [n, ...prev].slice(0, 5));
  }, []);

  const pushCommLog = useCallback(
    (
      channel: NotificationChannel,
      patientName: string,
      message: string,
      deliveryStatus: DeliveryStatus = 'Delivered',
      slotTime?: string,
    ) => {
      const log = buildCommLog(channel, patientName, message, deliveryStatus, slotTime);
      setCommunicationLogs((prev) => [log, ...prev].slice(0, 50));
      pushNotification(channel, message);
    },
    [pushNotification],
  );

  const recalcQueue = useCallback((apts: Appointment[]) => {
    setQueue(syncQueueFromAppointments(apts));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setQueue((prev) =>
        prev.map((entry) => {
          const waitDurationMinutes = computeLiveWaitMinutes(entry.checkedInAt, entry.position);
          const updated = { ...entry, waitDurationMinutes };
          return { ...updated, status: deriveQueueStatus(updated) };
        }),
      );
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  const getDepartmentDoctors = useCallback(
    (departmentId: string) =>
      SEED_DOCTORS.filter((d) => d.departmentId === departmentId),
    [],
  );

  useEffect(() => {
    const deptDoctors = SEED_DOCTORS.filter((d) => d.departmentId === selectedDepartmentId);
    if (deptDoctors.length && !deptDoctors.some((d) => d.id === selectedDoctorId)) {
      setSelectedDoctorId(deptDoctors[0].id);
    }
  }, [selectedDepartmentId, selectedDoctorId]);

  const analytics = useMemo((): AppointmentAnalytics => {
    const todayApts = appointments.filter((a) => a.date === APPOINTMENT_TODAY);
    const activeQueue = queue.filter((q) => q.status !== 'Completed' && q.status !== 'Skipped');
    const avgWait =
      activeQueue.length > 0
        ? Math.round(
            activeQueue.reduce((sum, q) => sum + q.waitDurationMinutes, 0) / activeQueue.length,
          )
        : 0;
    const noShows = todayApts.filter((a) => a.status === 'No-Show').length;
    const totalScheduled = todayApts.filter((a) => a.status !== 'Cancelled').length;
    const noShowRate = totalScheduled > 0 ? Math.round((noShows / totalScheduled) * 100) : 0;

    return {
      totalBookings: todayApts.filter((a) => a.status !== 'Cancelled').length,
      averageWaitMinutes: avgWait,
      noShowRatePercent: noShowRate,
    };
  }, [appointments, queue]);

  const bookAppointment = useCallback(
    (input: NewAppointmentInput): Appointment => {
      const doctor = SEED_DOCTORS.find((d) => d.id === input.doctorId)!;
      const dept = SEED_DEPARTMENTS.find((d) => d.id === doctor.departmentId)!;
      const [h, m] = input.startTime.split(':').map(Number);
      const endMins = h * 60 + m + 15;
      const endTime = `${String(Math.floor(endMins / 60)).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}`;

      const appointmentType: AppointmentType =
        input.appointmentType ??
        (input.bookingChannel === 'Walk-in' ? 'Walk-In' : 'Online');

      const token =
        input.checkInNow || input.bookingChannel === 'Walk-in'
          ? nextTokenNumber(doctor.departmentId, input.doctorId, input.date, appointments)
          : undefined;

      const apt: Appointment = {
        id: generateAppointmentId(),
        doctorId: input.doctorId,
        doctorName: doctor.name,
        departmentId: doctor.departmentId,
        patientId: `pat-${Date.now()}`,
        patientName: input.patientName,
        uhid: input.uhid,
        phone: input.phone,
        date: input.date,
        startTime: input.startTime,
        endTime,
        status: input.bookingChannel === 'Walk-in' ? 'Walk-in' : 'Confirmed',
        appointmentType,
        bookingChannel: input.bookingChannel,
        tokenNumber: token,
        checkedIn: Boolean(input.checkInNow || input.bookingChannel === 'Walk-in'),
        assignedRoom: token ? dept.roomLabel : undefined,
      };

      setAppointments((prev) => {
        const next = [...prev, apt];
        recalcQueue(next);
        return next;
      });

      const channel: NotificationChannel =
        input.bookingChannel === 'Online' ? 'WhatsApp' : 'SMS';
      const wait = token ? estimateWaitMinutes(parseInt(token.split('-')[1] ?? '1', 10)) : 10;
      pushCommLog(
        channel,
        input.patientName,
        token
          ? `Token ${token} assigned for ${doctor.name} — est. wait ${wait} mins`
          : `Appointment confirmed for ${input.startTime} slot`,
        'Delivered',
        input.startTime,
      );

      return apt;
    },
    [appointments, pushCommLog, recalcQueue],
  );

  const generateTokenCheckIn = useCallback(
    (input: TokenCheckInInput): Appointment => {
      const doctor = SEED_DOCTORS.find((d) => d.id === input.doctorId)!;
      const dept = SEED_DEPARTMENTS.find((d) => d.id === input.departmentId)!;
      const doctorQueue = syncQueueFromAppointments(appointments).filter(
        (q) => q.doctorId === input.doctorId,
      );
      const atCapacity = doctorQueue.length >= dept.maxQueueCapacity;
      const token = nextTokenNumber(input.departmentId, input.doctorId, APPOINTMENT_TODAY, appointments);

      const now = new Date();
      const startTime = `${String(now.getHours()).padStart(2, '0')}:${String(Math.floor(now.getMinutes() / 15) * 15).padStart(2, '0')}`;
      const endMins = parseTime(startTime) + 15;
      const endTime = `${String(Math.floor(endMins / 60)).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}`;

      const apt: Appointment = {
        id: `apt-new-${Date.now()}`,
        doctorId: input.doctorId,
        doctorName: doctor.name,
        departmentId: input.departmentId,
        patientId: `pat-${Date.now()}`,
        patientName: input.patientName,
        uhid: input.uhid,
        phone: input.phone,
        date: APPOINTMENT_TODAY,
        startTime,
        endTime,
        status: 'Walk-in',
        appointmentType: input.appointmentType,
        bookingChannel: 'Walk-in',
        tokenNumber: token,
        checkedIn: true,
        assignedRoom: dept.roomLabel,
        onWaitingList: atCapacity,
      };

      setAppointments((prev) => {
        const next = [...prev, apt];
        recalcQueue(next);
        return next;
      });

      const waitMsg = atCapacity
        ? `placed on waiting list — capacity breached (${dept.maxQueueCapacity} max)`
        : `checked in — proceed to ${dept.roomLabel}`;
      pushCommLog(
        'SMS',
        input.patientName,
        `Token ${token} generated. ${waitMsg}`,
        'Delivered',
      );

      if (atCapacity) {
        pushCommLog(
          'WhatsApp',
          input.patientName,
          `Queue capacity reached for ${dept.name}. You are on the dynamic waiting list with token ${token}.`,
          'Delivered',
        );
      }

      return apt;
    },
    [appointments, pushCommLog, recalcQueue],
  );

  function parseTime(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + (m || 0);
  }

  const cancelAppointment = useCallback(
    (id: string) => {
      setAppointments((prev) => {
        const apt = prev.find((a) => a.id === id);
        const next = prev.map((a) =>
          a.id === id ? { ...a, status: 'Cancelled' as AppointmentStatus } : a,
        );
        recalcQueue(next);
        if (apt) {
          pushCommLog(
            'Email',
            apt.patientName,
            `Cancellation notice — ${apt.date} at ${apt.startTime} with ${apt.doctorName}`,
            'Delivered',
            apt.startTime,
          );
        }
        return next;
      });
    },
    [pushCommLog, recalcQueue],
  );

  const rescheduleAppointment = useCallback(
    (id: string, startTime: string, date?: string) => {
      setAppointments((prev) => {
        const apt = prev.find((a) => a.id === id);
        const [h, m] = startTime.split(':').map(Number);
        const endMins = h * 60 + m + 15;
        const endTime = `${String(Math.floor(endMins / 60)).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}`;
        const next = prev.map((a) =>
          a.id === id
            ? {
                ...a,
                startTime,
                endTime,
                date: date ?? a.date,
                status: 'Confirmed' as AppointmentStatus,
              }
            : a,
        );
        if (apt) {
          pushCommLog(
            'WhatsApp',
            apt.patientName,
            `Rescheduled to ${date ?? apt.date} at ${startTime} with ${apt.doctorName}`,
            'Delivered',
            startTime,
          );
        }
        return next;
      });
    },
    [pushCommLog],
  );

  const checkInPatient = useCallback(
    (appointmentId: string) => {
      setAppointments((prev) => {
        const apt = prev.find((a) => a.id === appointmentId);
        if (!apt) return prev;
        const dept = SEED_DEPARTMENTS.find((d) => d.id === apt.departmentId)!;
        const token =
          apt.tokenNumber ??
          nextTokenNumber(apt.departmentId, apt.doctorId, apt.date, prev);
        const next = prev.map((a) =>
          a.id === appointmentId
            ? {
                ...a,
                checkedIn: true,
                tokenNumber: token,
                assignedRoom: dept.roomLabel,
                status:
                  a.status === 'Cancelled' ? a.status : ('Confirmed' as AppointmentStatus),
              }
            : a,
        );
        recalcQueue(next);
        pushCommLog(
          'SMS',
          apt.patientName,
          `Check-in confirmed. Token ${token} — proceed to ${dept.roomLabel}`,
          'Delivered',
          apt.startTime,
        );
        return next;
      });
    },
    [pushCommLog, recalcQueue],
  );

  const callNextPatient = useCallback(
    (doctorId: string) => {
      setAppointments((prev) => {
        const doctorQueue = syncQueueFromAppointments(prev).filter(
          (q) => q.doctorId === doctorId && q.status === 'Waiting',
        );
        const nextEntry = doctorQueue.sort((a, b) => a.position - b.position)[0];
        if (!nextEntry) return prev;

        const next = prev.map((a) => {
          if (a.doctorId === doctorId && a.status === 'In-Consultation') {
            return { ...a, status: 'Confirmed' as AppointmentStatus };
          }
          if (a.id === nextEntry.appointmentId) {
            return { ...a, status: 'In-Consultation' as AppointmentStatus };
          }
          return a;
        });
        recalcQueue(next);

        const called = next.find((a) => a.id === nextEntry.appointmentId);
        if (called) {
          pushCommLog(
            'WhatsApp',
            called.patientName,
            `${called.doctorName} is ready. Proceed to ${called.assignedRoom} with token ${called.tokenNumber}.`,
            'Delivered',
          );
        }
        return next;
      });
    },
    [pushCommLog, recalcQueue],
  );

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const getDoctorAppointments = useCallback(
    (doctorId: string, date: string) =>
      appointments.filter((a) => a.doctorId === doctorId && a.date === date),
    [appointments],
  );

  const getDoctorQueue = useCallback(
    (doctorId: string) =>
      queue.filter((q) => q.doctorId === doctorId).sort((a, b) => a.position - b.position),
    [queue],
  );

  const value = useMemo(
    () => ({
      departments: SEED_DEPARTMENTS,
      doctors: SEED_DOCTORS,
      blockedSlots: SEED_BLOCKED_SLOTS,
      appointments,
      queue,
      communicationLogs,
      notifications,
      selectedDepartmentId,
      setSelectedDepartmentId,
      selectedDoctorId,
      setSelectedDoctorId,
      selectedDate,
      setSelectedDate,
      analytics,
      bookAppointment,
      cancelAppointment,
      rescheduleAppointment,
      checkInPatient,
      generateTokenCheckIn,
      callNextPatient,
      dismissNotification,
      getDoctorAppointments,
      getDoctorQueue,
      getDepartmentDoctors,
    }),
    [
      appointments,
      queue,
      communicationLogs,
      notifications,
      selectedDepartmentId,
      selectedDoctorId,
      selectedDate,
      analytics,
      bookAppointment,
      cancelAppointment,
      rescheduleAppointment,
      checkInPatient,
      generateTokenCheckIn,
      callNextPatient,
      dismissNotification,
      getDoctorAppointments,
      getDoctorQueue,
      getDepartmentDoctors,
    ],
  );

  return <AppointmentContext.Provider value={value}>{children}</AppointmentContext.Provider>;
}

export function useAppointments(): AppointmentContextValue {
  const ctx = useContext(AppointmentContext);
  if (!ctx) throw new Error('useAppointments must be used within AppointmentProvider');
  return ctx;
}
