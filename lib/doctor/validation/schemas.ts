import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional().default(false),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sort: z.string().optional(),
  status: z.string().optional(),
});

export const saveEncounterSchema = z.object({
  appointmentId: z.string().uuid().optional(),
  patientId: z.string().uuid(),
  chiefComplaint: z.string().min(1),
  hpi: z.string().optional(),
  diagnosisIcd10Json: z.array(z.object({ code: z.string(), label: z.string() })).optional(),
  differentialJson: z.array(z.object({ diagnosis: z.string(), confidence: z.number() })).optional(),
  physicalExamJson: z.record(z.string(), z.unknown()).optional(),
  soapNotesJson: z.record(z.string(), z.unknown()).optional(),
  treatmentPlan: z.string().optional(),
  status: z.enum(['DRAFT', 'IN_PROGRESS', 'COMPLETED']).optional(),
  encounterId: z.string().uuid().optional(),
});

export const prescriptionSchema = z.object({
  encounterId: z.string().uuid(),
  patientId: z.string().uuid(),
  medicinesJson: z.array(
    z.object({
      drugName: z.string(),
      dosage: z.string(),
      frequency: z.string(),
      duration: z.string(),
      instructions: z.string().optional(),
    }),
  ),
  digitalSignature: z.string().optional(),
});

export const labOrderSchema = z.object({
  patientId: z.string().uuid(),
  encounterId: z.string().uuid().optional(),
  testCodesJson: z.array(z.string()).min(1),
  urgency: z.enum(['NORMAL', 'STAT']).default('NORMAL'),
});

export const radiologyOrderSchema = z.object({
  patientId: z.string().uuid(),
  encounterId: z.string().uuid().optional(),
  modality: z.string().min(1),
  bodyPart: z.string().min(1),
  urgency: z.enum(['NORMAL', 'STAT']).default('NORMAL'),
});

export const clinicalMessageSchema = z.object({
  channelId: z.string().min(1),
  body: z.string().min(1),
  stat: z.boolean().optional(),
});

export const documentSchema = z.object({
  patientId: z.string().uuid(),
  documentType: z.enum([
    'PROGRESS_NOTE',
    'DISCHARGE_SUMMARY',
    'REFERRAL_LETTER',
    'MEDICAL_CERTIFICATE',
    'FITNESS_CERTIFICATE',
    'SICK_LEAVE',
    'OPERATION_NOTE',
  ]),
  contentJson: z.record(z.string(), z.unknown()),
  digitalSignature: z.string().optional(),
});

export const appointmentUpdateSchema = z.object({
  status: z.enum([
    'SCHEDULED',
    'CHECKED_IN',
    'WAITING',
    'IN_CONSULT',
    'RUNNING',
    'COMPLETED',
    'FINISHED',
    'CANCELLED',
    'NO_SHOW',
  ]),
  scheduledAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const ipdAdmissionSchema = z.object({
  patientId: z.string().uuid(),
  wardName: z.string().min(1),
  bedNumber: z.string().min(1),
  notes: z.string().optional(),
});
