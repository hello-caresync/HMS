'use client';

import { useEcosystemStore } from '@/lib/ecosystem/store';
import type { AppointmentStatus, EcosystemAppointment } from '@/lib/ecosystem/types';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import {
  hubDoctorAcceptAppointment,
  hubDoctorCompleteConsultation,
  hubDoctorStartConsultation,
} from '@/lib/ecosystem/ecosystem-hub';
import { persistCrossAppAppointment } from '@/lib/realtime/cross-app-sync';

import { syncAppointmentToDoctor, syncStatusToDoctor } from '@/lib/ecosystem/doctor-sync';
import { useDoctorClinicalStore } from './store';
import type { Appointment, Consultation, PrescriptionItem, Vitals } from './types';

function ecoStatusFromDoctor(status: string): AppointmentStatus {
  switch (status) {
    case 'waiting':
      return 'Confirmed';
    case 'in-progress':
      return 'In Consultation';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'Requested';
  }
}

function doctorApptToEco(appt: Appointment, doctorName: string): EcosystemAppointment {
  const start = new Date(appt.time);
  const end = new Date(appt.endTime);
  return {
    id: appt.id,
    patientId: appt.patientId,
    patientName: appt.patientName,
    patientMrn: appt.mrn,
    doctorId: appt.doctorId,
    doctorName,
    department: 'General Medicine',
    date: start.toISOString().slice(0, 10),
    time: start.toTimeString().slice(0, 5),
    endTime: end.toTimeString().slice(0, 5),
    reason: appt.chiefComplaint,
    status: ecoStatusFromDoctor(appt.status),
    type: appt.type === 'teleconsult' ? 'Teleconsult' : 'OPD',
    token: appt.token,
    location: 'OPD Block A',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/** Resolve appointment from ecosystem store, falling back to doctor clinical store. */
export function resolveEcosystemAppointment(appointmentId: string): EcosystemAppointment | null {
  const ecoAppt = useEcosystemStore.getState().appointments.find((a) => a.id === appointmentId);
  if (ecoAppt) return ecoAppt;

  const docAppt = useDoctorClinicalStore.getState().appointments.find((a) => a.id === appointmentId);
  if (!docAppt) return null;

  const profile = useDoctorClinicalStore.getState().profile;
  return doctorApptToEco(docAppt, profile?.fullName ?? 'Doctor');
}

function ensureEcosystemAppointment(
  appointmentId: string,
  status?: AppointmentStatus,
): EcosystemAppointment | null {
  const resolved = resolveEcosystemAppointment(appointmentId);
  if (!resolved) return null;

  const appt = status ? { ...resolved, status, updatedAt: new Date().toISOString() } : resolved;
  const eco = useEcosystemStore.getState();
  const exists = eco.appointments.some((a) => a.id === appointmentId);

  if (exists) {
    useEcosystemStore.setState({
      appointments: eco.appointments.map((a) => (a.id === appointmentId ? appt : a)),
    });
  } else {
    useEcosystemStore.setState({ appointments: [...eco.appointments, appt] });
  }

  return appt;
}

function requireSupabase() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error('Supabase is not configured');
  return supabase;
}

async function persistAppointmentToSupabase(
  appointmentId: string,
  status: AppointmentStatus,
): Promise<void> {
  const supabase = requireSupabase();
  const appt = ensureEcosystemAppointment(appointmentId, status);
  if (!appt) throw new Error(`Appointment ${appointmentId} not found`);

  await persistCrossAppAppointment(supabase, appt);
}

async function persistPrescriptionToSupabase(
  rxId: string,
  patientId: string,
  doctorId: string,
  appointmentId: string | undefined,
  medicines: PrescriptionItem[],
  notes?: string,
): Promise<void> {
  const supabase = requireSupabase();

  const { error } = await supabase.from('ecosystem_prescriptions').upsert(
    {
      id: rxId,
      patient_id: patientId,
      doctor_id: doctorId,
      appointment_id: appointmentId ?? null,
      medicines: medicines.map((m) => ({
        id: m.id,
        name: m.drug,
        dose: m.dose,
        frequency: m.frequency,
        duration: m.duration,
        instructions: m.instructions,
      })),
      status: 'active',
      notes: notes ?? null,
      issued_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  );

  if (error) throw new Error(error.message);
}

async function persistMedicalRecord(
  patientId: string,
  title: string,
  summary: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  const supabase = requireSupabase();

  const { error } = await supabase.from('ecosystem_medical_records').insert({
    patient_id: patientId,
    record_type: 'visit',
    title,
    summary,
    metadata,
    recorded_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);
}

async function persistVitalsRecord(
  patientId: string,
  appointmentId: string,
  vitals: Vitals,
): Promise<void> {
  const supabase = requireSupabase();

  const { error } = await supabase.from('ecosystem_medical_records').insert({
    patient_id: patientId,
    record_type: 'vitals',
    title: 'Consultation vitals',
    summary: `BP ${vitals.bp} · HR ${vitals.hr} · Temp ${vitals.temp} · SpO₂ ${vitals.spo2}`,
    metadata: {
      appointmentId,
      vitals,
      recordedAt: vitals.recordedAt || new Date().toISOString(),
    },
    recorded_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);
}

/** Accept / confirm appointment → hub routes hospital + patient notifications */
export async function doctorConfirmAppointmentAsync(appointmentId: string): Promise<void> {
  const existing = useEcosystemStore.getState().appointments.find((a) => a.id === appointmentId);
  if (existing) {
    useEcosystemStore.getState().confirmAppointment(appointmentId);
  } else {
    ensureEcosystemAppointment(appointmentId, 'Confirmed');
  }

  const appt = resolveEcosystemAppointment(appointmentId);
  if (!appt) return;

  await hubDoctorAcceptAppointment({ ...appt, status: 'Confirmed' });
}

/** Start consultation → hub syncs OPD + patient */
export async function doctorStartConsultationAsync(appointmentId: string): Promise<void> {
  const existing = useEcosystemStore.getState().appointments.find((a) => a.id === appointmentId);
  if (existing) {
    useEcosystemStore.getState().startConsultation(appointmentId);
  } else {
    ensureEcosystemAppointment(appointmentId, 'In Consultation');
  }

  const appt = resolveEcosystemAppointment(appointmentId);
  if (!appt) return;
  await hubDoctorStartConsultation({ ...appt, status: 'In Consultation' });
}

export function doctorConfirmAppointment(appointmentId: string): void {
  void doctorConfirmAppointmentAsync(appointmentId).catch(console.error);
}

export function doctorStartConsultationEco(appointmentId: string): void {
  void doctorStartConsultationAsync(appointmentId).catch(console.error);
}

export function doctorCancelAppointment(appointmentId: string): void {
  useEcosystemStore.getState().cancelAppointment(appointmentId);
  void persistAppointmentToSupabase(appointmentId, 'Cancelled').catch(console.error);
}

export function doctorRescheduleAppointment(
  appointmentId: string,
  date: string,
  time: string,
  endTime: string,
): void {
  useEcosystemStore.getState().rescheduleAppointment(appointmentId, date, time);
  const appt = useEcosystemStore.getState().appointments.find((a) => a.id === appointmentId);
  if (appt) syncAppointmentToDoctor({ ...appt, date, time, endTime, status: 'Requested' });
  void persistAppointmentToSupabase(appointmentId, 'Requested').catch(console.error);
}

/** Complete consultation → vitals, EMR, prescriptions, status COMPLETED */
export async function doctorCompleteConsultationAsync(
  consultation: Consultation,
  chiefComplaint: string,
  vitals?: Vitals,
): Promise<void> {
  const store = useDoctorClinicalStore.getState();
  const doctorId = store.doctorId;
  if (!doctorId) throw new Error('Doctor not signed in');

  const appt = store.appointments.find((a) => a.id === consultation.appointmentId);

  if (consultation.prescription.length > 0) {
    useEcosystemStore.getState().createPrescription({
      patientId: consultation.patientId,
      doctorId,
      appointmentId: consultation.appointmentId,
      medicines: consultation.prescription.map((m) => ({
        name: m.drug,
        dose: m.dose,
        frequency: m.frequency,
        duration: m.duration,
        instructions: m.instructions,
      })),
      notes: consultation.treatmentPlan || consultation.plan,
    });
  }

  const existing = useEcosystemStore.getState().appointments.find(
    (a) => a.id === consultation.appointmentId,
  );
  if (existing) {
    useEcosystemStore.getState().completeAppointment(consultation.appointmentId);
  } else {
    ensureEcosystemAppointment(consultation.appointmentId, 'Completed');
  }

  const rxId = `rx-${consultation.id}`;
  if (consultation.prescription.length > 0) {
    await persistPrescriptionToSupabase(
      rxId,
      consultation.patientId,
      doctorId,
      consultation.appointmentId,
      consultation.prescription,
      consultation.treatmentPlan,
    );
  }

  const vitalsPayload =
    vitals ??
    consultation.vitals ??
    store.patients.find((p) => p.id === consultation.patientId)?.vitals;

  if (vitalsPayload) {
    await persistVitalsRecord(consultation.patientId, consultation.appointmentId, vitalsPayload);
  }

  await persistMedicalRecord(
    consultation.patientId,
    consultation.diagnosis || 'Consultation visit',
    [
      chiefComplaint && `Chief complaint: ${chiefComplaint}`,
      consultation.diagnosis && `Diagnosis: ${consultation.diagnosis}`,
      consultation.treatmentPlan && `Plan: ${consultation.treatmentPlan}`,
    ]
      .filter(Boolean)
      .join('\n'),
    {
      consultationId: consultation.id,
      appointmentId: consultation.appointmentId,
      subjective: consultation.subjective,
      objective: consultation.objective,
      assessment: consultation.assessment,
      plan: consultation.plan,
      diagnosis: consultation.diagnosis,
      followUpDate: consultation.followUpDate,
      vitals: vitalsPayload ?? null,
      prescription: consultation.prescription,
    },
  );

  const resolvedAppt = resolveEcosystemAppointment(consultation.appointmentId);
  if (resolvedAppt) {
    const profile = store.profile;
    await hubDoctorCompleteConsultation(
      { ...resolvedAppt, status: 'Completed' },
      { generateBillingDraft: true, consultationFee: profile?.consultationFee ?? 800 },
    );
  } else {
    await persistAppointmentToSupabase(consultation.appointmentId, 'Completed');
  }

  if (appt) {
    syncStatusToDoctor(consultation.appointmentId, 'Completed');
  }
}

export function doctorCompleteConsultation(
  consultation: Consultation,
  chiefComplaint: string,
  vitals?: Vitals,
): void {
  void doctorCompleteConsultationAsync(consultation, chiefComplaint, vitals).catch(console.error);
}

export function doctorSendPrescription(input: {
  patientId: string;
  appointmentId?: string;
  medicines: PrescriptionItem[];
  notes?: string;
}): string {
  const doctorId = useDoctorClinicalStore.getState().doctorId;
  if (!doctorId) throw new Error('Doctor not signed in');

  const rx = useEcosystemStore.getState().createPrescription({
    patientId: input.patientId,
    doctorId,
    appointmentId: input.appointmentId,
    medicines: input.medicines.map((m) => ({
      name: m.drug,
      dose: m.dose,
      frequency: m.frequency,
      duration: m.duration,
      instructions: m.instructions,
    })),
    notes: input.notes,
  });

  void persistPrescriptionToSupabase(
    rx.id,
    input.patientId,
    doctorId,
    input.appointmentId,
    input.medicines,
    input.notes,
  ).catch(console.error);

  return rx.id;
}

export function syncDoctorStatusToEco(appointmentId: string, doctorStatus: string): void {
  const ecoStatus = ecoStatusFromDoctor(doctorStatus);
  syncStatusToDoctor(appointmentId, ecoStatus);
  void persistAppointmentToSupabase(appointmentId, ecoStatus).catch(console.error);
}
