import type { ConfigurableWidget } from '../types';

export const DEFAULT_WIDGET_CONFIG: ConfigurableWidget[] = [
  {
    id: 'appointments',
    label: 'Appointments',
    description: 'Daily scheduling volume vs prior day',
    visible: true,
    order: 0,
  },
  {
    id: 'critical-patients',
    label: 'Critical Patients',
    description: 'Active high-acuity census',
    visible: true,
    order: 1,
  },
  {
    id: 'admissions',
    label: 'Admissions',
    description: 'Inpatient intake today',
    visible: true,
    order: 2,
  },
  {
    id: 'discharges',
    label: 'Discharges',
    description: 'Completed discharges today',
    visible: true,
    order: 3,
  },
  {
    id: 'low-stock',
    label: 'Low Stock',
    description: 'Pharmacy inventory below threshold',
    visible: true,
    order: 4,
  },
  {
    id: 'pending-payments',
    label: 'Pending Payments',
    description: 'Vendor invoice clearance queue',
    visible: false,
    order: 5,
  },
  {
    id: 'emergency-detail',
    label: 'Emergency Detail',
    description: 'Live ER triage board',
    visible: true,
    order: 6,
  },
];
