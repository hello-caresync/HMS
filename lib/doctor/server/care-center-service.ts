import type {
  CareCenterInsights,
  IpdDashboardStats,
  IpdPatientCard,
  IpdRiskLevel,
  OpdDashboardStats,
  OpdQueueCard,
} from '@/lib/doctor/types/care-center-dto';

import { mockStore } from './mock-store';
import type { DoctorSession } from './auth';
import { writeAuditLog } from './audit';
import { updateAppointmentStatus } from './clinical-service';

function mapVisitType(complaint: string): OpdQueueCard['visitType'] {
  if (complaint.toLowerCase().includes('emergency')) return 'Emergency Walk-in';
  return 'OPD';
}

function vitalsFromPatient(patientId: string): OpdQueueCard['vitalsStatus'] {
  if (patientId === 'pat-3') return 'critical';
  if (patientId === 'pat-1') return 'attention';
  return 'normal';
}

export async function getOpdCareCenter(session: DoctorSession) {
  const queue: OpdQueueCard[] = mockStore.opdQueue.map((q, index) => {
    const patient = mockStore.patients.find((p) => p.id === q.patientId);
    return {
      id: q.id,
      token: q.token,
      patientId: q.patientId,
      patientName: q.patientName,
      age: patient?.age ?? 0,
      gender: patient?.gender ?? '—',
      uhid: patient?.mrn ?? '—',
      appointmentTime: new Date().toISOString(),
      department: 'General Medicine',
      chiefComplaint: q.chiefComplaint,
      vitalsStatus: vitalsFromPatient(q.patientId),
      waitMinutes: q.waitMinutes,
      visitType: mapVisitType(q.chiefComplaint),
      priority: vitalsFromPatient(q.patientId) === 'critical' ? 'STAT' : 'Routine',
      hasAllergies: (patient?.allergies.length ?? 0) > 0,
      allergyList: patient?.allergies ?? [],
      insuranceStatus: 'Verified',
      status: q.status as OpdQueueCard['status'],
    };
  });

  const stats: OpdDashboardStats = {
    todayTotal: queue.length,
    waiting: queue.filter((q) => q.status === 'WAITING' || q.status === 'SCHEDULED').length,
    checkedIn: queue.filter((q) => q.status === 'CHECKED_IN').length,
    ongoing: queue.filter((q) => q.status === 'IN_CONSULT').length,
    completed: 2,
    followUpsToday: 1,
    teleconsultations: 1,
    emergencyWalkIns: queue.filter((q) => q.visitType === 'Emergency Walk-in').length,
  };

  return { stats, queue };
}

function ipdRiskLevel(patientId: string, ward: string): IpdRiskLevel {
  if (ward.toUpperCase().includes('ICU')) return 'critical';
  if (patientId === 'pat-3') return 'high';
  return 'moderate';
}

export async function getIpdCareCenter(session: DoctorSession) {
  const patients: IpdPatientCard[] = mockStore.ipdCensus.map((r) => {
    const patient = mockStore.patients.find((p) => p.id === r.patientId) ?? mockStore.patients[0];
    const ward = r.ward;
    return {
      id: r.id,
      patientId: r.patientId,
      bed: r.bed,
      ward,
      room: ward.includes('ICU') ? `ICU-${r.bed}` : `Rm-${r.bed}`,
      admissionDate: new Date(Date.now() - r.losDays * 86400000).toISOString(),
      attendingDoctor: session.fullName,
      primaryDiagnosis: patient.chronicConditions[0] ?? 'Under evaluation',
      riskLevel: ipdRiskLevel(r.patientId, ward),
      losDays: r.losDays,
      insuranceStatus: 'Verified',
      currentCondition: 'Stable on ward',
      status: 'ADMITTED',
      patient: {
        id: patient.id,
        mrn: patient.mrn,
        fullName: patient.fullName,
        age: patient.age,
        gender: patient.gender,
        bloodGroup: patient.bloodGroup,
        allergies: patient.allergies,
        chronicConditions: patient.chronicConditions,
      },
      pendingProgressNotes: r.soapHistory.length === 0,
      pendingOrders: r.patientId === 'pat-3' ? 2 : 0,
      isIcu: ward.toUpperCase().includes('ICU'),
    };
  });

  const stats: IpdDashboardStats = {
    todayAdmissions: 1,
    currentInpatients: patients.length,
    icuPatients: patients.filter((p) => p.isIcu).length,
    criticalPatients: patients.filter((p) => p.riskLevel === 'critical' || p.riskLevel === 'high').length,
    dischargeDue: 0,
    roundsToday: patients.length,
    pendingProgressNotes: patients.filter((p) => p.pendingProgressNotes).length,
    pendingOrders: patients.reduce((s, p) => s + p.pendingOrders, 0),
  };

  return { stats, patients };
}

export async function getCareCenterInsights(_session: DoctorSession): Promise<{ insights: CareCenterInsights }> {
  return {
    insights: {
      patientsSeenToday: 12,
      avgConsultMinutes: 14,
      admissions: 2,
      discharges: 1,
      followUpRate: 82,
      criticalCases: 2,
      labOrders: 8,
      radiologyOrders: 3,
      prescriptionCount: 15,
      revenueContribution: 84000,
      patientSatisfaction: 4.8,
    },
  };
}

export async function startOpdConsultation(session: DoctorSession, appointmentId: string) {
  return updateAppointmentStatus(session, appointmentId, 'IN_CONSULT');
}

export async function completeOpdConsultation(
  session: DoctorSession,
  input: {
    appointmentId: string;
    patientId: string;
    chiefComplaint: string;
    soapNotes?: Record<string, unknown>;
    diagnosisIcd10?: unknown[];
    sendPrescription?: boolean;
  },
) {
  const encounterId = `enc-${Date.now()}`;
  await updateAppointmentStatus(session, input.appointmentId, 'COMPLETED');
  await writeAuditLog({
    session,
    entityType: 'encounter',
    entityId: encounterId,
    action: 'COMPLETE_OPD',
    payload: { appointmentId: input.appointmentId },
  });
  return { encounter: { id: encounterId, ...input, status: 'COMPLETED' }, synced: ['patient_app', 'emr', 'pharmacy', 'billing'] };
}

export async function saveIpdProgressNote(
  session: DoctorSession,
  input: { admissionId: string; note: { s: string; o: string; a: string; p: string } },
) {
  const row = mockStore.ipdCensus.find((r) => r.id === input.admissionId);
  if (!row) throw new Error('NOT_FOUND');
  row.soapHistory.push({ at: new Date().toISOString(), author: session.fullName, ...input.note });
  await writeAuditLog({ session, entityType: 'ipd_admission', entityId: input.admissionId, action: 'PROGRESS_NOTE' });
  return { success: true };
}

export async function approveIpdDischarge(
  session: DoctorSession,
  input: { admissionId: string; patientId: string; summary: string; followUp?: string },
) {
  const row = mockStore.ipdCensus.find((r) => r.id === input.admissionId);
  if (!row) throw new Error('NOT_FOUND');
  const docId = `doc-${Date.now()}`;
  await writeAuditLog({ session, entityType: 'ipd_admission', entityId: input.admissionId, action: 'DISCHARGE' });
  return { document: { id: docId, summary: input.summary }, synced: ['billing', 'pharmacy', 'patient_app'] };
}

export async function requestAdmissionFromOpd(
  session: DoctorSession,
  input: { patientId: string; wardName: string; bedNumber: string; reason: string },
) {
  const id = `ipd-${Date.now()}`;
  await writeAuditLog({ session, entityType: 'ipd_admission', entityId: id, action: 'CREATE_FROM_OPD' });
  return { admission: { id, ...input, status: 'ADMITTED' } };
}
