export type HospitalPatient = {
  id: string;
  uhid: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  age: number;
  gender: string;
  bloodGroup: string;
  medicalHistory: string;
  department: string;
  status: string;
  emergencyContact?: string;
  insuranceProvider?: string;
  createdAt: string;
};

export type HospitalStaff = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  department: string;
  email: string;
  consultationFee?: number;
};

export type HospitalAppointment = {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  appointmentDate: string;
  timeSlot: string;
  department: string;
  status: string;
  token?: string;
  reason?: string;
};

export type OpdVisit = {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  queueNumber: string;
  department: string;
  status: 'Waiting' | 'Checked-In' | 'In Consultation' | 'Completed';
  appointmentId?: string;
  appointmentTime?: string;
  waitMinutes?: number;
  checkedInAt?: string;
};

export type HospitalAdmission = {
  id: string;
  patientId: string;
  patientName: string;
  attendingDoctorId: string;
  attendingDoctorName: string;
  wardNumber: string;
  bedNumber: string;
  status: 'Requested' | 'Admitted' | 'Discharged' | 'Transfer';
  diagnosis: string;
  uhid?: string;
};

export type BillingInvoice = {
  id: string;
  patientId: string;
  patientName: string;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: 'Unpaid' | 'Partial' | 'Paid';
  lineItems: BillingLineItem[];
  invoiceNumber: string;
  createdAt: string;
};

export type BillingLineItem = {
  description: string;
  category: string;
  amount: number;
};

export type InventoryItem = {
  id: string;
  itemName: string;
  category: string;
  quantityInStock: number;
  unitPrice: number;
  reorderLevel: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  sku?: string;
};

export type Vendor = {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  rating: number;
  phone?: string;
};

export type PurchaseOrder = {
  id: string;
  vendorId: string;
  vendorName: string;
  itemDetails: string;
  status: 'Draft' | 'Issued' | 'Accepted' | 'Delivered' | 'Cancelled';
  totalCost: number;
  createdAt: string;
};

export type HospitalNotification = {
  id: string;
  recipientRole: 'hospital' | 'doctor' | 'patient' | 'vendor';
  title: string;
  message: string;
  category: string;
  severity: 'info' | 'warning' | 'critical';
  readStatus: boolean;
  createdAt: string;
  relatedId?: string;
};

export type DashboardMetrics = {
  todayAppointments: number;
  todayOpd: number;
  waitingPatients: number;
  activeConsultations: number;
  todayAdmissions: number;
  todayRevenue: number;
  pendingBills: number;
  lowStockAlerts: number;
  vendorDeliveries: number;
  activeDoctors: number;
  /** @deprecated use waitingPatients */
  checkedInCount: number;
};

export type HospitalSettings = {
  hospitalName: string;
  address: string;
  phone: string;
  email: string;
  departments: string[];
  workingHoursStart: string;
  workingHoursEnd: string;
  rbacEnabled: boolean;
};
