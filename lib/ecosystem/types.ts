/** Nexora Healthcare Ecosystem V0 — shared cross-app types */

export type AppointmentStatus =
  | 'Requested'
  | 'Confirmed'
  | 'Checked-In'
  | 'In Consultation'
  | 'Completed'
  | 'Cancelled'
  | 'No-Show';

export type QueuePriority = 'standard' | 'senior' | 'vip' | 'emergency';

export type HospitalBranch = {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
};

export type FamilyMember = {
  id: string;
  primaryPatientId: string;
  fullName: string;
  relation: 'child' | 'parent' | 'spouse' | 'other';
  dateOfBirth: string;
  mrn: string;
};

export type NotificationCategory =
  | 'appointment'
  | 'prescription'
  | 'lab'
  | 'radiology'
  | 'follow-up'
  | 'system';

export type EcosystemPatient = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  mrn: string;
  dateOfBirth: string;
  bloodGroup: string;
  gender: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  insuranceProvider: string;
  insurancePolicyId: string;
};

export type EcosystemDoctor = {
  id: string;
  name: string;
  email: string;
  department: string;
  specialization: string;
  experience: string;
  languages: string[];
  rating: number;
  reviewCount: number;
  availableToday: boolean;
  photoInitials: string;
  bio: string;
  consultationFee: number;
  slots: string[];
  roomNumber: string;
  tokenPrefix: string;
  avgConsultMinutes: number;
  branchId: string;
  historicalDelayMinutes?: number;
};

export type DoctorDelayStatus = 'on-time' | 'slight-delay' | 'urgent';
export type VoiceLanguage = 'en' | 'hi' | 'ml';

export type EcosystemAppointment = {
  id: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  doctorId: string;
  doctorName: string;
  department: string;
  date: string;
  time: string;
  endTime: string;
  reason: string;
  status: AppointmentStatus;
  type: 'OPD' | 'Teleconsult';
  token: string;
  location: string;
  createdAt: string;
  updatedAt: string;
  roomNumber?: string;
  sequentialToken?: string;
  queuePosition?: number;
  estimatedWaitMinutes?: number;
  delayStatus?: DoctorDelayStatus;
  qrPayload?: string;
  checkedInAt?: string;
  calledAt?: string;
  isEmergency?: boolean;
  skipped?: boolean;
  aiRecommended?: boolean;
  followUpDays?: number;
  branchId?: string;
  branchName?: string;
  priorityTier?: QueuePriority;
  estimatedCost?: number;
  bookedByPatientId?: string;
  satisfactionRating?: number;
  noShowMarkedAt?: string;
};

export type PrescriptionMedicine = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
};

export type EcosystemPrescription = {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  appointmentId: string;
  medicines: PrescriptionMedicine[];
  issuedAt: string;
  status: 'active' | 'completed';
  notes?: string;
};

export type EcosystemLabOrder = {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  appointmentId?: string;
  testName: string;
  status: 'ordered' | 'sample-collected' | 'processing' | 'ready';
  orderedAt: string;
  completedAt?: string;
  resultSummary?: string;
  reportUrl?: string;
};

export type EcosystemRadiologyOrder = {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  appointmentId?: string;
  studyName: string;
  status: 'ordered' | 'scheduled' | 'completed';
  orderedAt: string;
  completedAt?: string;
  findings?: string;
  reportUrl?: string;
};

export type VisitRecord = {
  id: string;
  patientId: string;
  date: string;
  doctorName: string;
  department: string;
  diagnosis: string;
  summary: string;
  appointmentId: string;
};

export type VitalRecord = {
  id: string;
  patientId: string;
  recordedAt: string;
  bp: string;
  pulse: string;
  temperature: string;
  spo2: string;
  weight?: string;
};

export type EcosystemNotification = {
  id: string;
  patientId: string;
  title: string;
  body: string;
  category: NotificationCategory;
  read: boolean;
  createdAt: string;
  relatedId?: string;
};

export type HospitalQueueEntry = {
  id: string;
  appointmentId: string;
  token: string;
  sequentialToken?: string;
  patientName: string;
  department: string;
  doctorName: string;
  scheduledTime: string;
  status: AppointmentStatus;
  roomNumber?: string;
  priorityTier?: QueuePriority;
  createdAt: string;
};

export type OpdDisplayState = {
  calledPatientName: string | null;
  calledToken: string | null;
  sequentialToken: string | null;
  roomNumber: string | null;
  doctorName: string | null;
  department: string | null;
  lastCalledAt: string | null;
  voiceLanguage: VoiceLanguage;
  queuePaused: boolean;
  waitingHallCapacity: number;
  waitingHallOccupancy: number;
};

export type OpdAnalyticsSnapshot = {
  totalPatientsToday: number;
  avgWaitMinutes: number;
  avgConsultMinutes: number;
  doctorUtilizationPct: number;
  peakHour: string;
  noShowRatePct: number;
  avgSatisfactionRating: number;
  waitingHallOccupancyPct: number;
  updatedAt: string;
};

export type EcosystemState = {
  version: number;
  branches: HospitalBranch[];
  familyMembers: FamilyMember[];
  patients: EcosystemPatient[];
  doctors: EcosystemDoctor[];
  appointments: EcosystemAppointment[];
  prescriptions: EcosystemPrescription[];
  labOrders: EcosystemLabOrder[];
  radiologyOrders: EcosystemRadiologyOrder[];
  visits: VisitRecord[];
  vitals: VitalRecord[];
  notifications: EcosystemNotification[];
  hospitalQueue: HospitalQueueEntry[];
  billingInvoices: { id: string; appointmentId: string; patientName: string; amount: number; status: string; createdAt: string }[];
  opdDisplay: OpdDisplayState;
  opdAnalytics: OpdAnalyticsSnapshot;
};
