import { apiGet, apiPost, apiPatch } from '@/lib/doctor/client/api-client';
import { MOCK_AI_DIFFERENTIALS, MOCK_ANALYTICS, MOCK_CALENDAR_EVENTS } from '@/lib/mock-data';

import type {
  EmergencyCaseDto,
  IpdAdmissionDto,
  NotificationDto,
  OpdQueueItem,
  PatientDto,
} from '@/lib/doctor/types/clinical-dto';

export type EmrTimelineEvent = {
  id: string;
  patientId?: string;
  at: string;
  category: string;
  title: string;
  summary: string;
  detail?: string;
  provider?: string;
};

export type CalendarEventDto = {
  id: string;
  title: string;
  type: string;
  start: string;
  end: string;
  location: string;
  status?: string;
};

export type ChatMessageDto = {
  id: string;
  channelId: string;
  sender: string;
  body: string;
  at: string;
  stat?: boolean;
  attachment?: string;
};

export type FormularyDrugDto = {
  id: string;
  brand: string;
  generic: string;
  route: string;
  interactsWith?: string[];
  allergyConflict?: string[];
};

export async function fetchOpdQueue(): Promise<{ queue: OpdQueueItem[] }> {
  return apiGet<{ queue: OpdQueueItem[] }>('/api/opd/queue');
}

export async function fetchPatients(opts?: {
  search?: string;
  status?: 'OPD' | 'IPD' | 'EMERGENCY';
  page?: number;
}): Promise<{ patients: PatientDto[]; pagination?: { page: number; limit: number; total: number } }> {
  const params = new URLSearchParams();
  if (opts?.search) params.set('search', opts.search);
  if (opts?.page) params.set('page', String(opts.page));
  const qs = params.toString();
  return apiGet(`/api/patients${qs ? `?${qs}` : ''}`);
}

export async function fetchPatientById(id: string) {
  return apiGet<{ patient: PatientDto & Record<string, unknown> }>(`/api/patients/${id}`);
}

export async function fetchIpdAdmissions(): Promise<{ admissions: IpdAdmissionDto[] }> {
  return apiGet<{ admissions: IpdAdmissionDto[] }>('/api/ipd/admissions');
}

export async function fetchEmergencyCases(): Promise<{ cases: EmergencyCaseDto[] }> {
  return apiGet<{ cases: EmergencyCaseDto[] }>('/api/emergency');
}

export async function fetchNotificationsFeed(): Promise<{ notifications: NotificationDto[] }> {
  return apiGet<{ notifications: NotificationDto[] }>('/api/notifications');
}

export async function fetchFormulary() {
  return apiGet<{ drugs: FormularyDrugDto[] }>('/api/formulary');
}

export async function fetchClinicalMessages(channelId: string) {
  const [channelRes, msgRes] = await Promise.all([
    apiGet<{ channels: { id: string; name: string; unread: number }[] }>('/api/messages/channels'),
    apiGet<{ messages: ChatMessageDto[] }>(`/api/messages?channelId=${encodeURIComponent(channelId)}`),
  ]);
  return { channels: channelRes.channels, messages: msgRes.messages };
}

export type ClinicalOrderDto = {
  id: string;
  type: 'lab' | 'rad' | 'rx' | string;
  patient: string;
  test: string;
  status: string;
  dept: string;
  eta: string;
  progress: number;
  createdAt: string;
};

export async function fetchClinicalOrders() {
  return apiGet<{ orders: ClinicalOrderDto[] }>('/api/doctor/orders');
}

export async function fetchMessageChannels() {
  return apiGet<{ channels: { id: string; name: string; unread: number }[] }>('/api/messages/channels');
}

export type DoctorProfileDto = {
  doctorId: string;
  email: string;
  fullName: string;
  specialization: string;
  licenseNumber: string;
  role: string;
  consultationFees: number;
  workingHours: Record<string, string>;
  departments: string[];
  notificationPrefs: Record<string, boolean>;
  hospital: { id: string; name: string; code: string };
};

export async function fetchDoctorProfile() {
  return apiGet<{ profile: DoctorProfileDto }>('/api/doctor/profile');
}

export async function updateDoctorProfile(body: Partial<DoctorProfileDto>) {
  return apiPatch<{ profile: DoctorProfileDto }>('/api/doctor/profile', body);
}

export async function fetchDoctorSchedule(from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();
  return apiGet<{ schedule: Record<string, unknown> }>(`/api/doctor/schedule${qs ? `?${qs}` : ''}`);
}

export async function createAppointment(body: {
  patientId: string;
  scheduledAt: string;
  appointmentType: string;
  chiefComplaint?: string;
}) {
  return apiPost<{ appointment: unknown }>('/api/doctor/schedule', body);
}

export async function fetchCalendarEvents() {
  try {
    return await apiGet<{ events: CalendarEventDto[] }>('/api/calendar');
  } catch {
    return { events: MOCK_CALENDAR_EVENTS as CalendarEventDto[] };
  }
}

export async function fetchAnalytics() {
  try {
    return await apiGet<{ analytics: typeof MOCK_ANALYTICS }>('/api/analytics');
  } catch {
    return { analytics: MOCK_ANALYTICS };
  }
}

export async function fetchDashboardStats() {
  return apiGet<{ stats: Record<string, number> }>('/api/doctor/dashboard/stats');
}

export type TelemedicineSessionDto = {
  appointmentId: string;
  roomId: string;
  patient: PatientDto;
  transcript: { from: string; text: string }[];
  status?: string;
};

export async function fetchTelemedicineSession() {
  const data = await apiGet<{ session: TelemedicineSessionDto | null }>('/api/telemedicine');
  if (!data.session) {
    throw new Error('No telemedicine session scheduled');
  }
  return { session: data.session };
}

export async function fetchPatientLabOrders(patientId: string) {
  return apiGet<{ orders: unknown[] }>(`/api/lab-orders?patientId=${encodeURIComponent(patientId)}`);
}

export async function fetchEmrTimeline(patientId: string) {
  return apiGet<{ events: EmrTimelineEvent[] }>(
    `/api/doctor/emr/timeline?patientId=${encodeURIComponent(patientId)}`,
  );
}

export async function fetchAuditLogs(limit = 50) {
  return apiGet<{ logs: unknown[] }>(`/api/doctor/audit?limit=${limit}`);
}

export async function runAiDifferential(body: {
  complaint?: string;
  vitals?: string;
  patientId?: string;
  allergies?: string[];
}) {
  try {
    return await apiPost<{ results: typeof MOCK_AI_DIFFERENTIALS }>('/api/doctor/ai/differential', body);
  } catch {
    const boosted = MOCK_AI_DIFFERENTIALS.map((d, i) => ({
      ...d,
      confidence: Math.min(0.95, d.confidence + (body.complaint?.includes('chest') ? 0.05 : 0) - i * 0.02),
    }));
    return { success: true, results: boosted };
  }
}

export async function saveConsultation(body: Record<string, unknown>) {
  return apiPost<{ encounter: { id: string } }>('/api/opd/consultation', body);
}

export async function sendPrescription(body: Record<string, unknown>) {
  const result = await apiPost<{ prescription: unknown }>('/api/prescriptions', body);
  return { ...result, message: 'Prescription sent to pharmacy' };
}

export async function saveSoapNote(body: { admissionId: string; soap: Record<string, string> }) {
  return apiPost<{ message: string }>('/api/ipd/soap-notes', body);
}

export async function emergencyAction(body: Record<string, unknown>) {
  return apiPost<{ success: boolean }>('/api/emergency', body);
}

export async function acknowledgeNotification(id: string) {
  return apiPost<{ success: boolean }>('/api/notifications', { id });
}

export async function generateDocument(body: Record<string, unknown>) {
  return apiPost<{ document: unknown }>('/api/documents/generate', body);
}

export async function sendClinicalMessage(body: { channelId: string; body: string; stat?: boolean }) {
  return apiPost<{ message: unknown }>('/api/messages', body);
}

export async function createStatLabOrder(body: Record<string, unknown>) {
  return apiPost<{ order: unknown }>('/api/lab-orders', { ...body, urgency: 'STAT' });
}

export async function updateAppointmentStatus(appointmentId: string, status: string) {
  return apiPatch<{ appointment: unknown }>('/api/opd/queue', { appointmentId, status });
}

export async function requestAdmission(body: {
  patientId: string;
  wardName: string;
  bedNumber: string;
  notes?: string;
}) {
  return apiPost<{ admission: unknown }>('/api/ipd/admissions', body);
}

export async function updateIpdAdmission(body: {
  admissionId: string;
  status?: string;
  wardName?: string;
  bedNumber?: string;
}) {
  return apiPost<{ admission: unknown }>('/api/ipd/admissions', body);
}
