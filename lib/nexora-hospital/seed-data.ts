import type {
  BillingInvoice,
  DashboardMetrics,
  HospitalAdmission,
  HospitalAppointment,
  HospitalNotification,
  HospitalPatient,
  HospitalSettings,
  HospitalStaff,
  InventoryItem,
  OpdVisit,
  PurchaseOrder,
  Vendor,
} from './types';

export const SEED_PATIENTS: HospitalPatient[] = [
  {
    id: 'pat-001',
    uhid: 'NX-2026-000101',
    firstName: 'Rahul',
    lastName: 'Sharma',
    fullName: 'Rahul Sharma',
    phone: '+91 98765 43210',
    age: 34,
    gender: 'Male',
    bloodGroup: 'B+',
    medicalHistory: 'Hypertension · Seasonal allergies',
    department: 'General Medicine',
    status: 'Active',
    emergencyContact: 'Priya Sharma · +91 98765 43211',
    insuranceProvider: 'Star Health',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pat-002',
    uhid: 'NX-2026-000102',
    firstName: 'Anita',
    lastName: 'Desai',
    fullName: 'Anita Desai',
    phone: '+91 91234 56789',
    age: 42,
    gender: 'Female',
    bloodGroup: 'O+',
    medicalHistory: 'Type 2 Diabetes',
    department: 'Endocrinology',
    status: 'Active',
    emergencyContact: 'Raj Desai · +91 91234 56780',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pat-003',
    uhid: 'NX-2026-000103',
    firstName: 'Vikram',
    lastName: 'Patel',
    fullName: 'Vikram Patel',
    phone: '+91 99887 76655',
    age: 28,
    gender: 'Male',
    bloodGroup: 'A+',
    medicalHistory: 'None significant',
    department: 'Orthopedics',
    status: 'Active',
    createdAt: new Date().toISOString(),
  },
];

export const SEED_STAFF: HospitalStaff[] = [
  {
    id: 'doc-001',
    firstName: 'Priya',
    lastName: 'Mehta',
    fullName: 'Dr. Priya Mehta',
    role: 'Consultant',
    department: 'General Medicine',
    email: 'priya.mehta@nexora.com',
    consultationFee: 800,
  },
  {
    id: 'doc-002',
    firstName: 'Arjun',
    lastName: 'Rao',
    fullName: 'Dr. Arjun Rao',
    role: 'Specialist',
    department: 'Cardiology',
    email: 'arjun.rao@nexora.com',
    consultationFee: 1200,
  },
];

export const SEED_APPOINTMENTS: HospitalAppointment[] = [
  {
    id: 'apt-001',
    patientId: 'pat-001',
    patientName: 'Rahul Sharma',
    doctorId: 'doc-001',
    doctorName: 'Dr. Priya Mehta',
    appointmentDate: new Date().toISOString().slice(0, 10),
    timeSlot: '10:00',
    department: 'General Medicine',
    status: 'Confirmed',
    token: 'C-042',
    reason: 'Follow-up hypertension',
  },
  {
    id: 'apt-002',
    patientId: 'pat-002',
    patientName: 'Anita Desai',
    doctorId: 'doc-002',
    doctorName: 'Dr. Arjun Rao',
    appointmentDate: new Date().toISOString().slice(0, 10),
    timeSlot: '11:30',
    department: 'Cardiology',
    status: 'Pending',
    token: 'C-043',
    reason: 'Chest discomfort evaluation',
  },
];

export const SEED_OPD: OpdVisit[] = [
  {
    id: 'opd-001',
    patientId: 'pat-001',
    patientName: 'Rahul Sharma',
    doctorId: 'doc-001',
    doctorName: 'Dr. Priya',
    queueNumber: 'C-042',
    department: 'Cardiology',
    status: 'Waiting',
    appointmentId: 'apt-001',
    appointmentTime: '10:00 AM',
    waitMinutes: 12,
  },
  {
    id: 'opd-002',
    patientId: 'pat-003',
    patientName: 'Vikram Patel',
    doctorId: 'doc-001',
    doctorName: 'Dr. Priya Mehta',
    queueNumber: 'C-044',
    department: 'Orthopedics',
    status: 'Checked-In',
  },
];

export const SEED_ADMISSIONS: HospitalAdmission[] = [
  {
    id: 'adm-001',
    patientId: 'pat-002',
    patientName: 'Anita Desai',
    attendingDoctorId: 'doc-002',
    attendingDoctorName: 'Dr. Arjun Rao',
    wardNumber: 'Ward 3A',
    bedNumber: 'B-12',
    status: 'Admitted',
    diagnosis: 'Unstable angina — observation',
    uhid: 'NX-2026-000102',
  },
];

export const SEED_INVOICES: BillingInvoice[] = [
  {
    id: 'inv-001',
    patientId: 'pat-001',
    patientName: 'Rahul Sharma',
    totalAmount: 2400,
    paidAmount: 0,
    paymentStatus: 'Unpaid',
    invoiceNumber: 'INV-2026-0041',
    lineItems: [
      { description: 'OPD Consultation', category: 'Consultation', amount: 800 },
      { description: 'Lab Panel — CBC', category: 'Lab', amount: 600 },
      { description: 'Pharmacy — Amlodipine', category: 'Pharmacy', amount: 1000 },
    ],
    createdAt: new Date().toISOString(),
  },
];

export const SEED_INVENTORY: InventoryItem[] = [
  {
    id: 'inv-ph-001',
    itemName: 'Paracetamol 500mg',
    category: 'Medicine',
    quantityInStock: 420,
    unitPrice: 2.5,
    reorderLevel: 100,
    status: 'In Stock',
    sku: 'MED-PAR-500',
  },
  {
    id: 'inv-ph-002',
    itemName: 'IV Cannula 22G',
    category: 'Consumable',
    quantityInStock: 18,
    unitPrice: 45,
    reorderLevel: 50,
    status: 'Low Stock',
    sku: 'CON-CAN-22',
  },
  {
    id: 'inv-ph-003',
    itemName: 'N95 Respirator Mask',
    category: 'Consumable',
    quantityInStock: 0,
    unitPrice: 85,
    reorderLevel: 200,
    status: 'Out of Stock',
    sku: 'CON-N95',
  },
];

export const SEED_VENDORS: Vendor[] = [
  {
    id: 'ven-001',
    companyName: 'MedSupply India Pvt Ltd',
    contactPerson: 'Sanjay Kulkarni',
    email: 'orders@medsupply.in',
    rating: 4.6,
    phone: '+91 80 2345 6789',
  },
  {
    id: 'ven-002',
    companyName: 'PharmaCore Logistics',
    contactPerson: 'Neha Gupta',
    email: 'procurement@pharmacore.in',
    rating: 4.2,
    phone: '+91 22 6789 0123',
  },
];

export const SEED_POS: PurchaseOrder[] = [
  {
    id: 'po-001',
    vendorId: 'ven-001',
    vendorName: 'MedSupply India Pvt Ltd',
    itemDetails: 'IV Cannula 22G × 500 units',
    status: 'Issued',
    totalCost: 22500,
    createdAt: new Date().toISOString(),
  },
];

export const SEED_NOTIFICATIONS: HospitalNotification[] = [
  {
    id: 'notif-001',
    recipientRole: 'hospital',
    title: 'New appointment booked',
    message: 'Rahul Sharma booked General Medicine · 10:00 today',
    category: 'appointments',
    severity: 'info',
    readStatus: false,
    createdAt: new Date().toISOString(),
    relatedId: 'apt-001',
  },
  {
    id: 'notif-002',
    recipientRole: 'hospital',
    title: 'Low stock alert',
    message: 'IV Cannula 22G below reorder level (18 units)',
    category: 'inventory',
    severity: 'warning',
    readStatus: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    relatedId: 'inv-ph-002',
  },
];

export const DEFAULT_SETTINGS: HospitalSettings = {
  hospitalName: 'Nexora Multispeciality Hospital',
  address: '42 Healthcare Avenue, Bengaluru 560001',
  phone: '+91 80 4000 0000',
  email: 'admin@nexora.com',
  departments: ['General Medicine', 'Cardiology', 'Orthopedics', 'Pediatrics', 'Emergency'],
  workingHoursStart: '08:00',
  workingHoursEnd: '20:00',
  rbacEnabled: true,
};

export function computeMetrics(
  appointments: HospitalAppointment[],
  opd: OpdVisit[],
  admissions: HospitalAdmission[],
  invoices: BillingInvoice[],
  inventory: InventoryItem[],
  pos: PurchaseOrder[],
  staff: HospitalStaff[] = [],
): DashboardMetrics {
  const today = new Date().toISOString().slice(0, 10);
  const todayAppts = appointments.filter((a) => a.appointmentDate === today);
  const waiting = opd.filter((v) => v.status === 'Waiting').length;
  const checkedIn = opd.filter((v) => v.status === 'Checked-In').length;
  return {
    todayAppointments: todayAppts.length,
    todayOpd: opd.length,
    waitingPatients: waiting,
    checkedInCount: checkedIn,
    activeConsultations: opd.filter((v) => v.status === 'In Consultation').length,
    todayAdmissions: admissions.filter((a) => a.status === 'Admitted' || a.status === 'Requested').length,
    pendingBills: invoices.filter((i) => i.paymentStatus !== 'Paid').length,
    lowStockAlerts: inventory.filter((i) => i.status !== 'In Stock').length,
    vendorDeliveries: pos.filter((p) => p.status === 'Accepted' || p.status === 'Delivered').length,
    todayRevenue: invoices
      .filter((i) => i.createdAt.startsWith(today))
      .reduce((sum, i) => sum + i.paidAmount, 0),
    activeDoctors: staff.filter((s) => s.role?.toLowerCase().includes('doctor')).length || staff.length,
  };
}
