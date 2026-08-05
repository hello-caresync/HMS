'use client';

import { useEffect } from 'react';

import { useDoctorAuth } from '@/lib/doctor/auth/DoctorAuthProvider';
import { mergeEcosystemIntoDoctor } from '@/lib/ecosystem/doctor-sync';

import { SEED_DRUGS } from './seed-data';
import { useDoctorClinicalStore } from './store';
import type { Patient } from './types';

/** Bootstrap clinical store when doctor session is available */
export function useDoctorClinicalInit() {
  const { session } = useDoctorAuth();
  const initializeForDoctor = useDoctorClinicalStore((s) => s.initializeForDoctor);

  useEffect(() => {
    if (!session) return;
    initializeForDoctor(
      session.doctorId,
      session.fullName,
      session.email,
      session.specialization,
      session.licenseNumber,
    );
    mergeEcosystemIntoDoctor(session.doctorId);
  }, [session, initializeForDoctor]);
}

export function usePatients(search = '', filter = 'all') {
  const patients = useDoctorClinicalStore((s) => s.patients);
  const q = search.trim().toLowerCase();
  return patients.filter((p) => {
    const matchesSearch =
      !q ||
      p.fullName.toLowerCase().includes(q) ||
      p.mrn.toLowerCase().includes(q) ||
      p.diagnosis?.toLowerCase().includes(q);
    const matchesFilter =
      filter === 'all' ||
      (filter === 'critical' && p.vitals.spo2 && parseInt(p.vitals.spo2) < 95) ||
      (filter === 'follow-up' && p.visits.some((v) => v.type.includes('Follow')));
    return matchesSearch && matchesFilter;
  });
}

export function usePatient(patientId: string | null): Patient | undefined {
  return useDoctorClinicalStore((s) => s.patients.find((p) => p.id === patientId));
}

export function useTodayAppointments() {
  const appointments = useDoctorClinicalStore((s) => s.appointments);
  const today = new Date().toDateString();
  return appointments.filter((a) => new Date(a.time).toDateString() === today);
}

export function useDrugCatalog() {
  return SEED_DRUGS;
}

export function checkDrugAlerts(patient: Patient | undefined, drugName: string) {
  if (!patient) return { interactions: [] as string[], allergies: [] as string[] };
  const drug = SEED_DRUGS.find(
    (d) =>
      d.brand.toLowerCase().includes(drugName.toLowerCase()) ||
      d.generic.toLowerCase().includes(drugName.toLowerCase()),
  );
  const allergies =
    drug?.allergyConflict?.filter((a) =>
      patient.allergies.some((pa) => pa.toLowerCase().includes(a.toLowerCase())),
    ) ?? [];
  const currentMeds = patient.medications.map((m) => m.name);
  const interactions =
    drug?.interactsWith?.filter((i) =>
      currentMeds.some((m) => m.toLowerCase().includes(i.toLowerCase())),
    ) ?? [];
  return { interactions, allergies };
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return formatDate(iso);
}
