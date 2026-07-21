/** Production-ready patient UI copy (replaces sandbox debug strings). */

export const patientToastCopy = {
  prescriptionPdfReady: 'Prescription PDF ready for download.',
  pharmacyRefillActive: 'Pharmacy refill order active.',
  healthRecordGenerated: 'Complete health record generated.',
  diagnosticReportVerified: 'Diagnostic report verified.',
  paymentSessionActive: 'Payment gateway session active.',
  emergencyDispatchNotified: 'Emergency dispatch notified.',
  reminderEnabled: (medication: string) => `Reminders turned on for ${medication}.`,
  reminderPaused: (medication: string) => `Reminders paused for ${medication}.`,
  receiptReady: (transactionId: string) => `Receipt ready for ${transactionId}.`,
  paymentInitiated: (invoiceNumber: string, amount: string) =>
    `Payment started for ${invoiceNumber} (${amount}).`,
  refundSettled: 'Refund credited to your registered bank account.',
  labReportExport: (title: string) => `${title} — verified report ready to download.`,
  profileSwitched: (name: string) => `Viewing care profile for ${name}.`,
  contactDialing: (name: string) => `Connecting call to ${name}…`,
  familyInviteQueued: (name: string) => `Invite sent to ${name} for guardian verification.`,
  locationSharingOn: 'Live location sharing is on for your care team.',
  locationSharingOff: 'Live location sharing is off.',
  sosReset: 'Emergency console reset. You are back on standby.',
  ambulanceRequested: 'Ambulance request sent. ETA tracking will appear shortly.',
  refillProcessing: (medication: string) => `Refill in progress for ${medication}.`,
} as const;

const BADGE_LABELS: Record<string, string> = {
  RX_VAULT_SYNC_OK: '✓ Vault Synced',
  PHARMACY_VAULT_SYNC_OK: '✓ Pharmacy Synced',
  SIGNATURE_CLEARANCE_OK: '✓ Signature Verified',
  PAYMENT_GATEWAY_VERIFIED: '✓ Payment Verified',
  REPORT_READY_VERIFIED: '✓ Report Verified',
  DIAGNOSTIC_VAULT_SYNC: '✓ Diagnostics Vault Synced',
};

export function formatHeaderBadge(raw: string): string {
  if (BADGE_LABELS[raw]) return BADGE_LABELS[raw];
  if (raw.includes('_')) {
    const words = raw
      .toLowerCase()
      .split('_')
      .filter((w) => w !== 'ok' && w !== 'verified')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1));
    if (raw.includes('VERIFIED') || raw.includes('_OK')) {
      return `✓ ${words.join(' ')}`.trim();
    }
    return words.join(' ');
  }
  return raw;
}

export function formatSosHeaderBadge(status: string): { label: string; tone: 'emergency' | 'default' } {
  if (status === 'SOS Triggered - Dispatching Alert') {
    return { label: 'SOS Triggered', tone: 'emergency' };
  }
  if (status === 'Ambulance Requested') {
    return { label: 'Ambulance Requested', tone: 'emergency' };
  }
  return { label: 'Standby · Ready', tone: 'default' };
}

export function formatRadiologyStatus(status: string): string {
  if (status === 'REPORT_READY_VERIFIED') return '✓ Report Verified';
  return status;
}
