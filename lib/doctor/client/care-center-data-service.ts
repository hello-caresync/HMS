import { apiGet, apiPost } from '@/lib/doctor/client/api-client';
import type {
  CareCenterInsights,
  IpdDashboardStats,
  IpdPatientCard,
  OpdDashboardStats,
  OpdQueueCard,
} from '@/lib/doctor/types/care-center-dto';

export async function fetchCareCenterOpd(): Promise<{ stats: OpdDashboardStats; queue: OpdQueueCard[] }> {
  return apiGet('/api/doctor/care-center/opd');
}

export async function fetchCareCenterIpd(): Promise<{ stats: IpdDashboardStats; patients: IpdPatientCard[] }> {
  return apiGet('/api/doctor/care-center/ipd');
}

export async function fetchCareCenterInsights(): Promise<{ insights: CareCenterInsights }> {
  return apiGet('/api/doctor/care-center/insights');
}

export async function startCareCenterConsultation(appointmentId: string) {
  return apiPost<{ appointment: unknown }>('/api/doctor/care-center/opd/start', { appointmentId });
}

export async function completeCareCenterConsultation(body: {
  appointmentId: string;
  patientId: string;
  chiefComplaint: string;
  soapNotes?: Record<string, unknown>;
  diagnosisIcd10?: unknown[];
}) {
  return apiPost<{ encounter: { id: string }; synced: string[] }>(
    '/api/doctor/care-center/opd/complete',
    body,
  );
}

export async function requestCareCenterAdmission(body: {
  patientId: string;
  wardName: string;
  bedNumber: string;
  reason: string;
}) {
  return apiPost<{ admission: unknown }>('/api/doctor/care-center/opd/admit', body);
}

export async function saveCareCenterProgressNote(body: {
  admissionId: string;
  note: { s: string; o: string; a: string; p: string };
}) {
  return apiPost<{ success: boolean }>('/api/doctor/care-center/ipd/progress-note', body);
}

export async function submitCareCenterDischarge(body: {
  admissionId: string;
  patientId: string;
  summary: string;
  followUp?: string;
}) {
  return apiPost<{ document: unknown; synced: string[] }>('/api/doctor/care-center/ipd/discharge', body);
}
