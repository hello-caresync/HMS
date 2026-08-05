/** Reusable empty-state presets for enterprise modules */

export type EmptyStatePreset = {
  entity: string;
  title: string;
  description: string;
  actionLabel: string;
};

export const EMPTY_STATES = {
  patients: {
    entity: 'Patients',
    title: 'No Patients Found',
    description: 'Get started by registering your first patient record.',
    actionLabel: '+ Register Patient',
  },
  appointments: {
    entity: 'Appointments',
    title: 'No Appointments Found',
    description: 'Schedule the first appointment to begin OPD operations.',
    actionLabel: '+ Schedule Appointment',
  },
  opdQueue: {
    entity: 'OPD Queue',
    title: 'OPD Queue Empty',
    description: 'No patients in the queue. Check-ins will appear here in real time.',
    actionLabel: '+ Register Walk-in',
  },
  admissions: {
    entity: 'Admissions',
    title: 'No Admissions Found',
    description: 'Create an admission request when a patient requires inpatient care.',
    actionLabel: '+ Admit Patient',
  },
  beds: {
    entity: 'Beds',
    title: 'No Wards Configured',
    description: 'Complete hospital setup to define wards and bed capacity.',
    actionLabel: 'Open Setup Wizard',
  },
  invoices: {
    entity: 'Invoices',
    title: 'No Invoices Found',
    description: 'Generate your first invoice after a consultation or service.',
    actionLabel: '+ Generate Invoice',
  },
  inventory: {
    entity: 'Inventory Items',
    title: 'No Inventory Items Found',
    description: 'Add medicines and consumables to track stock levels.',
    actionLabel: '+ Add Inventory Item',
  },
  purchaseOrders: {
    entity: 'Purchase Orders',
    title: 'No Purchase Orders Found',
    description: 'Raise a purchase order when stock needs replenishment.',
    actionLabel: '+ Create Purchase Order',
  },
  labOrders: {
    entity: 'Lab Orders',
    title: 'No Lab Orders Found',
    description: 'Lab orders from consultations will appear here.',
    actionLabel: '+ Order Lab Test',
  },
  prescriptions: {
    entity: 'Prescriptions',
    title: 'No Prescriptions Found',
    description: 'Prescriptions issued during consultations will sync here.',
    actionLabel: 'View Appointments',
  },
  auditLogs: {
    entity: 'Audit Logs',
    title: 'No Audit Logs Yet',
    description: 'System actions will be recorded here for compliance.',
    actionLabel: 'Refresh',
  },
  notifications: {
    entity: 'Notifications',
    title: 'No Notifications',
    description: 'You are all caught up. Alerts from all apps appear here.',
    actionLabel: 'Refresh',
  },
  vendors: {
    entity: 'Vendors',
    title: 'No Vendors Found',
    description: 'Register suppliers to manage procurement and deliveries.',
    actionLabel: '+ Add Vendor',
  },
  doctors: {
    entity: 'Doctors',
    title: 'No Doctors Found',
    description: 'Onboard doctors during setup or from the staff module.',
    actionLabel: '+ Add Doctor',
  },
} as const satisfies Record<string, EmptyStatePreset>;
