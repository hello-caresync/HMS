import { SANDBOX_SECURED_PLACEHOLDER } from './types';
import type {
  BackupScheduleConfig,
  FinanceCheckoutSummary,
  RbacRoleConfig,
  SandboxFinanceTransaction,
  WebhookCredentialConfig,
} from './types';

export const SEED_RBAC_ROLES: RbacRoleConfig[] = [
  { roleId: 'ROLE-ADM', roleLabel: 'Hospital Administrator', permissionCount: 48, lastModified: '2026-07-08' },
  { roleId: 'ROLE-PHR', roleLabel: 'Pharmacist', permissionCount: 22, lastModified: '2026-07-05' },
  { roleId: 'ROLE-NRS', roleLabel: 'Staff Nurse', permissionCount: 18, lastModified: '2026-07-01' },
  { roleId: 'ROLE-RCV', roleLabel: 'Front Desk Reception', permissionCount: 14, lastModified: '2026-06-28' },
];

export const SEED_BACKUP_CONFIG: BackupScheduleConfig = {
  scheduleLabel: 'Daily Cold Backup · 02:00 IST',
  nextRunAt: '2026-07-11T02:00:00+05:30',
  retentionDays: 30,
  lastSnapshotRef: SANDBOX_SECURED_PLACEHOLDER,
  coldBackupEnabled: true,
};

export const SEED_WEBHOOK_CREDENTIALS: WebhookCredentialConfig[] = [
  {
    integrationId: 'WH-SMS-01',
    integrationName: 'SMS Dispatch Gateway',
    endpointLabel: 'notifications/sms/outbound',
    credentialMasked: SANDBOX_SECURED_PLACEHOLDER,
    status: 'Active',
  },
  {
    integrationId: 'WH-LAB-02',
    integrationName: 'Laboratory HL7 Bridge',
    endpointLabel: 'integrations/lab/results',
    credentialMasked: SANDBOX_SECURED_PLACEHOLDER,
    status: 'Active',
  },
  {
    integrationId: 'WH-TPA-03',
    integrationName: 'Insurance TPA Webhook',
    endpointLabel: 'claims/preauth/callback',
    credentialMasked: SANDBOX_SECURED_PLACEHOLDER,
    status: 'Disabled',
  },
];

export const SEED_SANDBOX_TRANSACTIONS: SandboxFinanceTransaction[] = [
  { transactionId: 'TXN-SBX-9081', patientInitials: 'P.N.', category: 'Consultation Fees', amountInr: 850, paymentMethod: 'UPI', status: 'Paid' },
  { transactionId: 'TXN-SBX-9082', patientInitials: 'R.S.', category: 'Lab Tests', amountInr: 1280, paymentMethod: 'Card', status: 'Paid' },
  { transactionId: 'TXN-SBX-9083', patientInitials: 'A.K.', category: 'Radiology Scans', amountInr: 650, paymentMethod: 'Cash', status: 'Processing' },
  { transactionId: 'TXN-SBX-9084', patientInitials: 'S.M.', category: 'Ward Tariffs', amountInr: 5000, paymentMethod: 'Insurance Cover', status: 'Pending' },
  { transactionId: 'TXN-SBX-9085', patientInitials: 'H.D.', category: 'Pharmacy Consumables', amountInr: 1840, paymentMethod: 'UPI', status: 'Paid' },
  { transactionId: 'TXN-SBX-9086', patientInitials: 'K.V.', category: 'Consultation Fees', amountInr: 920, paymentMethod: 'Card', status: 'Pending' },
];

export const DEFAULT_CHECKOUT_SUMMARY: FinanceCheckoutSummary = {
  subtotalInr: 10540,
  cgstInr: 948.6,
  sgstInr: 948.6,
  grandTotalInr: 12437.2,
};

export function formatInr(amount: number): string {
  return `₹ ${amount.toLocaleString('en-IN', { minimumFractionDigits: amount % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
}
