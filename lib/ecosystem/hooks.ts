'use client';

import { useMemo } from 'react';

import { useEcosystemStore } from './store';
import type { AppointmentStatus } from './types';

export function usePatientData(patientId: string | null) {
  const patients = useEcosystemStore((s) => s.patients);
  return useMemo(
    () => (patientId ? patients.find((p) => p.id === patientId) : undefined),
    [patients, patientId],
  );
}

export function usePatientAppointments(patientId: string | null) {
  const appointments = useEcosystemStore((s) => s.appointments);
  return useMemo(
    () =>
      patientId
        ? [...appointments]
            .filter((a) => a.patientId === patientId)
            .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
        : [],
    [appointments, patientId],
  );
}

export function useUpcomingAppointments(patientId: string | null) {
  const appointments = usePatientAppointments(patientId);
  const today = new Date().toISOString().slice(0, 10);
  return appointments.filter(
    (a) =>
      a.status !== 'Cancelled' &&
      a.status !== 'Completed' &&
      (a.date >= today || a.status === 'In Consultation'),
  );
}

export function useTodayAppointments(patientId: string | null) {
  const appointments = usePatientAppointments(patientId);
  const today = new Date().toISOString().slice(0, 10);
  return appointments.filter((a) => a.date === today && a.status !== 'Cancelled');
}

export function usePatientPrescriptions(patientId: string | null) {
  const prescriptions = useEcosystemStore((s) => s.prescriptions);
  return useMemo(
    () =>
      patientId
        ? prescriptions.filter((p) => p.patientId === patientId).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))
        : [],
    [prescriptions, patientId],
  );
}

export function usePatientNotifications(patientId: string | null) {
  const notifications = useEcosystemStore((s) => s.notifications);
  return useMemo(
    () =>
      patientId
        ? notifications.filter((n) => n.patientId === patientId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        : [],
    [notifications, patientId],
  );
}

export function useUnreadNotificationCount(patientId: string | null) {
  const notifications = usePatientNotifications(patientId);
  return notifications.filter((n) => !n.read).length;
}

export function useDoctors(search = '', department = 'all', branchId = 'all') {
  const doctors = useEcosystemStore((s) => s.doctors);
  const q = search.trim().toLowerCase();
  return useMemo(
    () =>
      doctors.filter((d) => {
        const matchDept = department === 'all' || d.department === department;
        const matchBranch = branchId === 'all' || d.branchId === branchId;
        const matchSearch =
          !q ||
          d.name.toLowerCase().includes(q) ||
          d.department.toLowerCase().includes(q) ||
          d.specialization.toLowerCase().includes(q);
        return matchDept && matchBranch && matchSearch;
      }),
    [doctors, search, department, branchId],
  );
}

export function useDoctor(doctorId: string | null) {
  const doctors = useEcosystemStore((s) => s.doctors);
  return useMemo(() => (doctorId ? doctors.find((d) => d.id === doctorId) : undefined), [doctors, doctorId]);
}

export function useMedicalRecords(patientId: string | null) {
  const visits = useEcosystemStore((s) => s.visits);
  const vitals = useEcosystemStore((s) => s.vitals);
  const labs = useEcosystemStore((s) => s.labOrders);
  const rad = useEcosystemStore((s) => s.radiologyOrders);

  return useMemo(() => {
    if (!patientId) return { visits: [], vitals: [], labs: [], rad: [] };
    return {
      visits: visits.filter((v) => v.patientId === patientId),
      vitals: vitals.filter((v) => v.patientId === patientId),
      labs: labs.filter((l) => l.patientId === patientId),
      rad: rad.filter((r) => r.patientId === patientId),
    };
  }, [patientId, visits, vitals, labs, rad]);
}

export function formatAppointmentStatus(status: AppointmentStatus): string {
  return status;
}

export function formatDateLabel(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTimeLabel(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function useLiveQueueAppointment(patientId: string | null) {
  const appointments = usePatientAppointments(patientId);
  return useMemo(
    () =>
      appointments.find((a) =>
        ['Confirmed', 'Checked-In', 'In Consultation'].includes(a.status),
      ),
    [appointments],
  );
}

export function useOpdAnalytics() {
  return useEcosystemStore((s) => s.opdAnalytics);
}

export function useOpdDisplay() {
  return useEcosystemStore((s) => s.opdDisplay);
}

export function useBranches() {
  return useEcosystemStore((s) => s.branches);
}

export function useFamilyMembers(patientId: string | null) {
  const members = useEcosystemStore((s) => s.familyMembers);
  return useMemo(
    () => (patientId ? members.filter((m) => m.primaryPatientId === patientId) : []),
    [members, patientId],
  );
}
