import type { MasterDataRegistry } from '../types';
import { createDefaultOpdTimings } from '../types';

export const SEED_MASTER_DATA: MasterDataRegistry = {
  departments: [
    { id: 'dept-cardio', name: 'Cardiology' },
    { id: 'dept-ortho', name: 'Orthopedics' },
    { id: 'dept-pedia', name: 'Pediatrics' },
    { id: 'dept-genmed', name: 'General Medicine' },
  ],
  vendors: [
    {
      id: 'vnd-001',
      vendorName: 'MedSupply India Pvt. Ltd.',
      contactPerson: 'Ravi Shankar',
      taxId: '29AABCM1234F1Z5',
      supplyCategory: 'Pharmaceuticals',
      active: true,
    },
    {
      id: 'vnd-002',
      vendorName: 'PharmaLink Distributors',
      contactPerson: 'Anita Desai',
      taxId: '27AAACF5678G1Z2',
      supplyCategory: 'Pharmaceuticals',
      active: true,
    },
    {
      id: 'vnd-003',
      vendorName: 'Surgical Hub Enterprises',
      contactPerson: 'Karan Mehta',
      taxId: '24AABCS9012H1Z8',
      supplyCategory: 'Surgical Supplies',
      active: false,
    },
  ],
  doctors: [
    {
      id: 'doc-001',
      name: 'Dr. Priya Menon',
      specialization: 'Interventional Cardiology',
      departmentId: 'dept-cardio',
      opdTimings: createDefaultOpdTimings(),
    },
    {
      id: 'doc-002',
      name: 'Dr. Arjun Das',
      specialization: 'Joint Replacement Surgery',
      departmentId: 'dept-ortho',
      opdTimings: createDefaultOpdTimings(),
    },
    {
      id: 'doc-003',
      name: 'Dr. Lakshmi Nair',
      specialization: 'Neonatal & Pediatric Care',
      departmentId: 'dept-pedia',
      opdTimings: createDefaultOpdTimings(),
    },
  ],
  services: [
    { id: 'svc-001', name: 'Consultation', basePrice: 800 },
    { id: 'svc-002', name: 'Lab', basePrice: 450 },
    { id: 'svc-003', name: 'Radiology', basePrice: 1200 },
    { id: 'svc-004', name: 'Procedure', basePrice: 3500 },
    { id: 'svc-005', name: 'Admission', basePrice: 2500 },
    { id: 'svc-006', name: 'OT', basePrice: 18000 },
    { id: 'svc-007', name: 'Ambulance', basePrice: 1500 },
  ],
  medicines: [
    {
      id: 'med-001',
      genericName: 'Paracetamol',
      brandName: 'Dolo 650',
      hsnCode: '30049061',
      gstPercentage: 12,
      unit: 'Strip',
      mrp: 32,
      vendorId: 'vnd-002',
    },
    {
      id: 'med-002',
      genericName: 'Omeprazole',
      brandName: 'Omez 20',
      hsnCode: '30049034',
      gstPercentage: 12,
      unit: 'Strip',
      mrp: 98,
      vendorId: 'vnd-002',
    },
    {
      id: 'med-003',
      genericName: 'Amoxicillin',
      brandName: 'Mox 500',
      hsnCode: '30041010',
      gstPercentage: 12,
      unit: 'Strip',
      mrp: 145,
      vendorId: 'vnd-001',
    },
    {
      id: 'med-004',
      genericName: 'Insulin Glargine',
      brandName: 'Lantus Solostar',
      hsnCode: '30043100',
      gstPercentage: 5,
      unit: 'Vial',
      mrp: 2840,
      vendorId: 'vnd-001',
    },
  ],
  roomBeds: [
    { id: 'bed-001', roomType: 'General', bedNumber: 'G-101-A', availabilityStatus: 'Vacant' },
    { id: 'bed-002', roomType: 'General', bedNumber: 'G-101-B', availabilityStatus: 'Occupied' },
    { id: 'bed-003', roomType: 'Private', bedNumber: 'P-204', availabilityStatus: 'Vacant' },
    { id: 'bed-004', roomType: 'ICU', bedNumber: 'ICU-04', availabilityStatus: 'Occupied' },
    { id: 'bed-005', roomType: 'ICU', bedNumber: 'ICU-05', availabilityStatus: 'Maintenance' },
  ],
};

export const SUPPLY_CATEGORIES = [
  'Pharmaceuticals',
  'Surgical Supplies',
  'Consumables',
  'Medical Equipment',
  'General',
] as const;

export const GST_OPTIONS = [0, 5, 12, 18, 28] as const;

export const MEDICINE_UNITS = ['Strip', 'Vial', 'Bottle', 'Tube', 'Box', 'Ampoule'] as const;

export const SERVICE_NAMES = [
  'Consultation',
  'Lab',
  'Radiology',
  'Procedure',
  'Admission',
  'OT',
  'Ambulance',
] as const;

export const ROOM_TYPES = ['General', 'Private', 'ICU'] as const;

export const BED_STATUSES = ['Vacant', 'Occupied', 'Maintenance', 'Reserved'] as const;

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calculatePriceWithGst(basePrice: number, gstPercentage: number): number {
  if (Number.isNaN(basePrice) || basePrice < 0) return 0;
  return Math.round(basePrice * (1 + gstPercentage / 100) * 100) / 100;
}

export function formatOpdSummary(timings: { day: string; enabled: boolean; startTime: string; endTime: string }[]): string {
  const active = timings.filter((t) => t.enabled);
  if (active.length === 0) return 'No OPD';
  if (active.length === 7 && active.every((t) => t.startTime === active[0].startTime)) {
    return `Daily ${active[0].startTime}–${active[0].endTime}`;
  }
  return `${active.length} days/week`;
}
