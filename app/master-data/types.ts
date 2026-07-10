/** Day-of-week key for structured OPD scheduling */
export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

/** Single OPD slot for one day */
export interface OpdSlot {
  day: DayOfWeek;
  enabled: boolean;
  startTime: string; // HH:mm (24h)
  endTime: string;
}

export type OpdTimings = OpdSlot[];

// ─── Department ─────────────────────────────────────────────────────────────

export interface Department {
  id: string;
  name: string;
}

export type DepartmentName =
  | 'Cardiology'
  | 'Orthopedics'
  | 'Pediatrics'
  | 'General Medicine';

// ─── Doctor ─────────────────────────────────────────────────────────────────

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  departmentId: string;
  opdTimings: OpdTimings;
}

// ─── Service Master ─────────────────────────────────────────────────────────

export type ServiceCategory =
  | 'Consultation'
  | 'Lab'
  | 'Radiology'
  | 'Procedure'
  | 'Admission'
  | 'OT'
  | 'Ambulance';

export interface ServiceMaster {
  id: string;
  name: ServiceCategory;
  basePrice: number;
}

// ─── Medicine Master ────────────────────────────────────────────────────────

export type MedicineUnit = 'Strip' | 'Vial' | 'Bottle' | 'Tube' | 'Box' | 'Ampoule';

export type GstPercentage = 0 | 5 | 12 | 18 | 28;

export interface MedicineMaster {
  id: string;
  genericName: string;
  brandName: string;
  hsnCode: string;
  gstPercentage: GstPercentage;
  unit: MedicineUnit;
  mrp: number;
  vendorId: string;
}

// ─── Vendor Master ──────────────────────────────────────────────────────────

export type SupplyCategory =
  | 'Pharmaceuticals'
  | 'Surgical Supplies'
  | 'Consumables'
  | 'Medical Equipment'
  | 'General';

export interface VendorMaster {
  id: string;
  vendorName: string;
  contactPerson: string;
  taxId: string; // GSTIN
  supplyCategory: SupplyCategory;
  active: boolean;
}

// ─── Room / Bed Master ──────────────────────────────────────────────────────

export type RoomType = 'General' | 'Private' | 'ICU';

export type BedAvailability = 'Vacant' | 'Occupied' | 'Maintenance' | 'Reserved';

export interface RoomBedMaster {
  id: string;
  roomType: RoomType;
  bedNumber: string;
  availabilityStatus: BedAvailability;
}

// ─── Master Data aggregate (for store / API payloads) ───────────────────────

export interface MasterDataRegistry {
  departments: Department[];
  doctors: Doctor[];
  services: ServiceMaster[];
  medicines: MedicineMaster[];
  vendors: VendorMaster[];
  roomBeds: RoomBedMaster[];
}

export type MasterDataTab =
  | 'departments'
  | 'doctors'
  | 'medicines'
  | 'services'
  | 'vendors'
  | 'roomBeds';

export const MASTER_DATA_TABS: { id: MasterDataTab; label: string; description: string }[] = [
  { id: 'departments', label: 'Departments', description: 'Clinical department registry' },
  { id: 'doctors', label: 'Doctor Registry', description: 'Physician roster & OPD schedules' },
  { id: 'medicines', label: 'Medicine Master', description: 'Pharmacy SKU catalog with HSN/GST' },
  { id: 'services', label: 'Service Catalog', description: 'Billable service tariff master' },
  { id: 'vendors', label: 'Vendor Directory', description: 'Procurement partner registry' },
  { id: 'roomBeds', label: 'Room & Bed Master', description: 'Bed inventory & availability' },
];

/** Default empty OPD template — one row per day */
export function createDefaultOpdTimings(): OpdTimings {
  const days: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  return days.map((day) => ({
    day,
    enabled: day !== 'sun',
    startTime: '09:00',
    endTime: day === 'sat' ? '13:00' : '17:00',
  }));
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}
