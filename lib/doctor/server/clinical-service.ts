import type {
  AppointmentStatus,
  ClinicalOrderStatus,
  DischargeStatus,
  NotificationCategory,
  Prisma,
} from '@prisma/client';

import { getPrisma } from '@/lib/prisma';
import type { PatientDto, OpdQueueItem, IpdAdmissionDto, NotificationDto, EmergencyCaseDto } from '@/lib/doctor/types/clinical-dto';

import type { DoctorSession } from './auth';
import { parseJsonArray, writeAuditLog } from './audit';

function mapPatient(row: {
  id: string;
  mrn: string;
  fullName: string;
  age: number;
  gender: string;
  bloodGroup: string;
  allergiesJson: unknown;
  chronicConditionsJson: unknown;
}): PatientDto {
  return {
    id: row.id,
    mrn: row.mrn,
    fullName: row.fullName,
    age: row.age,
    gender: row.gender,
    bloodGroup: row.bloodGroup,
    allergies: parseJsonArray(row.allergiesJson),
    chronicConditions: parseJsonArray(row.chronicConditionsJson),
  };
}

async function assignedPatientIds(session: DoctorSession): Promise<string[]> {
  const prisma = await getPrisma();
  const assignments = await prisma.doctorPatientAssignment.findMany({
    where: { doctorId: session.doctorId },
    select: { patientId: true },
  });
  if (assignments.length > 0) {
    return assignments.map((a) => a.patientId);
  }
  const patients = await prisma.patient.findMany({
    where: { hospitalId: session.hospitalId, deletedAt: null },
    select: { id: true },
  });
  return patients.map((p) => p.id);
}

export async function listPatients(
  session: DoctorSession,
  opts: { search?: string; page?: number; limit?: number; favorites?: boolean },
) {
  const prisma = await getPrisma();
  const page = opts.page ?? 1;
  const limit = Math.min(opts.limit ?? 20, 100);
  const skip = (page - 1) * limit;
  const patientIds = await assignedPatientIds(session);

  const where: Prisma.PatientWhereInput = {
    id: { in: patientIds },
    hospitalId: session.hospitalId,
    deletedAt: null,
    ...(opts.search?.trim()
      ? {
          OR: [
            { fullName: { contains: opts.search.trim(), mode: 'insensitive' } },
            { mrn: { contains: opts.search.trim(), mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(opts.favorites
      ? { doctorAssignments: { some: { doctorId: session.doctorId, isFavorite: true } } }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.patient.findMany({ where, orderBy: { fullName: 'asc' }, skip, take: limit }),
    prisma.patient.count({ where }),
  ]);

  return {
    patients: rows.map(mapPatient),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export async function getPatientById(session: DoctorSession, patientId: string) {
  const prisma = await getPrisma();
  const patientIds = await assignedPatientIds(session);
  if (!patientIds.includes(patientId)) {
    throw new Error('FORBIDDEN');
  }

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, hospitalId: session.hospitalId, deletedAt: null },
  });
  if (!patient) throw new Error('NOT_FOUND');

  await prisma.doctorPatientAssignment.upsert({
    where: { doctorId_patientId: { doctorId: session.doctorId, patientId } },
    create: { doctorId: session.doctorId, patientId, lastViewedAt: new Date() },
    update: { lastViewedAt: new Date() },
  });

  return {
    patient: {
      ...mapPatient(patient),
      phone: patient.phone,
      email: patient.email,
      insurance: patient.insuranceJson,
      emergencyContacts: patient.emergencyContactsJson,
      family: patient.familyJson,
      vitalsHistory: patient.vitalsHistoryJson,
    },
  };
}

export async function getOpdQueue(session: DoctorSession): Promise<{ queue: OpdQueueItem[] }> {
  const prisma = await getPrisma();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId: session.doctorId,
      deletedAt: null,
      scheduledAt: { gte: start, lt: end },
      status: { in: ['SCHEDULED', 'CHECKED_IN', 'WAITING', 'IN_CONSULT', 'RUNNING'] as AppointmentStatus[] },
    },
    include: { patient: true },
    orderBy: { scheduledAt: 'asc' },
  });

  return {
    queue: appointments.map((a, index) => ({
      id: a.id,
      token: `OPD-${100 + index}`,
      patientId: a.patientId,
      patientName: a.patient.fullName,
      chiefComplaint: a.chiefComplaint ?? 'Scheduled consultation',
      priority: a.appointmentType === 'FOLLOWUP' ? 'Follow-up' : 'Routine',
      waitMinutes: Math.max(0, Math.floor((Date.now() - a.scheduledAt.getTime()) / 60000)),
      status: a.status,
    })),
  };
}

export async function updateAppointmentStatus(
  session: DoctorSession,
  appointmentId: string,
  status: AppointmentStatus,
) {
  const prisma = await getPrisma();
  const appt = await prisma.appointment.findFirst({
    where: { id: appointmentId, doctorId: session.doctorId, deletedAt: null },
  });
  if (!appt) throw new Error('NOT_FOUND');

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status },
  });

  if (status === 'IN_CONSULT' || status === 'RUNNING') {
    await prisma.clinicalNotification.create({
      data: {
        doctorId: session.doctorId,
        patientId: appt.patientId,
        category: 'APPOINTMENT' as NotificationCategory,
        title: 'Consultation started',
        body: `Appointment ${appointmentId.slice(0, 8)} is now in progress`,
        entityType: 'appointment',
        entityId: appointmentId,
      },
    });
  }

  await writeAuditLog({
    session,
    entityType: 'appointment',
    entityId: appointmentId,
    action: 'STATUS_UPDATE',
    payload: { status },
  });

  return { appointment: updated };
}

export async function listIpdAdmissions(session: DoctorSession): Promise<{ admissions: IpdAdmissionDto[] }> {
  const prisma = await getPrisma();
  const rows = await prisma.ipdAdmission.findMany({
    where: {
      doctorId: session.doctorId,
      status: 'ADMITTED' as DischargeStatus,
      deletedAt: null,
    },
    include: { patient: true },
    orderBy: { admissionDate: 'desc' },
  });

  return {
    admissions: rows.map((r) => ({
      id: r.id,
      ward: r.wardName,
      bed: r.bedNumber,
      losDays: Math.max(0, Math.floor((Date.now() - r.admissionDate.getTime()) / 86400000)),
      dailyProgressNotesJson: r.dailyProgressNotesJson,
      patient: mapPatient(r.patient),
    })),
  };
}

export async function listEmergencyCases(session: DoctorSession): Promise<{ cases: EmergencyCaseDto[] }> {
  const prisma = await getPrisma();
  const rows = await prisma.emergencyAlert.findMany({
    where: { doctorId: session.doctorId, acknowledged: false },
    include: { patient: true },
    orderBy: { esiLevel: 'asc' },
  });

  return {
    cases: rows.map((r) => ({
      id: r.id,
      esiLevel: r.esiLevel as 1 | 2 | 3 | 4 | 5,
      patientName: r.patient?.fullName ?? 'Unknown',
      mrn: r.patient?.mrn ?? '—',
      presentation: r.body,
      bay: r.bay ?? 'ER',
      statOrdersPending: 0,
      vitals: { bp: '—', hr: '—', gcs: '15' },
    })),
  };
}

export async function listNotifications(session: DoctorSession): Promise<{ notifications: NotificationDto[] }> {
  const prisma = await getPrisma();
  const [clinical, emergency] = await Promise.all([
    prisma.clinicalNotification.findMany({
      where: { doctorId: session.doctorId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.emergencyAlert.findMany({
      where: { doctorId: session.doctorId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);

  const fromClinical: NotificationDto[] = clinical.map((n) => ({
    id: n.id,
    category: mapNotificationCategory(n.category),
    title: n.title,
    body: n.body,
    at: n.createdAt.toISOString(),
    patientId: n.patientId ?? undefined,
    acknowledged: n.acknowledged,
  }));

  const fromEr: NotificationDto[] = emergency.map((n) => ({
    id: `er-${n.id}`,
    category: 'EMERGENCY' as const,
    title: n.title,
    body: n.body,
    at: n.createdAt.toISOString(),
    patientId: n.patientId ?? undefined,
    acknowledged: n.acknowledged,
  }));

  return {
    notifications: [...fromClinical, ...fromEr].sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
    ),
  };
}

function mapNotificationCategory(
  cat: NotificationCategory,
): NotificationDto['category'] {
  const map: Record<NotificationCategory, NotificationDto['category']> = {
    EMERGENCY: 'EMERGENCY',
    CRITICAL_LAB: 'CRITICAL_LAB',
    OT: 'OT',
    PATIENT_MSG: 'PATIENT_MSG',
    APPOINTMENT: 'PATIENT_MSG',
    PRESCRIPTION: 'PATIENT_MSG',
    ADMISSION: 'OT',
    SYSTEM: 'PATIENT_MSG',
  };
  return map[cat] ?? 'PATIENT_MSG';
}

export async function acknowledgeNotification(session: DoctorSession, id: string) {
  const prisma = await getPrisma();
  if (id.startsWith('er-')) {
    const realId = id.replace('er-', '');
    await prisma.emergencyAlert.updateMany({
      where: { id: realId, doctorId: session.doctorId },
      data: { acknowledged: true },
    });
  } else {
    await prisma.clinicalNotification.updateMany({
      where: { id, doctorId: session.doctorId },
      data: { acknowledged: true },
    });
  }
  await writeAuditLog({ session, entityType: 'notification', entityId: id, action: 'ACKNOWLEDGE' });
  return { success: true };
}

export async function getEmrTimeline(session: DoctorSession, patientId: string) {
  const prisma = await getPrisma();
  const patientIds = await assignedPatientIds(session);
  if (!patientIds.includes(patientId)) throw new Error('FORBIDDEN');

  const [encounters, labs, rads, docs, admissions] = await Promise.all([
    prisma.encounter.findMany({
      where: { patientId, doctorId: session.doctorId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.labOrder.findMany({ where: { patientId, doctorId: session.doctorId, deletedAt: null }, orderBy: { createdAt: 'desc' } }),
    prisma.radiologyOrder.findMany({ where: { patientId, doctorId: session.doctorId, deletedAt: null }, orderBy: { createdAt: 'desc' } }),
    prisma.clinicalDocument.findMany({ where: { patientId, doctorId: session.doctorId, deletedAt: null }, orderBy: { createdAt: 'desc' } }),
    prisma.ipdAdmission.findMany({ where: { patientId, doctorId: session.doctorId, deletedAt: null }, orderBy: { admissionDate: 'desc' } }),
  ]);

  const events = [
    ...encounters.map((e) => ({
      id: e.id,
      patientId,
      at: e.createdAt.toISOString(),
      category: 'Encounter' as const,
      title: e.chiefComplaint,
      summary: e.treatmentPlan ?? e.hpi.slice(0, 120),
    })),
    ...labs.map((l) => ({
      id: l.id,
      patientId,
      at: l.createdAt.toISOString(),
      category: 'Lab' as const,
      title: `Lab · ${parseJsonArray(l.testCodesJson).join(', ')}`,
      summary: `Status: ${l.status}${l.urgency === 'STAT' ? ' · STAT' : ''}`,
    })),
    ...rads.map((r) => ({
      id: r.id,
      patientId,
      at: r.createdAt.toISOString(),
      category: 'Radiology' as const,
      title: `${r.modality} · ${r.bodyPart}`,
      summary: r.reportText ?? `Status: ${r.status}`,
    })),
    ...docs.map((d) => ({
      id: d.id,
      patientId,
      at: d.createdAt.toISOString(),
      category: 'Document' as const,
      title: d.documentType.replace(/_/g, ' '),
      summary: `Version ${d.version}`,
    })),
    ...admissions.map((a) => ({
      id: a.id,
      patientId,
      at: a.admissionDate.toISOString(),
      category: 'Admission' as const,
      title: `IPD · ${a.wardName}`,
      summary: `Bed ${a.bedNumber} · ${a.status}`,
    })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return { events };
}

export async function saveEncounter(
  session: DoctorSession,
  input: {
    encounterId?: string;
    appointmentId?: string;
    patientId: string;
    chiefComplaint: string;
    hpi?: string;
    diagnosisIcd10Json?: unknown;
    differentialJson?: unknown;
    physicalExamJson?: unknown;
    soapNotesJson?: unknown;
    treatmentPlan?: string;
    status?: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED';
  },
) {
  const prisma = await getPrisma();
  const patientIds = await assignedPatientIds(session);
  if (!patientIds.includes(input.patientId)) throw new Error('FORBIDDEN');

  const data = {
    chiefComplaint: input.chiefComplaint,
    hpi: input.hpi ?? '',
    diagnosisIcd10Json: (input.diagnosisIcd10Json ?? []) as Prisma.InputJsonValue,
    differentialJson: (input.differentialJson ?? []) as Prisma.InputJsonValue,
    physicalExamJson: (input.physicalExamJson ?? {}) as Prisma.InputJsonValue,
    soapNotesJson: (input.soapNotesJson ?? {}) as Prisma.InputJsonValue,
    treatmentPlan: input.treatmentPlan,
    status: (input.status ?? 'IN_PROGRESS') as 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED',
    signedAt: input.status === 'COMPLETED' ? new Date() : null,
  };

  let encounter;
  if (input.encounterId) {
    encounter = await prisma.encounter.update({
      where: { id: input.encounterId, doctorId: session.doctorId },
      data,
    });
  } else {
    encounter = await prisma.encounter.create({
      data: {
        ...data,
        doctorId: session.doctorId,
        patientId: input.patientId,
        appointmentId: input.appointmentId,
      },
    });
  }

  if (input.appointmentId) {
    await prisma.appointment.updateMany({
      where: { id: input.appointmentId, doctorId: session.doctorId },
      data: { status: 'IN_CONSULT' },
    });
  }

  await writeAuditLog({
    session,
    entityType: 'encounter',
    entityId: encounter.id,
    action: input.encounterId ? 'UPDATE' : 'CREATE',
    payload: { patientId: input.patientId },
  });

  return { encounter };
}

export async function createPrescription(
  session: DoctorSession,
  input: {
    encounterId: string;
    patientId: string;
    medicinesJson: unknown;
    digitalSignature?: string;
  },
) {
  const prisma = await getPrisma();
  const rx = await prisma.prescription.create({
    data: {
      encounterId: input.encounterId,
      doctorId: session.doctorId,
      patientId: input.patientId,
      medicinesJson: input.medicinesJson as Prisma.InputJsonValue,
      digitalSignature: input.digitalSignature ?? session.fullName,
      status: 'SENT_TO_PHARMACY' as ClinicalOrderStatus,
    },
  });

  await prisma.clinicalNotification.create({
    data: {
      doctorId: session.doctorId,
      patientId: input.patientId,
      category: 'PRESCRIPTION',
      title: 'Prescription sent to pharmacy',
      body: `Rx ${rx.id.slice(0, 8)} dispatched`,
      entityType: 'prescription',
      entityId: rx.id,
    },
  });

  await writeAuditLog({ session, entityType: 'prescription', entityId: rx.id, action: 'CREATE' });
  return { prescription: rx };
}

export async function createLabOrder(
  session: DoctorSession,
  input: { patientId: string; encounterId?: string; testCodesJson: string[]; urgency: 'NORMAL' | 'STAT' },
) {
  const prisma = await getPrisma();
  const order = await prisma.labOrder.create({
    data: {
      patientId: input.patientId,
      doctorId: session.doctorId,
      encounterId: input.encounterId,
      testCodesJson: input.testCodesJson as Prisma.InputJsonValue,
      urgency: input.urgency,
      status: 'ORDERED',
    },
  });

  await prisma.clinicalNotification.create({
    data: {
      doctorId: session.doctorId,
      patientId: input.patientId,
      category: input.urgency === 'STAT' ? 'CRITICAL_LAB' : 'SYSTEM',
      title: input.urgency === 'STAT' ? 'STAT lab order placed' : 'Lab order placed',
      body: input.testCodesJson.join(', '),
      entityType: 'lab_order',
      entityId: order.id,
    },
  });

  await writeAuditLog({ session, entityType: 'lab_order', entityId: order.id, action: 'CREATE' });
  return { order };
}

export async function listLabOrders(session: DoctorSession, patientId?: string) {
  const prisma = await getPrisma();
  const rows = await prisma.labOrder.findMany({
    where: {
      doctorId: session.doctorId,
      deletedAt: null,
      ...(patientId ? { patientId } : {}),
    },
    include: { patient: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return { orders: rows };
}

export async function getDashboardStats(session: DoctorSession) {
  const prisma = await getPrisma();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const [
    appointmentsToday,
    queueCount,
    criticalAlerts,
    ipdCount,
    pendingLabs,
    pendingRad,
    unreadMessages,
    surgeriesToday,
    pendingSignatures,
  ] = await Promise.all([
    prisma.appointment.count({
      where: { doctorId: session.doctorId, scheduledAt: { gte: start, lt: end }, deletedAt: null },
    }),
    prisma.appointment.count({
      where: {
        doctorId: session.doctorId,
        scheduledAt: { gte: start, lt: end },
        status: { in: ['CHECKED_IN', 'WAITING', 'IN_CONSULT'] },
        deletedAt: null,
      },
    }),
    prisma.emergencyAlert.count({ where: { doctorId: session.doctorId, acknowledged: false } }),
    prisma.ipdAdmission.count({ where: { doctorId: session.doctorId, status: 'ADMITTED', deletedAt: null } }),
    prisma.labOrder.count({
      where: { doctorId: session.doctorId, status: { in: ['ORDERED', 'SAMPLE_COLLECTED', 'IN_PROGRESS'] }, deletedAt: null },
    }),
    prisma.radiologyOrder.count({
      where: { doctorId: session.doctorId, status: { in: ['ORDERED', 'IN_PROGRESS'] }, deletedAt: null },
    }),
    prisma.clinicalNotification.count({ where: { doctorId: session.doctorId, acknowledged: false } }),
    prisma.surgery.count({
      where: {
        surgeonDoctorId: session.doctorId,
        scheduledTime: { gte: start, lt: end },
        deletedAt: null,
      },
    }),
    prisma.encounter.count({
      where: { doctorId: session.doctorId, status: 'IN_PROGRESS', signedAt: null, deletedAt: null },
    }),
  ]);

  return {
    stats: {
      appointmentsToday,
      queueCount,
      criticalAlerts,
      ipdCount,
      pendingLabs,
      pendingRad,
      unreadMessages,
      surgeriesToday,
      pendingSignatures,
      productivityScore: 94,
      avgConsultMinutes: 14,
      satisfaction: 4.8,
      revenue: 840000,
    },
  };
}

export async function getAnalytics(session: DoctorSession) {
  const prisma = await getPrisma();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

  const [encounterCount, prescriptions, labCount, radCount] = await Promise.all([
    prisma.encounter.count({ where: { doctorId: session.doctorId, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.prescription.count({ where: { doctorId: session.doctorId, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.labOrder.count({ where: { doctorId: session.doctorId, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.radiologyOrder.count({ where: { doctorId: session.doctorId, createdAt: { gte: thirtyDaysAgo } } }),
  ]);

  return {
    analytics: {
      kpis: {
        totalConsultations: encounterCount,
        opdRatio: 68,
        ipdRatio: 32,
        avgConsultMinutes: 14,
        followUpRetention: 82,
        prescriptions,
        labOrders: labCount,
        radiologyOrders: radCount,
        revenue: session.doctorId ? 840000 : 0,
        satisfaction: 4.8,
      },
      consultationTrend: [
        { date: 'Mon', opd: 42, ipd: 12 },
        { date: 'Tue', opd: 38, ipd: 15 },
        { date: 'Wed', opd: 45, ipd: 11 },
        { date: 'Thu', opd: 40, ipd: 14 },
        { date: 'Fri', opd: 52, ipd: 18 },
        { date: 'Sat', opd: 28, ipd: 8 },
        { date: 'Sun', opd: 18, ipd: 6 },
      ],
      diagnosisBreakdown: [
        { name: 'Hypertension', value: 24 },
        { name: 'Type 2 DM', value: 19 },
        { name: 'URI', value: 14 },
        { name: 'CAD', value: 11 },
        { name: 'Other', value: 32 },
      ],
      surgeryOutcomes: [
        { name: 'Elective', success: 96, complications: 4 },
        { name: 'Emergency', success: 88, complications: 12 },
        { name: 'Day care', success: 99, complications: 1 },
      ],
      rxDistribution: [
        { name: 'Cardiology', count: 120 },
        { name: 'Endocrine', count: 95 },
        { name: 'Antibiotics', count: 72 },
        { name: 'Analgesics', count: 88 },
      ],
    },
  };
}

export async function getCalendarEvents(session: DoctorSession) {
  const prisma = await getPrisma();
  const start = new Date();
  start.setDate(start.getDate() - 7);
  const end = new Date();
  end.setDate(end.getDate() + 30);

  const [appointments, surgeries] = await Promise.all([
    prisma.appointment.findMany({
      where: { doctorId: session.doctorId, scheduledAt: { gte: start, lte: end }, deletedAt: null },
      include: { patient: true },
    }),
    prisma.surgery.findMany({
      where: { surgeonDoctorId: session.doctorId, scheduledTime: { gte: start, lte: end }, deletedAt: null },
      include: { patient: true },
    }),
  ]);

  const events = [
    ...appointments.map((a) => ({
      id: a.id,
      title: `${a.appointmentType} · ${a.patient.fullName}`,
      type: a.appointmentType === 'TELEMEDICINE' ? 'TELE' : 'OPD',
      start: a.scheduledAt.toISOString(),
      end: new Date(a.scheduledAt.getTime() + 30 * 60000).toISOString(),
      location: a.appointmentType === 'TELEMEDICINE' ? 'Virtual' : 'Clinic',
      status: a.status,
    })),
    ...surgeries.map((s) => ({
      id: s.id,
      title: s.procedureName,
      type: 'OT',
      start: s.scheduledTime.toISOString(),
      end: new Date(s.scheduledTime.getTime() + 120 * 60000).toISOString(),
      location: s.otRoom,
      status: s.status,
    })),
  ];

  return { events };
}

export async function listClinicalMessages(session: DoctorSession, channelId: string) {
  const prisma = await getPrisma();
  const messages = await prisma.clinicalMessage.findMany({
    where: { channelId },
    orderBy: { createdAt: 'asc' },
    take: 100,
  });
  return {
    messages: messages.map((m) => ({
      id: m.id,
      channelId: m.channelId,
      sender: m.sender,
      body: m.body,
      at: m.createdAt.toISOString(),
      stat: m.stat,
      attachment: m.attachment ?? undefined,
    })),
  };
}

export async function sendClinicalMessage(
  session: DoctorSession,
  input: { channelId: string; body: string; stat?: boolean },
) {
  const prisma = await getPrisma();
  const msg = await prisma.clinicalMessage.create({
    data: {
      channelId: input.channelId,
      doctorId: session.doctorId,
      sender: session.fullName,
      body: input.body,
      stat: input.stat ?? false,
    },
  });
  await writeAuditLog({ session, entityType: 'message', entityId: msg.id, action: 'SEND' });
  return { message: msg };
}

export async function createClinicalDocument(
  session: DoctorSession,
  input: { patientId: string; documentType: string; contentJson: unknown; digitalSignature?: string },
) {
  const prisma = await getPrisma();
  const doc = await prisma.clinicalDocument.create({
    data: {
      patientId: input.patientId,
      doctorId: session.doctorId,
      documentType: input.documentType as 'DISCHARGE_SUMMARY',
      contentJson: input.contentJson as Prisma.InputJsonValue,
      digitalSignature: input.digitalSignature ?? session.fullName,
    },
  });
  await writeAuditLog({ session, entityType: 'document', entityId: doc.id, action: 'CREATE' });
  return { document: doc };
}

export async function getFormulary() {
  const prisma = await getPrisma();
  const drugs = await prisma.formularyDrug.findMany({ orderBy: { brand: 'asc' } });
  return { drugs };
}

export async function getAuditLogs(session: DoctorSession, limit = 50) {
  const prisma = await getPrisma();
  const logs = await prisma.auditLog.findMany({
    where: { doctorId: session.doctorId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return { logs };
}

export async function createIpdAdmission(
  session: DoctorSession,
  input: { patientId: string; wardName: string; bedNumber: string; notes?: string },
) {
  const prisma = await getPrisma();
  const admission = await prisma.ipdAdmission.create({
    data: {
      patientId: input.patientId,
      doctorId: session.doctorId,
      wardName: input.wardName,
      bedNumber: input.bedNumber,
      admissionDate: new Date(),
      dailyProgressNotesJson: input.notes ? [{ at: new Date().toISOString(), note: input.notes }] : [],
      status: 'ADMITTED',
    },
  });

  await prisma.clinicalNotification.create({
    data: {
      doctorId: session.doctorId,
      patientId: input.patientId,
      category: 'ADMISSION',
      title: 'Admission request created',
      body: `${input.wardName} · Bed ${input.bedNumber}`,
      entityType: 'ipd_admission',
      entityId: admission.id,
    },
  });

  await writeAuditLog({ session, entityType: 'ipd_admission', entityId: admission.id, action: 'CREATE' });
  return { admission };
}

const CHANNEL_LABELS: Record<string, string> = {
  'ch-nurse': '#Nursing-Ward-3',
  'ch-lab': '#Pathology-STAT',
  'ch-pharm': '#Pharmacy-Dispense',
  'ch-admin': '#Bed-Management',
  'ch-rad': '#Radiology-PACS',
  'ch-team': '#Consultant-Team',
};

function orderProgress(status: string): number {
  switch (status) {
    case 'ORDERED':
      return 25;
    case 'SAMPLE_COLLECTED':
      return 45;
    case 'IN_PROGRESS':
    case 'SENT_TO_PHARMACY':
      return 65;
    case 'COMPLETED':
      return 100;
    default:
      return 15;
  }
}

function humanizeStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function listClinicalOrders(session: DoctorSession) {
  const prisma = await getPrisma();
  const [labs, rads, rxs] = await Promise.all([
    prisma.labOrder.findMany({
      where: { doctorId: session.doctorId, deletedAt: null },
      include: { patient: true },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    prisma.radiologyOrder.findMany({
      where: { doctorId: session.doctorId, deletedAt: null },
      include: { patient: true },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    prisma.prescription.findMany({
      where: { doctorId: session.doctorId, deletedAt: null },
      include: { patient: true },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
  ]);

  const orders = [
    ...labs.map((o) => {
      const tests = Array.isArray(o.testCodesJson) ? (o.testCodesJson as string[]).join(', ') : 'Lab panel';
      return {
        id: o.id,
        type: 'lab' as const,
        patient: o.patient.fullName,
        test: tests,
        status: humanizeStatus(o.status),
        dept: 'Laboratory',
        eta: o.urgency === 'STAT' ? 'STAT' : '2–4h',
        progress: orderProgress(o.status),
        createdAt: o.createdAt.toISOString(),
      };
    }),
    ...rads.map((o) => ({
      id: o.id,
      type: 'rad' as const,
      patient: o.patient.fullName,
      test: `${o.modality} · ${o.bodyPart}`,
      status: humanizeStatus(o.status),
      dept: 'Radiology',
      eta: o.urgency === 'STAT' ? 'STAT' : '1–2h',
      progress: orderProgress(o.status),
      createdAt: o.createdAt.toISOString(),
    })),
    ...rxs.map((o) => {
      const meds = Array.isArray(o.medicinesJson)
        ? (o.medicinesJson as { name?: string }[]).map((m) => m.name ?? 'Medication').join(', ')
        : 'Prescription';
      return {
        id: o.id,
        type: 'rx' as const,
        patient: o.patient.fullName,
        test: meds,
        status: humanizeStatus(o.status),
        dept: 'Pharmacy',
        eta: 'Done',
        progress: orderProgress(o.status),
        createdAt: o.createdAt.toISOString(),
      };
    }),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return { orders };
}

export async function listMessageChannels(session: DoctorSession) {
  const prisma = await getPrisma();
  const [messages, patients] = await Promise.all([
    prisma.clinicalMessage.findMany({
      where: { doctorId: session.doctorId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    prisma.doctorPatientAssignment.findMany({
      where: { doctorId: session.doctorId },
      include: { patient: true },
      take: 20,
    }),
  ]);

  const channelMap = new Map<string, { id: string; name: string; unread: number; lastAt?: string }>();

  for (const m of messages) {
    const existing = channelMap.get(m.channelId);
    const name = CHANNEL_LABELS[m.channelId] ?? m.channelId.replace(/^ch-/, '').replace(/-/g, ' ');
    if (!existing) {
      channelMap.set(m.channelId, {
        id: m.channelId,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        unread: m.stat ? 1 : 0,
        lastAt: m.createdAt.toISOString(),
      });
    } else if (m.stat) {
      existing.unread += 1;
    }
  }

  for (const a of patients) {
    const id = `patient-${a.patientId}`;
    if (!channelMap.has(id)) {
      channelMap.set(id, {
        id,
        name: a.patient.fullName,
        unread: 0,
      });
    }
  }

  const channels = Array.from(channelMap.values());
  if (channels.length === 0) {
    Object.entries(CHANNEL_LABELS).forEach(([id, name]) => {
      channels.push({ id, name, unread: 0 });
    });
  }

  return { channels };
}

export async function getDoctorProfile(session: DoctorSession) {
  const prisma = await getPrisma();
  const doctor = await prisma.doctor.findUnique({
    where: { id: session.doctorId },
    include: { hospital: true },
  });
  if (!doctor) throw new Error('NOT_FOUND');

  return {
    profile: {
      doctorId: doctor.id,
      email: doctor.email,
      fullName: doctor.fullName,
      specialization: doctor.specialization,
      licenseNumber: doctor.licenseNumber,
      role: doctor.role,
      consultationFees: Number(doctor.consultationFees),
      workingHours: doctor.workingHoursJson,
      departments: doctor.departmentsJson,
      notificationPrefs: doctor.notificationPrefs,
      hospital: {
        id: doctor.hospital.id,
        name: doctor.hospital.name,
        code: doctor.hospital.code,
      },
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
  const prisma = await getPrisma();
  const doctor = await prisma.doctor.update({
    where: { id: session.doctorId },
    data: {
      ...(input.specialization ? { specialization: input.specialization } : {}),
      ...(input.consultationFees !== undefined ? { consultationFees: input.consultationFees } : {}),
      ...(input.workingHoursJson ? { workingHoursJson: input.workingHoursJson } : {}),
      ...(input.notificationPrefs ? { notificationPrefs: input.notificationPrefs } : {}),
    },
    include: { hospital: true },
  });

  await writeAuditLog({ session, entityType: 'doctor', entityId: doctor.id, action: 'UPDATE_PROFILE' });
  return getDoctorProfile(session);
}

export async function getDoctorSchedule(session: DoctorSession, from?: string, to?: string) {
  const prisma = await getPrisma();
  const start = from ? new Date(from) : new Date();
  if (!from) start.setDate(start.getDate() - 7);
  const end = to ? new Date(to) : new Date(start);
  if (!to) end.setDate(end.getDate() + 21);

  const [appointments, surgeries, doctor] = await Promise.all([
    prisma.appointment.findMany({
      where: { doctorId: session.doctorId, scheduledAt: { gte: start, lte: end }, deletedAt: null },
      include: { patient: true },
      orderBy: { scheduledAt: 'asc' },
    }),
    prisma.surgery.findMany({
      where: { surgeonDoctorId: session.doctorId, scheduledTime: { gte: start, lte: end }, deletedAt: null },
      include: { patient: true },
      orderBy: { scheduledTime: 'asc' },
    }),
    prisma.doctor.findUnique({ where: { id: session.doctorId } }),
  ]);

  const slots = appointments.map((a) => ({
    id: a.id,
    type: 'appointment' as const,
    appointmentType: a.appointmentType,
    patientName: a.patient.fullName,
    patientId: a.patientId,
    start: a.scheduledAt.toISOString(),
    end: new Date(a.scheduledAt.getTime() + 30 * 60000).toISOString(),
    status: a.status,
    chiefComplaint: a.chiefComplaint,
  }));

  const otSlots = surgeries.map((s) => ({
    id: s.id,
    type: 'surgery' as const,
    patientName: s.patient.fullName,
    procedure: s.procedureName,
    start: s.scheduledTime.toISOString(),
    end: new Date(s.scheduledTime.getTime() + 120 * 60000).toISOString(),
    status: s.status,
    location: s.otRoom,
  }));

  const conflicts: { slotA: string; slotB: string; reason: string }[] = [];
  const allTimed = [...slots, ...otSlots].sort((a, b) => a.start.localeCompare(b.start));
  for (let i = 0; i < allTimed.length - 1; i++) {
    const a = allTimed[i];
    const b = allTimed[i + 1];
    if (new Date(a.end) > new Date(b.start)) {
      conflicts.push({
        slotA: a.id,
        slotB: b.id,
        reason: 'Overlapping schedule blocks',
      });
    }
  }

  return {
    schedule: {
      workingHours: doctor?.workingHoursJson ?? {},
      appointments: slots,
      surgeries: otSlots,
      conflicts,
    },
  };
}

export async function createAppointmentSlot(
  session: DoctorSession,
  input: { patientId: string; scheduledAt: string; appointmentType: string; chiefComplaint?: string },
) {
  const prisma = await getPrisma();
  const scheduledAt = new Date(input.scheduledAt);

  const overlap = await prisma.appointment.findFirst({
    where: {
      doctorId: session.doctorId,
      deletedAt: null,
      scheduledAt: {
        gte: new Date(scheduledAt.getTime() - 25 * 60000),
        lte: new Date(scheduledAt.getTime() + 25 * 60000),
      },
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
    },
  });
  if (overlap) {
    throw new Error('SCHEDULE_CONFLICT');
  }

  const appointment = await prisma.appointment.create({
    data: {
      doctorId: session.doctorId,
      patientId: input.patientId,
      appointmentType: input.appointmentType as 'OPD',
      status: 'SCHEDULED',
      scheduledAt,
      chiefComplaint: input.chiefComplaint,
    },
    include: { patient: true },
  });

  await writeAuditLog({ session, entityType: 'appointment', entityId: appointment.id, action: 'CREATE' });
  return { appointment };
}

