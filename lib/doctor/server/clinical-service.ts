import type {
  EmergencyCaseDto,
  IpdAdmissionDto,
  NotificationDto,
  OpdQueueItem,
  PatientDto,
} from '@/lib/doctor/types/clinical-dto';

import type { DoctorSession } from './auth';
import { mockProfile, mockStore, nextMockId } from './mock-store';
import { parseJsonArray, writeAuditLog } from './audit';

const CHANNEL_LABELS: Record<string, string> = {
  'ch-nurse': '#Nursing-Ward-3',
  'ch-lab': '#Pathology-STAT',
  'ch-pharm': '#Pharmacy-Dispense',
  'ch-admin': '#Bed-Management',
  'ch-rad': '#Radiology-PACS',
  'ch-team': '#Consultant-Team',
};

function mapPatient(p: (typeof mockStore.patients)[0]): PatientDto {
  return {
    id: p.id,
    mrn: p.mrn,
    fullName: p.fullName,
    age: p.age,
    gender: p.gender,
    bloodGroup: p.bloodGroup,
    allergies: p.allergies,
    chronicConditions: p.chronicConditions,
  };
}

export async function listPatients(
  _session: DoctorSession,
  opts: { search?: string; page?: number; limit?: number; favorites?: boolean },
) {
  const page = opts.page ?? 1;
  const limit = Math.min(opts.limit ?? 20, 100);
  let rows = mockStore.patients.map(mapPatient);

  if (opts.search?.trim()) {
    const q = opts.search.trim().toLowerCase();
    rows = rows.filter((p) => p.fullName.toLowerCase().includes(q) || p.mrn.toLowerCase().includes(q));
  }

  const total = rows.length;
  const skip = (page - 1) * limit;
  return {
    patients: rows.slice(skip, skip + limit),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  };
}

export async function getPatientById(_session: DoctorSession, patientId: string) {
  const patient = mockStore.patients.find((p) => p.id === patientId);
  if (!patient) throw new Error('NOT_FOUND');

  return {
    patient: {
      ...mapPatient(patient),
      phone: '+91 98765 43210',
      email: `${patient.mrn.toLowerCase()}@patient.nexora.local`,
      insurance: { provider: 'Star Health', verified: true },
      emergencyContacts: [{ name: 'Emergency Contact', phone: '+91 90000 00000' }],
      family: [],
      vitalsHistory: [{ at: new Date().toISOString(), bp: '128/82', hr: 72 }],
    },
  };
}

export async function getOpdQueue(_session: DoctorSession): Promise<{ queue: OpdQueueItem[] }> {
  return {
    queue: mockStore.opdQueue.map((q, index) => ({
      id: q.id,
      token: q.token,
      patientId: q.patientId,
      patientName: q.patientName,
      chiefComplaint: q.chiefComplaint,
      priority: q.priority,
      waitMinutes: q.waitMinutes,
      status: q.status,
    })),
  };
}

export async function updateAppointmentStatus(
  session: DoctorSession,
  appointmentId: string,
  status: string,
) {
  const appt = mockStore.opdQueue.find((q) => q.id === appointmentId);
  if (appt) appt.status = status;

  await writeAuditLog({
    session,
    entityType: 'appointment',
    entityId: appointmentId,
    action: 'STATUS_UPDATE',
    payload: { status },
  });

  return { appointment: { id: appointmentId, status } };
}

export async function listIpdAdmissions(_session: DoctorSession): Promise<{ admissions: IpdAdmissionDto[] }> {
  return {
    admissions: mockStore.ipdCensus.map((r) => ({
      id: r.id,
      ward: r.ward,
      bed: r.bed,
      losDays: r.losDays,
      dailyProgressNotesJson: r.soapHistory,
      patient: mapPatient(mockStore.patients.find((p) => p.id === r.patientId) ?? mockStore.patients[0]),
    })),
  };
}

export async function listEmergencyCases(_session: DoctorSession): Promise<{ cases: EmergencyCaseDto[] }> {
  return {
    cases: mockStore.emergencyCases.map((c) => ({
      id: c.id,
      esiLevel: c.esiLevel,
      patientName: c.patientName,
      mrn: c.mrn,
      presentation: c.presentation,
      bay: c.bay,
      statOrdersPending: c.statOrdersPending,
      vitals: c.vitals,
      acknowledged: false,
    })),
  };
}

export async function listNotifications(_session: DoctorSession): Promise<{ notifications: NotificationDto[] }> {
  return {
    notifications: mockStore.notifications.map((n) => ({
      id: n.id,
      category: n.category === 'ALL' ? 'PATIENT_MSG' : n.category,
      title: n.title,
      body: n.body,
      at: n.at,
      patientId: n.patientId,
      acknowledged: n.acknowledged,
    })),
  };
}

export async function acknowledgeNotification(_session: DoctorSession, id: string) {
  const n = mockStore.notifications.find((x) => x.id === id);
  if (n) n.acknowledged = true;
  return { success: true };
}

export async function getEmrTimeline(_session: DoctorSession, patientId?: string) {
  const events = patientId
    ? mockStore.emrTimeline.filter((e) => e.patientId === patientId)
    : mockStore.emrTimeline;
  return {
    events: events.map((e) => ({
      id: e.id,
      at: e.at,
      title: e.title,
      summary: e.summary,
      category: e.category,
    })),
  };
}

export async function saveEncounter(
  session: DoctorSession,
  input: {
    patientId: string;
    chiefComplaint?: string;
    soapNotes?: Record<string, unknown>;
    diagnosisIcd10?: unknown[];
    status?: string;
  },
) {
  const id = nextMockId('enc');
  await writeAuditLog({ session, entityType: 'encounter', entityId: id, action: 'SAVE', payload: input });
  return { encounter: { id, ...input, status: input.status ?? 'IN_PROGRESS' } };
}

export async function createPrescription(
  session: DoctorSession,
  input: { patientId: string; items: unknown[] },
) {
  const id = nextMockId('rx');
  await writeAuditLog({ session, entityType: 'prescription', entityId: id, action: 'CREATE' });
  return { prescription: { id, ...input, status: 'SENT_TO_PHARMACY' } };
}

export async function createLabOrder(
  session: DoctorSession,
  input: { patientId: string; testCodes: string[]; urgency?: string },
) {
  const id = nextMockId('lab');
  mockStore.labOrders.unshift({
    id,
    patientId: input.patientId,
    testCodesJson: input.testCodes,
    status: 'ORDERED',
    urgency: input.urgency ?? 'NORMAL',
    createdAt: new Date().toISOString(),
  });
  await writeAuditLog({ session, entityType: 'lab_order', entityId: id, action: 'CREATE' });
  return { order: { id, ...input, status: 'ORDERED' } };
}

export async function listLabOrders(_session: DoctorSession, patientId?: string) {
  const orders = patientId
    ? mockStore.labOrders.filter((o) => o.patientId === patientId)
    : mockStore.labOrders;
  return { orders };
}

export async function getDashboardStats(_session: DoctorSession) {
  return {
    stats: {
      appointmentsToday: mockStore.opdQueue.length,
      queueCount: mockStore.opdQueue.filter((q) => ['WAITING', 'CHECKED_IN', 'IN_CONSULT'].includes(q.status)).length,
      criticalAlerts: mockStore.emergencyCases.filter((c) => c.esiLevel <= 2).length,
      ipdCount: mockStore.ipdCensus.length,
      pendingLabs: mockStore.labOrders.filter((o) => o.status !== 'COMPLETED').length,
      pendingRad: 1,
      unreadMessages: mockStore.messages.filter((m) => m.stat).length,
      surgeriesToday: 1,
      pendingSignatures: 0,
      productivityScore: 94,
      avgConsultMinutes: 14,
      satisfaction: 4.8,
      revenue: 840000,
    },
  };
}

export async function getAnalytics(_session: DoctorSession) {
  return { analytics: mockStore.analytics };
}

export async function getCalendarEvents(_session: DoctorSession) {
  return {
    events: mockStore.calendarEvents.map((e) => ({
      id: e.id,
      title: e.title,
      start: e.start,
      end: e.end,
      location: e.location,
      type: e.type,
    })),
  };
}

export async function listClinicalMessages(_session: DoctorSession, channelId: string) {
  return {
    messages: mockStore.messages
      .filter((m) => m.channelId === channelId)
      .map((m) => ({
        id: m.id,
        channelId: m.channelId,
        sender: m.sender,
        body: m.body,
        at: m.at,
        stat: m.stat,
        attachment: m.attachment,
      })),
  };
}

export async function sendClinicalMessage(
  session: DoctorSession,
  input: { channelId: string; body: string; stat?: boolean },
) {
  const msg = {
    id: nextMockId('msg'),
    channelId: input.channelId,
    sender: session.fullName,
    body: input.body,
    at: new Date().toISOString(),
    stat: input.stat,
  };
  mockStore.messages.push(msg);
  return { message: msg };
}

export async function createClinicalDocument(
  session: DoctorSession,
  input: { patientId: string; documentType: string; content: Record<string, unknown> },
) {
  const id = nextMockId('doc');
  await writeAuditLog({ session, entityType: 'document', entityId: id, action: 'CREATE' });
  return { document: { id, ...input, signedAt: new Date().toISOString() } };
}

export async function getFormulary() {
  return { drugs: mockStore.drugs };
}

export async function getAuditLogs(session: DoctorSession, limit = 50) {
  const logs = mockStore.auditLogs
    .filter((l) => true)
    .slice(0, limit);
  return { logs };
}

export async function createIpdAdmission(
  session: DoctorSession,
  input: { patientId: string; wardName: string; bedNumber: string; notes?: string },
) {
  const id = nextMockId('ipd');
  await writeAuditLog({ session, entityType: 'ipd_admission', entityId: id, action: 'CREATE' });
  return { admission: { id, ...input, status: 'ADMITTED' } };
}

export async function listClinicalOrders(_session: DoctorSession) {
  return { orders: [...mockStore.clinicalOrders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) };
}

export async function listMessageChannels(_session: DoctorSession) {
  const channels = mockStore.channels.map((ch) => ({
    id: ch.id,
    name: CHANNEL_LABELS[ch.id] ?? ch.name,
    unread: ch.unread,
  }));
  return { channels };
}

export async function getDoctorProfile(session: DoctorSession) {
  return {
    profile: {
      doctorId: session.doctorId,
      email: session.email,
      fullName: session.fullName,
      specialization: mockProfile.specialization,
      licenseNumber: mockProfile.licenseNumber,
      role: session.role,
      consultationFees: mockProfile.consultationFees,
      workingHours: mockProfile.workingHours,
      departments: ['Internal Medicine', 'Cardiology'],
      notificationPrefs: { criticalLabs: true, er: true },
      hospital: mockProfile.hospital,
    },
  };
}

export async function updateDoctorProfile(
  session: DoctorSession,
  input: {
    specialization?: string;
    consultationFees?: number;
    workingHoursJson?: Record<string, string>;
    notificationPrefs?: Record<string, boolean>;
  },
) {
  if (input.specialization) mockProfile.specialization = input.specialization;
  if (input.consultationFees !== undefined) mockProfile.consultationFees = input.consultationFees;
  if (input.workingHoursJson) mockProfile.workingHours = input.workingHoursJson;
  await writeAuditLog({ session, entityType: 'doctor', entityId: session.doctorId, action: 'UPDATE_PROFILE' });
  return getDoctorProfile(session);
}

export async function getDoctorSchedule(_session: DoctorSession, _from?: string, _to?: string) {
  const appointments = mockStore.calendarEvents
    .filter((e) => e.type === 'OPD' || e.type === 'TELE')
    .map((e) => ({
      id: e.id,
      type: 'appointment' as const,
      appointmentType: e.type,
      patientName: 'Scheduled patient',
      patientId: mockStore.patients[0]?.id ?? 'pat-1',
      start: e.start,
      end: e.end,
      status: 'SCHEDULED',
      chiefComplaint: e.title,
    }));

  const surgeries = mockStore.calendarEvents
    .filter((e) => e.type === 'OT')
    .map((e) => ({
      id: e.id,
      type: 'surgery' as const,
      patientName: mockStore.patients[1]?.fullName ?? 'Patient',
      procedure: e.title,
      start: e.start,
      end: e.end,
      status: 'SCHEDULED',
      location: e.location,
    }));

  return {
    schedule: {
      workingHours: mockProfile.workingHours,
      appointments,
      surgeries,
      conflicts: [],
    },
  };
}

export async function createAppointmentSlot(
  session: DoctorSession,
  input: { patientId: string; scheduledAt: string; appointmentType: string; chiefComplaint?: string },
) {
  const id = nextMockId('appt');
  mockStore.opdQueue.push({
    id,
    token: `OPD-${mockStore.opdQueue.length + 100}`,
    patientId: input.patientId,
    patientName: mockStore.patients.find((p) => p.id === input.patientId)?.fullName ?? 'Patient',
    chiefComplaint: input.chiefComplaint ?? 'Scheduled',
    priority: 'Routine',
    waitMinutes: 0,
    status: 'SCHEDULED',
  });
  await writeAuditLog({ session, entityType: 'appointment', entityId: id, action: 'CREATE' });
  return { appointment: { id, ...input, status: 'SCHEDULED' } };
}

export function getTelemedicineSession() {
  const p = mockStore.patients[0];
  return {
    session: {
      appointmentId: mockStore.telemedicine.appointmentId,
      roomId: mockStore.telemedicine.roomId,
      patient: {
        id: p.id,
        mrn: p.mrn,
        fullName: p.fullName,
        age: p.age,
        gender: p.gender,
        bloodGroup: p.bloodGroup,
        allergies: p.allergies,
        chronicConditions: p.chronicConditions,
      },
      transcript: mockStore.telemedicine.transcript,
      status: 'ACTIVE',
    },
  };
}
