/** Nexora Doctor App — domain types */

export type AppointmentStatus =
  | 'scheduled'
  | 'waiting'
  | 'in-progress'
  | 'completed'
  | 'cancelled';

export type OrderStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';
export type OrderType = 'lab' | 'radiology' | 'procedure' | 'admission' | 'surgery' | 'prescription';

export type Patient = {
  id: string;
  mrn: string;
  fullName: string;
  age: number;
  gender: string;
  bloodGroup: string;
  phone?: string;
  email?: string;
  allergies: string[];
  chronicConditions: string[];
  diagnosis?: string;
  vitals: Vitals;
  medications: Medication[];
  visits: VisitRecord[];
  labReports: LabReport[];
  radiologyReports: RadiologyReport[];
  documents: PatientDocument[];
};

export type Vitals = {
  bp: string;
  hr: string;
  temp: string;
  spo2: string;
  weight?: string;
  height?: string;
  recordedAt: string;
};

export type Medication = {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  since: string;
};

export type VisitRecord = {
  id: string;
  date: string;
  type: string;
  doctor: string;
  summary: string;
};

export type LabReport = {
  id: string;
  test: string;
  result: string;
  status: OrderStatus;
  orderedAt: string;
  completedAt?: string;
};

export type RadiologyReport = {
  id: string;
  study: string;
  findings: string;
  status: OrderStatus;
  orderedAt: string;
  completedAt?: string;
};

export type PatientDocument = {
  id: string;
  title: string;
  type: string;
  uploadedAt: string;
};

export type Appointment = {
  id: string;
  patientId: string;
  patientName: string;
  mrn: string;
  time: string;
  endTime: string;
  type: 'in-person' | 'teleconsult';
  status: AppointmentStatus;
  chiefComplaint: string;
  token: string;
  doctorId: string;
};

export type Consultation = {
  id: string;
  appointmentId: string;
  patientId: string;
  status: 'draft' | 'completed';
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  diagnosis: string;
  treatmentPlan: string;
  prescription: PrescriptionItem[];
  followUpDate?: string;
  updatedAt: string;
};

export type PrescriptionItem = {
  id: string;
  drug: string;
  dose: string;
  frequency: string;
  duration: string;
  instructions?: string;
};

export type ClinicalOrder = {
  id: string;
  type: OrderType;
  patientId: string;
  patientName: string;
  title: string;
  department: string;
  status: OrderStatus;
  orderedAt: string;
  completedAt?: string;
  progress: number;
  doctorId: string;
};

export type ChatChannel = {
  id: string;
  name: string;
  role: 'patient' | 'nurse' | 'reception' | 'lab' | 'radiology' | 'pharmacy';
  unread: number;
  lastMessage: string;
  lastAt: string;
};

export type ChatMessage = {
  id: string;
  channelId: string;
  sender: string;
  body: string;
  at: string;
  isDoctor?: boolean;
};

export type Notification = {
  id: string;
  title: string;
  body: string;
  category: 'emergency' | 'lab' | 'radiology' | 'patient' | 'system';
  at: string;
  read: boolean;
  patientId?: string;
};

export type ActivityItem = {
  id: string;
  action: string;
  detail: string;
  at: string;
};

export type DoctorProfile = {
  id: string;
  fullName: string;
  email: string;
  department: string;
  specialization: string;
  hospital: string;
  licenseNumber: string;
  phone: string;
  workingHours: { day: string; start: string; end: string }[];
  availability: 'available' | 'busy' | 'off-duty';
};

export type AnalyticsPeriod = 'weekly' | 'monthly' | 'yearly';

export type AnalyticsData = {
  patientsSeen: number;
  appointments: number;
  avgConsultMinutes: number;
  followUpRate: number;
  prescriptionCount: number;
  labOrders: number;
  radiologyOrders: number;
  satisfaction: number;
  trend: { label: string; consultations: number }[];
};

export type DrugCatalogEntry = {
  id: string;
  brand: string;
  generic: string;
  interactsWith?: string[];
  allergyConflict?: string[];
};

export type AiSuggestion = {
  diagnosis: string;
  confidence: number;
};
