'use client';

import type { Appointment } from '@/lib/nexora-doctor/types';
import { useDoctorClinicalStore } from '@/lib/nexora-doctor/store';

import { useEcosystemStore } from './store';
import type { AppointmentStatus, EcosystemAppointment, EcosystemPrescription } from './types';

function mapStatus(status: AppointmentStatus): Appointment['status'] {
  switch (status) {
    case 'Requested':
      return 'scheduled';
    case 'Confirmed':
    case 'Checked-In':
      return 'waiting';
    case 'In Consultation':
      return 'in-progress';
    case 'Completed':
      return 'completed';
    case 'Cancelled':
      return 'cancelled';
    default:
      return 'scheduled';
  }
}

function toDoctorAppointment(appt: EcosystemAppointment): Appointment {
  const isoTime = new Date(`${appt.date}T${appt.time}`).toISOString();
  const isoEnd = new Date(`${appt.date}T${appt.endTime}`).toISOString();
  return {
    id: appt.id,
    patientId: appt.patientId,
    patientName: appt.patientName,
    mrn: appt.patientMrn,
    time: isoTime,
    endTime: isoEnd,
    type: appt.type === 'Teleconsult' ? 'teleconsult' : 'in-person',
    status: mapStatus(appt.status),
    chiefComplaint: appt.reason,
    token: appt.token,
    doctorId: appt.doctorId,
  };
}

export function syncAppointmentToDoctor(appt: EcosystemAppointment) {
  const store = useDoctorClinicalStore.getState();
  if (!store.doctorId) return;

  const mapped = toDoctorAppointment(appt);
  const exists = store.appointments.some((a) => a.id === appt.id);

  useDoctorClinicalStore.setState({
    appointments: exists
      ? store.appointments.map((a) => (a.id === appt.id ? mapped : a))
      : [...store.appointments, mapped],
        notifications: exists
          ? store.notifications
          : [
              {
                id: `eco-notif-${appt.id}`,
                title: 'New Appointment Booked',
                body: `${appt.patientName} · ${appt.reason} · ${appt.date} ${appt.time}`,
                category: 'appointment' as const,
                read: false,
                at: new Date().toISOString(),
                appointmentId: appt.id,
                patientId: appt.patientId,
                targetHref: '/doctor/schedule',
              },
              ...store.notifications,
            ],
    activities: exists
      ? store.activities
      : [
          {
            id: `eco-act-${appt.id}`,
            action: 'Patient booked appointment',
            detail: `${appt.patientName} · ${appt.department}`,
            at: new Date().toISOString(),
          },
          ...store.activities,
        ],
  });
}

export function syncStatusToDoctor(appointmentId: string, status: AppointmentStatus) {
  const appt = useEcosystemStore.getState().appointments.find((a) => a.id === appointmentId);
  if (!appt) return;

  syncAppointmentToDoctor({ ...appt, status });

  const mappedStatus = mapStatus(status);
  useDoctorClinicalStore.setState((s) => ({
    appointments: s.appointments.map((a) =>
      a.id === appointmentId ? { ...a, status: mappedStatus } : a,
    ),
  }));
}

export function syncPrescriptionToDoctor(rx: EcosystemPrescription) {
  const store = useDoctorClinicalStore.getState();
  useDoctorClinicalStore.setState({
    prescriptions: [
      {
        id: rx.id,
        patientId: rx.patientId,
        patientName: rx.patientName,
        appointmentId: rx.appointmentId,
        medicines: rx.medicines.map((m) => ({
          id: m.id,
          drug: m.name,
          dose: m.dose,
          frequency: m.frequency,
          duration: m.duration,
          instructions: m.instructions,
        })),
        notes: rx.notes,
        status: 'sent' as const,
        issuedAt: rx.issuedAt,
        doctorId: rx.doctorId,
      },
      ...store.prescriptions,
    ],
  });
}

export function mergeEcosystemIntoDoctor(doctorId: string) {
  const eco = useEcosystemStore.getState();
  const forDoctor = eco.appointments.filter((a) => a.doctorId === doctorId);
  const store = useDoctorClinicalStore.getState();

  const merged = [...store.appointments];
  forDoctor.forEach((appt) => {
    const idx = merged.findIndex((a) => a.id === appt.id);
    const mapped = toDoctorAppointment(appt);
    if (idx >= 0) merged[idx] = mapped;
    else merged.push(mapped);
  });

  useDoctorClinicalStore.setState({ appointments: merged });
}
