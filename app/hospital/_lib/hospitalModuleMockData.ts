import type { HospitalModuleConfig } from '../_config/moduleRegistry';

export type HospitalRecord = {
  id: string;
  reference: string;
  subject: string;
  department: string;
  amount?: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Scheduled' | 'Submitted';
  updatedAt: string;
};

const DEPARTMENTS = [
  'General Medicine',
  'Cardiology',
  'Orthopedics',
  'Laboratory',
  'Radiology',
  'Pharmacy',
  'Billing',
  'Emergency',
] as const;

const SAMPLE_NAMES = ['R.K. Sharma', 'S.M. Iyer', 'A.P. Khan', 'L.N. Patel', 'V.D. Reddy', 'M.J. Nair'];

function pick<T>(arr: readonly T[], index: number): T {
  return arr[index % arr.length]!;
}

export function getPrimaryActionLabel(moduleId: string): string {
  if (moduleId.startsWith('bill-') || moduleId === 'billing' || moduleId === 'invoices') return 'Generate bill';
  if (moduleId.startsWith('staff')) return 'Add staff record';
  if (moduleId === 'admissions' || moduleId === 'ipd') return 'Admit patient';
  if (moduleId === 'discharge') return 'Initiate discharge';
  if (moduleId === 'emergency') return 'Register triage case';
  if (moduleId === 'payments' || moduleId === 'receipts') return 'Record payment';
  if (moduleId === 'insurance') return 'Submit pre-auth';
  if (moduleId === 'pharmacy' || moduleId.startsWith('dept-pharmacy')) return 'Add inventory item';
  if (moduleId === 'laboratory' || moduleId.startsWith('dept-lab')) return 'Add lab order';
  if (moduleId === 'patients') return 'Register patient';
  return 'Create record';
}

export function createSeedRecords(config: HospitalModuleConfig): HospitalRecord[] {
  const prefix = config.id.slice(0, 3).toUpperCase();
  const statuses: HospitalRecord['status'][] = ['Pending', 'In Progress', 'Scheduled', 'Completed', 'Submitted'];

  return Array.from({ length: 6 }, (_, i) => {
    const dept = pick(DEPARTMENTS, i + config.title.length);
    const subject = pick(SAMPLE_NAMES, i);
    return {
      id: `${config.id}-${i + 1}`,
      reference: `${prefix}-${1000 + i}`,
      subject,
      department: dept,
      amount: config.id.includes('bill') || config.id === 'billing' ? `₹${(4200 + i * 850).toLocaleString('en-IN')}` : undefined,
      status: pick(statuses, i),
      updatedAt: new Date(Date.now() - i * 3600_000).toLocaleString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: 'short',
      }),
    };
  });
}

export function parseMetricValue(value: string): number {
  const digits = value.replace(/[^\d]/g, '');
  const n = Number(digits);
  return Number.isFinite(n) ? n : 0;
}
