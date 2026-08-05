/** Standardized ecosystem event types for cross-app synchronization */

export const ECOSYSTEM_EVENTS = {
  AppointmentCreated: 'AppointmentCreated',
  AppointmentCancelled: 'AppointmentCancelled',
  AppointmentRescheduled: 'AppointmentRescheduled',
  AppointmentConfirmed: 'AppointmentConfirmed',
  PatientCheckedIn: 'PatientCheckedIn',
  ConsultationStarted: 'ConsultationStarted',
  ConsultationCompleted: 'ConsultationCompleted',
  PrescriptionGenerated: 'PrescriptionGenerated',
  LabOrdered: 'LabOrdered',
  LabCompleted: 'LabCompleted',
  InvoiceGenerated: 'InvoiceGenerated',
  PaymentCompleted: 'PaymentCompleted',
  StockDepleted: 'StockDepleted',
  PurchaseOrderIssued: 'PurchaseOrderIssued',
  AdmissionCreated: 'AdmissionCreated',
  DischargeCompleted: 'DischargeCompleted',
} as const;

export type EcosystemEventType = (typeof ECOSYSTEM_EVENTS)[keyof typeof ECOSYSTEM_EVENTS];

export type EcosystemEventPayload = {
  type: EcosystemEventType;
  actorRole: 'patient' | 'doctor' | 'hospital' | 'vendor' | 'system';
  actorId?: string;
  entityType: string;
  entityId: string;
  patientId?: string;
  doctorId?: string;
  vendorId?: string;
  message: string;
  metadata?: Record<string, unknown>;
  timestamp?: string;
};

export type EventBusListener = (event: EcosystemEventPayload) => void;
