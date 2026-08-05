'use client';

import {
  doctorCompleteConsultationAsync,
  doctorConfirmAppointmentAsync,
  doctorStartConsultationAsync,
} from './ecosystem-bridge';
import { useDoctorClinicalStore } from './store';
import type { Vitals } from './types';

export type WorkflowResult =
  | { ok: true; consultationId?: string }
  | { ok: false; error: string };

export async function acceptDoctorAppointment(appointmentId: string): Promise<WorkflowResult> {
  const store = useDoctorClinicalStore.getState();
  const appt = store.appointments.find((a) => a.id === appointmentId);
  if (!appt) return { ok: false, error: 'Appointment not found' };

  store.confirmAppointment(appointmentId);

  try {
    await doctorConfirmAppointmentAsync(appointmentId);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to confirm appointment';
    return { ok: false, error: message };
  }
}

export async function startDoctorConsultation(appointmentId: string): Promise<WorkflowResult> {
  const store = useDoctorClinicalStore.getState();
  const appt = store.appointments.find((a) => a.id === appointmentId);
  if (!appt) return { ok: false, error: 'Appointment not found' };

  const consultationId = store.startConsultation(appointmentId);

  try {
    await doctorStartConsultationAsync(appointmentId);
    return { ok: true, consultationId };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to start consultation';
    return { ok: false, error: message };
  }
}

export async function completeDoctorConsultation(
  consultationId: string,
  options?: { chiefComplaint?: string; vitals?: Vitals },
): Promise<WorkflowResult> {
  const store = useDoctorClinicalStore.getState();
  const consultation = store.consultations.find((c) => c.id === consultationId);
  if (!consultation) return { ok: false, error: 'Consultation not found' };

  const appt = store.appointments.find((a) => a.id === consultation.appointmentId);
  const chiefComplaint = options?.chiefComplaint ?? appt?.chiefComplaint ?? consultation.subjective;
  const mergedConsultation = {
    ...consultation,
    vitals: options?.vitals ?? consultation.vitals,
  };

  store.completeConsultation(consultationId);

  try {
    await doctorCompleteConsultationAsync(mergedConsultation, chiefComplaint, mergedConsultation.vitals);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to complete consultation';
    return { ok: false, error: message };
  }
}
