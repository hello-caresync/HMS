export type HrTab = 'directory' | 'rota' | 'payroll';

/** Nexora 11 core hospital workforce roles */
export type CoreRole =
  | 'Hospital Administrator'
  | 'Doctor / Consultant'
  | 'Staff Nurse'
  | 'Lab Technician'
  | 'Radiologist'
  | 'Pharmacist'
  | 'Billing Executive'
  | 'Receptionist'
  | 'HR Manager'
  | 'Security & Facilities'
  | 'Procurement Officer';

export type StaffStatus = 'On Duty' | 'Off Duty' | 'On Leave';

export type ShiftBlock = 'Morning' | 'Evening' | 'Night' | 'Weekly Off' | 'Unassigned';

export type AttendanceFlag = 'On Time' | 'Late' | 'Not Clocked';

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface Employee {
  id: string;
  staffId: string;
  name: string;
  role: CoreRole;
  department: string;
  activeShift: string;
  status: StaffStatus;
  baseSalary: number;
  shiftsCompleted: number;
  lopDays: number;
  bonusModifierPct: number;
  taxDeductions: number;
}

export interface WeeklyRotaEntry {
  employeeId: string;
  days: Record<DayKey, ShiftBlock>;
}

export interface AttendanceRecord {
  employeeId: string;
  clockIn?: string;
  clockOut?: string;
  scheduledStartHour: number;
  flag: AttendanceFlag;
}

export interface WorkforceMetrics {
  totalActiveStaff: number;
  staffOnDutyNow: number;
  pendingLeaveRequests: number;
  upcomingShiftOverlaps: number;
}

export interface PayrollLine {
  employeeId: string;
  employeeName: string;
  baseSalary: number;
  shiftsCompleted: number;
  lopDays: number;
  bonusModifierPct: number;
  taxDeductions: number;
  netPayable: number;
}

export interface PayrollDisbursementPayload {
  runId: string;
  period: string;
  lockedAt: string;
  currency: 'INR';
  totalDisbursed: number;
  employeeCount: number;
  disbursements: {
    staffId: string;
    name: string;
    netPayable: number;
    accountRef: string;
  }[];
}

export const CORE_ROLES: CoreRole[] = [
  'Hospital Administrator',
  'Doctor / Consultant',
  'Staff Nurse',
  'Lab Technician',
  'Radiologist',
  'Pharmacist',
  'Billing Executive',
  'Receptionist',
  'HR Manager',
  'Security & Facilities',
  'Procurement Officer',
];

export const DAY_LABELS: Record<DayKey, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
};

export const DAYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const SHIFT_STYLES: Record<ShiftBlock, string> = {
  Morning: 'bg-sky-200 text-sky-900 border-sky-300',
  Evening: 'bg-amber-200 text-amber-900 border-amber-300',
  Night: 'bg-indigo-300 text-indigo-950 border-indigo-400',
  'Weekly Off': 'bg-slate-100 text-slate-800 border-slate-200',
  Unassigned: 'bg-white text-slate-900 border-slate-200',
};

export const STATUS_STYLES: Record<StaffStatus, string> = {
  'On Duty': 'bg-emerald-100 text-emerald-900 ring-emerald-200',
  'Off Duty': 'bg-slate-100 text-slate-800 ring-slate-200',
  'On Leave': 'bg-violet-100 text-violet-900 ring-violet-200',
};

export const ATTENDANCE_FLAG_STYLES: Record<AttendanceFlag, string> = {
  'On Time': 'bg-emerald-100 text-emerald-800',
  Late: 'bg-rose-100 text-rose-800',
  'Not Clocked': 'bg-slate-100 text-slate-800',
};

export function scheduledStartForShift(shift: ShiftBlock): number {
  if (shift === 'Morning') return 6;
  if (shift === 'Evening') return 14;
  if (shift === 'Night') return 22;
  return 9;
}

export function computeNetPayable(emp: Employee): number {
  const dailyRate = emp.baseSalary / 30;
  const lopDeduction = emp.lopDays * dailyRate;
  const bonus = emp.baseSalary * (emp.bonusModifierPct / 100);
  return Math.round(emp.baseSalary - lopDeduction + bonus - emp.taxDeductions);
}

export function evaluateClockIn(scheduledStartHour: number, clockIn: Date): AttendanceFlag {
  const scheduled = new Date(clockIn);
  scheduled.setHours(scheduledStartHour, 0, 0, 0);
  const graceMs = 15 * 60 * 1000;
  return clockIn.getTime() <= scheduled.getTime() + graceMs ? 'On Time' : 'Late';
}

export function generatePayrollRunId(): string {
  return `PAY-RUN-${Date.now().toString(36).toUpperCase()}`;
}
