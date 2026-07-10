/** Sandbox testing types — no live PII; initials and secured placeholders only */

export const SANDBOX_SECURED_PLACEHOLDER = '[DATA SECURED FOR SANDBOX ISOLATION]';

export interface RbacRoleConfig {
  roleId: string;
  roleLabel: string;
  permissionCount: number;
  lastModified: string;
}

export interface BackupScheduleConfig {
  scheduleLabel: string;
  nextRunAt: string;
  retentionDays: number;
  lastSnapshotRef: string;
  coldBackupEnabled: boolean;
}

export interface WebhookCredentialConfig {
  integrationId: string;
  integrationName: string;
  endpointLabel: string;
  credentialMasked: string;
  status: 'Active' | 'Disabled';
}

export type FinanceTxnStatus = 'Paid' | 'Pending' | 'Processing';

export type FinancePaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Insurance Cover';

export interface SandboxFinanceTransaction {
  transactionId: string;
  patientInitials: string;
  category: string;
  amountInr: number;
  paymentMethod: FinancePaymentMethod;
  status: FinanceTxnStatus;
}

export interface FinanceCheckoutSummary {
  subtotalInr: number;
  cgstInr: number;
  sgstInr: number;
  grandTotalInr: number;
}

export const FINANCE_STATUS_STYLES: Record<FinanceTxnStatus, string> = {
  Paid: 'bg-emerald-100 text-emerald-950 border border-emerald-400 font-bold',
  Pending: 'bg-amber-100 text-amber-950 border border-amber-400 font-bold',
  Processing: 'bg-sky-100 text-sky-950 border border-sky-400 font-bold',
};
